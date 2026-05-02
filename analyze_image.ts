import { GoogleGenAI } from '@google/genai';

async function analyze() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await fetch("https://i.postimg.cc/d3frMsgm/IMG-4040.jpg");
  const buffer = await response.arrayBuffer();
  
  const b64 = Buffer.from(buffer).toString("base64");
  
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: b64, mimeType: 'image/jpeg' } },
          { text: 'Detail the UI layout and text of this account page image. Please list the sections, icons, and menus exactly as shown.' }
        ]
      }
    ]
  });
  console.log(result.text);
}

analyze().catch(console.error);
