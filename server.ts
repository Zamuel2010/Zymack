import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cryptoLib from "crypto";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin for persistent storage
if (fs.existsSync('./firebase-applet-config.json')) {
  try {
    const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    
    // Use the Service Account JSON if provided in environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
       const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
       admin.initializeApp({
         credential: admin.credential.cert(serviceAccount),
         projectId: cfg.projectId
       });
       console.log("Firebase Admin Initialized securely using ENV Service Account.");
    } else {
       // Fallback
       admin.initializeApp({ projectId: cfg.projectId });
       console.log("Firebase Admin Initialized without explicit credential.");
    }
  } catch (e) {
    console.error("Failed to initialize Firebase Admin:", e);
  }
}

// Get Firestore instance securely
const getDb = () => {
   if (!admin.apps.length) throw new Error("Firebase Admin not initialized");
   const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
   try { 
       if (cfg.firestoreDatabaseId && cfg.firestoreDatabaseId !== '(default)') {
           return getFirestore(admin.app(), cfg.firestoreDatabaseId);
       }
       return admin.firestore();
   } catch(e) {
       console.error("Failed to get named db, falling back to default.", e);
       return admin.firestore();
   }
};

// Path to store our global master XPUBs
const XPUBS_FILE = path.join(process.cwd(), ".xpubs.json");

// Define Tatum network mapping based on cryptocurrency and network
const getTatumChain = (crypto: string, network: string): string => {
  const normNet = network.toUpperCase();
  const normCryp = crypto.toUpperCase();

  if (normNet === 'TRC20' || normCryp === 'TRON' || normCryp === 'TRX') return 'tron';
  if (normNet === 'BEP20' || normNet === 'BSC' || normCryp === 'BNB') return 'bsc';
  
  if (normCryp === 'BTC' || normNet === 'BITCOIN') return 'bitcoin';
  if (normCryp === 'DOGE' || normNet === 'DOGECOIN') return 'dogecoin';
  if (normCryp === 'ADA' || normNet === 'CARDANO') return 'ada';
  if (normCryp === 'XRP' || normNet === 'RIPPLE') return 'xrp';
  if (normCryp === 'SOL' || normNet === 'SOLANA') return 'solana';
  
  // Default to Ethereum for EVM chains (ERC20, Arbitrum, Polygon, Base, etc.)
  // Note: ERC20 tokens like USDT and USDC share the exact same Ethereum address formatting.
  return 'ethereum';
};

