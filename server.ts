import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini if key exists
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSimulatedAdvisorResponse(message: string, wallet: any[], selectedCoin: string, priceData: any): string {
  const msgLower = message.toLowerCase();
  let responseText = '';

  const coinPrice = priceData?.price || 100;
  const change24h = priceData?.change24h || 0;
  
  const formattedPrice = coinPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedChange = (change24h >= 0 ? '+' : '') + change24h.toFixed(2) + '%';
  const changeColor = change24h >= 0 ? 'bullish sentiment' : 'bearish pressure';

  // 1. BUY/SELL SIGNAL
  if (msgLower.includes('signal') || msgLower.includes('buy') || msgLower.includes('sell') || msgLower.includes('indicator') || msgLower.includes('ma(')) {
    const ma7 = coinPrice * (1 + (Math.random() * 0.01 - 0.005));
    const ma25 = coinPrice * (1 + (Math.random() * 0.02 - 0.01));
    const rsi = Math.floor(Math.random() * 41) + 30; // 30 - 70
    
    let signal = 'NEUTRAL / ACCUMULATION';
    let recommendations = 'Wait for a confirmed trendline breach before scaling in.';
    
    if (change24h > 2) {
      signal = 'STRONG BUY (BULLISH BREAKOUT)';
      recommendations = `Price is riding above the MA(7) ($${ma7.toFixed(2)}) and MA(25) ($${ma25.toFixed(2)}). RSI is at ${rsi} (Healthy momentum). Set tight stop-losses at $${(coinPrice * 0.95).toFixed(2)}.`;
    } else if (change24h < -2) {
      signal = 'ACCUMULATE / LIMIT BUY';
      recommendations = `RSI oversold at ${rsi}. Leverage support lines around $${(coinPrice * 0.97).toFixed(2)}. This is a classic "Buy the Dip" zone for long-term swing trading.`;
    } else {
      signal = 'MOMENTUM RANGE CONSOLIDATION';
      recommendations = `MA(7) and MA(25) are converging tightly. RSI is sitting at ${rsi} showing equilibrium. Suggest scaling limit bids 3-5% below active close.`;
    }

    responseText = `📊 **Technical Signal Report for ${selectedCoin}/USDT**
• **Active Spot Price:** $${formattedPrice} (${formattedChange})
• **Moving Average 7 (MA-7):** $${ma7.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• **Moving Average 25 (MA-25):** $${ma25.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• **RSI (14-period Close):** ${rsi} (${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral Momentum'})

**💥 Quant Signal Verdict: ${signal}**
${recommendations}

*Risk Advisor Note: Always manage capital size. Standard rule suggests allocating maximum 2.5% risk exposure per active swing trade.*`;

  } 
  // 2. AUDIT PORTFOLIO
  else if (msgLower.includes('audit') || msgLower.includes('portfolio') || msgLower.includes('wallet') || msgLower.includes('asset')) {
    const walletAssets = Array.isArray(wallet) ? wallet : [];
    const totalUsdt = walletAssets.find(a => a.symbol === 'USDT')?.free || 0;
    const volatileAssets = walletAssets.filter(a => a.symbol !== 'USDT');
    const hasVolatile = volatileAssets.some(a => (a.free + a.locked) > 0);

    let auditText = '';
    if (totalUsdt > 50000) {
      auditText = `⚠️ **Capital Inefficiency Alert:** You are holding a large liquid cash balance of $${totalUsdt.toLocaleString()} USDT in your wallet. While cash preserves purchasing power during drawdowns, you are missing out on active trend-following alpha. Consider using the left Trade Center to place limit bids or buy spot positions in BTC or ETH.`;
    } else if (!hasVolatile) {
      auditText = `🧩 **All-Cash Portfolio:** Your active assets are entirely in liquid USDT ($${totalUsdt.toLocaleString()}). This is highly defensive. To test the simulator's capabilities, buy a small slice of ${selectedCoin} or other index assets via Market / Limit orders!`;
    } else {
      const assetDetails = volatileAssets
        .filter(a => (a.free + a.locked) > 0)
        .map(a => `• **${a.symbol}:** Free: ${a.free.toFixed(4)}${a.locked > 0 ? `, Locked: ${a.locked.toFixed(4)}` : ''}`)
        .join('\n');

      auditText = `✅ **Diversification Audit:**
Active Crypto Footprint:
${assetDetails}
Remaining Cash Reserve: $${totalUsdt.toLocaleString()} USDT

⚖️ **Optimization Strategy:**
Your current capital distribution shows active exposure. Ensure limit orders are placed at technical support lines to capture volatile market dips. Diversifying across Solana, Bitcoin, and Ethereum reduces standalone asset beta risk.`;
    }

    responseText = `🛡️ **Portfolio Audit Report**
${auditText}

*Key Quant recommendation:* Ensure you keep at least 25% of your capital liquid in USDT to run the "Buy The Dip" strategy during black swan candle events.`;

  }
  // 3. LIMIT vs MARKET ORDERS
  else if (msgLower.includes('limit') || msgLower.includes('market') || msgLower.includes('order') || msgLower.includes('match')) {
    responseText = `⚙️ **Order Execution Theory: Limit vs. Market Orders**

1. **Market Orders (Instant Fill):**
   - **How it works:** Instantly targets the best available bids or asks from the Order Book.
   - **Best for:** Immediate execution where speed matters more than the exact entry price.
   - **Fee impact:** Acts as a "Liquidity Taker".

2. **Limit Orders (Price Guarantee):**
   - **How it works:** You define a precise threshold (e.g. bid $${(coinPrice * 0.98).toLocaleString()} USDT). Your order enters the order book queue as "locked balance" and only triggers if a matching market price touches or crosses that target.
   - **Best for:** Patients buying at exact support levels, or taking profit at key resistance.
   - **Fee impact:** Acts as a "Liquidity Maker".

💡 *In this DEX simulator, our background price engine ticks every 1.5 seconds. If the simulated ticker price matches or crosses below your buy limit order (or above your sell limit order), your limit order is filled dynamically!*`;
  }
  // 4. FAUCET
  else if (msgLower.includes('faucet') || msgLower.includes('usdt')) {
    responseText = `💸 **USDT Faucet Injection Guide**

If your simulation balance is running low, or you want to experiment with high whale-like positions:
1. Click the **"USDT Faucet (+$10,000)"** button at the top-right of your main trading center.
2. The engine instantly injects **$10,000.00 USDT** into your free wallet reserves.
3. You will receive a green toast confirmation, and your allocations stack chart will refresh in real-time!`;
  }
  // DEFAULT RESPONSE
  else {
    responseText = `🤖 **Binance AI Advisor Insights**

Greetings! I am parsing the active simulator chart metrics to guide your trading.

**Current Live Metrics:**
• Active Watch: **${selectedCoin}/USDT** at **$${formattedPrice}**
• Last 24H: **${formattedChange}** showing ${changeColor}

💬 **How can I coach you today?**
Try asking me:
1. *"Give me buy/sell signals for ${selectedCoin}"* (Calculates live trend metrics)
2. *"Perform a portfolio risk audit"* (Analyzes your wallet reserves)
3. *"Explain how Limit Orders and Matching work"*

*Note: I am tracking real-time market activity inside this active session. Fire a suggested prompt above for immediate insights!*`;
  }

  return `💡 **[Simulator Mode Check]:** *To activate live Gemini-3.5-flash AI analysis, ensure you have set your GEMINI_API_KEY in Settings > Secrets. In the meantime, I am simulating full coaching analytics for you.*\n\n${responseText}`;
}

