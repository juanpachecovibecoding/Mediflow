import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { initializeApp, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// -------------------------------------------------------------
// 1. Configuraciones Maestras (Clinic & System)
// -------------------------------------------------------------
const clinicConfigPath = path.join(process.cwd(), 'clinic-config.json');
const systemConfigPath = path.join(process.cwd(), 'system-config.json');

export interface ClinicConfig {
  clinicId: string;
  clinicName: string;
  doctorName: string;
  specialty: string;
  shortDescription: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  googleMapsUrl: string;
  workingHours: string;
  slotDurationMinutes: number;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoText: string;
    logoBadge: string;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    duration: string;
    price: string;
  }>;
  insurances: string[];
}

export interface SystemConfig {
  apiKey: string;
  model: string;
  adminSecret: string;
  systemPrompt: string;
}

function getClinicConfig(): ClinicConfig {
  if (fs.existsSync(clinicConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(clinicConfigPath, 'utf8'));
    } catch (e) {
      console.error('Error reading clinic config:', e);
    }
  }
  return {
    clinicId: 'consultorio-dental',
    clinicName: 'Consultorio Odontológico',
    doctorName: 'Dr. Odontólogo',
    specialty: 'Odontología Integral',
    shortDescription: 'Atención odontológica personalizada.',
    phone: '+54 9 11 0000-0000',
    whatsappNumber: '+5491100000000',
    address: 'Consultorio Central',
    city: 'Buenos Aires',
    googleMapsUrl: '',
    workingHours: 'Lunes a Viernes de 09:00 a 19:00 hs',
    slotDurationMinutes: 30,
    branding: {
      primaryColor: '#0284c7',
      accentColor: '#0ea5e9',
      logoText: 'Consultorio',
      logoBadge: 'Dental'
    },
    services: [],
    insurances: ['Particular']
  };
}

function getSystemConfig(): SystemConfig {
  const envConfig: SystemConfig = {
    apiKey: process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || process.env.AGENT_PLATFORM_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    adminSecret: process.env.SUPERADMIN_SECRET || 'superadmin123',
    systemPrompt: 'Eres la asistente virtual del consultorio odontológico. Responde con calidez y profesionalismo en español. Cuando el paciente quiera agendar o consultar un turno, dale este enlace directo: {bookingUrl}'
  };

  if (fs.existsSync(systemConfigPath)) {
    try {
      const savedData = JSON.parse(fs.readFileSync(systemConfigPath, 'utf8'));
      return {
        apiKey: savedData.apiKey || envConfig.apiKey,
        model: savedData.model || envConfig.model,
        adminSecret: savedData.adminSecret || envConfig.adminSecret,
        systemPrompt: savedData.systemPrompt || envConfig.systemPrompt
      };
    } catch (e) {
      console.error('Error reading system config:', e);
    }
  }
  return envConfig;
}

// -------------------------------------------------------------
// 2. Firebase Admin Inicialización
// -------------------------------------------------------------
let adminApp: App | null = null;
let firestoreDb: any | null = null;

function getFirebaseAdmin() {
  if (!adminApp) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseAppConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      adminApp = initializeApp({
        projectId: firebaseAppConfig.projectId,
      });
    } else {
      adminApp = initializeApp();
    }
  }
  return adminApp;
}

function getDb() {
  if (!firestoreDb) {
    const app = getFirebaseAdmin();
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let databaseId = undefined;
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      databaseId = cfg.firestoreDatabaseId;
    }
    firestoreDb = getFirestore(app, databaseId);
  }
  return firestoreDb;
}

// -------------------------------------------------------------
// 3. Google Gemini Inicialización
// -------------------------------------------------------------
let ai: GoogleGenAI | null = null;

function initializeAI() {
  const cfg = getSystemConfig();
  const apiKey = cfg.apiKey;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
    console.log(`[AI] Google Gemini inicializado con éxito. Modelo objetivo: ${cfg.model}`);
  } else {
    ai = null;
    console.log('[AI] API Key de Gemini no configurada todavía. El bot responderá con plantilla de espera.');
  }
}

initializeAI();

// -------------------------------------------------------------
// 4. WhatsApp Bot (Baileys) - Monoclínica
// -------------------------------------------------------------
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = express();
app.use(express.json());

