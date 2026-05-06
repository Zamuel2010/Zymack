import { GoogleGenAI } from '@google/genai';

async function analyze() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await fetch("https://i.postimg.cc/X7Vh7BX7/IMG-4085.jpg");
  const buffer = await response.arrayBuffer();
  
  const b64 = Buffer.from(buffer).toString("base64");
  
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: b64, mimeType: 'image/jpeg' } },
          { text: 'Describe the design of the virtual card shown in this image. List its background style, logo placement, layout of the card number, CVV, expiry date, text colors, and font styles. Detail the visual appearance of the card itself.' }
        ]
      }
    ]
  });
  console.log(result.text);
}

analyze().catch(console.error);