// Generate an index from Firebase UID (hash it to a 31-bit integer for BIP32 compatibility)
const getIndexFromUid = (uid: string): number => {
  return cryptoLib.createHash('sha256').update(uid).digest().readUInt32LE(0) & 0x7FFFFFFF;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/admin/verify-tx", async (req, res) => {
    const apiKey = process.env.TATUM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TATUM_API_KEY is not configured" });
    }

    try {
      const { txId, asset } = req.body;
      if (!txId || !asset) return res.status(400).json({ error: "Missing txId or asset" });

      const chain = getTatumChain(asset, asset); // use getTatumChain with asset symbol
      let url = `https://api.tatum.io/v3/${chain}/transaction/${txId}`;
      
      const txResp = await fetch(url, { headers: { "x-api-key": apiKey } });
      
      if (!txResp.ok) {
        return res.status(404).json({ error: "Transaction not found on blockchain" });
      }

      const txData = await txResp.json();
      return res.json({ verified: true, chain, txData });
    } catch (e) {
      console.error("Tx Verify Error:", e);
      return res.status(500).json({ error: "Verification failed due to server error" });
    }
  });

  app.post("/api/tatum/wallet", async (req, res) => {
    const apiKey = process.env.TATUM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TATUM_API_KEY is not configured" });
    }

    try {
      const { crypto, network, uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
      }

      const chain = getTatumChain(crypto, network);
      const addressIndex = getIndexFromUid(uid);

      // Load or Create Master Wallet for this Chain
      let chainWallet;
      if (chain === 'ethereum' || chain === 'bsc' || chain === 'polygon') {
         chainWallet = process.env.ETH_XPUB ? { xpub: process.env.ETH_XPUB } : null;
      } else if (chain === 'bitcoin') {
         chainWallet = process.env.BTC_XPUB ? { xpub: process.env.BTC_XPUB } : null;
      } else if (chain === 'tron') {
         chainWallet = process.env.TRON_XPUB ? { xpub: process.env.TRON_XPUB } : null;
      } else {
         // fallback to file if not predefined
         let xpubs: Record<string, any> = {};
         if (fs.existsSync(XPUBS_FILE)) {
             xpubs = JSON.parse(fs.readFileSync(XPUBS_FILE, 'utf-8'));
         }
         
         // If file didn't have it, try firebase
         if (!xpubs[chain]) {
            try {
               const db = getDb();
               const doc = await db.collection("master_wallets").doc(chain).get();
               if (doc.exists) {
                   xpubs[chain] = doc.data();
                   fs.writeFileSync(XPUBS_FILE, JSON.stringify(xpubs, null, 2));
               }
            } catch(e) {}
         }
         chainWallet = xpubs[chain];
      }

      if (!chainWallet) {
        // Generate new master wallet via Tatum API
        const walletResp = await fetch(`https://api.tatum.io/v3/${chain}/wallet`, {
          headers: { "x-api-key": apiKey }
        });
        if (!walletResp.ok) {
           const errText = await walletResp.text();
           console.error("Tatum Wallet generation failed:", errText);
           throw new Error("Tatum Wallet generation failed");
        }
        chainWallet = await walletResp.json();
        
        // Save to fallback file
        let xpubs: Record<string, any> = {};
        if (fs.existsSync(XPUBS_FILE)) xpubs = JSON.parse(fs.readFileSync(XPUBS_FILE, 'utf-8'));
        xpubs[chain] = chainWallet;
        fs.writeFileSync(XPUBS_FILE, JSON.stringify(xpubs, null, 2));

        // SECURITY CRITICAL: Save master wallets (xpubs/mnemonics) to Firebase Storage
        try {
            const db = getDb();
            await db.collection("master_wallets").doc(chain).set(chainWallet);
            console.log(`Saved master wallet for ${chain} to Firestore`);
        } catch(firebaseErr) {
            console.error("Failed to save master wallet to Firebase:", firebaseErr);
        }

        console.log(`Generated new master wallet for ${chain} and saved XPUB to .xpubs.json (Set ENV vars for production)`);
      }

      // Generate Address for the user's index
      let address = "";
      
      if (chain === 'solana' || chain === 'xrp') {
          // Solana and XRP use individual generated keypairs instead of XPUB indexing natively in the same way via REST,
          // but if we are simulating unified indexing or if the user wants simple standalone, we can just return a fresh address.
          // To make it simple and "live", we generate a specific fresh wallet for this user's UID and store it in a map.
          let standaloneWallets: Record<string, any> = {};
          const fileName = path.join(process.cwd(), `.${chain}_wallets.json`);
          if (fs.existsSync(fileName)) {
             standaloneWallets = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
          }
          
          if (!standaloneWallets[uid]) {
             try {
                 const db = getDb();
                 const doc = await db.collection("managed_wallets").doc(`${chain}_${uid}`).get();
                 if (doc.exists && doc.data()) {
                     standaloneWallets[uid] = doc.data()?.walletData;
                     fs.writeFileSync(fileName, JSON.stringify(standaloneWallets, null, 2));
                 }
             } catch(e) {}
          }

          if (!standaloneWallets[uid]) {
             const endpoint = chain === 'xrp' ? `https://api.tatum.io/v3/xrp/account` : `https://api.tatum.io/v3/solana/wallet`;
             const resp = await fetch(endpoint, { headers: { "x-api-key": apiKey } });
             standaloneWallets[uid] = await resp.json();
             
             // Save locally as a temporary cache
             fs.writeFileSync(fileName, JSON.stringify(standaloneWallets, null, 2));

             // SECURITY CRITICAL: Save to Firebase Firestore immediately!
             try {
                 const db = getDb();
                 await db.collection("managed_wallets").doc(`${chain}_${uid}`).set({
                     uid: uid,
                     chain: chain,
                     address: standaloneWallets[uid].address,
                     walletData: standaloneWallets[uid] // Contains private key
                 });
                 console.log(`Saved ${chain} wallet securely to Firestore for uid ${uid}`);
             } catch (firebaseErr) {
                 console.error("Failed to save wallet to Firebase! It may be lost on restart:", firebaseErr);
             }
          }
          address = standaloneWallets[uid].address;
      } else {
          // Use XPUB to generate address
          const xpub = chainWallet.xpub;
          const addressResp = await fetch(`https://api.tatum.io/v3/${chain}/address/${xpub}/${addressIndex}`, {
              headers: { "x-api-key": apiKey }
          });
          
          if (!addressResp.ok) {
              const errText = await addressResp.text();
              console.error(`Tatum Address generation failed for ${chain}:`, errText);
              throw new Error(`Tatum Address generation failed`);
          }
          const addressData = await addressResp.json();
          address = addressData.address;
      }

      res.json({ address });

      // After sending response, asynchronously map the address and subscribe to webhooks
      setTimeout(async () => {
         try {
             // Save address -> uid mapping
             const MAP_FILE = path.join(process.cwd(), ".address_map.json");
             let addrMap: Record<string, string> = {};
             if (fs.existsSync(MAP_FILE)) {
                addrMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
             }
             addrMap[address.toLowerCase()] = uid;
             fs.writeFileSync(MAP_FILE, JSON.stringify(addrMap, null, 2));

             try {
                const db = getDb();
                await db.collection("address_mappings").doc(address.toLowerCase() || 'unknown').set({ uid });
             } catch(firebaseErr) {
                 console.error("Failed to map address in Firebase:", firebaseErr);
             }

             // Create Tatum webhook subscription
             if (process.env.APP_URL) {
                const subChain = chain === 'bitcoin' ? 'BTC' : 
                                 chain === 'ethereum' ? 'ETH' : 
                                 chain === 'bsc' ? 'BSC' : 
                                 chain === 'tron' ? 'TRON' : 
                                 chain === 'solana' ? 'SOL' : 
                                 chain === 'dogecoin' ? 'DOGE' : 
                                 chain === 'ada' ? 'ADA' : 
                                 chain === 'xrp' ? 'XRP' : 'ETH';

                const subResp = await fetch(`https://api.tatum.io/v3/subscription`, {
                   method: 'POST',
                   headers: { 
                      "x-api-key": apiKey,
                      "Content-Type": "application/json"
                   },
                   body: JSON.stringify({
                      type: "ADDRESS_TRANSACTION",
                      attr: {
                         address: address,
                         chain: subChain,
                         url: `${process.env.APP_URL}/api/tatum/webhook`
                      }
                   })
                });
                
                if (!subResp.ok) {
                   console.error("Failed to subscribe to Tatum webhook for address", address, await subResp.text());
                } else {
                   console.log(`Subscribed to webhooks for ${address} on ${subChain}`);
                }
             }
         } catch(e) {
             console.error("Webhook subscription error:", e);
         }
      }, 0);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate wallet" });
    }
  });

  app.post("/api/tatum/webhook", async (req, res) => {
    // Tatum sends webhook with body containing data about the transaction
    const webhookData = req.body;
    console.log("Received Tatum Webhook:", webhookData);
    
    // Always acknowledge early so Tatum doesn't retry
    res.status(200).send("OK");

    const address = (webhookData.address || webhookData.to || "").toLowerCase();
    if (!address) return;

    try {
        const db = getDb();
        let uid = null;
        
        // 1. Try to find uid from firestore mapping first
        const mapDoc = await db.collection("address_mappings").doc(address).get();
        if (mapDoc.exists) {
            uid = mapDoc.data()?.uid;
        } else {
            // 2. Fallback to local map just in case it was created quickly before container restart
            const MAP_FILE = path.join(process.cwd(), ".address_map.json");
            if (fs.existsSync(MAP_FILE)) {
               const addrMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
               uid = addrMap[address];
               // Auto-heal firestore if we know it
               if (uid) await db.collection("address_mappings").doc(address).set({ uid });
            }
        }
        
        if (!uid) {
            console.log("Webhook hit for unmapped address:", address);
            return;
        }

        let asset = webhookData.currency || webhookData.chain || "Crypto";
        if (webhookData.tokenAddress) asset = "ERC20_TOKEN";

        const cryptoAmount = parseFloat(webhookData.amount) || 0;
        if (cryptoAmount <= 0) return;

        const txId = webhookData.txId || webhookData.hash || webhookData.id;
        if (!txId) {
             console.log("Missing txId in webhook:", webhookData);
             return;
        }

        console.log(`Processing Webhook for uid ${uid}, asset ${asset}, amount ${cryptoAmount}, txId ${txId}`);

        // SECURITY CRITICAL: Execute inside a transaction to prevent replay attacks
        await db.runTransaction(async (transaction: any) => {
            const txRef = db.collection('wallets').doc(uid).collection('transactions').doc(txId);
            const txDoc = await transaction.get(txRef);
            
            if (txDoc.exists) {
                console.log(`Duplicate webhook ignored for txId ${txId}`);
                return; // Already processed!
            }
            
            // 3. Fetch Real Fiat Exchange Rates
            let rate = 1000;
            try {
                const cgResp = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,bitcoin,ethereum,solana,binancecoin,tron,ripple,cardano,dogecoin,shiba-inu&vs_currencies=ngn");
                const cgData = await cgResp.json();
                const liveRates: Record<string, number> = {
                   'BTC': cgData.bitcoin?.ngn || 100000000,
                   'ETH': cgData.ethereum?.ngn || 5000000,
                   'SOL': cgData.solana?.ngn || 250000,
                   'BSC': cgData.binancecoin?.ngn || 800000,
                   'BNB': cgData.binancecoin?.ngn || 800000,
                   'TRON': cgData.tron?.ngn || 200,
                   'USDT': cgData.tether?.ngn || 1600,
                   'USDC': cgData['usd-coin']?.ngn || 1600,
                   'XRP': cgData.ripple?.ngn || 800,
                   'ADA': cgData.cardano?.ngn || 700,
                   'DOGE': cgData.dogecoin?.ngn || 200,
                   'SHIB': cgData['shiba-inu']?.ngn || 0.03
                };
                rate = liveRates[asset.toUpperCase()] || rate;
            } catch (e) {
                console.error("Failed to fetch rates in webhook, using fallback rate.")
            }
            
            const fiatValue = cryptoAmount * rate;
            
            // 4. Update the user transaction log (guaranteed to happen once)
            transaction.set(txRef, {
                type: 'receive',
                amount: fiatValue, 
                cryptoAmount: cryptoAmount,
                cryptoAsset: asset,
                status: 'completed',
                title: `Deposit ${asset}`,
                createdAt: new Date().toISOString(),
                txId: txId,
                isRead: false
            });
            
            // 5. Update the wallet balance securely!
            const walletRef = db.collection('wallets').doc(uid);
            transaction.set(walletRef, {
                totalBalance: admin.firestore.FieldValue.increment(fiatValue)
            }, { merge: true });
            
            console.log(`Webhook PROCESSED securely! Added ${fiatValue} NGN to uid: ${uid}`);
        });

    } catch (err) {
        console.error("Critical error in Webhook processing:", err);
    }
  });

  app.get("/api/tatum/sync", (req, res) => {
     const uid = req.query.uid as string;
     if (!uid) return res.status(400).json({ error: "Missing uid" });
     
     const PENDING_FILE = path.join(process.cwd(), ".pending_tx.json");
     let pending: Record<string, any[]> = {};
     let userTx: any[] = [];
     
     if (fs.existsSync(PENDING_FILE)) {
        pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
        if (pending[uid] && pending[uid].length > 0) {
           userTx = [...pending[uid]];
           pending[uid] = []; // clear them
           fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
        }
     }
     
     res.json({ transactions: userTx });
  });

  app.post("/api/user/transfer", async (req, res) => {
    try {
        const { senderUid, recipientUid, amount } = req.body;
        
        if (!senderUid || !recipientUid || !amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid transfer details" });
        }
        if (senderUid === recipientUid) {
            return res.status(400).json({ error: "Cannot transfer to yourself" });
        }

        const db = getDb();
        
        await db.runTransaction(async (transaction: any) => {
            const senderWalletRef = db.collection('wallets').doc(senderUid);
            const recipientWalletRef = db.collection('wallets').doc(recipientUid);

            const senderDoc = await transaction.get(senderWalletRef);
            const recipientDoc = await transaction.get(recipientWalletRef);

            if (!senderDoc.exists) throw new Error("Sender wallet not found!");
            if (!recipientDoc.exists) throw new Error("Recipient does not exist!");

            const senderBalance = senderDoc.data()?.totalBalance || 0;
            if (senderBalance < amount) throw new Error("Insufficient balance!");

            // Calculate new balances
            const newSenderBalance = senderBalance - amount;
            const newRecipientBalance = (recipientDoc.data()?.totalBalance || 0) + amount;

            // Update balances securely
            transaction.update(senderWalletRef, { totalBalance: newSenderBalance });
            transaction.update(recipientWalletRef, { totalBalance: newRecipientBalance });

            // Create Transaction Logs
            const txId = `trf-${Date.now()}`;
            const senderTxRef = db.collection('wallets').doc(senderUid).collection('transactions').doc(txId);
            transaction.set(senderTxRef, {
                type: 'withdrawal',
                amount: amount,
                title: `Transfer to ${recipientUid.substring(0, 5)}...`,
                status: 'completed',
                createdAt: new Date().toISOString(),
                isRead: false
            });

            const recipientTxRef = db.collection('wallets').doc(recipientUid).collection('transactions').doc(txId);
            transaction.set(recipientTxRef, {
                type: 'deposit',
                amount: amount,
                title: `Transfer from ${senderUid.substring(0, 5)}...`,
                status: 'completed',
                createdAt: new Date().toISOString(),
                isRead: false
            });
        });

        res.json({ success: true, message: "Transfer successful!" });
    } catch (e: any) {
        console.error("Transfer Error:", e.message);
        res.status(500).json({ error: e.message || "Failed to transfer funds." });
    }
  });

  const getKorapayBankCode = (bankName: string) => {
    const map: Record<string, string> = {
      'GTBank': '058',
      'Access Bank': '044',
      'Zenith Bank': '057',
      'UBA': '033',
      'First Bank': '011',
      'Moniepoint': '50515',
      'Opay': '100004',
      'Palmpay': '100033',
      'Kuda': '090267'
    };
    return map[bankName] || '058'; // default to GTBank if not found
  };

  app.post("/api/user/withdraw", async (req, res) => {
        let step = "Fetching DB";
        try {
            step = "checking input";
            const { uid, accountId, amount } = req.body;
            
            if (!uid || !accountId || !amount || amount <= 0) {
                return res.status(400).json({ error: "Invalid withdrawal details" });
            }

            step = "fetching user and account docs";
            const db = getDb();

            // 1. Fetch user data and check balance
            const [userDoc, accountDoc] = await Promise.all([
                 db.collection('wallets').doc(uid).get(),
                 db.collection('wallets').doc(uid).collection('bankAccounts').doc(accountId).get()
            ]);

            step = "validating doc existence";
            if (!userDoc.exists) return res.status(404).json({ error: "Wallet not found" });
            if (!accountDoc.exists) return res.status(404).json({ error: "Bank account not found" });

            step = "validating balance";
            const balance = userDoc.data()?.totalBalance || 0;
            if (balance < amount) return res.status(400).json({ error: "Insufficient balance" });

            step = "getting test api keys";
            const accountData = accountDoc.data();
            const bankCode = getKorapayBankCode(accountData.bankName);

            // 2. Call Korapay Disburse API
            const korapayKey = process.env.KORAPAY_SECRET_KEY;
            if (!korapayKey) {
                console.warn("KORAPAY_SECRET_KEY is not set. Simulating payout.");
            } else {
                step = "Calling korapay disburse API";
                const korapayUrl = "https://api.korapay.com/merchant/api/v1/transactions/disburse";
                const payload = {
                  "reference": `withdraw-${Date.now()}-${uid.substring(0,6)}`,
                  "destination": {
                    "type": "bank_account",
                    "amount": amount,
                    "currency": "NGN",
                    "narration": "Zymack Withdrawal",
                    "bank_account": {
                      "bank": bankCode,
                      "account": accountData.accountNumber
                    },
                    "customer": {
                      "email": `user_${uid}@zymack.com`
                    }
                  }
                };
                
                const koraRes = await fetch(korapayUrl, {
                   method: "POST",
                   headers: {
                     "Authorization": `Bearer ${korapayKey}`,
                     "Content-Type": "application/json"
                   },
                   body: JSON.stringify(payload)
                });

                step = "parsing korapay json";
                const koraData = await koraRes.json();
                if (!koraRes.ok || !koraData.status) {
                    console.error("Korapay Error:", koraData);
                    return res.status(400).json({ error: koraData.message || "Failed to disburse funds to bank" });
                }
            }

            step = "processing firestore batch commit";
            // 3. Deduct Balance & Log transaction
            const batch = db.batch();
            const walletRef = db.collection('wallets').doc(uid);
            const txRef = db.collection('wallets').doc(uid).collection('transactions').doc(`wd-${Date.now()}`);
            
            // Deduct balance
            batch.set(walletRef, {
               totalBalance: admin.firestore.FieldValue.increment(-amount)
            }, { merge: true });

            // Add local withdrawal log
            batch.set(txRef, {
                type: 'withdrawal',
                amount: amount,
                title: `Withdrawal to ${accountData.bankName} (${accountData.accountNumber.slice(-4)})`,
                status: 'completed',
                createdAt: new Date().toISOString(),
                isRead: false
            });
            
            await batch.commit();

            step = "done";
            res.json({ success: true, message: "Withdrawal successful!" });
        } catch (e: any) {
            console.error(`Withdraw Error (at step: ${step}):`, e);
            res.status(500).json({ error: `${e.message} (Step: ${step})` || "Failed to process withdrawal." });
        }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, AI Studio handles the build via `npm run build`
    // Ensure we handle static files if needed, though mostly it's built and served by the infrastructure
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
