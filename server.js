import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

let symbol = "BTCUSDT";
let lastPrice = 0;
let prices = [];

// --- Fetch from Binance every second ---
async function updatePrice() {
  try {
    const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await resp.json();
    if (data.price) {
      lastPrice = parseFloat(data.price);
      prices.push(lastPrice);
      if (prices.length > 60) prices.shift(); // last 60 seconds
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
setInterval(updatePrice, 1000);

// --- Endpoint: current price ---
app.get("/api/price", (req, res) => res.json({ symbol, price: lastPrice }));

// --- Endpoint: change symbol ---
app.get("/api/change/:pair", (req, res) => {
  symbol = req.params.pair.toUpperCase();
  prices = [];
  res.json({ message: `Pair changed to ${symbol}` });
});

// --- Simple AI-like signal ---
app.get("/api/signal", (req, res) => {
  if (prices.length < 10) return res.json({ signal: "WAIT" });
  const last = prices[prices.length - 1];
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const diff = ((last - avg) / avg) * 100;
  let signal = "HOLD";
  if (diff > 0.4) signal = "SELL";
  else if (diff < -0.4) signal = "BUY";
  res.json({ signal, lastPrice, avg, diff: diff.toFixed(2) });
});

app.listen(PORT, () => console.log(`✅ REST server running on ${PORT}`));
