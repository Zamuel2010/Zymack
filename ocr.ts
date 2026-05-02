async function ocr() {
  const url = `https://api.ocr.space/parse/imageurl?apikey=helloworld&url=https://i.postimg.cc/d3frMsgm/IMG-4040.jpg`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

ocr().catch(console.error);