// 1. API: AI Crypto Advisor & Coach Chat
app.post('/api/ai-advisor', async (req, res) => {
  const { message, chatHistory, wallet, selectedCoin, priceData } = req.body;

  if (!ai) {
    // Generate helpful, simulated quant responses if Gemini API is not online
    const simulatedText = getSimulatedAdvisorResponse(message, wallet, selectedCoin, priceData);
    return res.json({ text: simulatedText });
  }

  try {
    const systemInstruction = `You are the Binance AI Quantitative Trading Advisor, a world-class crypto analyst and smart coach.
Your job is to provide objective, high-conviction, professional commentary on assets, technical chart indicators, portfolio configuration, or specific trade prompts.
Keep your tone hyper-professional, technical, and direct—referencing mock market values, trends, and risk management (stop-losses, position sizing).
Avoid fluff, emojis (use sparingly), or any disclaimer-heavy lingo (just give sharp trading analysis as a simulator coach).
Current Coin Context: ${selectedCoin}
Price Data Context (recent close): ${JSON.stringify(priceData || 'N/A')}
User's Simulate Wallet: ${JSON.stringify(wallet || 'USDT Only')}
If the user asks for a trade signal, analyze the price data and give a bold technical verdict (e.g. Bullish Breakout, Bearish Consolidation, RSI overbought etc.) and explain why in a structured format.`;

    const contents = [
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Advisor Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to call Gemini.' });
  }
});

// 2. API: Dynamic Crypto Market News Generator (uses structured JSON from Gemini)
app.get('/api/market-news', async (req, res) => {
  if (!ai) {
    // Return high-quality, pre-defined back-up headlines if Gemini is not online
    return res.json([
      {
        id: 'news-1',
        title: 'Ethereum whale transfers $45M into DeFi liquid staking protocol, sparking gas surge',
        timestamp: '15 mins ago',
        category: 'DEFI',
        impact: 'bullish',
        score: '+5.4%',
        relatedCoin: 'ETH',
      },
      {
        id: 'news-2',
        title: 'Federal Reserve hints at interest rate stabilization; BTC testing $98k resistance',
        timestamp: '42 mins ago',
        category: 'MACRO',
        impact: 'bullish',
        score: '+1.2%',
        relatedCoin: 'BTC',
      },
      {
        id: 'news-3',
        title: 'Solana trading volume flips Ethereum in active DEX charts after meme spike',
        timestamp: '1 hour ago',
        category: 'MARKETS',
        impact: 'bullish',
        score: '+8.7%',
        relatedCoin: 'SOL',
      },
      {
        id: 'news-4',
        title: 'BNB Chain executes scheduled quarterly burn of 1.2M tokens',
        timestamp: '3 hours ago',
        category: 'CHAIN',
        impact: 'neutral',
        score: '+0.5%',
        relatedCoin: 'BNB',
      },
      {
        id: 'news-5',
        title: 'Cardano node upgrade encounters localized latency issues; developers debugging',
        timestamp: '5 hours ago',
        category: 'TECH',
        impact: 'bearish',
        score: '-2.1%',
        relatedCoin: 'ADA',
      },
    ]);
  }

  try {
    const prompt = 'Generate exactly 5 realistic, technical, urgent crypto market news headlines. Some should be bullish, some bearish, relating to BTC, ETH, BNB, SOL, or ADA. Include a fast timestamp (e.g. 10m ago), a category, an impact ("bullish" / "bearish" / "neutral"), a percentage change score, and the precise ticker coin.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              category: { type: Type.STRING },
              impact: { type: Type.STRING, description: 'Must be "bullish", "bearish", or "neutral"' },
              score: { type: Type.STRING, description: 'Percentage indicator, e.g. "+4.2%" or "-1.5%"' },
              relatedCoin: { type: Type.STRING, description: 'BTC, ETH, BNB, SOL, or ADA' },
            },
            required: ['id', 'title', 'timestamp', 'category', 'impact', 'score', 'relatedCoin'],
          },
        },
      },
    });

    const newsData = JSON.parse(response.text || '[]');
    res.json(newsData);
  } catch (error) {
    console.error('News API error, returning default news:', error);
    res.json([
      {
        id: 'news-1',
        title: 'BTC consolidates at range high as spot exchange inflows settle near monthly lows',
        timestamp: '5 mins ago',
        category: 'MARKETS',
        impact: 'neutral',
        score: '+0.1%',
        relatedCoin: 'BTC',
      },
      {
        id: 'news-2',
        title: 'Solana active validators exceed record milestone, network gas fees main stable',
        timestamp: '18 mins ago',
        category: 'TECH',
        impact: 'bullish',
        score: '+3.4%',
        relatedCoin: 'SOL',
      },
      {
        id: 'news-3',
        title: 'Ethereum Layer-2 rollup network reports temporary transaction sequencers delay',
        timestamp: '1 hour ago',
        category: 'TECH',
        impact: 'bearish',
        score: '-1.8%',
        relatedCoin: 'ETH',
      },
    ]);
  }
});

