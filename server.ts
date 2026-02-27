import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import * as admin from "firebase-admin";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin lazily to prevent crashes if env vars are missing
let db: admin.firestore.Firestore;

function getDb() {
  if (!db) {
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn("⚠️ Firebase Admin credentials missing. Webhook will not be able to update Firestore.");
        // Initialize with default (will fail on actual DB calls but prevents startup crash)
        admin.initializeApp();
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      }
    }
    db = admin.firestore();
  }
  return db;
}

const parser = new XMLParser();

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // PagSeguro Webhook
    app.post("/api/webhooks/pagseguro", async (req, res) => {
      const { notificationCode, notificationType } = req.body;

      console.log("Webhook received:", { notificationCode, notificationType });

      if (notificationType === "transaction" && notificationCode) {
        try {
          const email = process.env.PAGSEGURO_EMAIL;
          const token = process.env.PAGSEGURO_TOKEN;

          // Query PagSeguro for transaction details
          const url = `https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${notificationCode}?email=${email}&token=${token}`;
          const response = await axios.get(url);
          const result = parser.parse(response.data);
          const transaction = result.transaction;

          // Status 3 means "Paid"
          if (transaction.status === 3 || transaction.status === "3") {
            const reference = transaction.reference; 
            
            // Determine plan type from items
            let planType = "monthly";
            const items = Array.isArray(transaction.items.item) ? transaction.items.item : [transaction.items.item];
            const hasYearly = items.some((item: any) => 
              item.description && item.description.toLowerCase().includes("anual")
            );
            if (hasYearly) planType = "yearly";
            
            if (reference) {
              const firestore = getDb();
              const userDocRef = firestore.collection("users").doc(reference);
              const userDoc = await userDocRef.get();

              if (userDoc.exists) {
                const now = new Date();
                const expiryDate = new Date();
                if (planType === "monthly") {
                  expiryDate.setMonth(now.getMonth() + 1);
                } else {
                  expiryDate.setFullYear(now.getFullYear() + 1);
                }

                await userDocRef.update({
                  subscription_status: "active",
                  plan_type: planType,
                  subscription_expiry_date: expiryDate.toISOString(),
                });

                console.log(`Subscription activated for user ${reference}`);
              }
            }
          }
        } catch (error) {
          console.error("Error processing PagSeguro webhook:", error);
        }
      }

      res.status(200).send("OK");
    });

    // Serve static files if dist exists (production), otherwise use Vite middleware
    const distPath = path.resolve("dist");
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isProduction || fs.existsSync(distPath)) {
      console.log(`Serving static files from ${distPath}`);
      app.use(express.static(distPath));
      app.use((req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.log("Starting Vite development server...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Fatal error during server startup:", error);
    process.exit(1);
  }
}

startServer();
