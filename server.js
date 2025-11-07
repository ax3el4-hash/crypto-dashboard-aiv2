// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// 🟢 Get live BTCUSDT price from Binance
app.get("/api/price", async (req, res) => {
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await r.json();
    res.json({ symbol: data.symbol, price: data.price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🤖 Simple AI-style signal generator
app.get("/api/signal", (req, res) => {
  const signals = ["BUY", "SELL", "HOLD"];
  const signal = signals[Math.floor(Math.random() * signals.length)];
  const confidence = (50 + Math.random() * 50).toFixed(1);
  res.json({ signal, confidence });
});

app.use(express.static("public")); // serves your index.html

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