// ==========================================
// ==========================================
// FULL-STACK ADMIN BACKEND DATABASE & ROUTES
// ==========================================

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize local JSON DB structure if not present
function loadDatabase() {
  let db: any;
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      users: [
        { 
          id: 'user-1', 
          name: 'John Doe', 
          username: 'john_doe', 
          email: 'john@binance-sim.net', 
          password: 'password', 
          status: 'approved', 
          balanceUsdt: 24500, 
          wallet: [
            { symbol: 'USDT', name: 'Tether USD', free: 24500.0, locked: 0 },
            { symbol: 'BTC', name: 'Bitcoin', free: 0.125, locked: 0 },
            { symbol: 'ETH', name: 'Ethereum', free: 1.85, locked: 0 },
            { symbol: 'BNB', name: 'BNB Token', free: 4.20, locked: 0 },
            { symbol: 'SOL', name: 'Solana', free: 15.0, locked: 0 },
            { symbol: 'ADA', name: 'Cardano', free: 320.0, locked: 0 },
          ],
          orders: [],
          alerts: [],
          chat: [],
          createdAt: '2026-06-10 14:32' 
        },
        { 
          id: 'user-2', 
          name: 'Sarah Connor', 
          username: 'sarah_c', 
          email: 'sarah@binance-sim.net', 
          password: 'password', 
          status: 'approved', 
          balanceUsdt: 5000, 
          wallet: [
            { symbol: 'USDT', name: 'Tether USD', free: 5000.0, locked: 0 },
            { symbol: 'BTC', name: 'Bitcoin', free: 0.05, locked: 0 },
            { symbol: 'ETH', name: 'Ethereum', free: 0.45, locked: 0 },
            { symbol: 'BNB', name: 'BNB Token', free: 1.5, locked: 0 }
          ],
          orders: [],
          alerts: [],
          chat: [],
          createdAt: '2026-06-11 09:12' 
        }
      ],
      juniorAdmins: [
        { id: 'jr-1', name: 'Junior Admin Bob', username: 'junior_bob', email: 'bob@binance-sim.net', password: 'password', status: 'pending', createdAt: '2026-06-12 11:00' },
        { id: 'jr-2', name: 'Junior Admin Jane', username: 'junior_jane', email: 'jane@binance-sim.net', password: 'password', status: 'approved', createdAt: '2026-06-13 01:20' }
      ],
      transactions: [
        { id: 'tx-1', username: 'john_doe', type: 'deposit', amount: 5000, netAmount: 5000, fee: 0, status: 'approved', refHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f', timestamp: '2026-06-12 14:32' },
        { id: 'tx-2', username: 'sarah_c', type: 'withdrawal', amount: 1000, netAmount: 910, fee: 90, status: 'approved', timestamp: '2026-06-13 09:12' }
      ],
      investments: [
        { id: 'inv-1', username: 'john_doe', planId: 'eth_staking_30', depositAmount: 3000, yieldDailyUsd: 4.5, durationDays: 30, status: 'approved', timestamp: '2026-06-12 14:50' }
      ],
      juniorActivities: [
        { id: 'act-1', actor: 'junior_jane', action: 'Faucet Reserves Refill', details: 'Requested injection of $100,000 USDT into active pool.', status: 'pending', timestamp: '2026-06-13 03:15' },
        { id: 'act-2', actor: 'junior_jane', action: 'Platform Fee Tuning Calibration', details: 'Adjust platform swap rate to optimized 0.05% margin.', status: 'approved', timestamp: '2026-06-13 04:00' }
      ],
      siteActivities: [
        { id: 'log-1', actor: 'senior_admin', role: 'senior_admin', action: 'System Initialized', details: 'Senior Admin commanded secure full-stack backend initialization.', timestamp: '2026-06-13 01:00' }
      ],
      systemParameters: {
        faucetReserves: 2500000,
        platformFeePercent: 0.10,
        contractGasBuffer: 15.0,
        ledgerLock: false
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(data);
  } catch (err) {
    console.error("Error reading db.json, returning empty template", err);
    db = { users: [], juniorAdmins: [], transactions: [], investments: [], juniorActivities: [], siteActivities: [] };
  }

  // Ensure DB upgrades for legacy structures
  let upgraded = false;
  if (!db.systemParameters) {
    db.systemParameters = {
      faucetReserves: 2500000,
      platformFeePercent: 0.10,
      contractGasBuffer: 15.0,
      ledgerLock: false
    };
    upgraded = true;
  }
  if (!db.users) {
    db.users = [];
    upgraded = true;
  }
  db.users.forEach((u: any) => {
    if (u.wallet === undefined) {
      u.wallet = [
        { symbol: 'USDT', name: 'Tether USD', free: u.balanceUsdt || 1000.0, locked: 0 },
        { symbol: 'BTC', name: 'Bitcoin', free: 0.125, locked: 0 },
        { symbol: 'ETH', name: 'Ethereum', free: 1.85, locked: 0 },
        { symbol: 'BNB', name: 'BNB Token', free: 4.20, locked: 0 },
        { symbol: 'SOL', name: 'Solana', free: 15.0, locked: 0 },
        { symbol: 'ADA', name: 'Cardano', free: 320.0, locked: 0 },
      ];
      upgraded = true;
    }
    if (u.orders === undefined) {
      u.orders = [];
      upgraded = true;
    }
    if (u.alerts === undefined) {
      u.alerts = [];
      upgraded = true;
    }
    if (u.chat === undefined) {
      u.chat = [];
      upgraded = true;
    }
  });

  if (upgraded) {
    saveDatabase(db);
  }
  return db;
}

function saveDatabase(db: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}

// Lazy load & Seeding logic for Firebase Firestore
let firestoreDb: any = null;
let seedingPromise: Promise<void> | null = null;

function getFirestoreDb() {
  if (firestoreDb !== null) {
    return firestoreDb;
  }
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (firebaseConfig && firebaseConfig.projectId) {
        let appInstance: any;
        if (getApps().length === 0) {
          appInstance = initializeApp({
            projectId: firebaseConfig.projectId,
          });
        } else {
          appInstance = getApps()[0];
        }
        firestoreDb = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId || undefined);
        console.log("Firebase Firestore initialized successfully.");

        if (!seedingPromise) {
          seedingPromise = ensureFirestoreSeeded(firestoreDb);
        }
        return firestoreDb;
      }
    }
  } catch (err) {
    console.warn("Failed to initialize Firebase lazily, falling back to local file store:", err);
  }
  return null;
}

