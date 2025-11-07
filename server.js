// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

let symbol = "BTCUSDT";
let lastPrice = 0;
let prices = [];

// --- update price every second from Binance REST API ---
async function updatePrice() {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await r.json();
    if (data.price) {
      lastPrice = parseFloat(data.price);
      prices.push(lastPrice);
      if (prices.length > 200) prices.shift();
    }
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}
setInterval(updatePrice, 1000);

// --- endpoints ---
app.get("/api/price", (req, res) => res.json({ symbol, price: lastPrice }));

app.get("/api/change/:pair", (req, res) => {
  symbol = req.params.pair.toUpperCase();
  prices = [];
  res.json({ message: `Pair changed to ${symbol}` });
});

app.get("/api/signal", (req, res) => {
  if (prices.length < 10) return res.json({ signal: "WAIT" });
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diff = ((lastPrice - avg) / avg) * 100;
  let signal = "HOLD";
  if (diff > 0.4) signal = "SELL";
  else if (diff < -0.4) signal = "BUY";
  res.json({ signal, lastPrice, avg, diff: diff.toFixed(2) });
});

// --- serve static files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`✅ REST server running on ${PORT}`));
