import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.TATUM_API_KEY || "";

async function check(chain: string, txId: string) {
    const res = await fetch(`https://api.tatum.io/v3/${chain}/transaction/${txId}`, {
        headers: { "x-api-key": apiKey }
    });
    console.log(chain, res.status);
}
check("solana", "dummy");
check("ethereum", "0x00");