async function ensureFirestoreSeeded(db: any) {
  try {
    const usersColl = await db.collection('users').limit(1).get();
    if (usersColl.empty) {
      console.log("Cloud Firestore is empty. Seeding custom mock datasets...");
      const localDb = loadDatabase();

      const collections = [
        { name: 'users', items: localDb.users || [] },
        { name: 'juniorAdmins', items: localDb.juniorAdmins || [] },
        { name: 'transactions', items: localDb.transactions || [] },
        { name: 'investments', items: localDb.investments || [] },
        { name: 'juniorActivities', items: localDb.juniorActivities || [] },
        { name: 'siteActivities', items: localDb.siteActivities || [] }
      ];

      for (const col of collections) {
        for (const item of col.items) {
          await db.collection(col.name).doc(item.id).set(item);
        }
      }

      await db.collection('systemParameters').doc('global').set(localDb.systemParameters || {
        faucetReserves: 2500000,
        platformFeePercent: 0.10,
        contractGasBuffer: 15.0,
        ledgerLock: false
      });
      console.log("Seeding to Firebase cloud instance finished successfully.");
    }
  } catch (err) {
    console.error("Failed to seed Firestore database:", err);
  }
}

// Unified Async Getters / Setters mapping
async function dbGetUsers() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('users').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read users failed:", e);
    }
  }
  return loadDatabase().users || [];
}

async function dbSaveUser(user: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('users').doc(user.id).set(user);
    } catch (e) {
      console.error("Firestore write user failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.users.findIndex((u: any) => u.id === user.id);
  if (idx >= 0) local.users[idx] = user;
  else local.users.push(user);
  saveDatabase(local);
}

async function dbGetJuniorAdmins() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('juniorAdmins').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read juniorAdmins failed:", e);
    }
  }
  return loadDatabase().juniorAdmins || [];
}

async function dbSaveJuniorAdmin(jr: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('juniorAdmins').doc(jr.id).set(jr);
    } catch (e) {
      console.error("Firestore write juniorAdmin failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.juniorAdmins.findIndex((j: any) => j.id === jr.id);
  if (idx >= 0) local.juniorAdmins[idx] = jr;
  else local.juniorAdmins.push(jr);
  saveDatabase(local);
}

async function dbGetTransactions() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('transactions').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read transactions failed:", e);
    }
  }
  return loadDatabase().transactions || [];
}

async function dbSaveTransaction(tx: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('transactions').doc(tx.id).set(tx);
    } catch (e) {
      console.error("Firestore write transaction failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.transactions.findIndex((t: any) => t.id === tx.id);
  if (idx >= 0) local.transactions[idx] = tx;
  else local.transactions.unshift(tx);
  saveDatabase(local);
}

async function dbGetInvestments() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('investments').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read investments failed:", e);
    }
  }
  return loadDatabase().investments || [];
}

async function dbSaveInvestment(inv: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('investments').doc(inv.id).set(inv);
    } catch (e) {
      console.error("Firestore write investment failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.investments.findIndex((i: any) => i.id === inv.id);
  if (idx >= 0) local.investments[idx] = inv;
  else local.investments.unshift(inv);
  saveDatabase(local);
}

async function dbGetJuniorActivities() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('juniorActivities').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read juniorActivities failed:", e);
    }
  }
  return loadDatabase().juniorActivities || [];
}

