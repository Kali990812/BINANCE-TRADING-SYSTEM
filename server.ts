import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

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
