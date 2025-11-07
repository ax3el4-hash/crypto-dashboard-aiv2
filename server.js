import express from "express";
import { WebSocketServer } from "ws";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = process.env.PORT || 10000;

// --- Binance stream ---
let binanceWS;
let lastPrice = 0;

function connectBinance(symbol = "BTCUSDT") {
  const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
  console.log("Connecting to Binance:", url);
  binanceWS = new WebSocket(url);

  binanceWS.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    lastPrice = parseFloat(data.p);
  };

  binanceWS.onclose = () => {
    console.log("Binance connection closed, reconnecting...");
    setTimeout(() => connectBinance(symbol), 3000);
  };

  binanceWS.onerror = (err) => {
    console.error("Binance error:", err.message);
    binanceWS.close();
  };
}

connectBinance("BTCUSDT");

// --- REST endpoint for frontend polling ---
app.get("/api/price", (req, res) => {
  res.json({ price: lastPrice });
});

// --- WebSocket broadcast to clients ---
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Frontend connected");
  const sendInterval = setInterval(() => {
    ws.send(JSON.stringify({ price: lastPrice }));
  }, 1000);

  ws.on("close", () => clearInterval(sendInterval));
});
