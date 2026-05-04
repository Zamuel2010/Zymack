const admin = require('firebase-admin');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
admin.initializeApp({ projectId: cfg.projectId });
console.log("DB ID:", cfg.firestoreDatabaseId);

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore(admin.app(), cfg.firestoreDatabaseId);

async function run() {
  try {
     const docRef = db.collection('test_batch_create').doc('valid123');
     await docRef.set({ val: 1 });
     console.log("Success!");
  } catch(e) {
     console.error("Error:", e.message);
  }
}
run();
