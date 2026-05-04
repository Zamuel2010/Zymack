const admin = require('firebase-admin');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
admin.initializeApp({ projectId: cfg.projectId });
const db = admin.firestore();

async function run() {
  try {
     const docRef = db.collection('test_batch_create').doc('valid123'); // make sure valid123 exists
     await docRef.set({ val: 1 }); // ensure it exists!

     // Now test batch increment with merge
     const batch = db.batch();
     batch.set(docRef, { val: admin.firestore.FieldValue.increment(1) }, { merge: true });
     await batch.commit();
     console.log("Batch increment successful on existing doc!");

     // Now test creating a subcollection without merge
     const subDocRef = docRef.collection('transactions').doc('tx123');
     const batch2 = db.batch();
     batch2.set(subDocRef, { test: 'hello' });
     await batch2.commit();
     console.log("Batch2 successful!");
  } catch(e) {
     console.error("Batch error:", e.message);
  }
}
run();
