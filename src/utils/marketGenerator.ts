import { Coin, Candle, OrderBook, Trade } from '../types';

export const INITIAL_COINS: Coin[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Layer-1',
    price: 97850.50,
    change24h: 2.15,
    high24h: 98400.00,
    low24h: 95100.00,
    volume24h: 42801.4,
    decimals: 2,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'Layer-1',
    price: 3450.75,
    change24h: -1.05,
    high24h: 3560.00,
    low24h: 3380.20,
    volume24h: 312500.5,
    decimals: 2,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    category: 'Favorites',
    price: 618.30,
    change24h: 4.82,
    high24h: 625.00,
    low24h: 588.50,
    volume24h: 874000.2,
    decimals: 1,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    category: 'Layer-1',
    price: 184.25,
    change24h: 8.43,
    high24h: 188.90,
    low24h: 169.10,
    volume24h: 1980000.0,
    decimals: 2,
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    category: 'DeFi',
    price: 0.684,
    change24h: -3.12,
    high24h: 0.715,
    low24h: 0.672,
    volume24h: 12500000.0,
    decimals: 3,
  },
];

// Generates simulated historical candle data
export function generateHistoricalCandles(basePrice: number, count: number = 40): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = basePrice * 0.95; // start slightly lower for an overall upward trend
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 15 * 60 * 1000); // 15-min intervals
    const change = currentPrice * (Math.random() * 0.03 - 0.0135); // bias slightly positive
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * 0.01);
    const low = Math.min(open, close) - Math.random() * (currentPrice * 0.01);
    const volume = Math.round(50 + Math.random() * 150);

    candles.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume,
      timestamp: Math.floor(time.getTime() / 1000),
    });

    currentPrice = close;
  }
  return candles;
}

// Generates dynamic order book levels around the current price
export function generateOrderBook(currentPrice: number, decimals: number): OrderBook {
  const asks: { price: number; amount: number; total: number }[] = [];
  const bids: { price: number; amount: number; total: number }[] = [];
  
  const stepPercent = 0.001; // 0.1% price spread increments
  
  let totalAsk = 0;
  for (let i = 1; i <= 8; i++) {
    const offset = i * stepPercent * currentPrice + (Math.random() * 0.0005 * currentPrice);
    const price = Number((currentPrice + offset).toFixed(decimals));
    const amount = Number((Math.random() * 2.5 + 0.1).toFixed(4));
    totalAsk += amount * price;
    asks.push({ price, amount, total: totalAsk });
  }

  let totalBid = 0;
  for (let i = 1; i <= 8; i++) {
    const offset = i * stepPercent * currentPrice + (Math.random() * 0.0005 * currentPrice);
    const price = Number((currentPrice - offset).toFixed(decimals));
    const amount = Number((Math.random() * 2.5 + 0.1).toFixed(4));
    totalBid += amount * price;
    bids.push({ price, amount, total: totalBid });
  }

  return { asks: asks.reverse(), bids }; // Asks are highest to lowest, bids are highest to lowest
}

// Generates mock live trade histories
export function generateRecentTrades(currentPrice: number, decimals: number, count: number = 15): Trade[] {
  const trades: Trade[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timeOffset = i * 2 * 1000; // 2 seconds apart
    const tradeTime = new Date(now.getTime() - timeOffset);
    const bias = Math.random() > 0.48 ? 1 : -1;
    const price = Number((currentPrice + (Math.random() * 0.002 * currentPrice * bias)).toFixed(decimals));
    const amount = Number((Math.random() * 1.5 + 0.001).toFixed(4));
    
    trades.push({
      id: `trade-${i}-${Math.random().toString(36).substr(2, 4)}`,
      time: tradeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price,
      amount,
      type: bias > 0 ? 'buy' : 'sell',
    });
  }
  return trades;
}
