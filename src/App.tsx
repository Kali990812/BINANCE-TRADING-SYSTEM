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
import { Sparkles, Star, TrendingUp, TrendingDown, BookOpen, AlertCircle, RefreshCw, Bell, Sliders, Gift, Users, ArrowRight, ShieldAlert, User, Briefcase, Landmark, History, Home, Layers, Copy, Check, Upload, ArrowUp, ArrowDown, LogOut } from 'lucide-react';

export const COMPACT_PLANS = [
  { id: 'bronze', name: 'Bronze Starter Plan', minDeposit: 10, yieldDaily: 5.0, durationDays: 10 },
  { id: 'silver', name: 'Silver Active Plan', minDeposit: 20, yieldDaily: 5.5, durationDays: 15 },
  { id: 'gold', name: 'Gold Premium Plan', minDeposit: 30, yieldDaily: 6.0, durationDays: 20 },
  { id: 'vip', name: 'VIP Tier Plan', minDeposit: 50, yieldDaily: 7.0, durationDays: 30 },
  { id: 'platinum', name: 'Platinum Sovereign Plan', minDeposit: 100, yieldDaily: 8.0, durationDays: 35 },
  { id: 'prestige', name: 'Prestige Paramount Plan', minDeposit: 200, yieldDaily: 10.0, durationDays: 40 },
];

