import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

async function testFetch() {
  try {
    const apiKey = process.env.TATUM_API_KEY || "";
    // doge wallet
    let r1 = await fetch("https://api.tatum.io/v3/dogecoin/address/xpub6EfMAB9fdz2TJnT6bNxh4DusX58yALzGTV9yB8MBJhTNWMdGTCjh9b1gBNm7YD7eWNpgf5eV4wccFrAgiEY6XMfEwH4EyRGHDC3bZXWhZDr/0", {headers:{"x-api-key":apiKey}});
    console.log("dogecoin:", await r1.json());
    
    // ada wallet
    let r3 = await fetch("https://api.tatum.io/v3/ada/address/9b2e4cf4d649e4eae924051def1b2b180cc6515f9e41df0521bef7fe44dc8315df70f7243dbd0d70126e23d2268ae8186cffdfc8b28bac9fa8dad36c9a4dba10/0", {headers:{"x-api-key":apiKey}});
    console.log("ada:", await r3.text());
    
  } catch (e) {
    console.error(e);
  }
}
testFetch();
