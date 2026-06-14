import { useState, useEffect, useRef } from 'react';
import { Coin, Candle, OrderBook as OrderBookType, Trade, TradingOrder, WalletAsset, ChatMessage, NewsItem, PriceAlert, NotificationItem } from './types';
import { INITIAL_COINS, generateHistoricalCandles, generateOrderBook, generateRecentTrades } from './utils/marketGenerator';

// Components
import { TickerTape } from './components/TickerTape';
import { MarketList } from './components/MarketList';
import { TradingChart } from './components/TradingChart';
import { OrderBook } from './components/OrderBook';
import { OrderForm } from './components/OrderForm';
import { TradesHistory } from './components/TradesHistory';
import { PortfolioCenter } from './components/PortfolioCenter';
import { AiAdvisor } from './components/AiAdvisor';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthPage } from './components/AuthPage';
import { AdminPortal } from './components/AdminPortal';

// Icons
import { Sparkles, Star, TrendingUp, TrendingDown, BookOpen, AlertCircle, RefreshCw, Bell, Sliders, Gift, Users, ArrowRight, ShieldAlert } from 'lucide-react';

export default function App() {
  // User Authentication profile state
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; email: string; role?: string; status?: string } | null>(() => {
    const saved = localStorage.getItem('binance_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Track the active admin portal modal status
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Separated panels state for Administrator accounts: 'user' (DEX Desktop) vs 'admin' (Admin Console)
  const [activePanel, setActivePanel] = useState<'user' | 'admin'>('user');

  // Sync back wallet modifications on administrative actions
  const refreshWalletFromStore = () => {
    const saved = localStorage.getItem('binance_mock_wallet');
    if (saved) {
      setWallet(JSON.parse(saved));
    }
  };

  const handleImportWallet = (importedWallet: WalletAsset[]) => {
    setWallet(importedWallet);
    localStorage.setItem('binance_mock_wallet', JSON.stringify(importedWallet));
    triggerToast(`Restored ledger and initialized balance archives from Google Drive backup!`);
  };

  // Track the active custom tab state for PortfolioCenter
  const [selectedPortfolioTab, setSelectedPortfolioTab] = useState<'open' | 'history' | 'wallet' | 'alerts' | 'distribution' | 'trend' | 'invest' | 'referrals' | 'drive'>('open');

  // Track dynamic referral earnings totals for top CTA banner
  const [totalReferralEarnings, setTotalReferralEarnings] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('binance_user_referrals');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0);
      }
      return 1150; // Initial seed default
    } catch {
      return 1150;
    }
  });

  // Keep referral earnings up-to-date with dynamic storage changes
  useEffect(() => {
    const syncEarnings = () => {
      try {
        const saved = localStorage.getItem('binance_user_referrals');
        if (saved) {
          const parsed = JSON.parse(saved);
          const total = parsed.reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0);
          setTotalReferralEarnings(total);
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('storage', syncEarnings);
    const interval = setInterval(syncEarnings, 1000);
    return () => {
      window.removeEventListener('storage', syncEarnings);
      clearInterval(interval);
    };
  }, []);

  // 1. Markets & Asset rates state
  const [coins, setCoins] = useState<Coin[]>(() => {
    const saved = localStorage.getItem('binance_mock_coins');
    return saved ? JSON.parse(saved) : INITIAL_COINS;
  });

  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('binance_favorites');
    return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'BNB'];
  });

  // 2. Active Coin Reference
  const activeCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  // 3. Technical Chart Candles (OHLC)
  const [candles, setCandles] = useState<Candle[]>(() => {
    return generateHistoricalCandles(activeCoin.price, 45);
  });

  // 4. Order Book state
  const [orderBook, setOrderBook] = useState<OrderBookType>(() => {
    return generateOrderBook(activeCoin.price, activeCoin.decimals);
  });

  // 5. Recent executed trades
  const [trades, setTrades] = useState<Trade[]>(() => {
    return generateRecentTrades(activeCoin.price, activeCoin.decimals);
  });

  // 6. User Portfolio Wallet balances
  const [wallet, setWallet] = useState<WalletAsset[]>(() => {
    const saved = localStorage.getItem('binance_mock_wallet');
    if (saved) return JSON.parse(saved);
    return [
      { symbol: 'USDT', name: 'Tether USD', free: 24500.0, locked: 0 },
      { symbol: 'BTC', name: 'Bitcoin', free: 0.125, locked: 0 },
      { symbol: 'ETH', name: 'Ethereum', free: 1.85, locked: 0 },
      { symbol: 'BNB', name: 'BNB Token', free: 4.20, locked: 0 },
      { symbol: 'SOL', name: 'Solana', free: 15.0, locked: 0 },
      { symbol: 'ADA', name: 'Cardano', free: 320.0, locked: 0 },
    ];
  });

  // 7. Active pending Limit Orders & filled History logs
  const [orders, setOrders] = useState<TradingOrder[]>(() => {
    const saved = localStorage.getItem('binance_mock_orders');
    if (saved) return JSON.parse(saved);
    // Initial cool sample limit orders
    return [
      {
        id: 'ord-sample-1',
        symbol: 'BTC',
        type: 'limit',
        side: 'buy',
        price: 90000.0,
        amount: 0.05,
        total: 4500.0,
        status: 'open',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'ord-sample-2',
        symbol: 'BNB',
        type: 'limit',
        side: 'sell',
        price: 850.0,
        amount: 2.15,
        total: 1827.5,
        status: 'open',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // 8. Order Book click click price capture state
  const [selectedBookPrice, setSelectedBookPrice] = useState<number | undefined>(undefined);

  // 9. Gemini AI chatbot logs
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('binance_ai_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 10. Dynamic Headlines Feed
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 10.5. Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('binance_mock_alerts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'alert-sample-1',
        symbol: 'BTC',
        targetPrice: 99000.0,
        condition: 'above',
        isTriggered: false,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'alert-sample-2',
        symbol: 'ETH',
        targetPrice: 3400.0,
        condition: 'below',
        isTriggered: false,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  // 10.7. Notifications Drawer states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [leverage, setLeverage] = useState<number>(() => {
    const saved = localStorage.getItem('binance_mock_leverage');
    return saved ? parseInt(saved) : 20;
  });
  const [isLeverageEnabled, setIsLeverageEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('binance_leverage_enabled');
    return saved ? saved === 'true' : false;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('binance_mock_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'notif-1',
        type: 'order_filled',
        title: 'LIMIT BUY FILLED',
        message: 'Your Limit Buy order of 0.05 BTC has been filled successfully at $89,150.00 USDT.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        severity: 'success',
      },
      {
        id: 'notif-2',
        type: 'price_alert',
        title: 'PRICE TARGET REACHED',
        message: 'ETH crossed below your defined target of $3,400.00 USDT. Current spot sits at $3,382.40.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        severity: 'warning',
      },
      {
        id: 'notif-3',
        type: 'liquidation_warning',
        title: 'HIGH LEVERAGE RISK WARNING',
        message: 'Your leveraged ADA spot holding warning is approaching liquidation limits. Monitor prices closely.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
        severity: 'danger',
      },
    ];
  });

  // Load and synchronize user state from backend database on mount or session change
  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      fetch(`/api/user/get-state?username=${currentUser.username}`)
        .then((res) => {
          if (!res.ok) throw new Error("Backend offline fallback");
          return res.json();
        })
        .then((data) => {
          if (data.wallet) {
            setWallet(data.wallet);
            localStorage.setItem('binance_mock_wallet', JSON.stringify(data.wallet));
          }
          if (data.orders) {
            setOrders(data.orders);
            localStorage.setItem('binance_mock_orders', JSON.stringify(data.orders));
          }
          if (data.alerts) {
            setAlerts(data.alerts);
            localStorage.setItem('binance_mock_alerts', JSON.stringify(data.alerts));
          }
          if (data.chat) {
            setChatHistory(data.chat);
            localStorage.setItem('binance_ai_chat', JSON.stringify(data.chat));
          }
        })
        .catch((err) => {
          console.warn("Express backend sync offline, using browser database cache:", err);
        });
    }
  }, [currentUser]);

  // Synchronize state changes back to DB (Debounced slightly to prevent spamming requests)
  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      const delayCommit = setTimeout(() => {
        fetch('/api/user/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser.username,
            wallet,
            orders,
            alerts,
            chat: chatHistory
          })
        }).catch(e => console.warn("Backend sync offline: ", e));
      }, 800);
      return () => clearTimeout(delayCommit);
    }
  }, [wallet, orders, alerts, chatHistory, currentUser]);

  // Helper to add unified notification
  const addNotification = (
    type: 'order_filled' | 'price_alert' | 'liquidation_warning' | 'liquidation_event',
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'danger' | 'success'
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isRead: false,
      severity,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // State handles to keep track of warn logs we've already triggered to prevent loop spamming 
  const warnedLiquidationSymbols = useRef<Record<string, number>>({});

  // 14. Asset Performance & Total PnL Polling Mechanism (Every 10 Seconds)
  const walletRefForPolling = useRef(wallet);
  const coinsRefForPolling = useRef(coins);
  const ordersRefForPolling = useRef(orders);

  useEffect(() => {
    walletRefForPolling.current = wallet;
  }, [wallet]);

  useEffect(() => {
    coinsRefForPolling.current = coins;
  }, [coins]);

  useEffect(() => {
    ordersRefForPolling.current = orders;
  }, [orders]);

  const [performanceData, setPerformanceData] = useState<{
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    assetPerformanceList: any[];
    lastUpdated: string;
  } | null>(null);

  const [performanceCountdown, setPerformanceCountdown] = useState<number>(10);

  const calculatePerformanceSnapshot = (
    currentWallet: WalletAsset[],
    currentCoins: Coin[],
    currentOrders: TradingOrder[]
  ) => {
    const defaultEntryPrices: Record<string, number> = {
      BTC: 61200.0,
      ETH: 3150.0,
      BNB: 540.0,
      SOL: 138.0,
      ADA: 0.44,
      USDT: 1.00
    };

    const startingQtyMap: Record<string, number> = {
      BTC: 0.125,
      ETH: 1.85,
      BNB: 4.20,
      SOL: 15.0,
      ADA: 320.0,
      USDT: 24500.0,
    };

    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let cumulativePnL = 0;

    const list = currentWallet.map((asset) => {
      const coin = currentCoins.find((c) => c.symbol === asset.symbol);
      const currentPrice = asset.symbol === 'USDT' ? 1.0 : (coin?.price || 0);
      const change24h = asset.symbol === 'USDT' ? 0.0 : (coin?.change24h || 0);
      
      const initQty = startingQtyMap[asset.symbol] || 0;
      const initPrice = defaultEntryPrices[asset.symbol] || currentPrice;
      
      const filledBuys = currentOrders.filter(
        (o) => o.symbol === asset.symbol && o.side === 'buy' && o.status === 'filled'
      );
      
      const totalBoughtQty = initQty + filledBuys.reduce((sum, o) => sum + o.amount, 0);
      const totalBoughtCost = (initQty * initPrice) + filledBuys.reduce((sum, o) => sum + (o.amount * o.price), 0);
      
      const avgEntryPrice = totalBoughtQty > 0 ? totalBoughtCost / totalBoughtQty : currentPrice;
      
      const totalQty = asset.free + asset.locked;
      const currentCostBasis = totalQty * avgEntryPrice;
      const currentMarketValue = totalQty * currentPrice;
      
      const unrealizedPnL = currentMarketValue - currentCostBasis;
      const unrealizedPnLPercent = avgEntryPrice > 0 ? ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100 : 0;

      if (asset.symbol !== 'USDT') {
        totalCostBasis += currentCostBasis;
        totalMarketValue += currentMarketValue;
        cumulativePnL += unrealizedPnL;
      }
      
      return {
        symbol: asset.symbol,
        name: asset.name,
        totalQty,
        avgEntryPrice,
        currentPrice,
        change24h,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    });

    const overallPnLPercent = totalCostBasis > 0 ? (cumulativePnL / totalCostBasis) * 100 : 0;

    return {
      unrealizedPnL: cumulativePnL,
      unrealizedPnLPercent: overallPnLPercent,
      assetPerformanceList: list,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  // Perform initial calculation on load
  useEffect(() => {
    const initial = calculatePerformanceSnapshot(wallet, coins, orders);
    setPerformanceData(initial);
  }, []);

  // Interval timer for 10 seconds polling (updates countdown every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceCountdown((prev) => {
        if (prev <= 1) {
          const fresh = calculatePerformanceSnapshot(
            walletRefForPolling.current,
            coinsRefForPolling.current,
            ordersRefForPolling.current
          );
          setPerformanceData(fresh);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('binance_mock_alerts', JSON.stringify(alerts));
  }, [alerts]);
  useEffect(() => {
    localStorage.setItem('binance_mock_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('binance_mock_leverage', leverage.toString());
  }, [leverage]);
  useEffect(() => {
    localStorage.setItem('binance_leverage_enabled', isLeverageEnabled.toString());
  }, [isLeverageEnabled]);
  useEffect(() => {
    localStorage.setItem('binance_mock_coins', JSON.stringify(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('binance_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('binance_mock_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('binance_mock_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('binance_ai_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Load News on startup
  useEffect(() => {
    fetchMarketNews();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreateAlert = (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: `alert-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      targetPrice,
      condition,
      isTriggered: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    triggerToast(`Alert Set! 🔔 Tracking ${symbol} crossing ${condition} $${targetPrice.toLocaleString()} USDT.`);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    triggerToast('Price threshold alert deleted.');
  };

  // Switch Active Coin Details and regenerate charts
  const handleSelectCoin = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSelectedBookPrice(undefined);
    const tarCoin = coins.find((c) => c.symbol === symbol) || coins[0];

    // Build new charts and books around target rate
    setCandles(generateHistoricalCandles(tarCoin.price, 45));
    setOrderBook(generateOrderBook(tarCoin.price, tarCoin.decimals));
    setTrades(generateRecentTrades(tarCoin.price, tarCoin.decimals));
  };

  const handleToggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Faucet logic: credited with free USDT
  const handleRunFaucet = () => {
    setWallet((prev) =>
      prev.map((w) => {
        if (w.symbol === 'USDT') {
          return { ...w, free: w.free + 10000 };
        }
        return w;
      })
    );
    triggerToast('Faucet triggered! Succesfully credited +10,000 USDT to available account.');
  };

  // Update USDT Balance for Investments/Withdrawals/Referrals
  const handleUpdateUsdtBalance = (change: number, message?: string) => {
    setWallet((prev) =>
      prev.map((w) => {
        if (w.symbol === 'USDT') {
          return { ...w, free: Number((w.free + change).toFixed(2)) };
        }
        return w;
      })
    );
    if (message) {
      triggerToast(message);
    }
  };

  // Secure Cryptographic Custom Asset Withdrawal Handler
  const handleWithdrawAsset = (symbol: string, amount: number, message?: string) => {
    setWallet((prev) =>
      prev.map((w) => {
        if (w.symbol === symbol) {
          return { ...w, free: Number(Math.max(0, w.free - amount).toFixed(6)) };
        }
        return w;
      })
    );
    if (message) {
      triggerToast(message);
    }
  };

  // Trade Executor Cockpit
  const handlePlaceOrder = (orderSpec: {
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
  }) => {
    const usdValue = orderSpec.price * orderSpec.amount;

    if (orderSpec.side === 'buy') {
      if (orderSpec.type === 'limit') {
        // LOCK USDT
        setWallet((prev) =>
          prev.map((w) => {
            if (w.symbol === 'USDT') {
              return { ...w, free: w.free - usdValue, locked: w.locked + usdValue };
            }
            return w;
          })
        );

        // Append to pending limits
        const newOrder: TradingOrder = {
          id: `ord-${Math.random().toString(36).substr(2, 9)}`,
          symbol: selectedSymbol,
          type: 'limit',
          side: 'buy',
          price: orderSpec.price,
          amount: orderSpec.amount,
          total: usdValue,
          status: 'open',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setOrders((prev) => [newOrder, ...prev]);
        triggerToast(`Limit Order queued! Buy ${orderSpec.amount} ${selectedSymbol} at $${orderSpec.price.toLocaleString()}.`);
      } else {
        // MARKET BUY SETTLES INSTANTLY
        setWallet((prev) => {
          return prev.map((asset) => {
            if (asset.symbol === 'USDT') {
              return { ...asset, free: asset.free - usdValue };
            }
            if (asset.symbol === selectedSymbol) {
              return { ...asset, free: asset.free + orderSpec.amount };
            }
            return asset;
          });
        });

        const newOrder: TradingOrder = {
          id: `ord-${Math.random().toString(36).substr(2, 9)}`,
          symbol: selectedSymbol,
          type: 'market',
          side: 'buy',
          price: orderSpec.price,
          amount: orderSpec.amount,
          total: usdValue,
          status: 'filled',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setOrders((prev) => [newOrder, ...prev]);
        addNotification(
          'order_filled',
          'MARKET BUY FILLED',
          `Successfully purchased ${orderSpec.amount.toFixed(4)} ${selectedSymbol} at market price $${orderSpec.price.toLocaleString()} USDT.`,
          'success'
        );
        triggerToast(`Market Order Executed! Purchased ${orderSpec.amount.toFixed(4)} ${selectedSymbol} at close price.`);
      }
    } else {
      // SELLING
      if (orderSpec.type === 'limit') {
        // LOCK CRYPTO COIN
        setWallet((prev) =>
          prev.map((w) => {
            if (w.symbol === selectedSymbol) {
              return { ...w, free: w.free - orderSpec.amount, locked: w.locked + orderSpec.amount };
            }
            return w;
          })
        );

        // Append to pending limits
        const newOrder: TradingOrder = {
          id: `ord-${Math.random().toString(36).substr(2, 9)}`,
          symbol: selectedSymbol,
          type: 'limit',
          side: 'sell',
          price: orderSpec.price,
          amount: orderSpec.amount,
          total: usdValue,
          status: 'open',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setOrders((prev) => [newOrder, ...prev]);
        triggerToast(`Limit Order queued! Sell ${orderSpec.amount} ${selectedSymbol} at $${orderSpec.price.toLocaleString()}.`);
      } else {
        // MARKET SELL SETTLES INSTANTLY
        setWallet((prev) => {
          return prev.map((asset) => {
            if (asset.symbol === selectedSymbol) {
              return { ...asset, free: asset.free - orderSpec.amount };
            }
            if (asset.symbol === 'USDT') {
              return { ...asset, free: asset.free + usdValue };
            }
            return asset;
          });
        });

        const newOrder: TradingOrder = {
          id: `ord-${Math.random().toString(36).substr(2, 9)}`,
          symbol: selectedSymbol,
          type: 'market',
          side: 'sell',
          price: orderSpec.price,
          amount: orderSpec.amount,
          total: usdValue,
          status: 'filled',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setOrders((prev) => [newOrder, ...prev]);
        addNotification(
          'order_filled',
          'MARKET SELL FILLED',
          `Successfully sold ${orderSpec.amount.toFixed(4)} ${selectedSymbol} at market price $${orderSpec.price.toLocaleString()} USDT.`,
          'success'
        );
        triggerToast(`Market Order Executed! Disposed ${orderSpec.amount.toFixed(4)} ${selectedSymbol} at close price.`);
      }
    }
  };

  // Cancel pending order
  const handleCancelOrder = (id: string) => {
    const target = orders.find((o) => o.id === id);
    if (!target) return;

    // Refund locked capital
    setWallet((prev) =>
      prev.map((asset) => {
        if (target.side === 'buy' && asset.symbol === 'USDT') {
          return { ...asset, free: asset.free + target.total, locked: asset.locked - target.total };
        }
        if (target.side === 'sell' && asset.symbol === target.symbol) {
          return { ...asset, free: asset.free + target.amount, locked: asset.locked - target.amount };
        }
        return asset;
      })
    );

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'canceled' as const } : o))
    );
    triggerToast('Order Canceled successfully. Locked assets refunded to available balance.');
  };

  // Fetch Market headlines through Express server
  const fetchMarketNews = async () => {
    setIsNewsLoading(true);
    try {
      const res = await fetch('/api/market-news');
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error('Failed to grab news feedback:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  // Submit chat prompt to Gemini Quant Coach
  const handleChatPromptSubmit = async (userPrompt: string) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, newMsg]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          chatHistory: chatHistory,
          wallet: wallet,
          selectedCoin: selectedSymbol,
          priceData: {
            price: activeCoin.price,
            change24h: activeCoin.change24h,
            high24h: activeCoin.high24h,
            low24h: activeCoin.low24h,
          },
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          role: 'model',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          role: 'model',
          content: `AI Service Unavailable: ${err?.message || 'Please check if your Gemini API key is configured correctly in Secrets.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
    triggerToast('Advisor chat logs wiped completely.');
  };

  // 11. Real-time Market Clock Ticks Simulation engine
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins((prevCoins) => {
        const nextCoins = prevCoins.map((coin) => {
          // Add a random tiny fluctuation walk
          const volatility = coin.symbol === 'BTC' ? 0.0006 : coin.symbol === 'SOL' ? 0.0025 : 0.0016;
          const fluctuation = coin.price * (Math.random() * volatility * 2 - volatility);
          const newPrice = Number((coin.price + fluctuation).toFixed(coin.decimals));

          // Compute new Highs / Lows matching walk
          const nextHigh = Number(Math.max(coin.high24h, newPrice).toFixed(coin.decimals));
          const nextLow = Number(Math.min(coin.low24h, newPrice).toFixed(coin.decimals));

          return {
            ...coin,
            price: newPrice,
            high24h: nextHigh,
            low24h: nextLow,
          };
        });

        // Trigger matching engines for active coin
        const updatedActiveCoin = nextCoins.find((c) => c.symbol === selectedSymbol) || nextCoins[0];

        // Match orderbook prices
        setOrderBook(generateOrderBook(updatedActiveCoin.price, updatedActiveCoin.decimals));

        // Inject high intensity live raw transaction item
        setTrades((prevTrades) => {
          const matchedAmt = Number((Math.random() * 0.8 + 0.001).toFixed(4));
          const side = Math.random() > 0.49 ? 'buy' : 'sell';
          const newTrade: Trade = {
            id: `trade-live-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            price: updatedActiveCoin.price,
            amount: matchedAmt,
            type: side as 'buy' | 'sell',
          };
          return [newTrade, ...prevTrades.slice(0, 19)];
        });

        // Update technical chart's active last candle closes
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const list = [...prevCandles];
          const lastIndex = list.length - 1;
          const lastCandle = list[lastIndex];

          const updatedLast = {
            ...lastCandle,
            close: updatedActiveCoin.price,
            high: Math.max(lastCandle.high, updatedActiveCoin.price),
            low: Math.min(lastCandle.low, updatedActiveCoin.price),
          };
          list[lastIndex] = updatedLast;
          return list;
        });

        return nextCoins;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // 12. Limit order book matching engine loop
  useEffect(() => {
    setOrders((prevOrders) => {
      let isChanged = false;
      const matched = prevOrders.map((order) => {
        if (order.status !== 'open') return order;

        // Fetch present price matching order symbol
        const currentRate = coins.find((c) => c.symbol === order.symbol)?.price || 0;

        let shouldFill = false;
        if (order.side === 'buy' && currentRate <= order.price) {
          shouldFill = true;
        } else if (order.side === 'sell' && currentRate >= order.price) {
          shouldFill = true;
        }

        if (shouldFill) {
          isChanged = true;
          // Trigger wallet asset allocation balance updates
          setWallet((prevWallet) => {
            return prevWallet.map((asset) => {
              if (order.side === 'buy') {
                if (asset.symbol === 'USDT') {
                  // Deduct from locked
                  return { ...asset, locked: asset.locked - order.total };
                }
                if (asset.symbol === order.symbol) {
                  // Credit crypto to free
                  return { ...asset, free: asset.free + order.amount };
                }
              } else {
                if (asset.symbol === order.symbol) {
                  // Deduct from locked crypto
                  return { ...asset, locked: asset.locked - order.amount };
                }
                if (asset.symbol === 'USDT') {
                  // Credit USDT funds to free
                  return { ...asset, free: asset.free + order.total };
                }
              }
              return asset;
            });
          });

          // Pushes filled order
          addNotification(
            'order_filled',
            `LIMIT ${order.side.toUpperCase()} FILLED`,
            `Limit ${order.side === 'buy' ? 'Buy' : 'Sell'} of ${order.amount} ${order.symbol} filled successfully at target of $${order.price.toLocaleString()} USDT.`,
            'success'
          );
          triggerToast(`Order Match Alert! Limit Sell/Buy of ${order.amount} ${order.symbol} filled at $${order.price.toLocaleString()} USDT.`);
          return { ...order, status: 'filled' as const };
        }
        return order;
      });

      return isChanged ? matched : prevOrders;
    });
  }, [coins]);

  // 13. Dynamic Price Alerts Check engine
  useEffect(() => {
    let triggeredCount = 0;
    setAlerts((prevAlerts) => {
      const updated = prevAlerts.map((alert) => {
        if (alert.isTriggered) return alert;

        const currentRate = coins.find((c) => c.symbol === alert.symbol)?.price || 0;
        if (currentRate === 0) return alert;

        let met = false;
        if (alert.condition === 'above' && currentRate >= alert.targetPrice) {
          met = true;
        } else if (alert.condition === 'below' && currentRate <= alert.targetPrice) {
          met = true;
        }

        if (met) {
          triggeredCount++;
          addNotification(
            'price_alert',
            'PRICE ALERT TRIGGERED',
            `${alert.symbol} has crossed ${alert.condition === 'above' ? 'above' : 'below'} your target of $${alert.targetPrice.toLocaleString()} USDT (Current rate: $${currentRate.toLocaleString()}).`,
            'warning'
          );
          triggerToast(`🔔 PRICE EXCEEDED! ${alert.symbol} has crossed ${alert.condition === 'above' ? 'above' : 'below'} your target of $${alert.targetPrice.toLocaleString()} (Current: $${currentRate.toLocaleString()})!`);
          return {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
        }
        return alert;
      });

      return triggeredCount > 0 ? updated : prevAlerts;
    });
  }, [coins]);

  // 13.5. Real-time Leverage Margin / Liquidation Watcher
  useEffect(() => {
    if (!isLeverageEnabled) return;

    coins.forEach((coin) => {
      const asset = wallet.find((w) => w.symbol === coin.symbol);
      if (!asset) return;

      const totalAmt = asset.free + asset.locked;
      if (totalAmt <= 0) return;

      // Calculate liquidation metrics exactly as we do in the drawer
      const entryPrice = coin.price * 1.01; 
      const marginFraction = 1 / leverage;
      const liquidationPrice = Math.max(0, entryPrice * (1 - marginFraction + 0.015));

      // 1. LIQUIDATION EVENT
      if (coin.price <= liquidationPrice) {
        // Wipe asset
        setWallet((prevWallet) =>
          prevWallet.map((w) => {
            if (w.symbol === coin.symbol) {
              return { ...w, free: 0, locked: 0 };
            }
            return w;
          })
        );

        addNotification(
          'liquidation_event',
          'FORCED LIQUIDATION',
          `💥 FORCED MARGIN LIQUIDATION: Your leveraged spot position in ${coin.symbol} has been liquidated at $${coin.price.toLocaleString()} USDT due to maintenance margin failure! Coin balance of ${totalAmt.toFixed(4)} ${coin.symbol} was automatically cleared.`,
          'danger'
        );
        triggerToast(`💥 DEBT LIQUIDATED! Leveraged ${coin.symbol} position liquidated at $${coin.price.toLocaleString()}!`);
      }
      // 2. LIQUIDATION WARNING
      else if (coin.price <= liquidationPrice * 1.035) {
        const lastWarn = warnedLiquidationSymbols.current[coin.symbol] || 0;
        if (Date.now() - lastWarn > 45000) {
          warnedLiquidationSymbols.current[coin.symbol] = Date.now();
          
          addNotification(
            'liquidation_warning',
            'LIQUIDATION WARNING',
            `⚠️ CRITICAL LIQUIDATION warning: ${coin.symbol} price is $${coin.price.toLocaleString()} USDT, within 3.5% of your estimated limit ($${liquidationPrice.toLocaleString()} USDT). Leverage multiplier: ${leverage}x.`,
            'danger'
          );
          triggerToast(`⚠️ MARGIN RISK: ${coin.symbol} liquidation limit approached!`);
        }
      }
    });
  }, [coins, isLeverageEnabled, leverage, wallet]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0d10] text-[#f1f5f9]">
        {/* Toast Alert Popups */}
        {toastMsg && (
          <div id="global-toast-notification" className="fixed top-4 right-4 z-50 bg-[#1e2329] border-l-4 border-blue-500 text-[#f1f5f9] px-4 py-3 rounded shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce max-w-sm">
            <Sparkles className="text-blue-500 shrink-0" size={14} />
            <span>{toastMsg}</span>
          </div>
        )}
        <AuthPage 
          onLoginSuccess={(user) => { 
            setCurrentUser(user); 
            localStorage.setItem('binance_current_user', JSON.stringify(user)); 
            triggerToast(`Core session loaded. Welcome ${user.name}!`);
          }} 
        />
      </div>
    );
  }

  return (
    <div id="binancedex-full-pane" className="min-h-screen bg-[#0b0e11] text-gray-100 flex flex-col font-sans relative antialiased overflow-x-hidden">
      {/* Toast Alert Popups */}
      {toastMsg && (
        <div id="global-toast-notification" className="fixed top-4 right-4 z-50 bg-[#1e2329] border-l-4 border-[#f0b90b] text-[#f1f5f9] px-4 py-3 rounded shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce max-w-sm font-sans">
          <Sparkles className="text-[#f0b90b] shrink-0" size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Administrative System operator fast desk strip */}
      {currentUser && (currentUser.role === 'senior_admin' || currentUser.role === 'junior_admin') && (
        <div id="admin-operator-fast-access-strip" className="bg-gradient-to-r from-[#1c242c] via-[#12161a] to-[#1c242c] border-b border-yellow-500/30 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 shadow-lg select-none">
          <div className="flex items-center gap-2.5">
            <span className="bg-yellow-500/15 text-yellow-500 text-[10px] font-black px-2.5 py-1 rounded border border-yellow-500/25 animate-pulse flex items-center gap-1.5 font-mono uppercase tracking-widest leading-none">
              <ShieldAlert size={12} className="stroke-[2.5]" /> Secure Workspace Manager
            </span>
            <p className="text-gray-300 font-medium text-center sm:text-left leading-normal font-sans text-[11px]">
              Logged in: <strong className="text-white">@{currentUser.username}</strong> ({currentUser.role === 'senior_admin' ? 'Senior Authority' : 'Junior Sandbox Only'}). Toggle separate panels below.
            </p>
          </div>

          <div className="flex bg-[#12161a] border border-[#2b3139] p-0.5 rounded-lg gap-1 shrink-0 overflow-hidden shadow-inner font-sans">
            <button
              onClick={() => {
                setActivePanel('user');
                triggerToast('Interactive trading view panel active.');
              }}
              className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activePanel === 'user'
                  ? 'bg-gradient-to-tr from-[#f0b90b] to-yellow-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-850'
              }`}
            >
              💼 User Panel (DEX Desk)
            </button>
            <button
              onClick={() => {
                setActivePanel('admin');
                triggerToast('Direct configuration dashboard active.');
              }}
              className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activePanel === 'admin'
                  ? 'bg-gradient-to-tr from-[#f0b90b] to-yellow-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f262f]'
              }`}
            >
              🛡️ Admin Panel (Ledger Control)
            </button>
          </div>
        </div>
      )}

      {/* Prominent top Referral CTA banner */}
      <div id="top-referral-cta-banner" className="bg-gradient-to-r from-[#1b1e22] via-[#221d0a] to-[#1b1e22] border-b border-[#eab308]/25 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none text-[11px] shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
          <span className="bg-[#eab308]/10 text-[#eab308] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border border-[#eab308]/20 animate-pulse font-sans">
            <Gift size={11} className="stroke-[2]" /> AFFILIATE PRO
          </span>
          <p className="text-gray-300 font-medium text-center md:text-left leading-normal">
            Secure <span className="text-white font-bold">10% instant commissions</span> on all referee network stakes! Your total earnings: <strong className="text-[#eab308] font-mono font-black text-xs">${totalReferralEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</strong>
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPortfolioTab('referrals');
            setTimeout(() => {
              document.getElementById('portfolio-center-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 80);
            triggerToast('Partner Portal Activated.');
          }}
          className="bg-[#eab308] hover:bg-yellow-500 text-black px-3.5 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1.5 border border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.3)] shrink-0 font-sans uppercase tracking-wider"
        >
          <Users size={12} className="stroke-[2.5]" />
          Invite Friends
          <ArrowRight size={11} className="stroke-[3]" />
        </button>
      </div>

      {/* Main Top Header Navbar navigation */}
      <header id="main-dex-header" className="bg-[#12161a] border-b border-[#2b3139] px-4 py-3 select-none flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Binance stylized logo */}
            <div className="w-6 h-6 bg-gradient-to-tr from-[#f0b90b] to-yellow-400 rotate-45 flex items-center justify-center rounded-[3px] shadow-[0_0_12px_rgba(240,185,11,0.3)]">
              <span className="text-black text-[10px] font-black font-sans -rotate-45">B</span>
            </div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1.5 font-sans">
              BINANCE <span className="text-[10px] bg-yellow-500/10 text-[#f0b90b] px-1.5 py-0.5 rounded font-bold tracking-normal uppercase">Paper Core</span>
            </h1>
          </div>
          <span className="hidden sm:inline-block text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono font-medium">Secured Node. v4.0</span>
        </div>

        {/* Global summary stats info */}
        <div className="flex items-center gap-5">
          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-800/80 rounded-lg border border-gray-700 font-mono text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
              <span className="text-gray-300 font-bold max-w-[80px] sm:max-w-[120px] truncate" title={currentUser.email}>
                {currentUser.name}
              </span>
              <button
                id="header-logout-btn"
                onClick={() => {
                  setCurrentUser(null);
                  setActivePanel('user');
                  localStorage.removeItem('binance_current_user');
                  triggerToast('Logged out of Paper Core session.');
                }}
                className="text-red-400 hover:text-red-300 ml-1.5 hover:underline cursor-pointer font-sans text-[10px]"
              >
                Logout
              </button>
            </div>
          )}

          <button
            id="faucet-header-btn"
            onClick={handleRunFaucet}
            className="text-[10.5px] font-bold text-[#f0b90b] bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded px-2.5 py-1 hover:bg-[#f0b90b] hover:text-black transition-all cursor-pointer"
          >
            USDT Faucet
          </button>

          {/* Global Alert Bell Button */}
          <button
            id="header-notification-bell"
            onClick={() => setIsNotifOpen(true)}
            className={`relative p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center border group ${
              isLeverageEnabled && notifications.some((n) => !n.isRead && n.severity === 'danger')
                ? 'bg-red-500/15 border-red-500 animate-pulse text-red-400'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-800 hover:border-gray-600 text-gray-300'
            }`}
            title="Open Alerts & Margin Risk Drawer"
          >
            <Bell size={16} className={`transition-colors ${
              isLeverageEnabled && notifications.some((n) => !n.isRead && n.severity === 'danger')
                ? 'text-red-400'
                : 'text-gray-300 group-hover:text-[#f0b90b]'
            }`} />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8.5px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-gray-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0ecb81]" />
            <span>Sim Sandbox Ingress Active</span>
          </div>
        </div>
      </header>

      {/* Render selected workspace panel separately */}
      {activePanel === 'admin' && currentUser && (currentUser.role === 'senior_admin' || currentUser.role === 'junior_admin') ? (
        <div className="flex-1 w-full bg-[#0b0e11] flex flex-col h-full overflow-hidden">
          <AdminPortal
            currentUser={currentUser as any}
            onClose={() => {
              setActivePanel('user');
              triggerToast('Returned to DEX Trading Desk.');
            }}
            onRefreshDEXBalance={refreshWalletFromStore}
            isFullPage={true}
          />
        </div>
      ) : (
        <>
          {/* Ticker tape summary panel */}
          <TickerTape
            coins={coins}
            selectedSymbol={selectedSymbol}
            onSelectCoin={handleSelectCoin}
            mockUsdtBalance={wallet.find((w) => w.symbol === 'USDT')?.free || 0}
          />

          {/* Dashboard Core Body workspace */}
          <main id="workspace-primary-row" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 bg-[#0b0e11] items-stretch">
            
            {/* LEFT COLUMN: Markets explorer + trades history feed */}
            <section id="column-west" className="lg:col-span-3 flex flex-col gap-3 h-full">
              {/* Market selector listings */}
              <div className="flex-1 min-h-[320px] rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                <MarketList
                  coins={coins}
                  selectedSymbol={selectedSymbol}
                  onSelectCoin={handleSelectCoin}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>

              {/* Scrolling trade logs history */}
              <div className="flex-1 min-h-[320px] rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                <TradesHistory trades={trades} coin={activeCoin} />
              </div>
            </section>

            {/* CENTER COLUMN: Interactive Candlestick Charts + Portfolio distribution panel */}
            <section id="column-center" className="lg:col-span-6 flex flex-col gap-3 h-full">
              {/* Main Ticking Market chart */}
              <div className="flex-[3] min-h-[360px] rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                <TradingChart candles={candles} coin={activeCoin} />
              </div>

              {/* Active Pending limits & Allocations */}
              <div className="flex-[2] min-h-[260px] rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                <PortfolioCenter
                  orders={orders}
                  wallet={wallet}
                  coins={coins}
                  onCancelOrder={handleCancelOrder}
                  onRunFaucet={handleRunFaucet}
                  alerts={alerts}
                  onCreateAlert={handleCreateAlert}
                  onDeleteAlert={handleDeleteAlert}
                  activeSymbol={selectedSymbol}
                  currentUser={currentUser}
                  onUpdateUsdtBalance={handleUpdateUsdtBalance}
                  selectedTab={selectedPortfolioTab}
                  onTabChange={setSelectedPortfolioTab}
                  onImportWallet={handleImportWallet}
                  performanceData={performanceData}
                  performanceCountdown={performanceCountdown}
                />
              </div>
            </section>

            {/* RIGHT COLUMN: Order Depth list + Cockpit Form + Gemini chat bot */}
            <section id="column-east" className="lg:col-span-3 flex flex-col gap-3 h-full">
              {/* Depth lists & Order placement form cards */}
              <div className="flex-1 grid grid-rows-2 sm:grid-rows-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-3 min-h-[380px]">
                {/* Depth lists */}
                <div className="rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                  <OrderBook
                    orderBook={orderBook}
                    coin={activeCoin}
                    onSelectPrice={(pr) => setSelectedBookPrice(pr)}
                  />
                </div>
                
                {/* Trade spot forms */}
                <div className="rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                  <OrderForm
                    coin={activeCoin}
                    wallet={wallet}
                    onPlaceOrder={handlePlaceOrder}
                    overridePrice={selectedBookPrice}
                  />
                </div>
              </div>

              {/* Gemini chatbot counsel */}
              <div className="flex-1 min-h-[380px] rounded bg-[#161a1e] border border-[#2b3139] overflow-hidden flex flex-col">
                <AiAdvisor
                  wallet={wallet}
                  selectedCoin={activeCoin}
                  candles={candles}
                  chatHistory={chatHistory}
                  onSendMessage={handleChatPromptSubmit}
                  onClearChat={handleClearChat}
                  isAiLoading={isAiLoading}
                />
              </div>
            </section>
          </main>
        </>
      )}

      {/* Dynamic Headlines flashing feed */}
      <footer id="dashboard-flashing-meta" className="bg-[#12161a] border-t border-[#2b3139] p-3 text-xs text-gray-500 shrink-0 select-none">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden max-w-full md:max-w-[70%]">
            <span className="bg-red-500/10 text-[#f5222d] text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
              <BriefcaseAlert size={12} className="text-[#f5222d]" /> FLASH NEWS
            </span>
            <div className="overflow-hidden whitespace-nowrap text-ellipsis text-gray-400">
              {isNewsLoading ? (
                <span className="animate-pulse">Retrieving dynamic intelligence from Gemini...</span>
              ) : news.length === 0 ? (
                <span>No urgent news flashes captured yet.</span>
              ) : (
                <span className="font-medium">
                  {news[0]?.relatedCoin}: {news[0]?.title} ({news[0]?.timestamp} • Impact:{' '}
                  <span
                    className={
                      news[0]?.impact === 'bullish'
                        ? 'text-[#0ecb81]'
                        : news[0]?.impact === 'bearish'
                        ? 'text-[#f6465d]'
                        : 'text-gray-450'
                    }
                  >
                    {news[0]?.impact}
                  </span>
                  )
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-[10px] font-mono justify-between md:justify-end border-t md:border-t-0 border-[#2b3139] pt-2 md:pt-0">
            <button
              id="refresh-news-btn"
              onClick={fetchMarketNews}
              className="hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw size={11} className={isNewsLoading ? 'animate-spin' : ''} />
              Refresh News
            </button>
            <span>UTC Time: {new Date().toUTCString()}</span>
          </div>
        </div>
      </footer>

      {/* Global Slide-In Notification & Risk Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          triggerToast('All notifications marked as read.');
        }}
        onClearAll={() => {
          setNotifications([]);
          triggerToast('All notifications cleared from history.');
        }}
        onDismissNotification={(id) => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
        wallet={wallet}
        coins={coins}
        leverage={leverage}
        onSetLeverage={(val) => {
          setLeverage(val);
          triggerToast(`Leverage scale adjusted to ${val}x risk.`);
        }}
        isLeverageEnabled={isLeverageEnabled}
        onToggleLeverage={(val) => {
          setIsLeverageEnabled(val);
          if (val) {
            triggerToast(`🚨 Leverage mode enabled at ${leverage}x! Positions monitor open.`);
          } else {
            triggerToast(`Unmargined spot mode restored.`);
          }
        }}
      />


    </div>
  );
}

// Custom simple icon wrapper since lucide and standard lacks certain combinations
function BriefcaseAlert({ size = 12, className = '' }) {
  return <AlertCircle size={size} className={className} />;
}
