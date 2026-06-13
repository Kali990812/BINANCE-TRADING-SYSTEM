export interface Coin {
  symbol: string;
  name: string;
  category: 'Layer-1' | 'DeFi' | 'Meme' | 'Favorites';
  price: number;
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  volume24h: number;
  decimals: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp?: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  asks: OrderBookEntry[]; // sells (red)
  bids: OrderBookEntry[]; // buys (green)
}

export interface Trade {
  id: string;
  time: string;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
}

export interface TradingOrder {
  id: string;
  symbol: string;
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  status: 'open' | 'filled' | 'canceled';
  timestamp: string;
}

export interface WalletAsset {
  symbol: string;
  name: string;
  free: number;
  locked: number;
}

export interface NewsItem {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  score: string;
  relatedCoin: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface NotificationItem {
  id: string;
  type: 'order_filled' | 'price_alert' | 'liquidation_warning' | 'liquidation_event';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
}


