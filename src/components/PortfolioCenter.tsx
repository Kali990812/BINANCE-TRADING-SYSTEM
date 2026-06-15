import React, { useState, useEffect } from 'react';
import { TradingOrder, WalletAsset, Coin, PriceAlert } from '../types';
import { 
  Trash2, Wallet, Coins, History, Layers, Bell, BellRing, PlusCircle, 
  AlertCircle, PieChart as PieIcon, TrendingUp, BadgePercent, Share2, 
  Copy, Check, Briefcase, ArrowUpRight, ArrowDownLeft, ShieldCheck, Landmark, Sliders, Cloud
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ReferralCenter } from './ReferralCenter';
import { DriveIntegration } from './DriveIntegration';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e2329] border border-[#2b3139] p-2 rounded shadow-2xl font-mono text-[10px] text-gray-200">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name} Allocation</span>
        </div>
        <div>Ratio: <span className="text-white font-extrabold">{data.percent.toFixed(2)}%</span></div>
        <div>Value: <span className="text-[#0ecb81] font-extrabold">${data.usdValStr}</span></div>
      </div>
    );
  }
  return null;
};

const TrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e2329] border border-[#2b3139] p-2 rounded shadow-2xl font-mono text-[10px] text-gray-200">
        <div className="text-gray-400 font-bold mb-0.5">{data.date}</div>
        <div>Price: <span className="text-[#f0b90b] font-extrabold">${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      </div>
    );
  }
  return null;
};

// Generates continuous, realistic price movements matching coin parameters
const generateHistoricalData = (coinSymbol: string, currentPrice: number, change24h: number) => {
  const data = [];
  const now = new Date();
  
  // Set up a deterministic seed multiplier based on the symbol characters
  const charSum = coinSymbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(now.getDate() - (29 - i));
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    // Create wave actions + trend based on symbol seed and day i
    const wave1 = Math.sin((i + charSum) * 0.4) * 0.03;
    const wave2 = Math.cos((i + charSum * 2) * 0.25) * 0.02;
    const trend = (i - 29) * (change24h / 100) * 0.015; // align trend with 24h change direction
    
    // Last element (i = 29) should be exactly currentPrice
    let factor = 1 + wave1 + wave2 + trend;
    
    if (i === 29) {
      factor = 1.0;
    } else {
      // Smoothly interpolate the correction factor so it doesn't jump on the last day
      const todayFactor = 1 + Math.sin((29 + charSum) * 0.4) * 0.03 + Math.cos((29 + charSum * 2) * 0.25) * 0.02;
      const t = i / 29;
      factor = factor / (1 - (1 - t) * (1 - todayFactor));
    }
    
    const calculatedPrice = currentPrice * factor;
    data.push({
      date: dateStr,
      price: Number(calculatedPrice.toFixed(2)),
    });
  }
  return data;
};

interface PortfolioCenterProps {
  orders: TradingOrder[];
  wallet: WalletAsset[];
  coins: Coin[];
  onCancelOrder: (id: string) => void;
  onRunFaucet: () => void;
  alerts: PriceAlert[];
  onCreateAlert: (symbol: string, targetPrice: number, condition: 'above' | 'below') => void;
  onDeleteAlert: (id: string) => void;
  activeSymbol: string;
  currentUser?: { name: string; username: string; email: string } | null;
  onUpdateUsdtBalance?: (change: number, message?: string) => void;
  selectedTab?: 'open' | 'history' | 'wallet' | 'alerts' | 'distribution' | 'trend' | 'invest' | 'referrals' | 'drive';
  onTabChange?: (tab: 'open' | 'history' | 'wallet' | 'alerts' | 'distribution' | 'trend' | 'invest' | 'referrals' | 'drive') => void;
  onImportWallet?: (importedWallet: WalletAsset[]) => void;
  performanceData?: {
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    assetPerformanceList: any[];
    lastUpdated: string;
  } | null;
  performanceCountdown?: number;
  onWithdrawAsset?: (symbol: string, amount: number, message?: string) => void;
}

interface InvestmentPlan {
  id: string;
  name: string;
  yieldDaily: number;
  yieldDailyUsd: number;
  durationDays: number;
  minDeposit: number;
  maxDeposit: number;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
}

const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan-10',
    name: 'Starter Tier ($10 Plan)',
    yieldDaily: 5.0,
    yieldDailyUsd: 0.5,
    durationDays: 30,
    minDeposit: 10,
    maxDeposit: 10,
    badge: 'Bronze Starter',
    badgeBg: 'bg-emerald-500/10',
    badgeColor: 'text-[#0ecb81]',
    description: 'Get started with a low entry-point stake of $10. Returns $0.50 USD daily.'
  },
  {
    id: 'plan-20',
    name: 'Standard Tier ($20 Plan)',
    yieldDaily: 4.5,
    yieldDailyUsd: 0.9,
    durationDays: 33,
    minDeposit: 20,
    maxDeposit: 20,
    badge: 'Silver Active',
    badgeBg: 'bg-blue-500/10',
    badgeColor: 'text-blue-400',
    description: 'A 33-day low-barrier intermediate term contract returning $0.90 USD daily.'
  },
  {
    id: 'plan-30',
    name: 'Advance Tier ($30 Plan)',
    yieldDaily: 5.0,
    yieldDailyUsd: 1.5,
    durationDays: 33,
    minDeposit: 30,
    maxDeposit: 30,
    badge: 'Gold Premium',
    badgeBg: 'bg-yellow-500/10',
    badgeColor: 'text-[#f0b90b]',
    description: 'An optimized silver rate contract returning a steady $1.50 USD daily returns.'
  },
  {
    id: 'plan-50',
    name: 'PRO Tier ($50 Plan)',
    yieldDaily: 4.6,
    yieldDailyUsd: 2.3,
    durationDays: 40,
    minDeposit: 50,
    maxDeposit: 50,
    badge: 'VIP Tier',
    badgeBg: 'bg-purple-500/10',
    badgeColor: 'text-purple-400',
    description: 'A high leverage yield tier staker returning $2.30 USD daily dividends for 40 days.'
  },
  {
    id: 'plan-100',
    name: 'Elite Tier ($100 Plan)',
    yieldDaily: 9.0,
    yieldDailyUsd: 9.0,
    durationDays: 50,
    minDeposit: 100,
    maxDeposit: 100,
    badge: 'Platinum Premium',
    badgeBg: 'bg-indigo-500/15',
    badgeColor: 'text-[#a78bfa]',
    description: 'Our high performance tier returning a massive $9.00 USD return daily over 50 days.'
  },
  {
    id: 'plan-200',
    name: 'Obidian Prestige ($200 Plan)',
    yieldDaily: 7.5,
    yieldDailyUsd: 15.0,
    durationDays: 40,
    minDeposit: 200,
    maxDeposit: 200,
    badge: 'Prestige Sovereign',
    badgeBg: 'bg-red-500/10',
    badgeColor: 'text-[#f6465d]',
    description: 'Direct sovereign contract with a premium of $15.00 USD return daily for 40 days.'
  }
];

interface ActiveInvestment {
  id: string;
  username: string;
  planId: string;
  planName: string;
  depositAmount: number;
  yieldDaily: number;
  yieldDailyUsd: number;
  timestamp: number;
  durationDays: number;
  accruedProfit: number;
  lastUpdated: number;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  investmentAmount: number;
  commissionEarned: number;
}

const DEFAULT_ENTRY_PRICES: Record<string, number> = {
  BTC: 61200.0,
  ETH: 3150.0,
  BNB: 540.0,
  SOL: 138.0,
  ADA: 0.44,
  USDT: 1.00
};

