import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import * as admin from "firebase-admin";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import fs from "fs";
import { google } from "googleapis";

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

async function getGoogleAuthClient(userId: string) {
  const firestore = getDb();
  const userDoc = await firestore.collection("users").doc(userId).get();
  if (!userDoc.exists) throw new Error("User not found");
  
  const userData = userDoc.data();
  const tokens = userData?.google_calendar_tokens;
  if (!tokens) throw new Error("Google Calendar not connected");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials(tokens);

  oauth2Client.on('tokens', async (newTokens) => {
    const updatedTokens = { ...tokens, ...newTokens };
    await firestore.collection("users").doc(userId).update({
      google_calendar_tokens: updatedTokens
    });
  });

  return oauth2Client;
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

    // Google OAuth Endpoints
    app.get("/api/auth/google/url", (req, res) => {
      const { userId, redirectUri } = req.query;
      
      console.log(`[Google Auth] Generating URL for userId: ${userId}, redirectUri: ${redirectUri}`);

      if (!userId || !redirectUri) {
        return res.status(400).json({ error: "Missing userId or redirectUri" });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
      if (!clientId || !clientSecret) {
        console.error('[Google Auth] Missing credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
        return res.status(500).json({ error: "Google credentials not configured" });
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri as string);
      const stateStr = Buffer.from(JSON.stringify({ userId, redirectUri })).toString('base64');

      console.log(`[Google Auth] Redirecting to Google with URI: ${redirectUri}`);
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        prompt: 'consent',
        state: stateStr,
      });

      res.json({ url });
    });

    app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], async (req, res) => {
      const { code, state, error } = req.query;
      console.log(`[Google Auth] Callback received. Error: ${error || 'none'}`);

      if (error) {
        return res.send(`
          <html><body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
                window.close();
              }
            </script>
            <p>Erro na autenticação: ${error}</p>
          </body></html>
        `);
      }

      if (!code || !state) {
        return res.status(400).send("Missing code or state");
      }

      try {
        const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        const { userId, redirectUri } = stateObj;
        console.log(`[Google Auth] Exchanging code for tokens. userId: ${userId}, redirectUri: ${redirectUri}`);

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID?.trim(),
          process.env.GOOGLE_CLIENT_SECRET?.trim(),
          redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code as string);
        console.log(`[Google Auth] Tokens received successfully for user ${userId}`);

        // Save tokens to Firestore
        const firestore = getDb();
        await firestore.collection("users").doc(userId).update({
          google_calendar_tokens: tokens,
          google_calendar_connected: true,
        });

        res.send(`
          <html><body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação com Google Calendar concluída com sucesso! Esta janela será fechada automaticamente.</p>
          </body></html>
        `);
      } catch (err: any) {
        console.error("Error exchanging code for tokens:", err.response?.data || err.message);
        res.send(`
          <html><body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to exchange tokens' }, '*');
                window.close();
              }
            </script>
            <p>Erro ao processar autenticação.</p>
          </body></html>
        `);
      }
    });

    app.post("/api/calendar/event", async (req, res) => {
      try {
        const { userId, event } = req.body;
        console.log(`Syncing event for user ${userId}:`, event.title);
        
        if (!userId || !event) return res.status(400).json({ error: "Missing userId or event" });

        const auth = await getGoogleAuthClient(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const startTime = event.time || '09:00';
        const [h, m] = startTime.split(':').map(Number);
        let endH = h + 1;
        let endDate = event.date;
        
        if (endH >= 24) {
          endH = 0;
          const d = new Date(event.date + 'T12:00:00');
          d.setDate(d.getDate() + 1);
          endDate = d.toISOString().split('T')[0];
        }
        
        const endTime = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        const gcalEventWithTime = {
          summary: event.title,
          location: event.location || '',
          description: `Tipo: ${event.type}\nValor: R$ ${event.value}\nStatus: ${event.status}`,
          start: {
            dateTime: `${event.date}T${startTime}:00-03:00`,
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: `${endDate}T${endTime}:00-03:00`,
            timeZone: 'America/Sao_Paulo',
          }
        };

        if (event.google_calendar_event_id) {
          console.log(`Updating existing event ${event.google_calendar_event_id}`);
          const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: event.google_calendar_event_id,
            requestBody: gcalEventWithTime,
          });
          res.json({ success: true, googleEventId: response.data.id });
        } else {
          console.log(`Inserting new event`);
          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: gcalEventWithTime,
          });
          res.json({ success: true, googleEventId: response.data.id });
        }
      } catch (error: any) {
        console.error("Error syncing to Google Calendar:", error.response?.data || error.message);
        res.status(500).json({ error: error.message });
      }
    });

    app.delete("/api/calendar/event", async (req, res) => {
      try {
        const { userId, googleEventId } = req.body;
        if (!userId || !googleEventId) return res.status(400).json({ error: "Missing userId or googleEventId" });

        const auth = await getGoogleAuthClient(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        await calendar.events.delete({
          calendarId: 'primary',
          eventId: googleEventId,
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting from Google Calendar:", error);
        res.status(500).json({ error: error.message });
      }
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
