import * as admin from 'firebase-admin';
import * as fs from 'fs';

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(cfg.serviceAccountKey),
        projectId: cfg.projectId
    });
}
const db = cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)' 
    ? admin.firestore(admin.app(), cfg.firestoreDatabaseId) 
    : admin.firestore();

async function run() {
    const doc = await db.collection('users').doc('B4HiKJixYmXhcRP8jih4vTq9pU63').get();
    console.log(doc.data());
    process.exit(0);
}
run();
