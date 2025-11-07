const express = require('express');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static('.'));
app.use(express.json());

app.get('/api/ticker24hr', async (req,res)=>{
  try{
    const r = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    const j = await r.json();
    res.json(j);
  }catch(e){ res.status(500).json({error:'failed'}); }
});

app.get('/api/exchangeInfo', async (req,res)=>{
  try{
    const r = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const j = await r.json();
    res.json(j);
  }catch(e){ res.status(500).json({error:'failed'}); }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url,true).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (client, req) => {
  const params = url.parse(req.url, true).query;
  const pair = (params.pair||'BTCUSDT').toLowerCase();
  const binanceUrl = `wss://stream.binance.com:9443/ws/${pair}@trade`;
  console.log('Client connected, proxying', binanceUrl);
  const upstream = new WebSocket(binanceUrl);

  upstream.on('message', (msg)=> {
    try{ client.send(msg.toString()); }catch(e){}
  });
  upstream.on('close', ()=> { try{ client.close(); }catch(e){} });
  upstream.on('error', (e)=> console.error('upstream error', e));

  client.on('close', ()=> { try{ upstream.close(); }catch(e){} });
  client.on('error', ()=> { try{ upstream.close(); }catch(e){} });
});

let cachedExchangeInfo = null;
async function refreshExchangeInfo(){
  try{
    const r = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    cachedExchangeInfo = await r.json();
  }catch(e){ console.error('exchangeInfo refresh failed', e); }
}
refreshExchangeInfo();
setInterval(refreshExchangeInfo, 10*60*1000);

server.listen(PORT, ()=> {
  console.log('Server listening on', PORT);
});