interface LocalBotState {
  status: 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED';
  qr: string | null;
  botActive: boolean;
  messagesSent: number;
}

const botState: LocalBotState = {
  status: 'DISCONNECTED',
  qr: null,
  botActive: true,
  messagesSent: 0
};

let activeSock: any = null;

async function startWhatsAppBot(host: string) {
  const clinic = getClinicConfig();
  const clinicId = clinic.clinicId;
  const authFolder = path.join(process.cwd(), 'wa_auth');

  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const logger = pino({ level: 'silent' });
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false
  });

  activeSock = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      botState.status = 'QR_READY';
      try {
        botState.qr = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('[WhatsApp] Fallo al generar QR en Base64', err);
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      botState.status = 'DISCONNECTED';
      console.log(`[WhatsApp] Conexión cerrada. Reconectar: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => startWhatsAppBot(host), 5000);
      } else {
        botState.qr = null;
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        activeSock = null;
      }
    } else if (connection === 'open') {
      botState.status = 'CONNECTED';
      botState.qr = null;
      console.log(`[WhatsApp] ¡Conectado exitosamente para ${clinic.clinicName}!`);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) continue;

      const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (!textMessage) continue;

      if (!botState.botActive) continue;

      const protocol = host.includes('localhost') ? 'http' : 'https';
      const bookingUrl = `${protocol}://${host}/reservar`;

      // 1. Detección automática de confirmación de reserva enviada desde la web
      const bookingMatch = textMessage.match(/He reservado un turno para el (\d{4}-\d{2}-\d{2}) a las (\d{2}:\d{2})h/);
      const dniMatch = textMessage.match(/\(DNI: (.*?)\)/);

      if (bookingMatch && dniMatch) {
        const date = bookingMatch[1];
        const time = bookingMatch[2];
        const dni = dniMatch[1];

        console.log(`[WhatsApp] Confirmación de turno detectada: DNI ${dni} fecha ${date} ${time}`);

        try {
          const patientsRef = getDb().collection('clinics').doc(clinicId).collection('patients');
          const patientSnap = await patientsRef.where('dni', '==', dni).limit(1).get();

          if (!patientSnap.empty) {
            const patientId = patientSnap.docs[0].id;
            const appointmentsRef = getDb().collection('clinics').doc(clinicId).collection('appointments');
            const appSnap = await appointmentsRef
              .where('patientId', '==', patientId)
              .where('date', '==', date)
              .where('time', '==', time)
              .limit(1)
              .get();

            if (!appSnap.empty) {
              await appSnap.docs[0].ref.update({
                status: 'CONFIRMED',
                updatedAt: FieldValue.serverTimestamp()
              });
            }
          }

          await sock.sendMessage(remoteJid, {
            text: `¡Excelente! Su turno para el día ${date} a las ${time} hs con el ${clinic.doctorName} ha sido CONFIRMADO. ¡Lo esperamos en ${clinic.address}!`
          });
          botState.messagesSent += 1;
        } catch (e) {
          console.error('[WhatsApp] Error confirmando cita en BD:', e);
        }
        continue;
      }

      // 2. Respuesta con Inteligencia Artificial (Google Gemini)
      if (ai) {
        try {
          const sysCfg = getSystemConfig();
          await sock.presenceSubscribe(remoteJid);
          await sock.sendPresenceUpdate('composing', remoteJid);

          const consultarEstadoPaciente: FunctionDeclaration = {
            name: 'consultarEstadoPaciente',
            description: 'Consulta si el paciente tiene un turno registrado usando su DNI.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                dni: {
                  type: Type.STRING,
                  description: 'El DNI o documento del paciente.'
                }
              },
              required: ['dni']
            }
          };

          const dynamicPrompt = sysCfg.systemPrompt.replace('{bookingUrl}', bookingUrl);

          const generationConfig = {
            systemInstruction: `${dynamicPrompt}\n\nDatos de la clínica:\n- Nombre: ${clinic.clinicName}\n- Profesional: ${clinic.doctorName}\n- Especialidad: ${clinic.specialty}\n- Dirección: ${clinic.address}, ${clinic.city}\n- Horarios: ${clinic.workingHours}\n- Obras Sociales Aceptadas: ${clinic.insurances.join(', ')}\n- Enlace directo para agendar: ${bookingUrl}\n\nIMPORTANTE:\n1. Si el paciente pide turno, explícale que puede elegir día y hora de forma directa e inmediata haciendo clic en el enlace de la agenda: ${bookingUrl}\n2. Si el paciente ya te dio su DNI para consultar su turno, usa la herramienta consultarEstadoPaciente.\n3. Envía siempre los enlaces como texto limpio (ej: ${bookingUrl}), NUNCA uses formato markdown de enlaces tipo [texto](url).`,
            tools: [{ functionDeclarations: [consultarEstadoPaciente] }]
          };

          const response1 = await ai.models.generateContent({
            model: sysCfg.model || 'gemini-2.0-flash',
            contents: `Mensaje del paciente: "${textMessage}"`,
            config: generationConfig
          });

          let replyText = '';

          if (response1.functionCalls && response1.functionCalls.length > 0) {
            const call = response1.functionCalls[0];
            if (call.name === 'consultarEstadoPaciente') {
              const dniArg = call.args.dni;
              let toolResultStr = 'No se encontró registro.';

              if (typeof dniArg === 'string') {
                const patientsRef = getDb().collection('clinics').doc(clinicId).collection('patients');
                const patientSnap = await patientsRef.where('dni', '==', dniArg).limit(1).get();

                if (patientSnap.empty) {
                  toolResultStr = `El DNI ${dniArg} no tiene turnos pendientes registrados. Indícale que puede agendar aquí: ${bookingUrl}`;
                } else {
                  const patientId = patientSnap.docs[0].id;
                  const appointmentsRef = getDb().collection('clinics').doc(clinicId).collection('appointments');
                  const apptSnap = await appointmentsRef
                    .where('patientId', '==', patientId)
                    .where('status', 'in', ['SCHEDULED', 'CONFIRMED'])
                    .get();

                  if (!apptSnap.empty) {
                    const appt = apptSnap.docs[0].data();
                    toolResultStr = `El paciente tiene un turno agendado para el ${appt.date} a las ${appt.time} hs con el ${clinic.doctorName}.`;
                  } else {
                    toolResultStr = `El paciente no tiene turnos pendientes. Puede elegir uno en ${bookingUrl}`;
                  }
                }
              }

              const previousContent = response1.candidates?.[0]?.content;
              if (previousContent) {
                const response2 = await ai.models.generateContent({
                  model: sysCfg.model || 'gemini-2.0-flash',
                  contents: [
                    { role: 'user', parts: [{ text: `Mensaje del paciente: "${textMessage}"` }] },
                    previousContent,
                    { role: 'user', parts: [{ functionResponse: { name: 'consultarEstadoPaciente', response: { result: toolResultStr } } }] }
                  ],
                  config: generationConfig
                });
                replyText = response2.text || 'Disculpa, no pude procesar la consulta en este momento.';
              }
            }
          } else {
            replyText = response1.text || '';
          }

          if (!replyText) {
            replyText = `¡Hola! Gracias por comunicarte con el ${clinic.clinicName}. Para agendar tu turno online podés ingresar a: ${bookingUrl}`;
          }

          await sock.sendPresenceUpdate('paused', remoteJid);
          await sock.sendMessage(remoteJid, { text: replyText });
          botState.messagesSent += 1;

        } catch (err) {
          console.error('[AI] Error procesando mensaje con Gemini:', err);
          await sock.sendPresenceUpdate('paused', remoteJid);
          await sock.sendMessage(remoteJid, {
            text: `¡Hola! Gracias por comunicarte con ${clinic.clinicName}. En este momento estamos procesando consultas. Podés agendar tu turno directamente en nuestra agenda online: ${bookingUrl}`
          });
        }
      } else {
        // Fallback cuando la API key aún no está seteada
        await sock.sendMessage(remoteJid, {
          text: `¡Hola! Gracias por escribirnos a ${clinic.clinicName}. Podés agendar o consultar los horarios disponibles directamente en: ${bookingUrl}`
        });
      }
    }
  });
}

