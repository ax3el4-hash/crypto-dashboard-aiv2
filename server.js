// --- server.js ---
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

let binanceWS;
let lastPrice = 0;
let symbol = "BTCUSDT";

// --- Connect to Binance safely ---
function connectBinance() {
  const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
  console.log("🔗 Connecting to Binance:", url);

  try {
    binanceWS = new WebSocket(url);

    binanceWS.on("open", () => console.log("✅ Connected to Binance WebSocket"));

    binanceWS.on("message", (msg) => {
      const data = JSON.parse(msg);
      if (data.p) lastPrice = parseFloat(data.p);
    });

    binanceWS.on("close", () => {
      console.log("⚠️ Binance closed, retrying in 3s...");
      setTimeout(connectBinance, 3000);
    });

    binanceWS.on("error", (err) => {
      console.error("❌ Binance WS error:", err.message);
      binanceWS.close();
    });
  } catch (err) {
    console.error("Failed to connect Binance:", err.message);
    setTimeout(connectBinance, 3000);
  }
}

connectBinance();

// --- Fallback HTTP request to Binance API ---
async function fetchBinanceFallback() {
  try {
    const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await resp.json();
    if (data.price) lastPrice = parseFloat(data.price);
  } catch (err) {
    console.error("HTTP fallback error:", err.message);
  }
}
setInterval(fetchBinanceFallback, 5000);

// --- REST endpoint ---
app.get("/api/price", (req, res) => {
  res.json({ symbol, price: lastPrice });
});

// --- WebSocket to frontend ---
const server = app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("📡 Frontend connected");
  const sendInterval = setInterval(() => {
    ws.send(JSON.stringify({ symbol, price: lastPrice }));
  }, 1000);

  ws.on("close", () => clearInterval(sendInterval));
});
