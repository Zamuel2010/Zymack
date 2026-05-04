import fetch from "node-fetch";

// Configuration for sweeping
const TATUM_API_KEY = process.env.TATUM_API_KEY;
const CHAIN = process.argv[2]; // e.g. "solana", "bitcoin", "ethereum", "tron"
const FROM_PRIVATE_KEY = process.argv[3];
const TO_ADDRESS = process.argv[4];
const AMOUNT = process.argv[5]; // Leave empty to potentially sweep all (max amount depending on chain)

async function sweep() {
  if (!CHAIN || !FROM_PRIVATE_KEY || !TO_ADDRESS) {
    console.error("Usage: npx tsx sweep.ts <chain> <fromPrivateKey> <toAddress> [amount]");
    console.error("Example: npx tsx sweep.ts solana <private_key> <master_address> 0.1");
    process.exit(1);
  }

  if (!TATUM_API_KEY) {
      console.error("Missing TATUM_API_KEY in environment variables.");
      process.exit(1);
  }

  console.log(`Sweeping ${AMOUNT || 'ALL'} from ${CHAIN} to ${TO_ADDRESS}...`);

  let body: any = {};
  if (CHAIN === "solana") {
     body = {
        to: TO_ADDRESS,
        amount: AMOUNT || "0", // Note: Some specific values might be needed to send MAX, or you specify a fixed amount subtracting gas.
        fromPrivateKey: FROM_PRIVATE_KEY,
     };
  } else if (CHAIN === "ethereum" || CHAIN === "bsc" || CHAIN === "polygon") {
     body = {
        to: TO_ADDRESS,
        amount: AMOUNT,
        fromPrivateKey: FROM_PRIVATE_KEY,
        currency: CHAIN === "ethereum" ? "ETH" : CHAIN === "bsc" ? "BSC" : "MATIC"
     };
  } else if (CHAIN === "bitcoin") {
    // Bitcoin requires fromAddress / UTXO management, which is slightly more complex.
    // If you have the mnemonic/private key, Tatum expects mnemonic+xpub or specific private keys in an array.
    body = {
        to: [{ address: TO_ADDRESS, value: Number(AMOUNT) }],
        fromPrivateKey: [FROM_PRIVATE_KEY] 
    };
  } else if (CHAIN === "tron") {
    body = {
      to: TO_ADDRESS,
      amount: AMOUNT,
      fromPrivateKey: FROM_PRIVATE_KEY
    };
  }

  const res = await fetch(`https://api.tatum.io/v3/${CHAIN}/transaction`, {
      method: "POST",
      headers: {
          "x-api-key": TATUM_API_KEY,
          "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
  });

  const responseText = await res.text();
  if (res.ok) {
     console.log("Sweep Successful:", responseText);
  } else {
     console.error("Sweep Failed:", responseText);
  }
}

sweep();