// -------------------------------------------------------------
// 5. Endpoints Públicos y de la Clínica
// -------------------------------------------------------------

// Configuración pública de la clínica (para la Landing Page y Portal de Turnos)
app.get('/api/clinic-config', (req, res) => {
  res.json(getClinicConfig());
});

// Verificación de DNI / Turnos existentes
app.post('/api/public/check-dni', async (req, res) => {
  try {
    const { dni } = req.body;
    const clinic = getClinicConfig();
    const clinicId = clinic.clinicId;
    const db = getDb();

    const pSnap = await db.collection('clinics').doc(clinicId).collection('patients').where('dni', '==', dni).limit(1).get();
    if (pSnap.empty) return res.json({ found: false });

    const pData = { id: pSnap.docs[0].id, ...pSnap.docs[0].data() };
    if (pData.createdAt?.toDate) pData.createdAt = pData.createdAt.toDate().toISOString();
    if (pData.updatedAt?.toDate) pData.updatedAt = pData.updatedAt.toDate().toISOString();

    const aSnap = await db.collection('clinics').doc(clinicId).collection('appointments')
      .where('patientId', '==', pData.id)
      .where('status', 'in', ['SCHEDULED', 'CONFIRMED'])
      .get();

    let existingAppointment = null;
    if (!aSnap.empty) {
      existingAppointment = { id: aSnap.docs[0].id, ...aSnap.docs[0].data() };
      if (existingAppointment.createdAt?.toDate) existingAppointment.createdAt = existingAppointment.createdAt.toDate().toISOString();
      if (existingAppointment.updatedAt?.toDate) existingAppointment.updatedAt = existingAppointment.updatedAt.toDate().toISOString();
    }

    res.json({ found: true, patient: pData, existingAppointment });
  } catch (err: any) {
    console.error('Error in check-dni:', err);
    res.status(500).json({ error: err.message });
  }
});

