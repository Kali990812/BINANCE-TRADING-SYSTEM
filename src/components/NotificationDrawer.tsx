import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, Trash2, CheckCheck, ShieldAlert, TrendingDown, 
  TrendingUp, Coins, BellOff, Sliders, AlertTriangle, Skull, ShieldCheck 
} from 'lucide-react';
import { NotificationItem, WalletAsset, Coin } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDismissNotification: (id: string) => void;
  wallet: WalletAsset[];
  coins: Coin[];
  leverage: number; // e.g. 1 (no leverage), 10, 25, 50, 100
  onSetLeverage: (val: number) => void;
  isLeverageEnabled: boolean;
  onToggleLeverage: (val: boolean) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onDismissNotification,
  wallet,
  coins,
  leverage,
  onSetLeverage,
  isLeverageEnabled,
  onToggleLeverage,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'risk'>('feed');

  // Filter out stablecoins, only get volatile balances with active value in wallet
  const volatileBalances = wallet.filter(w => w.symbol !== 'USDT' && (w.free + w.locked) > 0);

  // Helper to compute liquidation price buffer
  // In a long futures trade, liquidation price can be estimated as: entryPrice * (1 - 1 / leverage + 0.01)
  const getLiquidationMetrics = (assetSymbol: string) => {
    const coin = coins.find(c => c.symbol === assetSymbol);
    if (!coin) return { entryPrice: 0, currentPrice: 0, liquidationPrice: 0, distancePercent: 0, riskLevel: 'Safe' };

    const currentPrice = coin.price;
    // We assume the average entry price is slightly different or mock-stable
    const entryPrice = coin.price * 1.01; // Mock entry price close to current price
    const marginFraction = 1 / leverage;
    
    // Liquidation price computation with a slight safety buffer (e.g., standard maintenance margin)
    const liquidationPrice = Math.max(0, entryPrice * (1 - marginFraction + 0.015));
    const distancePercent = currentPrice > liquidationPrice 
      ? ((currentPrice - liquidationPrice) / currentPrice) * 100 
      : 0;

    let riskLevel: 'Safe' | 'Warning' | 'CRITICAL' = 'Safe';
    if (distancePercent < 2) riskLevel = 'CRITICAL';
    else if (distancePercent < 6) riskLevel = 'Warning';

    return {
      entryPrice,
      currentPrice,
      liquidationPrice,
      distancePercent,
      riskLevel
    };
  };

  const totalUnreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            id="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
          />

          {/* Drawer Panel Container */}
          <motion.div
            id="notification-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#161a1e] border-l border-[#2b3139] z-50 flex flex-col shadow-2xl text-gray-200 select-none"
          >
            {/* Header Area */}
            <div className="p-4 border-b border-[#2b3139] bg-[#181d23] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="text-[#f0b90b]" size={18} />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {totalUnreadCount}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold tracking-wider font-sans text-white uppercase">
                  Global Alerts &amp; Risk Drawer
                </h2>
              </div>
              <button
                id="close-drawer-btn"
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inner Drawer Navigation Tabs */}
            <div className="grid grid-cols-2 border-b border-[#2b3139] bg-[#12161a] text-xs">
              <button
                id="drawer-tab-feed"
                onClick={() => setActiveTab('feed')}
                className={`py-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'feed'
                    ? 'border-[#f0b90b] text-white bg-[#1e2329]/50'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Bell size={13} />
                Activity Feed ({notifications.length})
              </button>
              <button
                id="drawer-tab-risk"
                onClick={() => setActiveTab('risk')}
                className={`py-2.5 font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === 'risk'
                    ? 'border-red-500 text-white bg-[#1e2329]/50'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sliders size={13} />
                Leverage Risk Monitor {isLeverageEnabled && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
              </button>
            </div>

            {/* Content Feed Section */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'feed' ? (
                <div className="p-4 flex flex-col gap-3 min-h-full">
                  {/* Actions Bar */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pb-1 border-b border-[#2b3139] font-mono">
                      <button
                        id="mark-all-read-btn"
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1 hover:text-[#0ecb81] transition cursor-pointer"
                      >
                        <CheckCheck size={12} />
                        Mark all read
                      </button>
                      <button
                        id="clear-all-notifications-btn"
                        onClick={onClearAll}
                        className="flex items-center gap-1 hover:text-[#f6465d] transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Clear history
                      </button>
                    </div>
                  )}

                  {notifications.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-gray-500">
                      <BellOff size={32} className="opacity-20 mb-3" />
                      <span className="text-xs font-mono">Your activity stream is quiet.</span>
                      <p className="text-[10px] text-gray-500 max-w-[280px] mt-1 leading-relaxed">
                        Fired price alerts, completed futures fills, and leverage warning events will log here in real-time.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          id={`notification-card-${item.id}`}
                          className={`p-3 rounded-lg border text-xs font-mono transition-all relative overflow-hidden flex flex-col gap-1.5 ${
                            item.isRead ? 'bg-[#181d23]/50 border-gray-800' : 'bg-[#1e2329] border-l-3'
                          }`}
                          style={{
                            borderLeftColor: 
                              item.severity === 'danger' ? '#f6465d' : 
                              item.severity === 'warning' ? '#f0b90b' : 
                              item.severity === 'success' ? '#0ecb81' : '#3b82f6'
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase flex items-center gap-1.5 text-gray-250">
                              {item.severity === 'danger' && <Skull size={11} className="text-[#f6465d]" />}
                              {item.severity === 'warning' && <AlertTriangle size={11} className="text-[#f0b90b]" />}
                              {item.severity === 'success' && <TrendingUp size={11} className="text-[#0ecb81]" />}
                              {item.severity === 'info' && <Coins size={11} className="text-blue-400" />}
                              {item.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                              <span>{item.timestamp}</span>
                              <button
                                id={`dismiss-notif-${item.id}`}
                                onClick={() => onDismissNotification(item.id)}
                                className="text-gray-500 hover:text-[#f6465d] transition p-0.5 rounded cursor-pointer"
                                title="Dismiss notification"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-gray-300 leading-normal font-sans">
                            {item.message}
                          </p>

                          {/* Trigger simulation indicator badge */}
                          {!item.isRead && (
                            <div className="absolute top-1 right-8 w-1.5 h-1.5 rounded-full bg-yellow-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* LEVERAGE RISK MONITOR WORKSPACE */
                <div className="p-4 flex flex-col gap-4">
                  {/* Explanation card */}
                  <div className="bg-red-500/5 border border-red-500/15 p-3 rounded-lg flex gap-2">
                    <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={16} />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-red-300">Reg-T Margined Futures simulator</span>
                      <p className="text-[10px] text-gray-400 leading-normal font-sans">
                        Activate futures leverage to scale spot positions up to 100x. When prices drop near maintenance limits, high risk alerts prompt liquidation events in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Leverage Controls */}
                  <div className="bg-[#181d23] border border-[#2b3139] rounded-lg p-3.5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leverage Active State</span>
                      <div className="flex items-center gap-2">
                        <button
                          id="toggle-leverage-btn"
                          onClick={() => onToggleLeverage(!isLeverageEnabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isLeverageEnabled ? 'bg-red-500' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isLeverageEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-bold font-mono min-w-[24px]">
                          {isLeverageEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {isLeverageEnabled && (
                      <div className="flex flex-col gap-1.5 border-t border-gray-800 pt-3">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Exposure scale</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[10, 20, 50, 100].map((level) => (
                            <button
                              key={`lev-${level}`}
                              id={`leverage-select-${level}`}
                              onClick={() => onSetLeverage(level)}
                              className={`py-1 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer border ${
                                leverage === level
                                  ? 'bg-red-500/10 text-red-400 border-red-500'
                                  : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'
                              }`}
                            >
                              {level}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Positions under Margin Monitor */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Position Margin &amp; liquidation thresholds
                    </span>

                    {!isLeverageEnabled ? (
                      <div className="text-center py-10 bg-[#12161a]/30 border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500">
                        <ShieldCheck size={26} className="opacity-15 mb-2 text-green-400" />
                        <span className="text-[11px]">Unleveraged Spot Mode Active</span>
                        <p className="text-[9px] text-gray-600 max-w-[200px] mt-1">
                          Wallet assets have 100% equity collateral. No liquidation risk can be incurred.
                        </p>
                      </div>
                    ) : volatileBalances.length === 0 ? (
                      <div className="text-center py-10 bg-[#12161a]/30 border border-dashed border-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-500">
                        <Coins size={26} className="opacity-15 mb-2" />
                        <span className="text-[11px] font-mono">No Active Volatile Pos.</span>
                        <p className="text-[9px] text-gray-600 max-w-[200px] mt-1 leading-normal font-sans">
                          You only hold stable USDT cash or zero balances. Buy some BTC, ETH, or other tokens from the market board to open margin risk exposure.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {volatileBalances.map((asset) => {
                          const metrics = getLiquidationMetrics(asset.symbol);
                          const totalAmt = asset.free + asset.locked;
                          const totalValUsd = totalAmt * metrics.currentPrice;

                          return (
                            <div
                              key={`margin-pos-${asset.symbol}`}
                              className={`p-3 rounded-lg border flex flex-col gap-2.5 bg-[#12161a]/60 ${
                                metrics.riskLevel === 'CRITICAL' 
                                  ? 'border-red-500/40 bg-red-500/[0.02] animate-pulse' 
                                  : metrics.riskLevel === 'Warning'
                                  ? 'border-yellow-500/30'
                                  : 'border-[#2b3139]'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-1 text-xs">
                                  {asset.symbol} Margin Position
                                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    metrics.riskLevel === 'CRITICAL' 
                                      ? 'bg-red-500/15 text-red-400 font-black' 
                                      : metrics.riskLevel === 'Warning'
                                      ? 'bg-yellow-500/15 text-[#f0b90b]'
                                      : 'bg-green-500/15 text-[#0ecb81]'
                                  }`}>
                                    {metrics.riskLevel}
                                  </span>
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Leveraged Pos: <span className="text-white">${Math.round(totalValUsd * leverage).toLocaleString()}</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
                                <div>
                                  <span>Spot Price:</span>
                                  <p className="text-white font-bold text-xs">
                                    ${metrics.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-red-400">Est. Liquidation:</span>
                                  <p className="text-red-400 font-bold text-xs">
                                    ${metrics.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>

                              {/* Progress bar showing distance safety buffer */}
                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex justify-between text-[8px] font-mono uppercase text-gray-500">
                                  <span>Safety to Liq.</span>
                                  <span className={metrics.riskLevel === 'CRITICAL' ? 'text-red-400 font-black' : 'text-gray-300'}>
                                    {metrics.distancePercent.toFixed(2)}% remaining
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded bg-gray-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded transition-all duration-300 ${
                                      metrics.riskLevel === 'CRITICAL'
                                        ? 'bg-red-500'
                                        : metrics.riskLevel === 'Warning'
                                        ? 'bg-[#f0b90b]'
                                        : 'bg-[#0ecb81]'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, metrics.distancePercent * 3.5))}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom summary banner */}
            <div className="p-4 bg-[#12161a] border-t border-[#2b3139] text-[10.5px] font-mono text-gray-400 flex items-center justify-between">
              <span>Risk Margin Level:</span>
              <span className={`font-bold ${isLeverageEnabled ? 'text-red-400 animate-pulse' : 'text-[#0ecb81]'}`}>
                {isLeverageEnabled ? `${(100 / leverage).toFixed(1)}% (Maintenance Reg-T)` : '100% COLLATERALIZED'}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