export const PortfolioCenter: React.FC<PortfolioCenterProps> = ({
  orders,
  wallet,
  coins,
  onCancelOrder,
  onRunFaucet,
  alerts,
  onCreateAlert,
  onDeleteAlert,
  activeSymbol,
  currentUser,
  onUpdateUsdtBalance,
  selectedTab,
  onTabChange,
  performanceData,
  performanceCountdown,
  onWithdrawAsset,
  onImportWallet,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'open' | 'history' | 'wallet' | 'alerts' | 'distribution' | 'trend' | 'invest' | 'referrals' | 'drive'>('open');
  const activeTab = selectedTab !== undefined ? selectedTab : localActiveTab;
  const setActiveTab = (tab: 'open' | 'history' | 'wallet' | 'alerts' | 'distribution' | 'trend' | 'invest' | 'referrals' | 'drive') => {
    setLocalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // State to track pending referral bonus dynamically shown in the wallet
  const [pendingRefCommission, setPendingRefCommission] = useState(0);

  // Withdrawal Portal Form States
  const [withdrawAsset, setWithdrawAsset] = useState<string>('USDT');
  const [withdrawNetwork, setWithdrawNetwork] = useState<string>('TRC20');
  const [cryptoWithdrawAddress, setCryptoWithdrawAddress] = useState<string>('');
  const [cryptoWithdrawAmount, setCryptoWithdrawAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Simulated Deposit Gateway Form States
  const [gatewayMode, setGatewayMode] = useState<'withdraw' | 'deposit'>('deposit');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositNetwork, setDepositNetwork] = useState<string>('TRC20 (Tron Network)');
  const [depositRefHash, setDepositRefHash] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);

  // Dynamic lists of supported networks by asset
  const getNetworkOptions = (asset: string): string[] => {
    switch (asset) {
      case 'USDT': return ['TRC20 (Tron Network)', 'BEP20 (BNB Smart Chain)', 'ERC20 (Ethereum)'];
      case 'BTC': return ['BTC (Bitcoin Native)', 'BEP20 (BNB Smart Chain)'];
      case 'ETH': return ['ERC20 (Ethereum)', 'BEP20 (BNB Smart Chain)'];
      case 'BNB': return ['BEP20 (BSC)', 'BEP2 (Legacy Beacon Chain)'];
      case 'SOL': return ['SOL (Solana Classic Network)', 'BEP20 (BSC)'];
      case 'ADA': return ['ADA (Cardano Shelley Node)'];
      default: return ['Mainnet Network'];
    }
  };

  // Dynamic fee calculation based on chosen asset & network
  const getWithdrawFee = (asset: string, network: string): { amount: number; symbol: string } => {
    if (asset === 'USDT') {
      if (network.includes('ERC20')) return { amount: 8.50, symbol: 'USDT' };
      if (network.includes('TRC20')) return { amount: 1.00, symbol: 'USDT' };
      if (network.includes('BEP20')) return { amount: 0.25, symbol: 'USDT' };
    }
    if (asset === 'BTC') {
      if (network.includes('BEP20')) return { amount: 0.00001, symbol: 'BTC' };
      return { amount: 0.0002, symbol: 'BTC' }; // Native
    }
    if (asset === 'ETH') {
      if (network.includes('BEP20')) return { amount: 0.00008, symbol: 'ETH' };
      return { amount: 0.0025, symbol: 'ETH' }; // Native
    }
    if (asset === 'BNB') {
      return { amount: 0.001, symbol: 'BNB' };
    }
    if (asset === 'SOL') {
      return { amount: 0.005, symbol: 'SOL' };
    }
    if (asset === 'ADA') {
      return { amount: 0.8, symbol: 'ADA' };
    }
    return { amount: 0.0, symbol: asset };
  };

  // Address structure verification rules
  const validateWithdrawAddress = (asset: string, network: string, address: string) => {
    if (!address) return { isValid: null, error: '' };
    
    if (network.includes('ERC20') || network.includes('BEP20') || network.includes('BSC')) {
      if (!address.startsWith('0x')) {
        return { isValid: false, error: "Ethereum/BSC address must start with '0x'" };
      }
      if (address.length !== 42) {
        return { isValid: false, error: `Address must be 42 characters (current: ${address.length})` };
      }
      return { isValid: true, error: '' };
    }
    
    if (network.includes('TRC20')) {
      if (!address.startsWith('T')) {
        return { isValid: false, error: "TRC20 address must start with 'T'" };
      }
      if (address.length !== 34) {
        return { isValid: false, error: `TRC20 address must be 34 characters (current: ${address.length})` };
      }
      return { isValid: true, error: '' };
    }
    
    if (asset === 'BTC' && !network.includes('BEP20')) {
      if (!address.startsWith('1') && !address.startsWith('3') && !address.startsWith('bc1')) {
        return { isValid: false, error: "BTC address must start with '1', '3', or 'bc1'" };
      }
      if (address.length < 26 || address.length > 62) {
        return { isValid: false, error: "Invalid length for BTC address" };
      }
      return { isValid: true, error: '' };
    }
    
    if (asset === 'SOL' && !network.includes('BEP20')) {
      if (address.length < 32 || address.length > 44) {
        return { isValid: false, error: "Solana address must be 32 to 44 characters" };
      }
      return { isValid: true, error: '' };
    }
    
    if (address.length < 8) {
      return { isValid: false, error: "Address is too brief" };
    }
    
    return { isValid: true, error: '' };
  };

  const handleWithdrawAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onWithdrawAsset) {
      alert('Withdrawal function is not available.');
      return;
    }

    const availableFree = wallet.find((w) => w.symbol === withdrawAsset)?.free || 0;
    const amountVal = parseFloat(cryptoWithdrawAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (withdrawAsset === 'USDT' && amountVal < 1.0) {
      alert('Withdrawal limit error: The minimum allowed withdrawal amount is $1.00 USDT.');
      return;
    }

    if (amountVal > availableFree) {
      alert(`Insufficient funds. Your available ${withdrawAsset} is ${availableFree.toLocaleString()}.`);
      return;
    }

    const validation = validateWithdrawAddress(withdrawAsset, withdrawNetwork, cryptoWithdrawAddress);
    if (validation.isValid === false) {
      alert(`Invalid address format: ${validation.error}`);
      return;
    }

    setIsWithdrawing(true);

    setTimeout(() => {
      setIsWithdrawing(false);
      
      const feeVal = amountVal * 0.09;
      const netAmountVal = amountVal - feeVal;

      // Hold the balance immediately by deducting it. If rejected, admin will credit back.
      if (onWithdrawAsset) {
        onWithdrawAsset(withdrawAsset, amountVal, `Pending withdrawal of ${amountVal} ${withdrawAsset} submitted for Admin approval.`);
      }

      // Add to transaction requests list
      const newTxReq = {
        id: `tx-req-${Math.random().toString(36).substring(2, 9)}`,
        username: currentUser?.username || 'user',
        type: 'withdrawal',
        asset: withdrawAsset,
        amount: amountVal,
        fee: feeVal,
        netAmount: netAmountVal,
        address: cryptoWithdrawAddress,
        network: withdrawNetwork,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
      };

      const txReqs = JSON.parse(localStorage.getItem('binance_transaction_requests') || '[]');
      txReqs.unshift(newTxReq);
      localStorage.setItem('binance_transaction_requests', JSON.stringify(txReqs));

      const siteLogs = JSON.parse(localStorage.getItem('binance_site_activities') || '[]');
      siteLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        actor: currentUser?.username || 'user',
        role: 'user',
        action: 'Cryptographic Withdrawal Filed',
        details: `Requested withdrawal of ${amountVal} ${withdrawAsset}. 9% Interest fee (${feeVal.toFixed(4)}) applied. Net output: ${netAmountVal.toFixed(4)}. Status: Pending Admin Approval.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
      });
      localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

      setCryptoWithdrawAddress('');
      setCryptoWithdrawAmount('');

      alert(`Withdrawal request submitted successfully! A 9% processing fee (${feeVal.toFixed(4)} ${withdrawAsset}) has been factored. The Senior Admin has been alerted to review and authorize the payout.`);
    }, 1500);
  };

  const handleDepositAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid positive deposit amount.');
      return;
    }

    if (!depositRefHash || depositRefHash.trim().length < 6) {
      alert('Please enter a valid TxHash or block reference ID (at least 6 characters).');
      return;
    }

    setIsDepositing(true);
    setTimeout(() => {
      setIsDepositing(false);

      const newTxReq = {
        id: `tx-req-${Math.random().toString(36).substring(2, 9)}`,
        username: currentUser?.username || 'user',
        type: 'deposit',
        asset: 'USDT',
        amount: amountVal,
        fee: 0,
        netAmount: amountVal,
        address: 'Direct Staking Pool Recipient',
        network: depositNetwork,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
        refHash: depositRefHash
      };

      const txReqs = JSON.parse(localStorage.getItem('binance_transaction_requests') || '[]');
      txReqs.unshift(newTxReq);
      localStorage.setItem('binance_transaction_requests', JSON.stringify(txReqs));

      const siteLogs = JSON.parse(localStorage.getItem('binance_site_activities') || '[]');
      siteLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        actor: currentUser?.username || 'user',
        role: 'user',
        action: 'USDT Deposit Filed',
        details: `Requested deposit allocation of ${amountVal} USDT. TxHash Reference: ${depositRefHash}. Status: Pending Admin Verification.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
      });
      localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

      setDepositAmount('');
      setDepositRefHash('');

      alert(`Deposit request of $${amountVal} USDT registered successfully! Status: Pending Senior Admin verification of TxHash: ${depositRefHash}. Once verified, your balance will be credited instantly.`);
    }, 1200);
  };

  const calculatePendingRefCommission = () => {
    try {
      const saved = localStorage.getItem('binance_user_referrals');
      if (saved) {
        const parsed = JSON.parse(saved);
        const pending = parsed
          .filter((r: any) => r.status === 'pending')
          .reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0);
        setPendingRefCommission(pending);
      } else {
        // Sarah (150) + Bruce (1000) = 1150 initial
        setPendingRefCommission(1150);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculatePendingRefCommission();
  }, [activeTab]);

  const openOrders = orders.filter((o) => o.status === 'open');
  const pastOrders = orders.filter((o) => o.status !== 'open');

  // Local state for Referrals & Investments
  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>(() => {
    const saved = localStorage.getItem('binance_active_investments');
    return saved ? JSON.parse(saved) : [];
  });

  const [referralsList, setReferralsList] = useState<Referral[]>(() => {
    const saved = localStorage.getItem('binance_user_referrals');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ref-1',
        name: 'Sarah Connor',
        email: 's.connor@cyberdyne.net',
        joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        investmentAmount: 1500,
        commissionEarned: 150
      },
      {
        id: 'ref-2',
        name: 'Bruce Wayne',
        email: 'bruce@wayne-enterprise.com',
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        investmentAmount: 10000,
        commissionEarned: 1000
      }
    ];
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<InvestmentPlan | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Modals form state
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseGate, setPurchaseGate] = useState<'internal' | 'external'>('internal');
  const [simulatedExternalPaymentConfirmed, setSimulatedExternalPaymentConfirmed] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'trc20' | 'bank'>('trc20');
  const [isWithdrawalProcessing, setIsWithdrawalProcessing] = useState(false);
  const [withdrawSuccessTx, setWithdrawSuccessTx] = useState<string | null>(null);

  // Referral Simulation state
  const [refFriendName, setRefFriendName] = useState('');
  const [refFriendAmount, setRefFriendAmount] = useState('');

  // Local state for Price Alert Builder Form
  const [alertCoinSymbol, setAlertCoinSymbol] = useState(activeSymbol);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [trendSymbol, setTrendSymbol] = useState(activeSymbol);

  // Auto-save referrals
  useEffect(() => {
    localStorage.setItem('binance_user_referrals', JSON.stringify(referralsList));
  }, [referralsList]);

  // Auto-save active investments
  useEffect(() => {
    localStorage.setItem('binance_active_investments', JSON.stringify(activeInvestments));
  }, [activeInvestments]);

  // Direct Live Ticking interest: accrues real-time dividends
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInvestments((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((inv) => {
          const dailyUsd = inv.yieldDailyUsd || (inv.depositAmount * (inv.yieldDaily / 100));
          const yieldPerSec = dailyUsd / (24 * 60 * 60);
          const elapsedSecs = (Date.now() - inv.lastUpdated) / 1000;
          const delta = yieldPerSec * Math.max(0, elapsedSecs);
          return {
            ...inv,
            accruedProfit: Number((inv.accruedProfit + delta).toFixed(6)),
            lastUpdated: Date.now()
          };
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeInvestments.length]);

  const handleCopyReferralUrl = () => {
    const referralUrl = `https://binance-papercore.com/join?ref=${currentUser?.username || 'member'}`;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Perform purchase confirmation
  const handleConfirmPurchasePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPurchaseModal) return;
    const amount = parseFloat(purchaseAmount);
    if (!amount || amount < showPurchaseModal.minDeposit || amount > showPurchaseModal.maxDeposit) {
      alert(`Please enter an amount of exactly $${showPurchaseModal.minDeposit.toLocaleString()} USDT.`);
      return;
    }

    const usdtBalance = wallet.find((w) => w.symbol === 'USDT')?.free || 0;

    // Direct Payment vs External QR Transfer code
    if (purchaseGate === 'internal') {
      if (usdtBalance < amount) {
        alert(`Insufficient USDT balance. You have $${usdtBalance.toLocaleString()} but need $${amount.toLocaleString()}. Use the USDT Faucet or Deposit Desk!`);
        return;
      }
      // Deduct balance
      if (onUpdateUsdtBalance) {
        onUpdateUsdtBalance(-amount, `Successfully paid $${amount.toLocaleString()} USDT for plan purchase request.`);
      }
    } else {
      if (!simulatedExternalPaymentConfirmed) {
        alert(`Please click the "Confirm Simulated External payment" button first to verify the TRC-20 blockchain transfer!`);
        return;
      }
    }

    // Instead of active directly, queue as PENDING INVESTMENT REQUEST for Senior Admin!
    const pendingReqId = `inv-req-${Math.random().toString(36).substring(2, 9)}`;
    const pendingReq = {
      id: pendingReqId,
      username: currentUser?.username || 'user',
      planId: showPurchaseModal.id,
      planName: showPurchaseModal.name,
      depositAmount: amount,
      yieldDaily: showPurchaseModal.yieldDaily,
      yieldDailyUsd: showPurchaseModal.yieldDailyUsd,
      durationDays: showPurchaseModal.durationDays,
      status: 'pending',
      timestamp: Date.now()
    };

    const storedReqsRaw = localStorage.getItem('binance_investment_requests');
    const investmentReqs = storedReqsRaw ? JSON.parse(storedReqsRaw) : [];
    investmentReqs.unshift(pendingReq);
    localStorage.setItem('binance_investment_requests', JSON.stringify(investmentReqs));

    // Log the user action
    const storedLogsRaw = localStorage.getItem('binance_site_activities');
    const siteLogs = storedLogsRaw ? JSON.parse(storedLogsRaw) : [];
    siteLogs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      actor: currentUser?.username || 'user',
      role: 'user',
      action: 'Plan Staking Purchase',
      details: `Purchased "${showPurchaseModal.name}" with $${amount} USDT. Sent to Senior Admin queue.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    });
    localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

    alert(`Plan purchased successfully! This investment has been submitted to the Senior Administrator. Once approved, it will begin generating daily dividends.`);
    
    setShowPurchaseModal(null);
    setPurchaseAmount('');
    setSimulatedExternalPaymentConfirmed(false);
  };

  // Claim dividends from active investment
  const handleClaimYield = (id: string) => {
    const target = activeInvestments.find((inv) => inv.id === id);
    if (!target || target.accruedProfit <= 0) return;

    const payout = target.accruedProfit;

    if (onUpdateUsdtBalance) {
      onUpdateUsdtBalance(payout, `Claimed +$${payout.toFixed(4)} USDT yield payouts direct into your wallet!`);
    }

    // Log user claim activity
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

    setActiveInvestments((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, accruedProfit: 0, lastUpdated: Date.now() } : inv
      )
    );
  };

  // Simulate fast-forwarding 24h
  const handleFastForwardYield = (id: string) => {
    setActiveInvestments((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const dailyUsd = inv.yieldDailyUsd || (inv.depositAmount * (inv.yieldDaily / 100));
        return {
          ...inv,
          timestamp: inv.timestamp - (24 * 60 * 60 * 1000), // Age the contract by 24 hours for progress calculation
          accruedProfit: Number((inv.accruedProfit + dailyUsd).toFixed(6)),
          lastUpdated: Date.now()
        };
      })
    );
    if (onUpdateUsdtBalance) {
      onUpdateUsdtBalance(0, 'Fast-forwarded 24-hours: dividends accumulated and contract aged.');
    }
  };

  // Perform Sell Investment/Execute Withdrawal portal
  const handleConfirmWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const usdtBalance = wallet.find((w) => w.symbol === 'USDT')?.free || 0;

    if (!amount || amount <= 0) {
      alert('Please specify a positive amount to withdraw.');
      return;
    }
    if (amount < 1.0) {
      alert('Withdrawal limit error: The minimum allowed withdrawal amount is $1.00 USD.');
      return;
    }
    if (amount > usdtBalance) {
      alert(`Insufficient available USDT balance. Maximum cashout available: $${usdtBalance.toLocaleString()} USDT.`);
      return;
    }

    setIsWithdrawalProcessing(true);
    setWithdrawSuccessTx(null);

    // Block balance and submit to administrator
    setTimeout(() => {
      if (onUpdateUsdtBalance) {
        onUpdateUsdtBalance(-amount, `Withdrawal request of $${amount.toLocaleString()} USDT submitted. Pending Admin approval.`);
      }

      const fee = amount * 0.09;
      const netAmount = amount - fee;

      const newTxReq = {
        id: `tx-req-${Math.random().toString(36).substring(2, 9)}`,
        username: currentUser?.username || 'user',
        type: 'withdrawal',
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
      };

      const txReqs = JSON.parse(localStorage.getItem('binance_transaction_requests') || '[]');
      txReqs.unshift(newTxReq);
      localStorage.setItem('binance_transaction_requests', JSON.stringify(txReqs));

      const siteLogs = JSON.parse(localStorage.getItem('binance_site_activities') || '[]');
      siteLogs.unshift({
        id: `log-${Math.random().toString(36).substring(2, 9)}`,
        actor: currentUser?.username || 'user',
        role: 'user',
        action: 'Withdrawal Filed',
        details: `Requested withdrawal of $${amount} USDT. 9% Fee ($${fee.toFixed(2)}) applied. Net: $${netAmount.toFixed(2)}. Status: Pending Admin Approval.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
      });
      localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

      setIsWithdrawalProcessing(false);
      setWithdrawSuccessTx(`tx-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`);
      setWithdrawAmount('');
      
      alert(`Withdrawal request of $${amount} USDT submitted successfully (9% processing fee applied). The Senior Administrator will process your transfer shortly.`);
    }, 1200);
  };

  // Close specific modals
  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawSuccessTx(null);
  };

  // Simulate a friend referral signing up
  const handleSimulateReferralAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refFriendName.trim() || !refFriendAmount) {
      alert('Please fill out friend name and investment package price first.');
      return;
    }
    const checkAmt = parseFloat(refFriendAmount);
    if (!checkAmt || checkAmt <= 0) {
      alert('Amount must be positive.');
      return;
    }

    const bonus = Number((checkAmt * 0.1).toFixed(2)); // 10%

    const mockEmail = `${refFriendName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const newRef: Referral = {
      id: `ref-${Math.random().toString(36).substring(2, 9)}`,
      name: refFriendName,
      email: mockEmail,
      joinedAt: new Date().toLocaleDateString(),
      investmentAmount: checkAmt,
      commissionEarned: bonus
    };

    setReferralsList((p) => [newRef, ...p]);

    if (onUpdateUsdtBalance) {
      onUpdateUsdtBalance(bonus, `🎉 Referral Bonus Secured! +$${bonus.toLocaleString()} USDT (10% of $${checkAmt.toLocaleString()}) credited to balance.`);
    }

    setRefFriendName('');
    setRefFriendAmount('');
  };

  // Synchronize alert coin selection and fill price if user shifts coin target
  useEffect(() => {
    setAlertCoinSymbol(activeSymbol);
    setTrendSymbol(activeSymbol);
    const tar = coins.find((c) => c.symbol === activeSymbol);
    if (tar) {
      setAlertTargetPrice(tar.price.toString());
    }
  }, [activeSymbol]);

  // Synchronize fill price specifically when dropdown item is clicked
  const handleAlertCoinSymbolChange = (sym: string) => {
    setAlertCoinSymbol(sym);
    const tar = coins.find((c) => c.symbol === sym);
    if (tar) {
      setAlertTargetPrice(tar.price.toString());
    }
  };

  // Calculates total portfolio value in USD on the fly
  const calculatePortfolioValue = () => {
    let totalUsd = 0;
    const items = wallet.map((asset) => {
      const coinRate = coins.find((c) => c.symbol === asset.symbol);
      const rate = asset.symbol === 'USDT' ? 1 : (coinRate?.price || 0);
      const totalAmount = asset.free + asset.locked;
      const usdValue = totalAmount * rate;
      totalUsd += usdValue;
      return {
        ...asset,
        usdValue,
        rate,
      };
    });

    return { totalUsd, items };
  };

  const { totalUsd, items: enrichedAssets } = calculatePortfolioValue();

  // Color mapping for horizontal asset stack visual rendering
  const assetColors: Record<string, string> = {
    USDT: '#0ecb81', // Green
    BTC: '#f0b90b',  // Yellow / Orange
    ETH: '#3b82f6',  // Blue
    BNB: '#eab308',  // Yellow
    SOL: '#8b5cf6',  // Purple
    ADA: '#64748b',  // Slate
  };

  const chartData = enrichedAssets
    .filter((asset) => asset.usdValue > 0)
    .map((asset) => ({
      name: asset.symbol,
      value: asset.usdValue,
      color: assetColors[asset.symbol] || '#94a3b8',
      free: asset.free + asset.locked,
      usdValStr: asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      percent: totalUsd > 0 ? (asset.usdValue / totalUsd) * 100 : 0,
    }));

  const handleFormSubmitAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const pr = parseFloat(alertTargetPrice);
    if (!pr || pr <= 0) return;
    onCreateAlert(alertCoinSymbol, pr, alertCondition);
  };

  const activeAlertsCount = alerts.filter(a => !a.isTriggered).length;

  return (
    <div id="portfolio-center-card" className="bg-[#161a1e] border-t border-[#2b3139] flex flex-col md:h-[320px] select-none text-[11px] font-medium font-sans">
      {/* Tab Panels Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#2b3139] px-4 py-2 bg-[#181d23] gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          <button
            id="portfolio-tab-open"
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'open'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            Open Orders ({openOrders.length})
          </button>
          <button
            id="portfolio-tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'history'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History size={13} />
            Order History ({pastOrders.length})
          </button>
          <button
            id="portfolio-tab-wallet"
            onClick={() => setActiveTab('wallet')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'wallet'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet size={13} />
            Mock Portfolio
          </button>
          <button
            id="portfolio-tab-distribution"
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'distribution'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PieIcon size={13} />
            Portfolio Distribution
          </button>
          <button
            id="portfolio-tab-trend"
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'trend'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            Price Trend
          </button>
          <button
            id="portfolio-tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'alerts'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell size={13} className={activeAlertsCount > 0 ? 'text-red-400 animate-pulse' : ''} />
            Price Alerts ({alerts.length})
          </button>
          <button
            id="portfolio-tab-invest"
            onClick={() => setActiveTab('invest')}
            className={`px-3.5 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(14,203,129,0.05)] hover:shadow-[0_0_12px_rgba(14,203,129,0.15)] ${
              activeTab === 'invest'
                ? 'bg-gradient-to-r from-emerald-950/20 to-[#2b3139] text-white font-extrabold border-b-2 border-[#0ecb81]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0ecb81]"></span>
              </span>
              <Briefcase size={14} className="text-[#0ecb81] stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-[#0ecb81] tracking-wide">Staking Investments ({activeInvestments.length})</span>
          </button>
          <button
            id="portfolio-tab-referrals"
            onClick={() => setActiveTab('referrals')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'referrals'
                ? 'bg-[#2b3139] text-white font-bold border-b-2 border-[#eab308]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BadgePercent size={13} className="text-[#eab308]" />
            Referrals (10% Bonus)
          </button>
          <button
            id="portfolio-tab-drive"
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-1.5 rounded text-xs cursor-pointer flex items-center gap-1 transition-all ${
              activeTab === 'drive'
                ? 'bg-[#2b3139] text-[#f0b90b] font-bold border-b-2 border-[#f0b90b]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cloud size={13} className="text-[#f0b90b]" />
            Google Drive Backup
          </button>
        </div>

        {/* Dynamic header summary statistics */}
        <div className="flex items-center gap-4 text-xs font-mono ml-auto">
          <span className="text-gray-400">
            Est. Total Portfolio:{' '}
            <span className="text-[#0ecb81] font-bold">
              ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <div className="flex-1 overflow-auto p-4">
        {/* OPEN ORDERS TAB */}
        {activeTab === 'open' && (
          <div className="w-full h-full min-h-[140px]">
            {openOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                <Layers className="opacity-20 mb-2" size={32} />
                <span>No active limit bookings pending fills.</span>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="text-gray-500 border-b border-[#2b3139] pb-2 font-semibold">
                    <th className="py-2">Date</th>
                    <th className="py-2">Pair</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Side</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2229]">
                  {openOrders.map((o) => (
                    <tr key={o.id} id={`open-order-${o.id}`} className="hover:bg-[#1e2329]/50 transition-all">
                      <td className="py-2.5 text-gray-400">{o.timestamp}</td>
                      <td className="py-2.5 font-bold text-gray-200">{o.symbol}/USDT</td>
                      <td className="py-2.5 uppercase text-yellow-500">{o.type}</td>
                      <td className={`py-2.5 uppercase font-bold ${o.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {o.side}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-100">
                        ${o.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right text-gray-350">{o.amount.toFixed(4)}</td>
                      <td className="py-2.5 text-right text-gray-100">${o.total.toFixed(2)}</td>
                      <td className="py-2 text-center text-gray-100">
                        <button
                          id={`cancel-order-${o.id}`}
                          onClick={() => onCancelOrder(o.id)}
                          className="hover:bg-[#f6465d]/25 text-gray-400 hover:text-[#f6465d] p-1.5 rounded cursor-pointer transition-colors"
                          title="Cancel Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ORDER HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="w-full h-full min-h-[140px]">
            {pastOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                <History className="opacity-20 mb-2" size={32} />
                <span>Transaction list is vacant. Make a trade to see results!</span>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="text-gray-500 border-b border-[#2b3139] pb-2 font-semibold">
                    <th className="py-2">Date</th>
                    <th className="py-2">Pair</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Side</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Filled</th>
                    <th className="py-2 text-right font-bold">Total</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2229]">
                  {pastOrders.map((o) => (
                    <tr key={o.id} id={`history-order-${o.id}`} className="hover:bg-[#1e2329]/50 transition-all text-gray-300">
                      <td className="py-2 text-gray-500">{o.timestamp}</td>
                      <td className="py-2 font-bold text-gray-200">{o.symbol}/USDT</td>
                      <td className="py-2 uppercase text-gray-400">{o.type}</td>
                      <td className={`py-2 uppercase font-bold ${o.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {o.side}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-200">
                        ${o.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right">{o.amount.toFixed(4)}</td>
                      <td className="py-2 text-right font-bold text-gray-100">${o.total.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            o.status === 'filled'
                              ? 'bg-[#0ecb81]/15 text-[#0ecb81]'
                              : 'bg-red-500/15 text-[#f6465d]'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PORTFOLIO WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="flex flex-col gap-4">
            {/* Visual stacked distribution line chart */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Asset Allocation Breakdown</span>
              <div className="w-full h-3 rounded bg-gray-800 overflow-hidden flex">
                {enrichedAssets.map((asset) => {
                  const percent = totalUsd > 0 ? (asset.usdValue / totalUsd) * 100 : 0;
                  if (percent <= 0) return null;
                  return (
                    <div
                      key={`stack-${asset.symbol}`}
                      className="h-full relative group transition-all hover:scale-y-110"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: assetColors[asset.symbol] || '#94a3b8',
                      }}
                      title={`${asset.symbol}: ${percent.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Color legends */}
              <div className="flex flex-wrap gap-x-4 gap-y-2.5 mt-1 font-mono text-[10px]">
                {enrichedAssets.map((asset) => {
                  const percent = totalUsd > 0 ? (asset.usdValue / totalUsd) * 100 : 0;
                  return (
                    <div key={`legend-${asset.symbol}`} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: assetColors[asset.symbol] || '#94a3b8' }}
                      />
                      <span className="font-bold text-gray-200">{asset.symbol}</span>
                      <span className="text-gray-560">
                        {percent.toFixed(1)}% (${Math.round(asset.usdValue).toLocaleString()})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset balances Table detail list */}
            <div className="border border-[#2b3139] rounded overflow-hidden mt-2">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="bg-[#181d23] text-gray-500 text-[10px] font-semibold border-b border-[#2b3139]">
                    <th className="py-2 pl-3">Coin</th>
                    <th className="py-2 text-right">Available Balance</th>
                    <th className="py-2 text-right">Locked In Orders</th>
                    <th className="py-2 text-right pr-3">Estimated USD Worth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2229]">
                  {enrichedAssets.map((asset) => (
                    <tr key={`item-${asset.symbol}`} className="text-gray-200">
                      <td className="py-2 pl-3 font-bold flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: assetColors[asset.symbol] || '#94a3b8' }}
                        />
                        {asset.symbol} <span className="text-[9px] text-gray-500 font-normal">{asset.name}</span>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {asset.free.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="py-2 text-right text-gray-500">
                        {asset.locked > 0 ? asset.locked.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '-'}
                      </td>
                      <td className="py-2 text-right pr-3 font-bold text-[#0ecb81]">
                        ${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Asset Performance Summary Table */}
            {(() => {
              const startingQtyMap: Record<string, number> = {
                BTC: 0.125,
                ETH: 1.85,
                BNB: 4.20,
                SOL: 15.0,
                ADA: 320.0,
                USDT: 24500.0,
              };

              // Use performanceData from App.tsx polling if available, otherwise compute a fallback
              const assetPerformance = performanceData?.assetPerformanceList || wallet.map((asset) => {
                const coin = coins.find((c) => c.symbol === asset.symbol);
                const currentPrice = asset.symbol === 'USDT' ? 1.0 : (coin?.price || 0);
                const change24h = asset.symbol === 'USDT' ? 0.0 : (coin?.change24h || 0);
                
                const initQty = startingQtyMap[asset.symbol] || 0;
                const initPrice = DEFAULT_ENTRY_PRICES[asset.symbol] || currentPrice;
                
                // Find all filled buy orders for this asset
                const filledBuys = orders.filter(
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

              // Calculate overall totals
              const overallPnL = performanceData?.unrealizedPnL ?? assetPerformance
                .filter(a => a.symbol !== 'USDT')
                .reduce((sum, a) => sum + a.unrealizedPnL, 0);

              const overallPnLPercent = performanceData?.unrealizedPnLPercent ?? 0;
              const isProfitTotal = overallPnL > 0;
              const isLossTotal = overallPnL < 0;
              const totalPnlColor = isProfitTotal ? 'text-[#0ecb81]' : isLossTotal ? 'text-[#f6465d]' : 'text-gray-400';
              const lastUpdated = performanceData?.lastUpdated ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div className="mt-4 flex flex-col gap-2">
                  {/* Total PnL & Polling Countdown Status Panel */}
                  <div className="bg-[#1b1f24] border border-[#2b3139] rounded px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider font-sans">
                        Total Unrealized PnL:
                      </span>
                      <strong className={`font-mono text-xs font-black ${totalPnlColor}`}>
                        {isProfitTotal ? '+' : ''}${overallPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {overallPnL !== 0 && (
                          <span className="text-[9.5px] ml-1.5 font-bold opacity-90">
                            ({isProfitTotal ? '+' : ''}{overallPnLPercent.toFixed(2)}%)
                          </span>
                        )}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-500 font-mono text-[9px] self-end sm:self-auto shrink-0">
                      <span className="flex items-center gap-1 font-semibold text-gray-450">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/90 animate-ping inline-block" />
                        Polling ref in <strong className="text-[#eab308] font-bold">{performanceCountdown ?? 10}s</strong>
                      </span>
                      <span className="text-gray-600">|</span>
                      <span>Last: {lastUpdated}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <TrendingUp size={12} className="text-[#0ecb81]" /> Asset Performance History & Unrealized PnL
                  </span>
                  <div className="border border-[#2b3139] rounded overflow-hidden">
                    <table className="w-full text-left font-mono">
                      <thead>
                        <tr className="bg-[#181d23] text-gray-500 text-[10px] font-semibold border-b border-[#2b3139]">
                          <th className="py-2 pl-3">Asset</th>
                          <th className="py-2 text-right">Current Price</th>
                          <th className="py-2 text-right">Avg Entry Price</th>
                          <th className="py-2 text-right">24h Change</th>
                          <th className="py-2 text-right pr-3">Unrealized PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2229]">
                        {assetPerformance.map((asset) => {
                          const isProfit = asset.unrealizedPnL > 0;
                          const isLoss = asset.unrealizedPnL < 0;
                          const isCoinNeutral = asset.symbol === 'USDT';
                          
                          const pnlColorClass = isCoinNeutral 
                            ? 'text-gray-400' 
                            : isProfit 
                              ? 'text-[#0ecb81]' 
                              : isLoss 
                                ? 'text-[#f6465d]' 
                                : 'text-gray-400';
                                
                          const changeColorClass = asset.change24h > 0 
                            ? 'text-[#0ecb81]' 
                            : asset.change24h < 0 
                              ? 'text-[#f6465d]' 
                              : 'text-gray-400';

                          return (
                            <tr key={`perf-${asset.symbol}`} className="text-gray-200">
                              <td className="py-2 pl-3 font-bold flex items-center gap-2">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: assetColors[asset.symbol] || '#94a3b8' }}
                                />
                                {asset.symbol} <span className="text-[9px] text-gray-500 font-normal">{asset.name}</span>
                              </td>
                              <td className="py-2 text-right font-medium text-gray-150">
                                ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: asset.symbol === 'ADA' ? 4 : 2, maximumFractionDigits: asset.symbol === 'ADA' ? 4 : 2 })}
                              </td>
                              <td className="py-2 text-right text-gray-300 font-medium">
                                ${asset.avgEntryPrice.toLocaleString(undefined, { minimumFractionDigits: asset.symbol === 'ADA' ? 4 : 2, maximumFractionDigits: asset.symbol === 'ADA' ? 4 : 2 })}
                              </td>
                              <td className={`py-2 text-right font-semibold ${changeColorClass}`}>
                                {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                              </td>
                              <td className={`py-2 text-right pr-3 font-bold ${pnlColorClass}`}>
                                {!isCoinNeutral && (isProfit ? '+' : '')}
                                ${asset.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {!isCoinNeutral && (
                                  <span className="text-[9px] font-medium ml-1.5 opacity-85">
                                    ({isProfit ? '+' : ''}{asset.unrealizedPnLPercent.toFixed(2)}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Secure Asset Dual Gateway (Deposits/Withdrawals) */}
            <div className="bg-[#181d23]/80 border border-[#2b3139] rounded-lg p-3.5 mt-3 flex flex-col gap-3 font-sans animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 border-b border-[#2b3139]/65 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] text-[#f0b90b] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="stroke-[2.5]" />
                    Dual Sandbox Treasury Routing Gateway
                  </span>
                  <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Secured Sandbox Node
                  </span>
                </div>
                
                {/* Segments switch */}
                <div className="flex bg-[#12161a] p-0.5 rounded border border-[#2b3139] self-start sm:self-auto shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setGatewayMode('deposit')}
                    className={`px-3 py-1 rounded text-[9.5px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      gatewayMode === 'deposit' 
                        ? 'bg-[#f0b90b] text-black font-extrabold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    USDT Deposit Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => setGatewayMode('withdraw')}
                    className={`px-3 py-1 rounded text-[9.5px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      gatewayMode === 'withdraw' 
                        ? 'bg-[#f0b90b] text-black font-extrabold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Crypto Withdrawal Desk
                  </button>
                </div>
              </div>

              {gatewayMode === 'withdraw' ? (
                <form onSubmit={handleWithdrawAssetSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                  {/* Left Side: Select Currency, Network, Dest Address */}
                  <div className="md:col-span-8 flex flex-col gap-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Choose Asset */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] text-gray-400 font-extrabold uppercase animate-pulse">1. Select Asset Currency</label>
                        <select
                          value={withdrawAsset}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWithdrawAsset(val);
                            setWithdrawNetwork(getNetworkOptions(val)[0]);
                          }}
                          className="bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] font-bold text-white focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                        >
                          {wallet.map((w) => (
                            <option key={`with-opt-${w.symbol}`} value={w.symbol}>
                              {w.symbol} ({w.name} - Avail: {w.free.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Choose Network */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] text-gray-400 font-extrabold uppercase">2. Choose Network Protocol</label>
                        <select
                          value={withdrawNetwork}
                          onChange={(e) => setWithdrawNetwork(e.target.value)}
                          className="bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] font-bold text-white focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                        >
                          {getNetworkOptions(withdrawAsset).map((net) => (
                            <option key={`net-opt-${net}`} value={net}>
                              {net}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Destination Wallet address */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-extrabold uppercase flex justify-between items-center">
                        <span>3. Target Address Coordinator</span>
                        {cryptoWithdrawAddress && (() => {
                          const v = validateWithdrawAddress(withdrawAsset, withdrawNetwork, cryptoWithdrawAddress);
                          return v.isValid === true ? (
                            <span className="text-[#0ecb81] font-mono text-[8.5px] font-bold uppercase font-black">✓ Validated Address Structure</span>
                          ) : v.isValid === false ? (
                            <span className="text-[#f6465d] font-mono text-[8.5px] font-bold uppercase">{v.error}</span>
                          ) : null;
                        })()}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={`Paste standard ${withdrawAsset} ${withdrawNetwork.split(' ')[0]} external destination address`}
                        value={cryptoWithdrawAddress}
                        onChange={(e) => setCryptoWithdrawAddress(e.target.value)}
                        className={`bg-[#12161a] border ${
                          cryptoWithdrawAddress 
                            ? validateWithdrawAddress(withdrawAsset, withdrawNetwork, cryptoWithdrawAddress).isValid === false 
                              ? 'border-[#f6465d]/50 focus:border-[#f6465d]' 
                              : 'border-[#0ecb81]/40 focus:border-[#0ecb81]' 
                            : 'border-[#2b3139] focus:border-[#f0b90b]'
                        } px-2.5 py-1.5 rounded font-mono text-[11px] font-bold text-white focus:outline-none placeholder-gray-650`}
                      />
                    </div>
                  </div>

                  {/* Right Side: Amount and Final processing button */}
                  <div className="md:col-span-4 flex flex-col gap-2.5 self-stretch justify-between">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-extrabold uppercase flex justify-between">
                        <span>4. Withdrawal Amount</span>
                        <button
                          type="button"
                          onClick={() => {
                            const free = wallet.find((w) => w.symbol === withdrawAsset)?.free || 0;
                            setCryptoWithdrawAmount(free.toString());
                          }}
                          className="text-[#eab308] hover:underline hover:text-yellow-400 cursor-pointer font-bold text-[8.5px] uppercase"
                        >
                          Withdraw Max
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          step="any"
                          min="0"
                          placeholder="0.00"
                          value={cryptoWithdrawAmount}
                          onChange={(e) => setCryptoWithdrawAmount(e.target.value)}
                          className="w-full bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] font-extrabold text-[#f1f5f9] placeholder-gray-600 focus:outline-none focus:border-[#f0b90b] pr-12 text-right"
                        />
                        <span className="absolute right-3 top-1.5 pt-0.5 font-bold font-mono text-gray-500 text-[9.5px]">
                          {withdrawAsset}
                        </span>
                      </div>
                    </div>

                    {/* Summary fee indicators */}
                    <div className="bg-[#12161a] border border-[#2b3139]/80 rounded px-2.5 py-2 flex flex-col gap-1 text-[9px] font-mono">
                      <div className="flex justify-between items-center text-gray-500 text-[8.5px]">
                        <span>Staking Exit Interest (Fee):</span>
                        <span className="font-extrabold text-red-400">9% Flat Deduction Amount</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500 text-[8.5px]">
                        <span>Calculated Exit Fee:</span>
                        <span className="font-bold text-gray-300">
                          {((parseFloat(cryptoWithdrawAmount) || 0) * 0.09).toFixed(4)} {withdrawAsset}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#2b3139]/50 pt-1 text-gray-300 font-bold">
                        <span>Net Standard Output:</span>
                        <span className="font-extrabold text-[#0ecb81]">
                          {(() => {
                            const amt = parseFloat(cryptoWithdrawAmount) || 0;
                            const result = Math.max(0, amt * 0.91);
                            return `${result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${withdrawAsset}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isWithdrawing || !cryptoWithdrawAddress || !cryptoWithdrawAmount || parseFloat(cryptoWithdrawAmount) <= 0}
                      className={`w-full py-1.5 px-3 rounded text-[10.5px] font-black cursor-pointer select-none transition-all flex items-center justify-center gap-1.5 ${
                        isWithdrawing
                          ? 'bg-[#2b3139] text-gray-500 cursor-not-allowed'
                          : (!cryptoWithdrawAddress || !cryptoWithdrawAmount || parseFloat(cryptoWithdrawAmount) <= 0)
                            ? 'bg-[#21262d] text-gray-500 border border-[#30363d]'
                            : 'bg-[#f0b90b] hover:bg-yellow-500 text-black font-black hover:shadow-[0_0_12px_rgba(240,185,11,0.25)]'
                      }`}
                    >
                      {isWithdrawing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} className="stroke-[2.5]" />
                          Submit Withdrawal to Admin
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Simulated Deposit Filing Form */
                <form onSubmit={handleDepositAssetSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                  <div className="md:col-span-8 flex flex-col gap-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Token */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] text-gray-400 font-extrabold uppercase">1. Deposit Asset Token</label>
                        <select
                          disabled
                          className="bg-[#12161a] border border-[#2b3139]/80 px-2.5 py-1.5 rounded font-mono text-[11px] font-bold text-gray-400"
                        >
                          <option value="USDT">USDT (Tether USD Stability Pool)</option>
                        </select>
                      </div>

                      {/* Network */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] text-gray-400 font-extrabold uppercase">2. Staking Network protocol</label>
                        <select
                          value={depositNetwork}
                          onChange={(e) => setDepositNetwork(e.target.value)}
                          className="bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] font-bold text-white focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                        >
                          <option value="TRC20 (Tron Network)">TRC20 (Tron Network High Speed)</option>
                          <option value="ERC20 (Ethereum Layer-1)">ERC20 (Ethereum High Fee)</option>
                          <option value="BSC BEP20 (BNB Smart Chain)">BSC BEP20 (BNB Smart Chain)</option>
                        </select>
                      </div>
                    </div>

                    {/* TxHash input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-extrabold uppercase flex justify-between">
                        <span>3. Payment Transaction Hash (TxHash Reference)</span>
                        <span className="text-gray-500 text-[8px] font-mono">Simulate standard blockchain payment first</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0xef7a72a94f6bd488a0b023f0ec9ce93b96c9f28da31ac0f730ff"
                        value={depositRefHash}
                        onChange={(e) => setDepositRefHash(e.target.value)}
                        className="bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] text-white focus:outline-none focus:border-[#f0b90b] placeholder-gray-650"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-2.5 self-stretch justify-between">
                    <div>
                      <label className="text-[9.5px] text-gray-400 font-extrabold uppercase block mb-1">
                        4. Amount (USD Value)
                      </label>
                      <input
                        type="number"
                        required
                        step="any"
                        min="1"
                        placeholder="Min: $10 USDT"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-[11px] font-extrabold text-[#f1f5f9] placeholder-gray-600 focus:outline-none focus:border-[#f0b90b] text-right"
                      />
                    </div>

                    {/* Notice Block */}
                    <div className="bg-[#12161a] border border-[#2b3139]/80 rounded p-2 flex flex-col gap-0.5 text-[8.5px] font-mono text-gray-400 leading-normal">
                      <p>✓ Minimum deposit size: $10.00 USDT</p>
                      <p>⚠️ Funds will hold pending senior administrator cryptographic txhash check.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isDepositing || !depositAmount || !depositRefHash}
                      className={`w-full py-1.5 px-3 rounded text-[10.5px] font-black cursor-pointer select-none transition-all flex items-center justify-center gap-1.5 ${
                        isDepositing
                          ? 'bg-[#2b3139] text-gray-500 cursor-not-allowed'
                          : (!depositAmount || !depositRefHash)
                            ? 'bg-[#21262d] text-gray-500 border border-[#30363d]'
                            : 'bg-[#0ecb81] hover:bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(14,203,129,0.15)]'
                      }`}
                    >
                      {isDepositing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-1" />
                          Registering Payment...
                        </>
                      ) : (
                        <>
                          <Landmark size={13} className="stroke-[2.5]" />
                          Claim Deposit Credit / Verify
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Pending Referral Balance summary box */}
            <div className="bg-[#eab308]/5 border border-[#eab308]/20 rounded-lg p-3.5 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 font-sans">
              <div className="flex gap-2.5 items-start">
                <div className="bg-[#eab308]/15 text-[#eab308] p-2 rounded-lg shrink-0">
                  <BadgePercent size={18} />
                </div>
                <div>
                  <h4 className="text-gray-150 font-black text-xs uppercase tracking-wide">
                    Pending Referral Balance
                  </h4>
                  <p className="text-gray-400 text-[10.5px] mt-0.5 leading-relaxed">
                    Earned via your exclusive 10% ambassador commission link. Ready to settle and credit directly into your live USDT trading funds at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#2b3139]/40 mt-1 sm:mt-0 font-mono">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-0.5">Accrued Bonus</span>
                  <span className="text-base font-black text-[#eab308]">${pendingRefCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab('referrals');
                  }}
                  className="bg-[#eab308] hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-[11px] font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  Manage & Claim
                  <ArrowUpRight size={13} className="stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Standard User Approvals Center */}
            <div className="bg-[#181d23]/40 border border-[#2b3139] rounded-lg p-3.5 mt-2.5 font-sans">
              <div className="flex justify-between items-center border-b border-[#2b3139]/65 pb-2 mb-2">
                <span className="text-[10.5px] text-gray-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={14} className="text-[#f0b90b]" />
                  Your Sandbox Treasury Approvals Desk (.env simulation)
                </span>
                <span className="text-[8px] text-[#f0b90b] font-mono border border-[#f0b90b]/20 bg-[#f0b90b]/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Pending Admin Audits
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                {/* Left: Pending Deposits & Withdrawals requests */}
                <div className="bg-[#12161a]/60 border border-[#1e2229] p-3 rounded">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-2">Treasury Operations (Deposits/Withdrawals)</span>
                  {(() => {
                    const reqs = JSON.parse(localStorage.getItem('binance_transaction_requests') || '[]')
                      .filter((r: any) => r.username === currentUser?.username);
                    if (reqs.length === 0) {
                      return <p className="text-[10px] text-gray-500 italic py-2">No pending deposit or withdrawal requests.</p>;
                    }
                    return (
                      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {reqs.map((r: any) => (
                          <div key={r.id} className="bg-[#181d23]/80 border border-[#2b3139]/60 p-2 rounded flex justify-between items-center text-[10px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-200 capitalize">{r.type}</span>
                              <span className="text-[8px] text-gray-500">{r.timestamp}</span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="font-extrabold text-white">${r.amount.toLocaleString()} USDT</span>
                                {r.type === 'withdrawal' && (
                                  <span className="text-[8px] text-gray-550 block">Net: ${(r.amount * 0.91).toFixed(2)} (-9% Interest)</span>
                                )}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                                r.status === 'approved' ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-red-500/15 text-red-500'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Pending Investment subscription requests */}
                <div className="bg-[#12161a]/60 border border-[#1e2229] p-3 rounded">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-2">Investment Plans Awaiting Admin Approval</span>
                  {(() => {
                    const reqs = JSON.parse(localStorage.getItem('binance_investment_requests') || '[]')
                      .filter((r: any) => r.username === currentUser?.username);
                    if (reqs.length === 0) {
                      return <p className="text-[10px] text-gray-500 italic py-2">No pending contract activations.</p>;
                    }
                    return (
                      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {reqs.map((r: any) => (
                          <div key={r.id} className="bg-[#181d23]/80 border border-[#2b3139]/60 p-2 rounded flex justify-between items-center text-[10px]">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-200">{r.planName}</span>
                              <span className="text-[8px] text-gray-500 block">Staked Amount: ${r.depositAmount} USDT</span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="font-bold text-[#ecb417] block">Pending Admin Approval</span>
                                <span className="text-[8px] text-gray-500 block">Term: {r.durationDays}d (+${r.yieldDailyUsd}/d)</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400 animate-pulse' :
                                r.status === 'approved' ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-red-500/15 text-red-500'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO DISTRIBUTION TAB */}
        {activeTab === 'distribution' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full min-h-[160px] items-stretch">
            {/* Left Column: Recharts Pie Chart representation */}
            <div className="md:col-span-12 lg:col-span-5 bg-[#181d23]/60 rounded p-3 border border-[#2b3139] flex flex-col justify-center items-center relative min-h-[160px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider absolute top-3 left-3 flex items-center gap-1.5 font-mono">
                <PieIcon size={12} className="text-[#f0b90b]" /> Asset Ratios
              </span>

              {/* Pie/Donut Chart Container */}
              <div className="relative w-full h-[140px] flex items-center justify-center mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#161a1e" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Total Portfolio Balance */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-mono font-semibold">Total</span>
                  <span className="text-[11px] font-black text-[#0ecb81] font-mono">
                    ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Allocation progress and metric cards */}
            <div className="md:col-span-12 lg:col-span-7 flex flex-col gap-1.5 overflow-y-auto max-h-[190px]">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 h-full py-6">
                  <PieIcon className="opacity-15 mb-1 text-gray-500" size={32} />
                  <span>No assets to distribute. Add mock funds first.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pr-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono px-1">Holdings Allocation</span>
                  {chartData.map((asset) => (
                    <div
                      key={`dist-row-${asset.name}`}
                      className="bg-[#12161a]/60 border border-[#2b3139] hover:border-gray-700/60 transition-all rounded p-2 flex items-center justify-between gap-3 text-[11px] font-mono"
                    >
                      {/* Asset Indicator & Name */}
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: asset.color }} />
                        <div className="flex flex-col">
                          <span className="font-bold text-white leading-none">{asset.name}</span>
                          <span className="text-[9px] text-gray-500 mt-0.5">{asset.free.toLocaleString(undefined, { maximumFractionDigits: 4 })} available</span>
                        </div>
                      </div>

                      {/* Percent Bar & Value */}
                      <div className="flex items-center gap-3 text-right">
                        {/* Custom visual mini progress bar */}
                        <div className="hidden sm:flex flex-col gap-1 w-16 font-sans">
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${asset.percent}%`, backgroundColor: asset.color }} />
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="font-bold text-white">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] font-bold" style={{ color: asset.color }}>{asset.percent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRICE TREND HISTORICAL PERFORMANCE TAB */}
        {activeTab === 'trend' && (() => {
          const selectedCoin = coins.find((c) => c.symbol === trendSymbol) || coins[0] || { symbol: 'BTC', name: 'Bitcoin', price: 65000, change24h: 2.5 };
          const historicalData = generateHistoricalData(selectedCoin.symbol, selectedCoin.price, selectedCoin.change24h);
          const prices = historicalData.map(d => d.price);
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;
          
          // Use assetColors map or fall back to high-fidelity gold
          const coinColor = assetColors[selectedCoin.symbol] || '#f0b90b';
          const isPositive = selectedCoin.change24h >= 0;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[190px] items-stretch">
              {/* Sidebar Left: Coin Selector & Analytics */}
              <div className="lg:col-span-4 bg-[#181d23]/50 border border-[#2b3139] rounded p-3 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[#f0b90b] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <TrendingUp size={12} /> Live Market Intelligence
                  </span>

                  {/* Coin Dropdown Selector */}
                  <div className="flex flex-col gap-1 mt-1">
                    <label htmlFor="trend-coin-symbol-select" className="text-[9px] text-gray-500 font-bold uppercase">Compare Asset</label>
                    <select
                      id="trend-coin-symbol-select"
                      value={trendSymbol}
                      onChange={(e) => setTrendSymbol(e.target.value)}
                      className="bg-[#12161a] text-gray-100 border border-[#2b3139] px-2 py-1.5 rounded text-xs font-mono font-bold focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                    >
                      {coins.map((c) => (
                        <option key={`trend-opt-${c.symbol}`} value={c.symbol}>
                          {c.name} ({c.symbol}/USDT)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 30-Day Quick statistics metrics */}
                <div className="flex flex-col gap-1.5 border-t border-[#2b3139] pt-2 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Current Price:</span>
                    <span className="text-white font-extrabold">${selectedCoin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>24h Change:</span>
                    <span className={`font-bold ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {isPositive ? '+' : ''}{selectedCoin.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 border-t border-[#2b3139]/40 pt-1.5 mt-0.5">
                    <span>30D Local Low:</span>
                    <span className="text-gray-300">${minPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>30D Local High:</span>
                    <span className="text-gray-300">${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Chart Right: Recharts Gradient Area Performance representation */}
              <div className="lg:col-span-8 bg-[#181d23]/30 rounded border border-[#2b3139] p-2 flex flex-col justify-between relative min-h-[170px]">
                <div className="flex justify-between items-center mb-1 px-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    {selectedCoin.name} ({selectedCoin.symbol}) 30-Day History
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">
                    End-of-day UTC values
                  </span>
                </div>

                <div className="w-full h-[145px] mt-1 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`trendGrad-${selectedCoin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={coinColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={coinColor} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" opacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#4b5563"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke="#4b5563"
                        fontSize={8}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: v > 1000 ? 0 : 1 })}`}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={coinColor}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#trendGrad-${selectedCoin.symbol})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

        {/* DIRECT INVESTMENTS TAB PANEL */}
        {activeTab === 'invest' && (
          <div className="flex flex-col gap-4 font-sans text-xs">
            <div className="flex justify-between items-center bg-[#1e2329]/30 rounded p-2 border border-[#2b3139]">
              <div>
                <h3 className="text-gray-100 font-bold text-sm flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#0ecb81]" /> Premium Investment Packages
                </h3>
                <p className="text-gray-400 text-[11px] mt-0.5">Staking and lockup cycles backed by custom liquidity reserves.</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-[#f6465d]/10 border border-[#f6465d]/35 hover:bg-[#f6465d]/20 text-[#f6465d] px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <ArrowDownLeft size={13} />
                Withdraw Portfolio Funds (Sell Icon)
              </button>
            </div>

            {/* List packages with high-conversion layouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INVESTMENT_PLANS.map((plan) => {
                const usdtAsset = wallet.find((w) => w.symbol === 'USDT');
                const usdtVal = usdtAsset ? usdtAsset.free : 0;
                
                // Deterministic capacity based on plan details to make it highly engaging and realistic
                const baseWeight = plan.minDeposit === 10 ? 84 : 
                                   plan.minDeposit === 20 ? 91 :
                                   plan.minDeposit === 30 ? 67 :
                                   plan.minDeposit === 50 ? 78 :
                                   plan.minDeposit === 100 ? 93 : 52;
                
                return (
                  <div
                    key={plan.id}
                    className="bg-[#181d23]/55 border border-[#2b3139] hover:border-[#f0b90b]/50 rounded p-3.5 flex flex-col justify-between gap-3 relative transition-all group duration-300 shadow-md hover:shadow-[#f0b90b]/5"
                  >
                    {/* Badge */}
                    <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${plan.badgeBg} ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#f0b90b] flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-pulse" />
                        Guaranteed Yield Plan
                      </span>
                      <h4 className="text-gray-150 text-sm font-black mt-1 group-hover:text-white transition-colors">{plan.name}</h4>
                      <p className="text-gray-400 text-[10.5px] mt-1.5 line-clamp-2 leading-relaxed shrink-0">
                        {plan.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-3.5 p-2 bg-[#12161a]/60 rounded-sm font-mono border border-[#1e2229]">
                        <div>
                          <span className="text-[9px] text-[#848e9c]">Daily Yield:</span>
                          <p className="text-sm font-black text-[#0ecb81]">+{plan.yieldDaily}%</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#848e9c]">Term:</span>
                          <p className="text-sm font-bold text-gray-200">{plan.durationDays} Days</p>
                        </div>
                        <div className="col-span-2 border-t border-[#1e2229] pt-1.5 mt-0.5">
                          <span className="text-[9px] text-[#848e9c] block">Allocation Value:</span>
                          <p className="text-[10.5px] text-gray-250 font-black">
                            ${plan.minDeposit.toLocaleString()} USDT Fixed
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Remaining Capacity Progress Bar */}
                      <div className="mt-3.5 pt-1 border-t border-[#2b3139]/30">
                        <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                          <span className="text-gray-500 font-bold">Staking Pool Capacity</span>
                          <span className="text-[#f0b90b] font-extrabold">{baseWeight}% Sold Out</span>
                        </div>
                        <div className="w-full bg-[#12161a] h-1.5 rounded-full overflow-hidden border border-[#2b3139]/30 p-[1px]">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-[#f0b90b] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${baseWeight}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono mt-1 text-gray-550">
                          <span>Remaining Vol: {((100 - baseWeight) * (plan.minDeposit / 5)).toFixed(1)} USDT</span>
                          <span className="text-[#0ecb81] font-bold">✓ Active Pool Staker</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 mt-1.5">
                      <button
                        onClick={() => {
                          setShowPurchaseModal(plan);
                          setPurchaseAmount(plan.minDeposit.toString());
                        }}
                        className="w-full bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30 hover:bg-[#0ecb81] hover:text-black py-1.5 px-3 rounded text-[11px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                      >
                        <ArrowUpRight size={13} className="stroke-[3]" />
                        Stake & Allocate ${plan.minDeposit} USDT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Subscriptions / Yield tracking */}
            <div className="bg-[#12161a]/30 border border-[#2b3139] rounded p-3 mt-1.5">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1 font-mono">
                  <ShieldCheck size={12} className="text-[#0ecb81]" /> Active Liquid Positions ({activeInvestments.length})
                </span>
                <span className="text-[9px] text-gray-500 italic">
                  *Accumulates returns in real-time. Use Fast-Forward simulator to skip time.
                </span>
              </div>

              {activeInvestments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-6 text-center">
                  <Landmark size={24} className="opacity-15 mb-2" />
                  <p className="text-[11px] font-medium">You do not have any active investment packages.</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Click "Buy Plan" above to start earning daily high yields.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[180px] pr-1.5 font-mono">
                  {activeInvestments
                    .filter((inv) => inv.username === currentUser?.username)
                    .map((inv) => {
                      const daysActive = ((Date.now() - inv.timestamp) / (1000 * 60 * 60 * 24)).toFixed(3);
                      
                      const totalMs = inv.durationDays * 24 * 60 * 60 * 1000;
                      const elapsedMs = Math.max(0, Date.now() - inv.timestamp);
                      const elapsedPercent = Math.min(100, Math.max(0.1, (elapsedMs / totalMs) * 100));

                      return (
                        <div
                          key={inv.id}
                          className="bg-[#181d23]/80 border border-[#2b3139] rounded p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-[11px]"
                        >
                          <div className="flex flex-col min-w-[150px]">
                            <span className="font-bold text-gray-100 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#0ecb81] shrink-0 animate-ping" />
                              {inv.planName}
                            </span>
                            <span className="text-[9.5px] text-gray-500 mt-1">
                              Amt: <strong className="text-gray-300">${inv.depositAmount.toLocaleString()} USDT</strong> ({inv.yieldDaily}% daily)
                            </span>
                          </div>

                          {/* Dynamic Duration Progress Bar */}
                          <div className="flex-1 flex flex-col gap-0.5 max-w-[120px] justify-center mx-1 sm:mx-3">
                            <span className="text-[8.5px] text-gray-400 font-sans flex justify-between">
                              <span>Plan Duration</span>
                              <span>{elapsedPercent.toFixed(2)}%</span>
                            </span>
                            <div className="w-full bg-[#12161a] h-1.5 rounded overflow-hidden border border-[#2b3139]/30">
                              <div 
                                className="bg-[#0ecb81] h-full rounded transition-all duration-300"
                                style={{ width: `${elapsedPercent}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-gray-500 text-right">Term: {inv.durationDays} Days</span>
                          </div>

                          <div className="flex flex-cols sm:flex-row items-start sm:items-center gap-4 text-[10.5px]">
                            <div>
                              <span className="text-[9px] text-[#848e9c] block">Yield Accrued:</span>
                              <span className="font-black text-[#0ecb81]">+${inv.accruedProfit.toFixed(5)} USDT</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#848e9c] block">Live Status:</span>
                              <span className="text-[#0ecb81] font-semibold uppercase tracking-wider text-[9px]">
                                ACTIVE ({Number(daysActive).toFixed(3)}d)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Fast-forward simulator tool */}
                            <button
                              onClick={() => handleFastForwardYield(inv.id)}
                              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                              title="Simulate 24 Hrs Yield Addition"
                            >
                              ☀️ Fast-Forward 24h
                            </button>
                            <button
                              onClick={() => handleClaimYield(inv.id)}
                              disabled={inv.accruedProfit <= 0}
                              className={`px-2 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-colors ${
                                inv.accruedProfit > 0 
                                  ? 'bg-[#0ecb81] text-black hover:bg-emerald-500' 
                                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Claim Yield
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

        {/* SPECIAL USER REFERRALS TAB PANEL */}
        {activeTab === 'referrals' && (
          <ReferralCenter
            currentUser={currentUser}
            onUpdateUsdtBalance={(change, msg) => {
              if (onUpdateUsdtBalance) {
                onUpdateUsdtBalance(change, msg);
              }
              // Immediately sync local state of pending count
              calculatePendingRefCommission();
            }}
            onReferralsUpdated={calculatePendingRefCommission}
          />
        )}

        {/* CUSTOM DEFI CUSTOM PRICE ALERTS TAB */}
        {activeTab === 'alerts' && (

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full min-h-[140px]">
            {/* Left third: Creation form */}
            <form onSubmit={handleFormSubmitAlert} className="md:col-span-4 bg-[#1e2329]/40 border border-[#2b3139] rounded p-3 flex flex-col justify-between gap-2.5">
              <span className="text-[10px] font-bold text-[#f0b90b] uppercase tracking-wider flex items-center gap-1">
                <BellRing size={12} />
                Create Custom Alert
              </span>

              <div className="flex flex-col gap-1.5">
                {/* Select Asset */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Asset</span>
                  <select
                    id="alert-coin-select"
                    value={alertCoinSymbol}
                    onChange={(e) => handleAlertCoinSymbolChange(e.target.value)}
                    className="bg-[#1e2329] text-gray-250 border border-[#2b3139] px-2 py-1 rounded text-[11px] font-mono font-bold focus:outline-none focus:border-[#f0b90b] cursor-pointer"
                  >
                    {coins.map((c) => (
                      <option key={`opt-${c.symbol}`} value={c.symbol}>
                        {c.symbol} (Current: ${c.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Condition */}
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Trigger Condition</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#12161a] p-0.5 rounded">
                    <button
                      type="button"
                      onClick={() => setAlertCondition('above')}
                      className={`py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        alertCondition === 'above'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/35'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {"Price Above (>=)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertCondition('below')}
                      className={`py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        alertCondition === 'below'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/35'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Price Below (&lt;=)
                    </button>
                  </div>
                </div>

                {/* Target Price */}
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Target Price (USD)</span>
                  <input
                    id="alert-price-input"
                    type="number"
                    step="any"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="bg-[#1e2329] text-gray-250 border border-[#2b3139] px-2 py-1 rounded text-[11px] font-mono focus:outline-none focus:border-[#f0b90b] text-right"
                  />
                </div>
              </div>

              <button
                id="alert-create-btn"
                type="submit"
                className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-1 px-3 text-[10.5px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <PlusCircle size={12} />
                Set Custom Alert
              </button>
            </form>

            {/* Right two-thirds: Alerts listing table */}
            <div className="md:col-span-8 overflow-y-auto max-h-[190px] border border-[#2b3139] rounded p-2.5 bg-[#12161a]/30">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 h-full py-8 text-center">
                  <Bell className="opacity-15 mb-2 text-gray-500" size={26} />
                  <span>No price thresholds set yet. Define matching targets to trigger custom desktop notices.</span>
                </div>
              ) : (
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#2b3139] pb-1 font-semibold text-[10px]">
                      <th className="pb-1.5 pl-1.5">Asset</th>
                      <th className="pb-1.5">Condition</th>
                      <th className="pb-1.5 text-right">Target Price</th>
                      <th className="pb-1.5 text-center">Status</th>
                      <th className="pb-1.5 pr-1.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2229]">
                    {alerts.map((al) => (
                      <tr key={al.id} id={`alert-row-${al.id}`} className="hover:bg-[#1e2329]/50 transition-all text-gray-300">
                        <td className="py-2 pl-1.5 font-bold text-gray-200">
                          {al.symbol}/USDT
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase inline-block ${
                              al.condition === 'above'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-blue-500/10 text-blue-400'
                            }`}
                          >
                            {al.condition === 'above' ? 'Crossing Above (>=)' : 'Crossing Below (<=)'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-bold text-gray-100">
                          ${al.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-center">
                          {al.isTriggered ? (
                            <span className="text-[9px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase inline-flex items-center gap-1">
                              🔕 Fired {al.triggeredAt}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-yellow-500/10 text-[#f0b90b] px-1.5 py-0.5 rounded font-bold uppercase inline-flex items-center gap-1 animate-pulse">
                              🔔 Pending
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-right pr-1.5 text-gray-100">
                          <button
                            id={`delete-alert-${al.id}`}
                            onClick={() => onDeleteAlert(al.id)}
                            className="hover:bg-red-500/25 text-gray-400 hover:text-[#f6465d] p-1.5 rounded cursor-pointer transition-colors"
                            title="Delete Alert"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* GOOGLE DRIVE INTEGRATION PANEL */}
        {activeTab === 'drive' && (
          <DriveIntegration
            wallet={wallet}
            orders={orders}
            onImportWallet={onImportWallet || (() => {})}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* POPUP MODAL: PURCHASE INVESTMENT PLAN & CHOOSE PAYMENT PATHWAY */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-[#1e2329] border border-gray-700 w-full max-w-md rounded-lg overflow-hidden shadow-2xl flex flex-col animate-scale-up text-gray-200">
            {/* Header */}
            <div className="bg-[#161a1e] px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#0ecb81] flex items-center gap-1.5">
                <ShieldCheck size={16} /> Choose Payment Pathway
              </span>
              <button
                onClick={() => {
                  setShowPurchaseModal(null);
                  setSimulatedExternalPaymentConfirmed(false);
                }}
                className="text-gray-400 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Plan Info Overview banner */}
            <div className="bg-[#12161a]/60 p-3.5 border-b border-[#2b3139] leading-relaxed">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[13px] text-white">{showPurchaseModal.name}</span>
                <span className="text-[10px] text-[#0ecb81] font-bold font-mono">+{showPurchaseModal.yieldDaily}% / Daily</span>
              </div>
              <p className="text-gray-400 text-[10px] mt-1">Staking Term: {showPurchaseModal.durationDays} Days lockup cycle</p>
            </div>

            {/* Input & Pathway details Form */}
            <form onSubmit={handleConfirmPurchasePlan} className="p-4 flex flex-col gap-3.5">
              {/* Amount Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Investment Capital Amount (USDT)
                </label>
                <div className="relative mt-0.5">
                  <input
                    type="number"
                    required
                    min={showPurchaseModal.minDeposit}
                    max={showPurchaseModal.maxDeposit}
                    step="any"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder={`e.g. ${showPurchaseModal.minDeposit}`}
                    className="w-full bg-[#12161a] border border-[#2b3139] px-3 py-2 rounded text-sm text-white font-mono font-bold focus:outline-none focus:border-[#0ecb81] pr-12 text-right"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-[10px] uppercase font-mono">
                    USDT
                  </span>
                </div>
                <div className="flex justify-between text-[9.5px] text-gray-500 mt-1">
                  <span>Limits: ${showPurchaseModal.minDeposit.toLocaleString()} - ${showPurchaseModal.maxDeposit.toLocaleString()}</span>
                  <span>My Balance: <strong className="text-gray-300">${(wallet.find(w => w.symbol === 'USDT')?.free || 0).toLocaleString()} USDT</strong></span>
                </div>
              </div>

              {/* Payment Pathway Selector buttons */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Select Billing Option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseGate('internal');
                      setSimulatedExternalPaymentConfirmed(false);
                    }}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      purchaseGate === 'internal'
                        ? 'bg-[#0ecb81]/10 border-[#0ecb81] text-[#0ecb81]'
                        : 'bg-[#12161a] border-[#2b3139] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">💼 Internal Porfolio</span>
                    <span className="text-[9px] block text-gray-500 mt-0.5">Deduct from USDT balance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseGate('external')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      purchaseGate === 'external'
                        ? 'bg-[#0ecb81]/10 border-[#0ecb81] text-[#0ecb81]'
                        : 'bg-[#12161a] border-[#2b3139] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">🔗 TRC-20 Blockchain</span>
                    <span className="text-[9px] block text-gray-500 mt-0.5">Pay via external wallet QR</span>
                  </button>
                </div>
              </div>

              {/* Conditional payment helper guidelines container */}
              {purchaseGate === 'external' ? (
                <div className="bg-[#12161a] border border-[#2b3139] p-3 rounded flex flex-col gap-1.5 text-gray-350">
                  <p className="font-bold text-[10px] text-[#eab308]">External Payment Address (TRC-20):</p>
                  <p className="font-mono text-[9px] bg-[#1a1f26] px-2 py-1.5 rounded text-gray-100 select-all border border-[#252a30]">
                    TX7mFqZfWJmQe9yRtUu9pQy8z7wWxLMN7x
                  </p>
                  <p className="text-[9.5px] leading-relaxed text-gray-400 mt-0.5">
                    1. Send the correct amount to the network address above.<br />
                    2. Click the button below to simulate external payment receipt confirmation.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedExternalPaymentConfirmed(true);
                      alert('Simulated Blockchain payment successful! Click the Pay button below to finalize.');
                    }}
                    className={`mt-1.5 w-full py-1 px-3 border rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      simulatedExternalPaymentConfirmed
                        ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                        : 'bg-[#1c2127] hover:bg-gray-800 border-gray-600 text-gray-300'
                    }`}
                  >
                    {simulatedExternalPaymentConfirmed ? '✓ Simulated payment confirmed!' : '⚡ Confirm Simulated External Deposit'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#12161a]/65 p-2 rounded text-[10px] text-gray-400">
                  No fee is charged for internal balance deductions. Processing will be immediate. Only buy after ensuring you have enough available resources.
                </div>
              )}

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseModal(null);
                    setSimulatedExternalPaymentConfirmed(false);
                  }}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold py-1.5 px-3 rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0ecb81] hover:bg-emerald-500 text-black font-extrabold py-1.5 px-3 rounded cursor-pointer transition-all"
                >
                  Confirm Pay & Buy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: SELL FINANCIAL INVESTMENTS / CASH OUT WITHDRAWAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-[#1e2329] border border-gray-700 w-full max-w-md rounded-lg overflow-hidden shadow-2xl flex flex-col animate-scale-up text-gray-200">
            {/* Header */}
            <div className="bg-[#161a1e] px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
              <span className="font-extrabold text-sm text-[#f6465d] flex items-center gap-1.5">
                <ArrowDownLeft size={16} /> Secure Funds Withdrawal (Sell Asset)
              </span>
              <button
                onClick={handleCloseWithdrawModal}
                className="text-gray-400 hover:text-white font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmWithdrawal} className="p-4 flex flex-col gap-3.5">
              {/* Wallet Info banner */}
              <div className="bg-[#12161a]/60 p-3 rounded border border-[#2b3139] font-mono flex justify-between items-center">
                <span className="text-gray-400">My Available USDT:</span>
                <span className="text-white text-sm font-black text-[#0ecb81]">
                  ${(wallet.find((w) => w.symbol === 'USDT')?.free || 0).toLocaleString()} USDT
                </span>
              </div>

              {/* Withdraw Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Amount to Withdraw (USDT)
                </label>
                <div className="relative mt-0.5">
                  <input
                    type="number"
                    required
                    step="any"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 500"
                    disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                    className="w-full bg-[#12161a] border border-[#2b3139] px-3 py-2 rounded text-sm text-white font-mono font-bold focus:outline-none focus:border-[#f6465d] pr-12 text-right"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-[10px] uppercase font-mono">
                    USDT
                  </span>
                </div>
              </div>

              {/* Payout method choice */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Payout Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('trc20')}
                    disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      withdrawMethod === 'trc20'
                        ? 'bg-[#f6465d]/10 border-[#f6465d] text-[#f6465d]'
                        : 'bg-[#12161a] border-[#2b3139] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">🔗 TRC-20 Wallet Address</span>
                    <span className="text-[9px] block text-gray-500 mt-0.5">To external crypto account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank')}
                    disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      withdrawMethod === 'bank'
                        ? 'bg-[#f6465d]/10 border-[#f6465d] text-[#f6465d]'
                        : 'bg-[#12161a] border-[#2b3139] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">🏦 Local Bank Wire</span>
                    <span className="text-[9px] block text-gray-500 mt-0.5">Direct swift bank payout</span>
                  </button>
                </div>
              </div>

              {/* Dynamic input fields depending on method */}
              {withdrawMethod === 'trc20' ? (
                <div className="flex flex-col gap-1.5 bg-[#12161a] p-2.5 rounded border border-[#2b3139]">
                  <label className="text-[9.5px] text-gray-405 font-bold uppercase">
                    Your Receiver Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                    className="w-full bg-[#1e2329] border border-[#2b3139] px-2 py-1.5 rounded font-mono text-[10.5px] text-white focus:outline-none focus:border-[#f6465d]"
                  />
                  <span className="text-[9px] text-[#f6465d] mt-0.5 block">
                    *Double check TRC-20 compatibility. Sending to a wrong address is irreversible.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-[#12161a] p-2.5 rounded border border-[#2b3139]">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-gray-400 font-bold uppercase">Legal Full Name</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                        className="bg-[#1e2329] border border-[#2b3139] px-2 py-1 rounded text-white focus:outline-none focus:border-[#f6465d]"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8.5px] text-gray-400 font-bold uppercase">Bank Name</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JP Morgan"
                        disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                        className="bg-[#1e2329] border border-[#2b3139] px-2 py-1 rounded text-white focus:outline-none focus:border-[#f6465d]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8.5px] text-gray-400 font-bold uppercase">Routing Number / Swift IBAN</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IBAN4092100US8291..."
                      disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                      className="w-full bg-[#1e2329] border border-[#2b3139] px-2 py-1 rounded font-mono text-[10px] text-white focus:outline-none focus:border-[#f6465d]"
                    />
                  </div>
                </div>
              )}

              {/* Status information view */}
              {isWithdrawalProcessing && (
                <div className="bg-yellow-500/10 border border-yellow-500/35 p-2 rounded flex items-center justify-center gap-2 text-[#eab308] font-bold text-[10px]">
                  <span className="w-2.5 h-2.5 border-2 border-[#eab308] border-t-transparent rounded-full animate-spin" />
                  Verifying nodes & broadcasting block payout... Please wait.
                </div>
              )}

              {withdrawSuccessTx && (
                <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/35 p-3 rounded flex flex-col gap-1.5 text-gray-300">
                  <span className="font-black text-[10px] text-[#0ecb81] flex items-center gap-1.5">
                    ✓ Payout Broadcast Complete!
                  </span>
                  <p className="text-[9px] text-gray-400 leading-relaxed font-mono">
                    System withdrew desired funds instantly! Payout details:<br />
                    Hash: <strong className="text-gray-200 select-all">{withdrawSuccessTx}</strong><br />
                    Expected Delivery: Immediate blockchain confirmation / 1 Business bank routing day.
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCloseWithdrawModal}
                  disabled={isWithdrawalProcessing}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold py-1.5 px-3 rounded cursor-pointer transition-colors"
                >
                  Close Gate
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawalProcessing || withdrawSuccessTx !== null}
                  className={`py-1.5 px-3 rounded text-black font-extrabold cursor-pointer transition-all ${
                    isWithdrawalProcessing || withdrawSuccessTx !== null
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-[#f6465d] hover:bg-red-500 text-white'
                  }`}
                >
                  Request Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

