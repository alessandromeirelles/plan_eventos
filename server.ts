import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import admin from "firebase-admin";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import nodemailer from "nodemailer";

// Initialize Firebase Admin lazily to prevent crashes if env vars are missing
let db: admin.firestore.Firestore;

function getDb() {
  if (!db) {
    const apps = admin.apps || [];
    if (apps.length === 0) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
      
      // Remove surrounding quotes
      privateKey = privateKey.replace(/^["']|["']$/g, '');
      
      // Handle escaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Check if it's a JSON string (downloaded service account file)
      if (privateKey.trim().startsWith('{')) {
        try {
          const json = JSON.parse(privateKey);
          if (json.private_key) {
            privateKey = json.private_key;
          }
        } catch (e) {
          console.error("[Firebase] Error parsing private key as JSON:", e);
        }
      }

      console.log("[Firebase] Preparing private key...");
      console.log("[Firebase] Key length:", privateKey.length);
      console.log("[Firebase] Key starts with:", privateKey.substring(0, 30));
      console.log("[Firebase] Key ends with:", privateKey.substring(privateKey.length - 30));

      // If it already has headers, it should be fine
      if (privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
          console.log("[Firebase] Key has headers.");
          privateKey = privateKey.trim();
      } else {
          console.log("[Firebase] Key missing headers, attempting to format...");
          // Remove existing headers/footers and all whitespace to get raw base64
          const rawBase64 = privateKey
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/\s+/g, '');
          
          console.log("[Firebase] Raw base64 length:", rawBase64.length);
          
          // Re-add headers/footers with proper 64-character line breaks
          const match = rawBase64.match(/.{1,64}/g);
          if (match) {
            privateKey = `-----BEGIN PRIVATE KEY-----\n${match.join('\n')}\n-----END PRIVATE KEY-----`;
          } else {
            console.error("[Firebase] Failed to match base64 content.");
          }
      }
      
      console.log("[Firebase] Final key format check:", privateKey.substring(0, 30), "...", privateKey.substring(privateKey.length - 30));
      console.log("[Firebase] Private key prepared.");

      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        const missing = [];
        if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
        if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
        if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
        
        const errorMsg = `⚠️ Firebase Admin credentials missing: ${missing.join(", ")}. Webhook and Backup will not work.`;
        console.error(errorMsg);
        throw new Error("Configuração do Firebase incompleta no servidor.");
      } else {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
          });
          console.log("[Firebase] Admin initialized successfully.");
        } catch (initError: any) {
          console.error("[Firebase] Error initializing admin:", initError);
          throw new Error(`Erro ao inicializar Firebase Admin: ${initError.message}`);
        }
      }
    }
    db = admin.firestore();
  }
  return db;
}