export default function App() {
  // User Authentication profile state
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; email: string; role?: string; status?: string } | null>(() => {
    const saved = localStorage.getItem('binance_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Extract referral parameters on page load
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let ref = searchParams.get('ref') || searchParams.get('code');
      if (!ref) {
        // Fallback for hash query params
        const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
        ref = hashParams.get('ref') || hashParams.get('code');
      }
      if (ref) {
        localStorage.setItem('binance_referral_inviter', ref);
        console.log(`🔗 Affiliate tracker: Loaded with referral code [${ref}]`);
      }
    } catch (e) {
      console.warn("Failed tracking dynamic referral parameter on launch:", e);
    }
  }, []);

  const [userSelectedScreenshot, setUserSelectedScreenshot] = useState<string | null>(null);

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
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [userTab, setUserTab] = useState<'home' | 'packages' | 'finance' | 'history' | 'trade'>('home');
  const [depositScreenshotBase64, setDepositScreenshotBase64] = useState<string>('');
  const [depositMpesaCode, setDepositMpesaCode] = useState<string>('');
  const [depositFieldAmount, setDepositFieldAmount] = useState<string>('');
  const [calcUsdtAmount, setCalcUsdtAmount] = useState<string>('');
  const [isDepositSubmitting, setIsDepositSubmitting] = useState<boolean>(false);
  const [withdrawMpesaNumber, setWithdrawMpesaNumber] = useState<string>('');
  const [withdrawFieldAmount, setWithdrawFieldAmount] = useState<string>('');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState<boolean>(false);
  const [activeInvestments, setActiveInvestments] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('binance_active_investments') || '[]');
  });
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
      // 1. Initial immediate state fetch
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
          if (data.transactions) {
            const oldTxsRaw = localStorage.getItem('binance_transaction_requests') || '[]';
            let oldTxs: any[] = [];
            try { oldTxs = JSON.parse(oldTxsRaw); } catch { oldTxs = []; }
            const otherUsersTxs = oldTxs.filter((tx: any) => (tx.username || '').toLowerCase() !== currentUser.username.toLowerCase());
            const updatedCombinedTxs = [...data.transactions, ...otherUsersTxs];
            localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedCombinedTxs));
          }
        })
        .catch((err) => {
          console.warn("Express backend sync offline, using browser database cache:", err);
        });

      // 2. Periodic background polling for real-time status notifications
      const pollInterval = setInterval(() => {
        fetch(`/api/user/get-state?username=${currentUser.username}`)
          .then((res) => {
            if (!res.ok) throw new Error("Sync failure");
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

            if (data.transactions) {
              const oldTxsRaw = localStorage.getItem('binance_transaction_requests') || '[]';
              let oldTxs: any[] = [];
              try { oldTxs = JSON.parse(oldTxsRaw); } catch { oldTxs = []; }

              let hasNewApproved = false;

              data.transactions.forEach((newTx: any) => {
                if (newTx.type === 'deposit' && newTx.status === 'approved') {
                  const existingMatch = oldTxs.find((oldTx: any) => oldTx.id === newTx.id);
                  // If we previously had it recorded as pending (or if it is brand new), trigger notification
                  if (existingMatch && existingMatch.status === 'pending') {
                    hasNewApproved = true;

                    // Trigger Web Notification
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                      try {
                        const verifiedByText = newTx.verifiedBy ? ` Verified by: ${newTx.verifiedBy}.` : '';
                        new Notification("🟢 Deposit Request Approved!", {
                          body: `Your deposit of $${newTx.amount} USDT has been credited to your wallet balance instantly.${verifiedByText}`,
                          requireInteraction: true
                        });
                      } catch (notifyErr) {
                        console.warn("Could not dispatch native browser alert:", notifyErr);
                      }
                    }
                    
                    // Trigger UI Toast alert fallback
                    triggerToast(`🎉 Your deposit of $${newTx.amount || 0} USDT has been approved and credited!`);
                  }
                }
              });

              // Write updated list back to unified browser storage
              const otherUsersTxs = oldTxs.filter((tx: any) => (tx.username || '').toLowerCase() !== currentUser.username.toLowerCase());
              const updatedCombinedTxs = [...data.transactions, ...otherUsersTxs];
              localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedCombinedTxs));

              // If any modification happened, re-trigger local state evaluation
              if (hasNewApproved) {
                // Trigger quick virtual state update by ticking a primitive key to refresh renders
                setNews(prev => [...prev]);
              }
            }
          })
          .catch((err) => {
            console.debug("Background transaction poller offline state:", err);
          });
      }, 5000); // Poll every 5 seconds for fast interactive feedback

      return () => clearInterval(pollInterval);
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

  // Save active investments when modified
  useEffect(() => {
    localStorage.setItem('binance_active_investments', JSON.stringify(activeInvestments));
  }, [activeInvestments]);

  // Handle standard user claim yield
  const handleUserClaimYield = (id: string) => {
    const target = activeInvestments.find(inv => inv.id === id);
    if (!target || target.accruedProfit <= 0) return;

    const payout = target.accruedProfit;

    const updatedWallet = wallet.map(w => {
      if (w.symbol === 'USDT') {
        const currentFree = parseFloat((w.free || 0).toString());
        return { ...w, free: Number((currentFree + payout).toFixed(2)) };
      }
      return w;
    });
    setWallet(updatedWallet);
    localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));

    const storedLogsRaw = localStorage.getItem('binance_site_activities');
    const siteLogs = storedLogsRaw ? JSON.parse(storedLogsRaw) : [];
    siteLogs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      actor: currentUser?.username || 'user',
      role: 'user',
      action: 'Claim Dividends',
      details: `Claimed +$${payout.toFixed(4)} USDT from active contract "${target.planName}".`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    });
    localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

    setActiveInvestments(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, accruedProfit: 0, lastUpdated: Date.now() } : inv
      )
    );

    triggerToast(`Claimed +$${payout.toFixed(2)} USDT dividend successfully!`);
  };

  const handleUserFastForwardYield = (id: string) => {
    setActiveInvestments(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        const dailyUsd = inv.yieldDailyUsd || (inv.depositAmount * (inv.yieldDaily / 100));
        const currentAccrued = parseFloat((inv.accruedProfit || 0).toString());
        return {
          ...inv,
          timestamp: inv.timestamp - (24 * 60 * 60 * 1000),
          accruedProfit: Number((currentAccrued + dailyUsd).toFixed(4)),
          lastUpdated: Date.now()
        };
      })
    );
    triggerToast("Demo: Advanced contract clock by +24h! Accrued new yield.");
  };

  const handleUserBuyPlan = (plan: { id: string; name: string; minDeposit: number; yieldDaily: number; durationDays: number }) => {
    const cost = plan.minDeposit;
    const usdtAsset = wallet.find(w => w.symbol === 'USDT') || { symbol: 'USDT', name: 'Tether USD', free: 1.0, locked: 0 };
    if (usdtAsset.free < cost) {
      alert(`Insufficient balance! Your premium balance is $${usdtAsset.free.toFixed(2)} USDT, but the ${plan.name} package requires exactly $${cost.toFixed(2)} USDT capital. Please navigate to the "Deposit" tab and pay via M-Pesa!`);
      setUserTab('finance');
      return;
    }

    const updatedWallet = wallet.map(w => {
      if (w.symbol === 'USDT') {
        return { ...w, free: Number((w.free - cost).toFixed(2)) };
      }
      return w;
    });
    setWallet(updatedWallet);
    localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));

    const pendingReq = {
      id: `inv-${Math.random().toString(36).substring(2, 9)}`,
      username: currentUser?.username || 'user',
      planId: plan.id,
      planName: plan.name,
      depositAmount: cost,
      yieldDaily: plan.yieldDaily,
      yieldDailyUsd: Number((cost * (plan.yieldDaily / 100)).toFixed(2)),
      timestamp: Date.now(),
      durationDays: plan.durationDays,
      status: 'pending'
    };

    const storedInvsRaw = localStorage.getItem('binance_investment_requests') || '[]';
    let localReqs = [];
    try { localReqs = JSON.parse(storedInvsRaw); } catch { localReqs = []; }
    localReqs.unshift(pendingReq);
    localStorage.setItem('binance_investment_requests', JSON.stringify(localReqs));

    fetch('/api/user/submit-investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser?.username,
        planId: plan.id,
        depositAmount: cost,
        yieldDailyUsd: (cost * (plan.yieldDaily / 100)),
        durationDays: plan.durationDays
      })
    })
    .then(() => {
      triggerToast(`Staked $${cost} USDT in ${plan.name}!`);
      alert(`Staking package initiated successfully!\nPlan: ${plan.name}\nAmount: $${cost} USDT\nStatus: Pending Senior Admin approval. Once approved, interest dividends start accumulating!`);
    })
    .catch(e => {
      console.warn("Backend staking submission offline, cached:", e);
      triggerToast(`Secured offline staking record.`);
    });
  };

  const handleUserSubmitDeposit = (e: any) => {
    e.preventDefault();
    const amtVal = parseFloat(depositFieldAmount);
    if (isNaN(amtVal) || amtVal < 10) {
      alert("Please enter a valid deposit amount of at least $10.00 USDT.");
      return;
    }
    if (!depositMpesaCode || depositMpesaCode.trim().length < 6) {
      alert("Please enter a valid M-Pesa transaction reference code (at least 6 characters).");
      return;
    }
    if (!depositScreenshotBase64) {
      alert("Please upload a proof of payment screenshot before confirming your deposit.");
      return;
    }

    setIsDepositSubmitting(true);

    const newTx = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      username: currentUser?.username || 'user',
      type: 'deposit',
      amount: amtVal,
      netAmount: amtVal,
      fee: 0,
      network: 'M-Pesa 0797166504',
      refHash: depositMpesaCode.trim().toUpperCase(),
      screenshotBase64: depositScreenshotBase64,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    };

    const storedTxRaw = localStorage.getItem('binance_transaction_requests') || '[]';
    let txs = [];
    try { txs = JSON.parse(storedTxRaw); } catch { txs = []; }
    txs.unshift(newTx);
    localStorage.setItem('binance_transaction_requests', JSON.stringify(txs));

    fetch('/api/user/submit-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser?.username,
        amount: amtVal,
        refHash: depositMpesaCode.trim().toUpperCase(),
        network: 'M-Pesa 0797166504',
        screenshotBase64: depositScreenshotBase64
      })
    })
    .then(async (res) => {
      setIsDepositSubmitting(false);
      if (res.ok) {
        alert(`Payment verification filed successfully!\nReference: ${depositMpesaCode.toUpperCase()}\nAmount: $${amtVal} USDT\nStatus: Pending verification. A Senior Administrator will inspect your screenshot proof and credit your wallet shortly.`);
        setDepositFieldAmount('');
        setDepositMpesaCode('');
        setDepositScreenshotBase64('');
        triggerToast("Deposit payment queued for verification!");
      } else {
        const err = await res.json();
        alert(`Submission failed: ${err.error}`);
      }
    })
    .catch(e => {
      console.warn("Express submit payment failed, locally queued:", e);
      setIsDepositSubmitting(false);
      alert(`Deposit request of $${amtVal} filed (offline fallback). Reference: ${depositMpesaCode.toUpperCase()}. Pending Admin approval.`);
      setDepositFieldAmount('');
      setDepositMpesaCode('');
      setDepositScreenshotBase64('');
    });
  };

  const handleUserSubmitWithdrawal = (e: any) => {
    e.preventDefault();
    const amtVal = parseFloat(withdrawFieldAmount);
    
    // Check if they have active/pending investments
    const localReqs = JSON.parse(localStorage.getItem('binance_investment_requests') || '[]');
    const hasInvestments = activeInvestments.length > 0 || localReqs.some((r: any) => r.username === currentUser?.username);
    
    if (!hasInvestments) {
      alert("Platform policy: Withdrawals are locked for new users in order to protect against account creation abuse. To unlock your $1.00 join bonus and other funds, you must first join the site and purchase a package in the Staking Packages tab.");
      setUserTab('packages');
      return;
    }

    const usdtAsset = wallet.find(w => w.symbol === 'USDT') || { symbol: 'USDT', name: 'Tether USD', free: 0.0, locked: 0 };
    if (isNaN(amtVal) || amtVal <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }
    if (amtVal > usdtAsset.free) {
      alert(`Insufficient funds! Your maximum withdrawable balance is $${usdtAsset.free.toFixed(2)} USDT.`);
      return;
    }
    if (!withdrawMpesaNumber || withdrawMpesaNumber.trim().length < 8) {
      alert("Please enter a valid phone number for M-Pesa payout.");
      return;
    }

    setIsWithdrawSubmitting(true);
    const fee = Number((amtVal * 0.09).toFixed(2));
    const netPayout = Number((amtVal - fee).toFixed(2));

    const newTx = {
      id: `tx-${Math.random().toString(36).substring(2, 9)}`,
      username: currentUser?.username || 'user',
      type: 'withdrawal',
      amount: amtVal,
      netAmount: netPayout,
      fee: fee,
      network: 'M-Pesa Payout Desk',
      refHash: `WITHDRAW-${withdrawMpesaNumber}-${Math.random().toString(36).substring(3, 8).toUpperCase()}`,
      screenshotBase64: '',
      status: 'pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    };

    const storedTxRaw = localStorage.getItem('binance_transaction_requests') || '[]';
    let txs = [];
    try { txs = JSON.parse(storedTxRaw); } catch { txs = []; }
    txs.unshift(newTx);
    localStorage.setItem('binance_transaction_requests', JSON.stringify(txs));

    const updatedWallet = wallet.map(w => {
      if (w.symbol === 'USDT') {
        return { ...w, free: Number((w.free - amtVal).toFixed(2)) };
      }
      return w;
    });
    setWallet(updatedWallet);
    localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));

    fetch('/api/user/submit-withdrawal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: currentUser?.username,
        amount: amtVal,
        fee: fee,
        netAmount: netPayout,
        address: withdrawMpesaNumber,
        network: 'M-Pesa Payout Desk'
      })
    })
    .then(async (res) => {
      setIsWithdrawSubmitting(false);
      if (res.ok) {
        alert(`Withdrawal Filed Successfully!\nAmount: $${amtVal} USDT\nFee (9% flat): $${fee} USDT\nNet Payout: $${netPayout} USDT\nQueued to phone: ${withdrawMpesaNumber}\nStatus: Pending Admin approval.`);
        setWithdrawFieldAmount('');
        setWithdrawMpesaNumber('');
        triggerToast("Withdrawal request dispatched!");
      } else {
        const err = await res.json();
        alert(`Withdrawal failed: ${err.error}`);
      }
    })
    .catch(e => {
      console.warn("Backend submit withdrawal failed, offline fallback applied:", e);
      setIsWithdrawSubmitting(false);
      alert(`Withdrawal of $${amtVal} USDT queued offline. Ref: WITHDRAW-${withdrawMpesaNumber}`);
      setWithdrawFieldAmount('');
      setWithdrawMpesaNumber('');
    });
  };

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
            <div 
              id="user-account-auth-indicator" 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1b2026] rounded-lg border-2 border-[#f0b90b] shadow-[0_0_15px_rgba(240,185,11,0.25)] font-mono text-[11px] animate-pulse transition-all hover:scale-105 duration-300 group"
              title={`Logged in as: ${currentUser.name} (${currentUser.email})`}
            >
              <div className="flex items-center gap-1.5 text-[#f0b90b] font-bold">
                <User size={13} className="stroke-[2.5]" />
                <span className="text-[10px] uppercase tracking-wider hidden xs:inline">Account:</span>
              </div>
              <span className="text-white font-extrabold max-w-[80px] sm:max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-ping" />
              <div className="border-l border-gray-700 pl-2 ml-1">
                <button
                  id="header-logout-btn"
                  onClick={() => {
                    setCurrentUser(null);
                    setActivePanel('user');
                    localStorage.removeItem('binance_current_user');
                    triggerToast('Logged out of Paper Core session.');
                  }}
                  className="text-red-400 hover:text-red-300 hover:underline cursor-pointer font-sans font-bold text-[10px] uppercase tracking-wide"
                >
                  Logout
                </button>
              </div>
            </div>
          )}



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
      ) : currentUser?.role === 'user' ? (
        <div className="flex-1 w-full flex flex-col bg-[#0b0e11] text-gray-100 overflow-y-auto select-none pb-24">
          
          {/* TOP USER NAVIGATION HEADER */}
          <div className="bg-[#12161a] border-b border-[#2b3139] px-4 py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white font-sans flex items-center gap-1.5">
                  Secure Workspace Portal
                </h2>
                <p className="text-[10px] text-gray-400 font-mono">Verified Account: {currentUser.name}</p>
              </div>
            </div>
            
            {/* Quick Balance display & logout */}
            <div className="flex items-center gap-3">
              <div className="bg-[#1e2329] border border-[#2b3139] px-3 py-1 rounded flex items-center gap-1.5">
                <span className="text-[9px] uppercase font-bold text-[#f0b90b] tracking-wider font-mono">WALLET:</span>
                <span className="text-xs font-mono font-extrabold text-[#0ecb81]">
                  ${(wallet.find(w => w.symbol === 'USDT')?.free || 1.0).toFixed(2)} USDT
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('binance_current_user');
                  window.location.reload();
                }}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-2.5 py-1 text-xs rounded flex items-center gap-1.5 transition-all cursor-pointer font-medium border-none"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* TAB SHEETS */}
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
            
            {/* TAB INTERACTIVE BODY */}
            {userTab === 'home' && (
              <div className="flex flex-col gap-5">
                
                {/* 1. Welcome Header Banner */}
                <div className="bg-gradient-to-r from-[#161a1e] to-[#1e2229] border border-[#2b3139] rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none select-none">💎</div>
                  <div className="flex items-center gap-4">
                    <div className="bg-[#f0b90b]/10 text-[#f0b90b] p-3 rounded-full border border-[#f0b90b]/20">
                      <User size={28} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#f0b90b] tracking-widest font-mono">Member Account Profile</div>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">Welcome back, {currentUser.name}! 👋</h3>
                      <p className="text-xs text-gray-400 mt-1">Your secure staking capital is actively generating dividends daily. Secure and decentralized core routing enabled.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#2b3139]/60 flex flex-wrap gap-4 text-[11px] text-gray-400 font-mono">
                    <span>📧 Email: <strong className="text-white">{currentUser.email}</strong></span>
                    <span>👤 Username: <strong className="text-white">{currentUser.username}</strong></span>
                    <span>🏷️ Rank: <strong className="text-[#f0b90b] uppercase">Active VIP Staker</strong></span>
                  </div>
                </div>

                {/* 2. Bento virtual wallet grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* MAIN WALLET CARD */}
                  <div className="bg-[#12161a] border-2 border-[#f0b90b]/80 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#f0b90b] text-[#12161a] text-[8.5px] font-bold font-mono px-2 py-0.5 uppercase tracking-wider rounded-bl">
                      Primary Virtual Wallet
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-450 font-medium">
                        <Landmark size={14} className="text-[#f0b90b]" />
                        <span>AVAILABLE LIQUIDITY</span>
                      </div>
                      <div className="text-3xl font-extrabold text-white tracking-tight mt-2.5 font-mono">
                        ${(wallet.find(w => w.symbol === 'USDT')?.free || 1.0).toFixed(2)}
                        <span className="text-sm text-gray-400 ml-1.5 font-sans font-medium">USDT</span>
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-[#2b3139] flex justify-between items-center text-[10px] font-mono text-gray-500">
                      <span>Refreshed: Real-time UTC</span>
                      <span className="text-[#0ecb81] font-bold">● Network Online</span>
                    </div>
                  </div>

                  {/* JOIN BONUS CARD */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Gift size={15} className="text-orange-450" />
                        <span>JOINING REWARD</span>
                      </div>
                      <div className="text-2xl font-extrabold text-white tracking-tight mt-2.5 font-mono">
                        $1.00 <span className="text-xs text-gray-400 font-sans font-normal">USDT</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-gray-400 leading-normal mt-3 bg-orange-500/10 border border-orange-500/20 p-2 rounded">
                      🎁 <strong>withdrawable claim rule:</strong> Available automatically once you make your first staking package investment!
                    </div>
                  </div>

                  {/* ACCUMULATED YIELD CARD */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Sparkles size={15} className="text-[#f0b90b]" />
                        <span>YIELD & EARNINGS</span>
                      </div>
                      <div className="text-2xl font-extrabold text-[#0ecb81] tracking-tight mt-2.5 font-mono">
                        ${(activeInvestments.reduce((sum, inv) => sum + (inv.accruedProfit || 0), 0) + totalReferralEarnings * 0.05).toFixed(2)}
                        <span className="text-xs text-gray-400 ml-1.5 font-sans font-normal">USDT</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed mt-4">
                      Includes claimed & unclaimed daily yields + real-time VIP contract affiliate commissions.
                    </p>
                  </div>

                </div>

                {/* 3. Quick Stats & Referrals Option */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* REFERRAL BOX */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <h4 className="text-xs uppercase font-extrabold text-[#f0b90b] tracking-wider flex items-center gap-1.5">
                        <Users size={14} /> Referral Affiliate Program
                      </h4>
                      <span className="text-[10px] bg-[#f0b90b]/15 text-[#f0b90b] px-2 py-0.5 rounded font-bold font-mono">5% Commission</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Invite friends to join and earn 5.0% commission instantly on every starting package they acquire!
                    </p>
                    
                    <div className="bg-[#1e2329] border border-[#2b3139] rounded p-2.5 flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] font-mono text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap select-all font-bold">
                        https://binancetradingsystem.bit006223.workers.dev/?ref={currentUser.username}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://binancetradingsystem.bit006223.workers.dev/?ref=${currentUser.username}`);
                          triggerToast("Referral link copied!");
                          alert("Referral link copied to clipboard!\nShare this link to claim a 5.0% instant commission payout as soon as referees invest.");
                        }}
                        className="bg-[#f0b90b] hover:bg-[#dfaa0a] text-black text-[10px] font-bold px-3 py-1 rounded shrink-0 flex items-center gap-1 transition-all cursor-pointer border-none"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                    
                    <div className="text-[10px] text-gray-500 font-mono flex justify-between pr-2 mt-1">
                      <span>Referees: 3 Members</span>
                      <span>Total Commissions: ${(totalReferralEarnings * 0.05).toFixed(2)} USDT</span>
                    </div>
                  </div>

                  {/* ACTIVE INVESTMENT STATUS */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <h4 className="text-xs uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5">
                        <Briefcase size={14} /> Staking Status Summary
                      </h4>
                      <span className="text-[10px] font-bold font-mono text-gray-400">
                        {activeInvestments.length} Running Contracts
                      </span>
                    </div>
                    
                    {activeInvestments.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-400 italic">No running investment package found.</p>
                        <button
                          onClick={() => setUserTab('packages')}
                          className="mt-3 inline-block bg-[#1e2329] hover:bg-gray-800 border border-[#2b3139] text-white text-xs px-3 py-1.5 rounded transition-colors font-medium cursor-pointer"
                        >
                          View Investment Packages →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2 max-h-[140px] overflow-y-auto pr-1">
                        {activeInvestments.slice(0, 3).map((inv: any) => (
                          <div key={inv.id} className="bg-[#1e2329] border border-[#2b3139]/80 p-2.5 rounded flex justify-between items-center text-[11px]">
                            <div>
                              <span className="font-extrabold text-white block">{inv.planName}</span>
                              <span className="text-[9px] text-gray-500 font-mono">Capital: ${inv.depositAmount} USDT</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#0ecb81] font-bold font-mono">+{inv.yieldDaily}% Daily</span>
                              <span className="text-[9.5px] text-gray-450 block font-mono">Accrued: ${inv.accruedProfit.toFixed(2)} USDT</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500 font-mono mt-2 pr-2 text-right">
                      <span className="cursor-pointer text-[#f0b90b] underline hover:text-[#dfaa0a]" onClick={() => setUserTab('packages')}>
                        Manage packages & Claim Yield 
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {userTab === 'packages' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-[#2b3139] pb-3 text-sans">
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Premium Capital Staking Options
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Allocate your USDT into high-performance smart contracts. Interest accumulates on a daily basis and is claimable directly to your wallet.
                  </p>
                </div>

                {/* 1. Staking Grid Packages list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COMPACT_PLANS.map((plan) => {
                    const usdtAsset = wallet.find(w => w.symbol === 'USDT') || { free: 1.0 };
                    const isAffordable = usdtAsset.free >= plan.minDeposit;
                    return (
                      <div key={plan.id} className="bg-[#161a1e] border border-[#2b3139] hover:border-[#f0b90b]/50 rounded-xl p-4 flex flex-col gap-3 relative transition-all group shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-[#f0b90b] tracking-wider font-mono">
                              FIXED CONTRACT
                            </span>
                            <h4 className="text-sm font-extrabold text-white mt-0.5">{plan.name}</h4>
                          </div>
                          <span className="text-xl">💰</span>
                        </div>

                        <div className="bg-[#1e2329]/80 rounded p-2.5 font-mono text-[11px] text-gray-400 flex flex-col gap-1.5">
                          <div className="flex justify-between">
                            <span>Requires:</span>
                            <strong className="text-white">${plan.minDeposit} USDT</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Yield:</span>
                            <strong className="text-[#0ecb81]">+{plan.yieldDaily}% Daily</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Yield Payout:</span>
                            <strong className="text-white">${(plan.minDeposit * (plan.yieldDaily / 100)).toFixed(2)} / Day</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Contract Term:</span>
                            <strong className="text-gray-300">{plan.durationDays} Days</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUserBuyPlan(plan)}
                          className={`w-full py-2 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-all border-none ${
                            isAffordable
                              ? 'bg-[#f0b90b] hover:bg-[#dfaa0a] text-black'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {isAffordable ? '⚡ Stake & Allocate Capital' : '❌ Insufficient USDT (Deposit Open)'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Active staking interest claim desk */}
                <div className="bg-[#12161a] border border-[#2b3139] rounded-xl p-5 mt-4 text-sans">
                  <div className="flex justify-between items-center border-b border-[#2b3139] pb-3 mb-4">
                    <h4 className="text-xs uppercase font-extrabold text-[#f0b90b] tracking-widest flex items-center gap-1.5 font-mono">
                      🏆 Active Yield Claiming Desk
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono">Claim dividends on a daily basis</span>
                  </div>

                  {activeInvestments.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs italic">
                      No approved active investment packages are currently running. Select and purchase a package above to begin generating daily interest!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {activeInvestments.map((inv: any) => {
                        const canClaim = inv.accruedProfit > 0;
                        return (
                          <div key={inv.id} className="bg-[#161a1e] border border-[#2b3139] p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-white">{inv.planName}</span>
                                <span className="text-[9.5px] bg-[#0ecb81]/15 text-[#0ecb81] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                                  Yielding
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 font-mono text-[11px] text-gray-400">
                                <div>Staked capital: <strong className="text-white">${inv.depositAmount} USDT</strong></div>
                                <div>Daily return: <strong className="text-[#0ecb81]">+{inv.yieldDaily}%</strong></div>
                                <div>Accrued rewards: <strong className="text-[#0ecb81]">${inv.accruedProfit ? inv.accruedProfit.toFixed(4) : "0.0000"} USDT</strong></div>
                                <div>Status: <strong className="text-[#0ecb81] uppercase font-bold text-[10px]">Active</strong></div>
                              </div>
                            </div>

                            {/* Verification tools + Claim Button */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-[#2b3139]/60 pt-3 md:pt-0">
                              <button
                                type="button"
                                onClick={() => handleUserFastForwardYield(inv.id)}
                                className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-mono text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer font-bold"
                                title="Gain +24 hours of dividends in sandbox instantly for demo testing"
                              >
                                ⏳ Fast-Forward 24h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUserClaimYield(inv.id)}
                                disabled={!canClaim}
                                className={`flex-1 md:flex-none font-sans font-extrabold text-xs px-4 py-1.5 rounded transition-all select-none cursor-pointer border-none ${
                                  canClaim
                                    ? 'bg-[#0ecb81] text-black font-extrabold uppercase'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                Claim Interest
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {userTab === 'finance' && (
              <div className="flex flex-col gap-5">
                
                {/* Segment toggle slider */}
                <div className="flex gap-2 p-1 bg-[#12161a] border border-[#2b3139] rounded-lg">
                  <button
                    type="button"
                    className="flex-1 py-1.5 text-xs font-bold rounded bg-[#1e2329] border border-[#f0b90b]/20 text-[#f0b90b]"
                  >
                    📥 Deposit USDT via M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Strict System Guard: Withdrawal requests can be initiated inside the cashout panel below. It unlocks automatically once you join the platform and secure at least 1 staking contract.");
                    }}
                    className="flex-1 py-1.5 text-xs font-bold text-gray-400 hover:text-white rounded transition-all bg-transparent border-none cursor-pointer"
                  >
                    📤 Payout Withdrawal Panel
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                  
                  {/* LEFT COLUMN: Payment details instructions */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col gap-4">
                    <h4 className="text-xs uppercase font-extrabold text-[#f0b90b] tracking-wider font-mono">
                      🏦 M-Pesa Treasury Desk Setup
                    </h4>
                    
                    <div className="bg-[#12161a] border border-[#2b3139] p-4 rounded-lg flex flex-col gap-2 relative">
                      <div className="absolute top-0 right-0 bg-[#0ecb81] text-black text-[8px] font-bold px-1.5 py-0.5 uppercase font-mono rounded-bl tracking-wider font-mono">
                        Real-Time
                      </div>
                      <span className="text-[10px] font-mono text-gray-450 block">SEND PAYMENTS DIRECTLY TO:</span>
                      <div className="text-lg font-mono font-extrabold text-white tracking-widest">
                        M-Pesa Number:
                        <span className="text-[#f0b90b] block mt-1 text-2xl select-all">0797166504</span>
                      </div>
                      <span className="text-[10.5px] text-gray-400 leading-normal">
                        Verify recipient details show the verified ledger merchant number before sending. Rate is fixed at 1 USDT = 130 KES (e.g., 10 USDT = Ksh 1,300, 20 USDT = Ksh 2,600).
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 text-xs text-gray-300 leading-relaxed font-sans mt-1">
                      <h5 className="font-extrabold text-white text-xs">📜 Deposit Step-By-Step:</h5>
                      <span className="flex gap-2">
                        <strong className="text-[#f0b90b]">1.</strong>
                        Calculate KES amount based on 1 USDT = 130 KES, then send to <strong>0797 166 504</strong>.
                      </span>
                      <span className="flex gap-2">
                        <strong className="text-[#f0b90b]">2.</strong>
                        Take a screenshot of the completed M-Pesa payment receipt from your mobile.
                      </span>
                      <span className="flex gap-2">
                        <strong className="text-[#f0b90b]">3.</strong>
                        Upload the screenshot and type in the transaction reference code (e.g. SFG873HDU3).
                      </span>
                      <span className="flex gap-2">
                        <strong className="text-[#f0b90b]">4.</strong>
                        Submit details. Senior Admin reviews and credits your primary virtual wallet instantly!
                      </span>
                    </div>

                    {/* Quick Convert calculator tool section */}
                    <div className="mt-2 border-t border-[#2b3139]/85 pt-4 flex flex-col gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#f0b90b] text-[15px]">⚡</span>
                        <h5 className="font-extrabold text-white text-[11.5px] uppercase tracking-wider font-mono">
                          Quick Convert Calculator (Ksh 130 Rate)
                        </h5>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Verify conversion pricing instantly. Input any target USDT capital to estimate exact KES payload sending requirements.
                      </p>
                      
                      <div className="bg-[#12161a] border border-[#2b3139]/60 rounded-lg p-3 flex flex-col gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-wider">
                            USDT AMOUNT
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={calcUsdtAmount}
                              onChange={(e) => setCalcUsdtAmount(e.target.value)}
                              placeholder="Enter USDT to convert..."
                              className="w-full bg-[#161a1e] border border-[#2b3139] focus:border-[#f0b90b] rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                            />
                            <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-500 font-mono font-bold">USDT</span>
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-1.5 flex-wrap">
                          {['10', '50', '100', '250', '500', '1000'].map((preset) => (
                            <button
                              type="button"
                              key={preset}
                              onClick={() => setCalcUsdtAmount(preset)}
                              className="text-[9.5px] font-mono bg-[#161a1e] hover:bg-[#20272f] text-gray-300 hover:text-[#f0b90b] border border-[#2b3139] hover:border-[#f0b90b]/35 px-2 py-0.5 rounded transition-all cursor-pointer"
                            >
                              ${preset}
                            </button>
                          ))}
                          {calcUsdtAmount && (
                            <button
                              type="button"
                              onClick={() => setCalcUsdtAmount('')}
                              className="text-[9.5px] font-mono bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded transition-all cursor-pointer ml-auto"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Result payload widget */}
                        <div className="bg-[#0b0e11] border border-[#2b3139]/85 rounded p-2.5 flex flex-col gap-1 text-center sm:text-left">
                          <div className="flex justify-between items-center text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">
                            <span>Safaricom Conversion Protocol</span>
                            <span>Standard fixed rate</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1 pt-1 border-t border-[#2b3139]/30">
                            <span className="text-[10px] text-gray-450 font-sans">Equivalent in KES:</span>
                            <div className="flex items-center justify-center sm:justify-end gap-1.5 mt-1 sm:mt-0">
                              <strong className="text-sm font-mono text-[#0ecb81] tracking-widest font-black">
                                Ksh {calcUsdtAmount && !isNaN(parseFloat(calcUsdtAmount)) 
                                  ? (parseFloat(calcUsdtAmount) * 130).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : "0.00"
                                }
                              </strong>
                              <span className="text-[9px] text-[#0ecb81] font-bold font-mono">KES</span>
                            </div>
                          </div>

                          {calcUsdtAmount && !isNaN(parseFloat(calcUsdtAmount)) && (
                            <button
                              type="button"
                              onClick={() => {
                                const roundedVal = (parseFloat(calcUsdtAmount) * 130).toFixed(2);
                                navigator.clipboard.writeText(roundedVal);
                                triggerToast(`Copied Ksh ${parseFloat(roundedVal).toLocaleString()} to clipboard!`);
                              }}
                              className="mt-2 text-[9px] bg-[#161a1e] hover:bg-[#20272f] text-gray-400 hover:text-white py-1 px-2.5 rounded border border-[#2b3139] hover:border-[#f0b90b]/30 transition-all cursor-pointer self-center w-full sm:w-auto font-mono"
                            >
                              📋 Copy KES Amount
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Deposit filing receipt form */}
                  <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 shadow-lg">
                    <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-1.5 font-mono mb-4">
                      📁 Verify & File Payment Reciept
                    </h4>

                    <form onSubmit={handleUserSubmitDeposit} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block mb-1.5">
                          Deposit Capital (Minimum $10.00 USDT / Ksh 1,300 KES)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={10}
                            step="any"
                            value={depositFieldAmount}
                            onChange={(e) => setDepositFieldAmount(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full bg-[#12161a] border border-[#2b3139] focus:border-[#f0b90b] rounded px-3 py-2 text-sm text-white font-mono outline-none"
                            required
                          />
                          <span className="absolute right-3 top-2 text-xs text-gray-500 font-mono">USDT</span>
                        </div>
                        {depositFieldAmount && !isNaN(parseFloat(depositFieldAmount)) && (
                          <div className="mt-2 text-xs text-[#f0b90b] font-mono flex flex-col gap-1 bg-[#12161a] border border-[#2b3139]/80 p-2 rounded">
                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                              <span>Conversion Rate:</span>
                              <span>1 USDT = 130 KES</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-[#2b3139]/50">
                              <span className="font-sans">💰 Amount to Pay in KES:</span>
                              <strong className="text-white text-xs font-mono">
                                Ksh {(parseFloat(depositFieldAmount) * 130).toLocaleString()} KES
                              </strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block mb-1.5">
                          M-Pesa Transaction Reference Code
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          value={depositMpesaCode}
                          onChange={(e) => setDepositMpesaCode(e.target.value)}
                          placeholder="e.g. SGG8HJDY83"
                          className="w-full bg-[#12161a] border border-[#2b3139] focus:border-[#f0b90b] rounded px-3 py-2 text-sm text-white font-mono uppercase outline-none"
                          required
                        />
                      </div>

                      {/* File upload widget */}
                      <div>
                        <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block mb-1.5">
                          M-Pesa Screenshot Proof Of Payment
                        </label>
                        
                        {depositScreenshotBase64 ? (
                          <div className="bg-[#12161a] border border-[#2b3139] rounded p-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={depositScreenshotBase64}
                                alt="Proof thumbnail"
                                className="w-10 h-10 object-cover rounded border border-gray-750"
                              />
                              <div>
                                <span className="text-[10px] text-[#0ecb81] font-bold block">✓ File Loaded</span>
                                <span className="text-[8.5px] text-gray-500 font-mono">Proof ready for verification</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDepositScreenshotBase64('')}
                              className="text-[10px] text-red-400 hover:text-white px-2 py-0.5 hover:bg-red-500/10 rounded border-none cursor-pointer bg-transparent"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="relative border-2 border-dashed border-[#2b3139] hover:border-[#f0b90b]/50 rounded-lg p-4 bg-[#12161a] transition-all text-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.readAsDataURL(file);
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setDepositScreenshotBase64(reader.result);
                                      triggerToast("Screenshot parsed successfully!");
                                    }
                                  };
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-1">
                              <Upload size={22} className="text-gray-500" />
                              <span className="text-xs text-gray-300 font-medium font-sans">Select Payment Screenshot</span>
                              <span className="text-[9px] text-gray-500 font-mono">JPG, PNG allowed</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isDepositSubmitting || !depositFieldAmount || !depositMpesaCode || !depositScreenshotBase64}
                        className={`w-full py-2.5 text-xs uppercase font-extrabold rounded select-none shadow border-none transition-all flex items-center justify-center gap-1.5 ${
                          !depositFieldAmount || !depositMpesaCode || !depositScreenshotBase64 || isDepositSubmitting
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-[#f0b90b] hover:bg-[#dfaa0a] text-black cursor-pointer'
                        }`}
                      >
                        {isDepositSubmitting ? ' Filing Verification...' : '⚡ Confirm Payment & File Proof'}
                      </button>
                    </form>
                  </div>

                </div>

                {/* WITHDRAWAL FORM CARD (Separated inside finance desk below) */}
                <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 mt-4">
                  <div className="flex items-center justify-between border-b border-[#2b3139] pb-3 mb-4 font-mono text-xs">
                    <h4 className="text-xs uppercase font-extrabold text-[#f0b90b] tracking-wider flex items-center gap-1.5 font-mono">
                      📤 Request cashout payout
                    </h4>
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold font-mono">
                      Strict Account Check Active
                    </span>
                  </div>

                  {/* Check if user active investments */}
                  {(() => {
                    const localReqs = JSON.parse(localStorage.getItem('binance_investment_requests') || '[]');
                    const hasInvestments = activeInvestments.length > 0 || localReqs.some((r: any) => r.username === currentUser?.username);
                    if (!hasInvestments) {
                      return (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 flex gap-3 text-xs text-red-400 leading-relaxed font-sans">
                          <div className="text-base">🚨</div>
                          <div>
                            <strong>Cashout Withdrawal Feature Locked!</strong>
                            <p className="mt-1 text-gray-450 leading-normal font-sans">
                              To prevent spam, user registers have a mandatory staking clause. The joining reward bonus ($1.00 USDT) and any interest cashouts will unlock automatically once you join the platform and secure at least one fixed staking package. Head over to the Staking Packages page to get started.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <form onSubmit={handleUserSubmitWithdrawal} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                          <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block mb-1">
                            Withdrawal Amount (USDT)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={withdrawFieldAmount}
                            onChange={(e) => setWithdrawFieldAmount(e.target.value)}
                            placeholder="e.g. 15.00"
                            className="w-full bg-[#12161a] border border-[#2b3139] focus:border-[#f0b90b] rounded px-3 py-2 text-sm text-white font-mono outline-none"
                            required
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="text-[11px] font-mono text-gray-400 uppercase font-bold block mb-1">
                            Select Payout Phone Number
                          </label>
                          <input
                            type="tel"
                            maxLength={12}
                            value={withdrawMpesaNumber}
                            onChange={(e) => setWithdrawMpesaNumber(e.target.value)}
                            placeholder="e.g. 07XXXXXXXX"
                            className="w-full bg-[#12161a] border border-[#2b3139] focus:border-[#f0b90b] rounded px-3 py-2 text-sm text-white font-mono outline-none"
                            required
                          />
                        </div>

                        <div className="md:col-span-1">
                          <button
                            type="submit"
                            disabled={isWithdrawSubmitting}
                            className="w-full bg-red-650 hover:bg-red-600 text-white font-mono text-xs font-bold py-2 px-4 rounded transition-all cursor-pointer shadow outline-none border-none py-2.5"
                          >
                            {isWithdrawSubmitting ? "Dispatching..." : "⚡ Dispatch Outward Payout"}
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </div>

              </div>
            )}

            {userTab === 'history' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-[#2b3139] pb-3 text-mono">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    📜 Treasuries & Stakings Ledger logs
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your full transactional auditing trail. Verify pending approvals, historical deposits, and outbound cashout releases.
                  </p>
                </div>

                {/* Browser Desktop Push Notification authorization banner */}
                {typeof window !== 'undefined' && 'Notification' in window && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                    notificationPermission === 'granted'
                      ? 'bg-[#0ecb81]/10 border-[#0ecb81]/25 text-[#0ecb81]'
                      : notificationPermission === 'denied'
                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                        : 'bg-[#0ea5e9]/10 border-[#0ea5e9]/25 text-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-black/55 flex items-center justify-center text-md self-center">
                        {notificationPermission === 'granted' ? (
                          <span>🔔</span>
                        ) : notificationPermission === 'denied' ? (
                          <span>🚫</span>
                        ) : (
                          <span className="animate-bounce block">⚡</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">
                          {notificationPermission === 'granted'
                            ? 'Real-Time Desktop Verification Active'
                            : notificationPermission === 'denied'
                              ? 'Desktop Verification Alerts Interrupted'
                              : 'Enable Instant Verification Desktop Popups'}
                        </h4>
                        <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                          {notificationPermission === 'granted'
                            ? 'Your browser is successfully connected to the Safaricom M-Pesa Verifier. You will receive active real-time desktop popups instantly when senior admin confirms your pending deposits.'
                            : notificationPermission === 'denied'
                              ? 'Notifications are blocked in your browser settings. Please click the security lock icon in your address bar and reset notifications permission to allow popups.'
                              : 'Stay notified in the background: authorize the system to trigger native browser alerts when deposits are approved or processed.'}
                        </p>
                      </div>
                    </div>
                    {notificationPermission === 'default' && (
                      <button
                        type="button"
                        onClick={() => {
                          Notification.requestPermission().then(permission => {
                            setNotificationPermission(permission);
                            if (permission === 'granted') {
                              try {
                                new Notification("🟢 Real-Time Alerts Active!", {
                                  body: "HANDSHAKE SUCCESSFUL: You will receive native background popups when your deposits are validated.",
                                  icon: '/assets/logo.png'
                                });
                              } catch (e) {
                                console.warn(e);
                              }
                            }
                          });
                        }}
                        className="bg-[#0ea5e9] hover:bg-[#38bdf8] text-black font-black text-[10.5px] uppercase tracking-widest px-4.5 py-2 rounded-lg cursor-pointer transition-all self-start sm:self-center shrink-0 border-none shadow-[0_4px_12px_rgba(14,165,233,0.35)]"
                      >
                        Authorize Alerts
                      </button>
                    )}
                  </div>
                )}

                {/* Deposits and Withdrawals table */}
                <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden shadow-md">
                  <div className="bg-[#12161a] border-b border-[#2b3139] px-4 py-3 font-mono">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Payments & Payouts Statement
                    </h4>
                  </div>

                  {(() => {
                    const reqs = JSON.parse(localStorage.getItem('binance_transaction_requests') || '[]')
                      .filter((r: any) => r.username === currentUser?.username);
                    
                    if (reqs.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-500 italic">
                          No pending or archived payment transactions found in your records.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto font-mono">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#1c2127]/60 text-gray-400 border-b border-[#262c33] text-[10px] uppercase font-bold">
                              <th className="px-4 py-3">Timestamp / Type</th>
                              <th className="px-4 py-3">Transaction Code</th>
                              <th className="px-4 py-3 text-right">Credit / Fees</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3 text-center">Receipt Proof</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#232930]/40">
                            {reqs.map((r: any) => (
                              <tr key={r.id} className="hover:bg-[#1f252d]/40 transition-colors">
                                <td className="px-4 py-3.5">
                                  <span className="text-[10px] text-gray-550 block mb-1">{r.timestamp}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                                    r.type === 'deposit' ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'border border-red-500/20 text-red-500'
                                  }`}>
                                    {r.type}
                                  </span>
                                </td>
                                
                                <td className="px-4 py-3.5 text-gray-200 font-bold select-all">
                                  {r.refHash || "CASH-DESK"}
                                  <span className="text-[9px] text-gray-500 block font-normal mt-0.5">{r.network}</span>
                                </td>

                                <td className="px-4 py-3.5 text-right font-bold text-white text-sm">
                                  +${r.amount} <span className="text-[10px] text-gray-400 font-normal">USDT</span>
                                  {r.type === 'withdrawal' && (
                                    <span className="text-[9px] text-red-500/80 block font-mono">
                                      Flat Fee: -9%
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                                    r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                                    r.status === 'approved' ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-red-500/15 text-red-500'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5 text-center">
                                  {r.screenshotBase64 ? (
                                    <button
                                      type="button"
                                      onClick={() => setUserSelectedScreenshot(r.screenshotBase64)}
                                      className="bg-gray-850 hover:bg-gray-800 text-xs px-2.5 py-1 rounded text-gray-300 font-mono text-[9.5px] font-bold cursor-pointer border border-[#2b3139]"
                                    >
                                      🔍 View Screenshot
                                    </button>
                                  ) : (
                                    <span className="text-gray-500 italic text-[10px]">No receipt</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* Staking packages requests table */}
                <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden shadow-md mt-1">
                  <div className="bg-[#12161a] border-b border-[#2b3139] px-4 py-3 font-mono">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      Fixed Contract Subscription Applications
                    </h4>
                  </div>

                  {(() => {
                    const localReqs = JSON.parse(localStorage.getItem('binance_investment_requests') || '[]')
                      .filter((r: any) => r.username === currentUser?.username);
                    
                    if (localReqs.length === 0) {
                      return (
                        <div className="py-12 text-center text-xs text-gray-500 italic">
                          No pending package activations.
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto font-mono text-xs text-left">
                        <table className="w-full">
                          <thead className="bg-[#1c2127]/60 text-gray-400 border-b border-[#262c33] text-[10px] uppercase font-bold">
                            <tr>
                              <th className="px-4 py-3">Plan Name / Term</th>
                              <th className="px-4 py-3 text-right">Deposit Capital</th>
                              <th className="px-4 py-3 text-right">Daily Yield Return</th>
                              <th className="px-4 py-3 text-center">Approval Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#232930]/40">
                            {localReqs.map((inv: any) => (
                              <tr key={inv.id} className="hover:bg-[#1f252d]/40 transition-colors">
                                <td className="px-4 py-3.5">
                                  <strong className="text-white block">{inv.planName}</strong>
                                  <span className="text-[9.5px] text-gray-500 mt-0.5 block">{inv.durationDays} Days Duration</span>
                                </td>

                                <td className="px-4 py-3.5 text-right font-bold text-white text-sm">
                                  ${inv.depositAmount} USDT
                                </td>

                                <td className="px-4 py-3.5 text-right font-bold text-[#0ecb81]">
                                  +{inv.yieldDaily}% daily
                                  <span className="text-[9px] text-gray-405 block font-normal mt-0.5">${inv.yieldDailyUsd} USDT / Day</span>
                                </td>

                                <td className="px-4 py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                                    inv.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                                    inv.status === 'approved' ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-red-500/15 text-red-500'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            {userTab === 'trade' && (
              <div className="flex flex-col gap-5 text-sans">
                <div className="border-b border-[#2b3139] pb-3 text-mono">
                  <h3 className="text-xs uppercase font-extrabold text-[#f0b90b] tracking-wider">
                    📈 Spot Ledger Candlestick Chart
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 text-sans">
                    Real-time liquidity streams showing candle feeds. Optimized and lightweight to support seamless mobile rendering.
                  </p>
                </div>

                {/* Minimized Chart inside standard container */}
                <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden p-3 h-[400px] flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono border-b border-[#2b3139] pb-2 text-gray-400">
                    <div>
                      <span className="text-white font-bold">BTC / USDT Spot</span>
                    </div>
                    <div className="flex gap-3">
                      <span>Index: <strong className="text-[#0ecb81]">${activeCoin.price.toLocaleString()}</strong></span>
                      <span>Change: <strong className="text-[#0ecb81]">{activeCoin.change24h}%</strong></span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full bg-[#12161a] rounded overflow-hidden flex flex-col justify-between">
                    <TradingChart candles={candles} coin={activeCoin} />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* COMPACT FLOATING NAVIGATION BOTTOM BAR FOR ALL DEVICES */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#12161a] border-t border-[#2b3139] px-4 py-2 z-40 flex justify-around items-center shadow-2xl">
            <button
              onClick={() => setUserTab('home')}
              className={`flex flex-col items-center gap-1 bg-transparent border-none outline-none cursor-pointer p-1.5 transition-colors ${
                userTab === 'home' ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Home size={18} />
              <span className="text-[9.5px] font-mono font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setUserTab('packages')}
              className={`flex flex-col items-center gap-1 bg-transparent border-none outline-none cursor-pointer p-1.5 transition-colors ${
                userTab === 'packages' ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={18} />
              <span className="text-[9.5px] font-mono font-medium">Staking</span>
            </button>

            <button
              onClick={() => setUserTab('finance')}
              className={`flex flex-col items-center gap-1 bg-transparent border-none outline-none cursor-pointer p-1.5 transition-colors ${
                userTab === 'finance' ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Landmark size={18} />
              <span className="text-[9.5px] font-mono font-medium">Finance</span>
            </button>

            <button
              onClick={() => setUserTab('history')}
              className={`flex flex-col items-center gap-1 bg-transparent border-none outline-none cursor-pointer p-1.5 transition-colors ${
                userTab === 'history' ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <History size={18} />
              <span className="text-[9.5px] font-mono font-medium font-bold">Ledgers</span>
            </button>

            <button
              onClick={() => setUserTab('trade')}
              className={`flex flex-col items-center gap-1 bg-transparent border-none outline-none cursor-pointer p-1.5 transition-colors ${
                userTab === 'trade' ? 'text-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp size={18} />
              <span className="text-[9.5px] font-mono font-medium">Spot Trade</span>
            </button>
          </div>

          {/* USER SCREENSHOT LIGHTBOX EXCLUSIVE */}
          {userSelectedScreenshot && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setUserSelectedScreenshot(null)}>
              <div className="bg-[#1e2329] border border-[#2b3139] p-4 rounded-lg max-w-sm w-full flex flex-col gap-3 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-[#2b3139]">
                  <h3 className="text-xs uppercase font-extrabold text-[#f0b90b] font-mono">My Receipt Proof</h3>
                  <button
                    type="button"
                    onClick={() => setUserSelectedScreenshot(null)}
                    className="text-gray-400 hover:text-white hover:bg-gray-800 px-2 py-0.5 rounded text-xs font-bold bg-transparent border-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-center bg-black rounded overflow-hidden p-2 border border-[#2b3139]/50">
                  <img
                    src={userSelectedScreenshot}
                    alt="M-Pesa Receipt Upload"
                    className="max-h-[50vh] object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[9px] text-gray-500 font-mono text-center">
                  This screenshot proof of payment has been securely submitted to the core review node.
                </span>
              </div>
            </div>
          )}

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