async function dbSaveJuniorActivity(act: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('juniorActivities').doc(act.id).set(act);
    } catch (e) {
      console.error("Firestore write juniorActivity failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.juniorActivities.findIndex((a: any) => a.id === act.id);
  if (idx >= 0) local.juniorActivities[idx] = act;
  else local.juniorActivities.unshift(act);
  saveDatabase(local);
}

async function dbGetSiteActivities() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snap = await db.collection('siteActivities').get();
      return snap.docs.map((d: any) => d.data());
    } catch (e) {
      console.error("Firestore read siteActivities failed:", e);
    }
  }
  return loadDatabase().siteActivities || [];
}

async function dbSaveSiteActivity(log: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('siteActivities').doc(log.id).set(log);
    } catch (e) {
      console.error("Firestore write siteActivity failed:", e);
    }
  }
  const local = loadDatabase();
  const idx = local.siteActivities.findIndex((s: any) => s.id === log.id);
  if (idx >= 0) local.siteActivities[idx] = log;
  else local.siteActivities.unshift(log);
  saveDatabase(local);
}

async function dbGetSystemParameters() {
  const db = getFirestoreDb();
  if (db) {
    try {
      const doc = await db.collection('systemParameters').doc('global').get();
      if (doc.exists) return doc.data();
    } catch (e) {
      console.error("Firestore read systemParameters failed:", e);
    }
  }
  return loadDatabase().systemParameters || {
    faucetReserves: 2500000,
    platformFeePercent: 0.10,
    contractGasBuffer: 15.0,
    ledgerLock: false
  };
}

async function dbSaveSystemParameters(params: any) {
  const db = getFirestoreDb();
  if (db) {
    try {
      await db.collection('systemParameters').doc('global').set(params);
    } catch (e) {
      console.error("Firestore write systemParameters failed:", e);
    }
  }
  const local = loadDatabase();
  local.systemParameters = params;
  saveDatabase(local);
}

async function dbAddSystemLog(actor: string, role: string, action: string, details: string) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
  const id = `log-${Math.random().toString(36).substring(2, 9)}`;
  const logObj = { id, actor, role, action, details, timestamp };
  await dbSaveSiteActivity(logObj);
}


// 1. Fetch Complete Admin panel data
app.get('/api/admin/data', async (req, res) => {
  try {
    const [users, juniorAdmins, transactions, investments, juniorActivities, siteActivities, systemParameters] = await Promise.all([
      dbGetUsers(),
      dbGetJuniorAdmins(),
      dbGetTransactions(),
      dbGetInvestments(),
      dbGetJuniorActivities(),
      dbGetSiteActivities(),
      dbGetSystemParameters()
    ]);
    res.json({
      users,
      juniorAdmins,
      transactions,
      investments,
      juniorActivities,
      siteActivities,
      systemParameters
    });
  } catch (error) {
    res.status(500).json({ error: 'Database operations error.' });
  }
});