// Registro de nuevo paciente
app.post('/api/public/register', async (req, res) => {
  try {
    const { patient } = req.body;
    const clinic = getClinicConfig();
    const clinicId = clinic.clinicId;
    const db = getDb();

    patient.clinicOwnerId = clinicId;
    patient.createdAt = FieldValue.serverTimestamp();
    patient.updatedAt = FieldValue.serverTimestamp();

    const docRef = await db.collection('clinics').doc(clinicId).collection('patients').add(patient);
    res.json({ id: docRef.id });
  } catch (err: any) {
    console.error('Error registering patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cancelación de cita por el paciente
app.post('/api/public/cancel', async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const clinic = getClinicConfig();
    const clinicId = clinic.clinicId;
    const db = getDb();

    await db.collection('clinics').doc(clinicId).collection('appointments').doc(appointmentId).update({
      status: 'CANCELLED',
      updatedAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Horarios ocupados para una fecha
app.post('/api/public/slots', async (req, res) => {
  try {
    const { date } = req.body;
    const clinic = getClinicConfig();
    const clinicId = clinic.clinicId;
    const db = getDb();

    const snap = await db.collection('clinics').doc(clinicId).collection('appointments').where('date', '==', date).get();
    const occupied = snap.docs
      .filter((d: any) => d.data().status !== 'CANCELLED')
      .map((d: any) => d.data().time);

    res.json({ occupied });
  } catch (err: any) {
    console.error('Error getting slots:', err);
    res.status(500).json({ error: err.message });
  }
});

// Agendar nueva cita
app.post('/api/public/book', async (req, res) => {
  try {
    const { appointment } = req.body;
    const clinic = getClinicConfig();
    const clinicId = clinic.clinicId;
    const db = getDb();

    appointment.clinicOwnerId = clinicId;
    appointment.status = appointment.status || 'SCHEDULED';
    appointment.createdAt = FieldValue.serverTimestamp();
    appointment.updatedAt = FieldValue.serverTimestamp();

    const docRef = await db.collection('clinics').doc(clinicId).collection('appointments').add(appointment);
    res.json({ id: docRef.id });
  } catch (err: any) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. Endpoints de WhatsApp & Administración
// -------------------------------------------------------------

// Iniciar socket de WhatsApp
app.post('/api/whatsapp/start', async (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  if (botState.status === 'DISCONNECTED') {
    botState.status = 'INITIALIZING';
    startWhatsAppBot(host);
  }
  res.json({ status: botState.status, qr: botState.qr });
});

// Estado de WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: botState.status,
    qr: botState.qr,
    botActive: botState.botActive,
    messagesSent: botState.messagesSent
  });
});

// Pausar / Activar el bot
app.post('/api/whatsapp/toggle-bot', (req, res) => {
  const { active } = req.body;
  botState.botActive = !!active;
  res.json({ success: true, botActive: botState.botActive });
});

// Enviar recordatorios manuales desde el panel
app.post('/api/whatsapp/send-reminders', async (req, res) => {
  try {
    const { appointments } = req.body;
    if (!appointments || !Array.isArray(appointments)) {
      return res.status(400).json({ error: 'Lista de turnos requerida' });
    }

    if (!activeSock || botState.status !== 'CONNECTED') {
      return res.status(400).json({ error: 'WhatsApp no está conectado' });
    }

    const clinic = getClinicConfig();
    res.json({ success: true, count: appointments.length, message: 'Enviando recordatorios...' });

    (async () => {
      for (const appt of appointments) {
        try {
          if (!appt.phone) continue;
          const cleanNumber = appt.phone.replace(/\D/g, '');
          const waCheck = await activeSock.onWhatsApp(cleanNumber);

          if (!waCheck || waCheck.length === 0 || !waCheck[0].exists) {
            console.log(`[Reminder] Número no encontrado en WA: ${cleanNumber}`);
            continue;
          }

          const jid = waCheck[0].jid;
          const messageText = `Hola ${appt.patientName}! 👋 Te recordamos que tenés un turno agendado en ${clinic.clinicName} para el día ${appt.date} a las ${appt.time} hs con el ${clinic.doctorName}.\n\nPor favor respondé este mensaje con:\n1️⃣ para CONFIRMAR tu asistencia.\n2️⃣ para CANCELAR o solicitar reprogramar.\n\n¡Te esperamos!`;

          await activeSock.sendMessage(jid, { text: messageText });
          console.log(`[Reminder] Recordatorio enviado a ${jid}`);
          botState.messagesSent += 1;

          // Pausa de 15 segundos entre envíos para comportamiento natural
          await new Promise(r => setTimeout(r, 15000));
        } catch (err) {
          console.error(`Error enviando recordatorio a ${appt.phone}:`, err);
        }
      }
    })();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. Panel SuperAdmin (Tú: API Key, Prompts y Modelos)
// -------------------------------------------------------------
app.get('/api/admin/system-config', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const sysConfig = getSystemConfig();
  if (adminKey !== sysConfig.adminSecret) {
    return res.status(401).json({ error: 'Unauthorized: Secret key inválida' });
  }
  res.json(sysConfig);
});

app.post('/api/admin/system-config', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const existing = getSystemConfig();
  if (adminKey !== existing.adminSecret) {
    return res.status(401).json({ error: 'Unauthorized: Secret key inválida' });
  }

  const { apiKey, model, adminSecret, systemPrompt } = req.body;
  const newConfig: SystemConfig = {
    apiKey: apiKey !== undefined ? apiKey : existing.apiKey,
    model: model || existing.model,
    adminSecret: adminSecret || existing.adminSecret,
    systemPrompt: systemPrompt !== undefined ? systemPrompt : existing.systemPrompt
  };

  fs.writeFileSync(systemConfigPath, JSON.stringify(newConfig, null, 2));
  initializeAI();
  res.json({ success: true, config: newConfig });
});

// Guardar cambios en la configuración del consultorio
app.post('/api/admin/clinic-config', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const sysConfig = getSystemConfig();
  if (adminKey !== sysConfig.adminSecret && adminKey !== 'clinic-admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updatedConfig = req.body;
  fs.writeFileSync(clinicConfigPath, JSON.stringify(updatedConfig, null, 2));
  res.json({ success: true, config: updatedConfig });
});

// -------------------------------------------------------------
// 8. Inicialización del Servidor (Vite o Dist)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🦷 Turnely / MediFlow Single-Client Platform`);
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

startServer();
