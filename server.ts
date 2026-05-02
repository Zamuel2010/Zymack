import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cryptoLib from "crypto";

// Path to store our global master XPUBs
const XPUBS_FILE = path.join(process.cwd(), ".xpubs.json");

// Define Tatum network mapping based on cryptocurrency and network
const getTatumChain = (crypto: string, network: string): string => {
  if (crypto === 'btc' || network === 'Bitcoin') return 'bitcoin';
  if (network === 'TRC20') return 'tron';
  if (network === 'BEP20' || network === 'BSC') return 'bsc';
  if (crypto === 'doge' || network === 'Dogecoin') return 'dogecoin';
  if (crypto === 'ada' || network === 'Cardano') return 'ada';
  if (crypto === 'xrp' || network === 'Ripple' || network === 'XRP') return 'xrp';
  if (network === 'Solana' || crypto === 'sol') return 'solana';
  // Default to Ethereum for EVM chains (ERC20, Arbitrum, Optimism, Polygon, Base, etc) since the same address works!
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
      let xpubs: Record<string, any> = {};
      if (fs.existsSync(XPUBS_FILE)) {
        xpubs = JSON.parse(fs.readFileSync(XPUBS_FILE, 'utf-8'));
      }

      let chainWallet = xpubs[chain];
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
        xpubs[chain] = chainWallet;
        fs.writeFileSync(XPUBS_FILE, JSON.stringify(xpubs, null, 2));
        console.log(`Generated new master wallet for ${chain} and saved XPUB to .xpubs.json`);
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
             const endpoint = chain === 'xrp' ? `https://api.tatum.io/v3/xrp/account` : `https://api.tatum.io/v3/solana/wallet`;
             const resp = await fetch(endpoint, { headers: { "x-api-key": apiKey } });
             standaloneWallets[uid] = await resp.json();
             fs.writeFileSync(fileName, JSON.stringify(standaloneWallets, null, 2));
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

  app.post("/api/tatum/webhook", (req, res) => {
    // Tatum sends webhook with body containing data about the transaction
    const webhookData = req.body;
    console.log("Received Tatum Webhook:", webhookData);
    
    // Webhook data usually has 'address' or 'to' depending on the chain, and 'amount'
    const address = (webhookData.address || webhookData.to || "").toLowerCase();
    
    if (address) {
       const MAP_FILE = path.join(process.cwd(), ".address_map.json");
       if (fs.existsSync(MAP_FILE)) {
          const addrMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
          const uid = addrMap[address];
          if (uid) {
             const PENDING_FILE = path.join(process.cwd(), ".pending_tx.json");
             let pending: Record<string, any[]> = {};
             if (fs.existsSync(PENDING_FILE)) {
                pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
             }
             if (!pending[uid]) pending[uid] = [];
             
             pending[uid].push({
                type: 'deposit',
                address: webhookData.address,
                amount: parseFloat(webhookData.amount) || 0,
                asset: webhookData.currency || webhookData.chain || "Crypto",
                txId: webhookData.txId,
                timestamp: new Date().toISOString()
             });
             
             fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
             console.log(`Saved pending deposit for uid ${uid}`);
          }
       }
    }
    
    // Always return 200 OK so Tatum doesn't retry infinitely
    res.status(200).send("OK");
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