// 2. Auth: Register new Standard User or Junior Admin
app.post('/api/auth/register', async (req, res) => {
  const { name, username, email, password, role } = req.body;
  const usernameLower = (username || '').toLowerCase().trim();
  const emailLower = (email || '').toLowerCase().trim();

  try {
    const [users, juniorAdmins] = await Promise.all([dbGetUsers(), dbGetJuniorAdmins()]);
    // Check username collision
    const standardExists = users.some((u: any) => u.username === usernameLower);
    const juniorExists = juniorAdmins.some((u: any) => u.username === usernameLower);
    
    if (standardExists || juniorExists || usernameLower === 'senior_admin' || usernameLower === 'junior_admin') {
      return res.status(400).json({ error: 'Username already registered to active account.' });
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();

    if (role === 'junior_admin') {
      // New Junior Admins start as PENDING, awaiting Senior Admin approval!
      const newJunior = {
        id: `jr-${Math.random().toString(36).substring(2, 9)}`,
        name,
        username: usernameLower,
        email: emailLower,
        password: password || 'admin',
        status: 'pending',
        createdAt: timestamp
      };
      await dbSaveJuniorAdmin(newJunior);
      await dbAddSystemLog(usernameLower, 'junior_admin', 'Admin Registration Filed', `Junior Admin registered account profile for "${name}" (${usernameLower}). Status Set to PENDING senior approval.`);
      return res.json({ status: 'pending', user: newJunior, message: 'Junior Admin registration successful. Awaiting Senior Admin activation.' });
    } else {
      // Standard Users start as PENDING, awaiting Senior Admin approval!
      const newUser = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`,
        name,
        username: usernameLower,
        email: emailLower,
        password: password || 'password',
        status: 'pending',
        balanceUsdt: 1000, // Default seed balance
        wallet: [
          { symbol: 'USDT', name: 'Tether USD', free: 1000.0, locked: 0 },
          { symbol: 'BTC', name: 'Bitcoin', free: 0.125, locked: 0 },
          { symbol: 'ETH', name: 'Ethereum', free: 1.85, locked: 0 },
          { symbol: 'BNB', name: 'BNB Token', free: 4.20, locked: 0 },
          { symbol: 'SOL', name: 'Solana', free: 15.0, locked: 0 },
          { symbol: 'ADA', name: 'Cardano', free: 320.0, locked: 0 },
        ],
        orders: [],
        alerts: [],
        chat: [],
        createdAt: timestamp
      };
      await dbSaveUser(newUser);
      await dbAddSystemLog(usernameLower, 'user', 'User Registration Filed', `New user registered account profile for "${name}" (${usernameLower}). Status Set to PENDING senior approval.`);
      return res.json({ status: 'pending', user: newUser, message: 'User registration successful. Awaiting Senior Admin approval.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Auth registration processing failed.' });
  }
});

// 3. Auth: Login Check for both Users and Junior Admins
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const userLower = (username || '').toLowerCase().trim();

  try {
    // 1) Hardcoded Senior Admin
    if (userLower === 'senior_admin' && password === 'admin') {
      await dbAddSystemLog('senior_admin', 'senior_admin', 'Operator Login', 'Senior Admin signed into command control console.');
      return res.json({
        name: 'Senior Administrator',
        username: 'senior_admin',
        email: 'senior@binance-sim.net',
        role: 'senior_admin',
        status: 'approved'
      });
    }

    const [users, juniorAdmins] = await Promise.all([dbGetUsers(), dbGetJuniorAdmins()]);

    // 2) Standard users list check
    const matchedUser = users.find((u: any) => u.username === userLower);
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== password) {
        if (password !== 'admin' && password !== 'password') { // support standard fallbacks
          return res.status(401).json({ error: 'Incorrect credentials password.' });
        }
      }
      
      await dbAddSystemLog(matchedUser.username, 'user', 'Session Connection', `Trader successfully entered platform. Status: ${matchedUser.status}`);
      return res.json({
        name: matchedUser.name,
        username: matchedUser.username,
        email: matchedUser.email,
        role: 'user',
        status: matchedUser.status
      });
    }

    // 3) Junior Admins list check
    const matchedJunior = juniorAdmins.find((u: any) => u.username === userLower);
    if (matchedJunior) {
      if (matchedJunior.status !== 'approved') {
        return res.status(403).json({ error: 'Junior Admin portal session is PENDING Senior Admin approval. Please contact the Senior Admin.' });
      }
      
      await dbAddSystemLog(matchedJunior.username, 'junior_admin', 'Operator Login', `Junior Admin Bob signed into read-only node. Status: Approved.`);
      return res.json({
        name: matchedJunior.name,
        username: matchedJunior.username,
        email: matchedJunior.email,
        role: 'junior_admin',
        status: 'approved'
      });
    }

    return res.status(404).json({ error: 'Account username not recognized. Check spelling or sign up.' });
  } catch (error) {
    res.status(500).json({ error: 'Auth login execution error.' });
  }
});

// 4. Senior Admin approves pending Standard User
app.post('/api/admin/approve-user', async (req, res) => {
  const { username, adminUsername } = req.body;
  try {
    const users = await dbGetUsers();
    const user = users.find((u: any) => u.username === username);
    if (!user) return res.status(404).json({ error: 'Standard User not found.' });

    user.status = 'approved';
    await dbSaveUser(user);
    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Approve Standard User', `Approved pending standard user "${username}". Profile activated.`);
    
    const freshUsers = await dbGetUsers();
    res.json({ success: true, users: freshUsers });
  } catch (e) {
    res.status(500).json({ error: 'Internal administrative workflow error.' });
  }
});

// 5. Senior Admin approves pending Junior Admin account creation!
app.post('/api/admin/approve-junior', async (req, res) => {
  const { username, adminUsername } = req.body;
  try {
    const juniorAdmins = await dbGetJuniorAdmins();
    const jr = juniorAdmins.find((u: any) => u.username === username);
    if (!jr) return res.status(404).json({ error: 'Junior Admin not found.' });

    jr.status = 'approved';
    await dbSaveJuniorAdmin(jr);
    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Approve Junior Admin Creator', `Approved and certified new Junior Operator account "${username}" execution level.`);
    
    const freshJuniors = await dbGetJuniorAdmins();
    res.json({ success: true, juniorAdmins: freshJuniors });
  } catch (e) {
    res.status(500).json({ error: 'Internal administrative workflow error.' });
  }
});

// 6. Junior Admin places an operational action -> Needs Senior Admin approval!
app.post('/api/admin/submit-junior-activity', async (req, res) => {
  const { actor, action, details } = req.body;
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
    const newActivity = {
      id: `act-${Math.random().toString(36).substring(2, 9)}`,
      actor,
      action,
      details,
      status: 'pending', // Starts pending senior audit!
      timestamp
    };

    await dbSaveJuniorActivity(newActivity);
    await dbAddSystemLog(actor, 'junior_admin', 'Submit Operator Activity', `Junior Admin requested review for system action "${action}": ${details}`);
    
    const activities = await dbGetJuniorActivities();
    res.json({ success: true, juniorActivities: activities });
  } catch (e) {
    res.status(500).json({ error: 'Failed submitting operator sandbox activity.' });
  }
});

// 7. Senior Admin reviews and APPROVES the operational activities carried with Junior Admin!
app.post('/api/admin/approve-junior-activity', async (req, res) => {
  const { activityId, adminUsername } = req.body;
  try {
    const [acts, systemParameters] = await Promise.all([
      dbGetJuniorActivities(),
      dbGetSystemParameters()
    ]);

    const act = acts.find((a: any) => a.id === activityId);
    if (!act) return res.status(404).json({ error: 'Junior Activity record not found.' });

    act.status = 'approved';
    await dbSaveJuniorActivity(act);

    // Perform dynamic database mutations based on the approved action!
    if (act.action === 'Faucet Reserves Refill' || act.action === 'Faucet Refill Request') {
      systemParameters.faucetReserves = (systemParameters.faucetReserves || 0) + 100000;
    } else if (act.action === 'Platform Fee Tuning Calibration' || act.action === 'Fee Reduction adjustment') {
      systemParameters.platformFeePercent = 0.05; // Calibrate to standard professional tier
    } else if (act.action === 'Smart Contract Gas Buffer Injection') {
      systemParameters.contractGasBuffer = (systemParameters.contractGasBuffer || 0) + 5.0;
    } else if (act.action === 'Core Backup Replication') {
      systemParameters.ledgerLock = false; // Reset lock state
    }

    await dbSaveSystemParameters(systemParameters);
    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Audit Approve Junior Activity', `Senior Admin audited & approved Junior Admin Activity "${act.action}" (${act.actor}). Action committed directly to node database parameters.`);
    
    const freshActs = await dbGetJuniorActivities();
    res.json({ success: true, juniorActivities: freshActs, systemParameters });
  } catch (e) {
    res.status(500).json({ error: 'Activity approval flow failed.' });
  }
});

// GET user persistent states (wallet, orders, alerts, chat)
app.get('/api/user/get-state', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Username parameter is missing.' });

  try {
    const users = await dbGetUsers();
    const usernameLower = (username as string).toLowerCase().trim();
    const user = users.find((u: any) => u.username === usernameLower);

    if (!user) {
      return res.status(404).json({ error: 'User does not exist on active node.' });
    }

    res.json({
      wallet: user.wallet || null,
      orders: user.orders || null,
      alerts: user.alerts || null,
      chat: user.chat || null,
      balanceUsdt: user.balanceUsdt !== undefined ? user.balanceUsdt : 1000.0
    });
  } catch (e) {
    res.status(500).json({ error: 'Get user state transaction failed.' });
  }
});

// POST to synchronize state (wallet, orders, alerts, chat, balance)
app.post('/api/user/sync-state', async (req, res) => {
  const { username, wallet, orders, alerts, chat, balanceUsdt } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required to commit state changes.' });

  try {
    const users = await dbGetUsers();
    const usernameLower = (username as string).toLowerCase().trim();
    const user = users.find((u: any) => u.username === usernameLower);

    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    // Update provided properties
    if (wallet !== undefined) {
      user.wallet = wallet;
      // Keep balanceUsdt synced with USDT wallet item free balance
      const usdtAsset = wallet.find((w: any) => w.symbol === 'USDT');
      if (usdtAsset) {
        user.balanceUsdt = usdtAsset.free;
      }
    }
    if (orders !== undefined) user.orders = orders;
    if (alerts !== undefined) user.alerts = alerts;
    if (chat !== undefined) user.chat = chat;
    if (balanceUsdt !== undefined) {
      user.balanceUsdt = balanceUsdt;
      // Sync back USDT asset free balance as well
      if (user.wallet) {
        const usdtAsset = user.wallet.find((w: any) => w.symbol === 'USDT');
        if (usdtAsset) {
          usdtAsset.free = balanceUsdt;
        }
      }
    }

    await dbSaveUser(user);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Update state transaction failed.' });
  }
});

// GET system parameters
app.get('/api/system/parameters', async (req, res) => {
  try {
    const systemParameters = await dbGetSystemParameters();
    res.json(systemParameters);
  } catch (e) {
    res.status(500).json({ error: 'Failed retrieving parameters.' });
  }
});

// 8. User submits deposit/payment
app.post('/api/user/submit-payment', async (req, res) => {
  const { username, amount, refHash, network } = req.body;
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
    const newTx = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      username,
      type: 'deposit',
      amount: parseFloat(amount),
      netAmount: parseFloat(amount),
      fee: 0,
      network: network || 'ERC20',
      refHash: refHash || '0xSimulatedHash',
      status: 'pending',
      timestamp
    };

    await dbSaveTransaction(newTx);
    await dbAddSystemLog(username, 'user', 'Submit Payment', `Filed deposit payment of $${amount} USDT. TxHash Reference: ${refHash}`);
    
    const transactions = await dbGetTransactions();
    res.json({ success: true, transactions });
  } catch (e) {
    res.status(500).json({ error: 'Submit payment transaction failed.' });
  }
});

// 9. Senior Admin approves the payments done in the system by users
app.post('/api/admin/approve-payment', async (req, res) => {
  const { transactionId, adminUsername } = req.body;
  try {
    const [txs, users] = await Promise.all([dbGetTransactions(), dbGetUsers()]);

    const tx = txs.find((t: any) => t.id === transactionId && t.type === 'deposit');
    if (!tx) return res.status(404).json({ error: 'Payment transaction record not found.' });

    tx.status = 'approved';
    await dbSaveTransaction(tx);
    
    // Credit the standard user's registry balance!
    const user = users.find((u: any) => u.username === tx.username);
    if (user) {
      user.balanceUsdt = Number(((user.balanceUsdt || 0) + tx.amount).toFixed(2));
      if (user.wallet) {
        const usdtAsset = user.wallet.find((w: any) => w.symbol === 'USDT');
        if (usdtAsset) {
          usdtAsset.free = user.balanceUsdt;
        }
      }
      await dbSaveUser(user);
    }

    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Approve User Payment', `Approved deposit request of $${tx.amount} USDT for user "@${tx.username}". Funds released.`);
    
    const freshTxs = await dbGetTransactions();
    const freshUsers = await dbGetUsers();
    res.json({ success: true, transactions: freshTxs, users: freshUsers });
  } catch (e) {
    res.status(500).json({ error: 'Approve payment transaction failed.' });
  }
});

// 10. User submits Investment allocation
app.post('/api/user/submit-investment', async (req, res) => {
  const { username, planId, depositAmount, yieldDailyUsd, durationDays } = req.body;
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
    const newInv = {
      id: `inv-${Math.random().toString(36).substring(2, 9)}`,
      username,
      planId,
      depositAmount: parseFloat(depositAmount),
      yieldDailyUsd: parseFloat(yieldDailyUsd),
      durationDays: parseInt(durationDays) || 30,
      status: 'pending',
      timestamp
    };

    await dbSaveInvestment(newInv);
    await dbAddSystemLog(username, 'user', 'Submit Investment', `Subscribed in staking investment plan "${planId}" ($${depositAmount} USDT). Status: Pending.`);
    
    const investments = await dbGetInvestments();
    res.json({ success: true, investments });
  } catch (e) {
    res.status(500).json({ error: 'Submit investment allocation transaction failed.' });
  }
});

// 11. Senior Admin approves investments once the user invests in
app.post('/api/admin/approve-investment', async (req, res) => {
  const { investmentId, adminUsername } = req.body;
  try {
    const invs = await dbGetInvestments();
    const inv = invs.find((i: any) => i.id === investmentId);
    if (!inv) return res.status(404).json({ error: 'Investment details not found.' });

    inv.status = 'approved';
    await dbSaveInvestment(inv);
    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Approve User Investment', `Authorized & activated investment portfolio proposal "${inv.planId}" ($${inv.depositAmount} USDT) for @${inv.username}.`);
    
    const freshInvs = await dbGetInvestments();
    res.json({ success: true, investments: freshInvs });
  } catch (e) {
    res.status(500).json({ error: 'Approve investment collection task failed.' });
  }
});

// 12. User initiates withdrawal
app.post('/api/user/submit-withdrawal', async (req, res) => {
  const { username, amount, fee, netAmount, address, network } = req.body;
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
    const newTx = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      username,
      type: 'withdrawal',
      amount: parseFloat(amount),
      netAmount: parseFloat(netAmount),
      fee: parseFloat(fee),
      network: network || 'TRC20',
      address: address || 'SimulatedAddress',
      status: 'pending',
      timestamp
    };

    await dbSaveTransaction(newTx);
    await dbAddSystemLog(username, 'user', 'Initiated Withdrawal', `Submitted withdrawal demand of $${amount} USDT. Destination Address: ${address}`);
    
    const transactions = await dbGetTransactions();
    res.json({ success: true, transactions });
  } catch (e) {
    res.status(500).json({ error: 'Submit withdrawal transaction failed.' });
  }
});

// 13. Senior Admin approves withdrawal initiated by users
app.post('/api/admin/approve-withdrawal', async (req, res) => {
  const { transactionId, adminUsername } = req.body;
  try {
    const txs = await dbGetTransactions();
    const tx = txs.find((t: any) => t.id === transactionId && t.type === 'withdrawal');
    if (!tx) return res.status(404).json({ error: 'Withdrawal details not found.' });

    tx.status = 'approved';
    await dbSaveTransaction(tx);
    await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Approve Outflow Withdrawal', `Audited & Approved transfer payout of $${tx.netAmount} USDT to @${tx.username}'s address. net value: $${tx.netAmount}`);
    
    const freshTxs = await dbGetTransactions();
    res.json({ success: true, transactions: freshTxs });
  } catch (e) {
    res.status(500).json({ error: 'Approve withdrawal transaction failed.' });
  }
});

// 14. Senior Admin rejects any active workflow (payment, investment, or withdrawal)
app.post('/api/admin/reject-workflow', async (req, res) => {
  const { type, id, adminUsername } = req.body;
  try {
    if (type === 'transaction') {
      const txs = await dbGetTransactions();
      const tx = txs.find((t: any) => t.id === id);
      if (tx) {
        tx.status = 'rejected';
        await dbSaveTransaction(tx);
        await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Reject Transfer', `Disapproved cash transaction "${id}" (${tx.type}) for @${tx.username}.`);
      }
    } else if (type === 'investment') {
      const invs = await dbGetInvestments();
      const inv = invs.find((i: any) => i.id === id);
      if (inv) {
        inv.status = 'rejected';
        await dbSaveInvestment(inv);
        await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Reject Investment', `Declined pending investment portfolio "${id}" for @${inv.username}.`);
      }
    } else if (type === 'juniorActivity') {
      const acts = await dbGetJuniorActivities();
      const act = acts.find((a: any) => a.id === id);
      if (act) {
        act.status = 'rejected';
        await dbSaveJuniorActivity(act);
        await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Audit Reject Junior Activity', `Declined operator action request "${act.action}" filed by @${act.actor}.`);
      }
    } else if (type === 'juniorAdmin') {
      const juniors = await dbGetJuniorAdmins();
      const jr = juniors.find((j: any) => j.username === id);
      if (jr) {
        jr.status = 'rejected';
        await dbSaveJuniorAdmin(jr);
        await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Reject Junior Administrator', `Rejected pending executive administrative level for candidate @${jr.username}.`);
      }
    } else if (type === 'user') {
      const users = await dbGetUsers();
      const u = users.find((user: any) => user.username === id);
      if (u) {
        u.status = 'rejected';
        await dbSaveUser(u);
        await dbAddSystemLog(adminUsername || 'senior_admin', 'senior_admin', 'Reject User Signup', `Rejected pending login candidate registration for user @${u.username}.`);
      }
    }

    const [users, juniorAdmins, transactions, investments, juniorActivities] = await Promise.all([
      dbGetUsers(),
      dbGetJuniorAdmins(),
      dbGetTransactions(),
      dbGetInvestments(),
      dbGetJuniorActivities()
    ]);

    res.json({
      success: true,
      users,
      juniorAdmins,
      transactions,
      investments,
      juniorActivities
    });
  } catch (e) {
    res.status(500).json({ error: 'Workflow rejection transaction failure.' });
  }
});

// Configure Vite or Serve static production bundle
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

initServer();