async function sendRetentionEmail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn("⚠️ SMTP credentials missing. Skipping email to:", to);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from, to, subject, text });
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
  }
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

    // Retention Emails Processing
    app.post("/api/admin/process-retention", async (req, res) => {
      try {
        const firestore = getDb();
        const usersSnap = await firestore.collection("users").get();
        const docs = usersSnap.docs || [];
        const now = new Date();
        let processedCount = 0;
        let emailsSentCount = 0;

        for (const doc of docs) {
          const userData = doc.data();
          if (!userData.email || !userData.last_activity) continue;

          const lastActivity = new Date(userData.last_activity);
          const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          const emailsSent = userData.emails_sent || [];

          let subject = "";
          let text = "";
          let key = "";

          if (diffDays >= 29 && !emailsSent.includes('29d')) {
            key = '29d';
            subject = "Que pena, seu trial vai expirar!";
            text = `Olá ${userData.name},\n\nNotamos que você não aparece há algum tempo. Seu período de teste está chegando ao fim. Não perca a chance de continuar organizado!`;
          } else if (diffDays >= 21 && !emailsSent.includes('21d')) {
            key = '21d';
            subject = "O tempo está acabando!";
            text = `Olá ${userData.name},\n\nO tempo voa! Já faz 21 dias que não te vemos. Volte agora e garanta sua organização.`;
          } else if (diffDays >= 14 && !emailsSent.includes('14d')) {
            key = '14d';
            subject = "Sentimos sua falta!";
            text = `Olá ${userData.name},\n\nEstamos passando para te chamar de volta. O Planeventos está com novidades para te ajudar no dia a dia.`;
          } else if (diffDays >= 7 && !emailsSent.includes('7d')) {
            key = '7d';
            subject = "Dê uma chance para a organização!";
            text = `Olá ${userData.name},\n\nDê uma chance para o aplicativo e você terá sucesso em se organizar. Estamos aqui para facilitar sua vida.`;
          } else if (diffDays >= 3 && !emailsSent.includes('3d')) {
            key = '3d';
            subject = "Estamos sentindo saudades!";
            text = `Olá ${userData.name},\n\nJá faz 3 dias que você não aparece. Tudo bem por aí? Volte e continue planejando seus eventos!`;
          }

          if (key) {
            await sendRetentionEmail(userData.email, subject, text);
            await doc.ref.update({
              emails_sent: admin.firestore.FieldValue.arrayUnion(key)
            });
            emailsSentCount++;
          }
          processedCount++;
        }

        res.json({ success: true, processed: processedCount, sent: emailsSentCount });
      } catch (error: any) {
        console.error("[Retention] Error processing:", error);
        res.status(500).json({ 
          error: "Falha ao processar retenção",
          details: error.message
        });
      }
    });

    // Notify Admin of new user
    app.post("/api/admin/notify-new-user", async (req, res) => {
      try {
        const { userName, userEmail } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER; // Default to SMTP user for admin alerts
        if (!adminEmail) throw new Error("Admin email not configured");
        
        await sendRetentionEmail(adminEmail, "Novo usuário cadastrado!", `Um novo usuário se cadastrou no Planeventos:\n\nNome: ${userName}\nEmail: ${userEmail}`);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Notify User of trial expiry
    app.post("/api/user/notify-trial-expiry", async (req, res) => {
      try {
        const { userEmail, userName } = req.body;
        await sendRetentionEmail(userEmail, "Seu período de teste expirou!", `Olá ${userName},\n\nSeu período de teste de 60 dias no Planeventos expirou. Você tem 7 dias para assinar ou seu histórico será apagado.`);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Database Backup Endpoint
    app.get("/api/admin/backup", async (req, res) => {
      try {
        console.log("[Backup] Starting database backup...");
        const firestore = getDb();
        const collections = ["users", "companies", "events"];
        const backupData: any = {};

        for (const colName of collections) {
          console.log(`[Backup] Fetching collection: ${colName}`);
          const snap = await firestore.collection(colName).get();
          const docs = snap.docs || [];
          backupData[colName] = docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`[Backup] Fetched ${backupData[colName].length} documents from ${colName}`);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-planeventos-${timestamp}.json`;

        console.log(`[Backup] Backup created successfully. Filename: ${filename}`);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.send(JSON.stringify(backupData, null, 2));
      } catch (error: any) {
        console.error("[Backup] Error creating backup:", error);
        res.status(500).json({ 
          error: "Falha ao criar backup do banco de dados",
          details: error.message 
        });
      }
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
        const userRef = firestore.collection("users").doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.log(`[Google Auth] User document ${userId} not found, creating it.`);
          await userRef.set({
            uid: userId,
            google_calendar_tokens: tokens,
            google_calendar_connected: true,
            updated_at: new Date().toISOString()
          });
        } else {
          console.log(`[Google Auth] Updating user document ${userId} with tokens.`);
          await userRef.update({
            google_calendar_tokens: tokens,
            google_calendar_connected: true,
            updated_at: new Date().toISOString()
          });
        }

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
        console.error("Error exchanging code for tokens:", err);
        if (err.response) {
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
        }
        res.send(`
          <html><body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'Failed to exchange tokens: ' + (err.message || 'Unknown error') }, '*');
                window.close();
              }
            </script>
            <p>Erro ao processar autenticação: ${err.message}</p>
          </body></html>
        `);
      }
    });

    // Diagnostic endpoint
    app.get("/api/diag", async (req, res) => {
      try {
        const firestore = getDb();
        const testDoc = await firestore.collection("diag").doc("test").get();
        res.json({
          status: "ok",
          firebase: "connected",
          env: {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          }
        });
      } catch (err: any) {
        res.status(500).json({ status: "error", message: err.message });
      }
    });

    app.post("/api/calendar/sync-all", async (req, res) => {
      try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const firestore = getDb();
        const userDoc = await firestore.collection("users").doc(userId).get();
        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
        
        const userData = userDoc.data();
        const userEmail = userData?.email;
        if (!userEmail) return res.status(400).json({ error: "User email not found" });

        const eventsSnap = await firestore.collection("events").where("user_id", "==", userEmail).get();
        const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const auth = await getGoogleAuthClient(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        let syncedCount = 0;
        for (const event of events as any[]) {
          // Skip if already has google event id (optional: could update instead)
          if (event.google_calendar_event_id) continue;

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

          const gcalEvent = {
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

          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: gcalEvent,
          });

          if (response.data.id) {
            await firestore.collection("events").doc(event.id).update({
              google_calendar_event_id: response.data.id
            });
            syncedCount++;
          }
        }

        res.json({ success: true, syncedCount });
      } catch (error: any) {
        console.error("Error syncing all events:", error);
        res.status(500).json({ error: error.message });
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
