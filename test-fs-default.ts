import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAppConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

const adminApp = initializeApp({
  projectId: firebaseAppConfig.projectId,
});

const firestoreDb = getFirestore(adminApp);

async function run() {
  try {
    const snap = await firestoreDb.collection('clinics').limit(1).get();
    console.log("Success with default DB! Found", snap.size, "docs.");
  } catch (err) {
    console.error("Firestore Error with default DB:", err.message);
  }
}

run();
