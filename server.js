import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
let currentPair = "BTCUSDT";

// --- Binance API price ---
app.get("/api/price", async (req, res) => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${currentPair}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Price fetch error:", err);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

// --- Simple AI-like signal generator ---
app.get("/api/signal", (req, res) => {
  const diff = (Math.random() * 6 - 3).toFixed(2); // -3% to +3%
  const signal = diff > 0.7 ? "BUY" : diff < -0.7 ? "SELL" : "HOLD";
  res.json({ diff, signal });
});

// --- Switch trading pair ---
app.get("/api/change/:pair", (req, res) => {
  currentPair = req.params.pair.toUpperCase();
  res.json({ message: `Pair changed to ${currentPair}` });
});

// --- Serve frontend ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
