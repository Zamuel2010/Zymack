const admin = require('firebase-admin');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({ projectId: cfg.projectId });

let db;
try { 
    const { getFirestore } = require('firebase-admin/firestore');
    db = getFirestore(admin.app(), cfg.firestoreDatabaseId);
    console.log("Got getFirestore");
} catch(e) {
    console.log("Threw!", e.message);
    db = admin.firestore();
}
