import React from 'react';
import { Download } from 'lucide-react';
import { Trade, Coin } from '../types';

interface TradesHistoryProps {
  trades: Trade[];
  coin: Coin;
}

export const TradesHistory: React.FC<TradesHistoryProps> = ({ trades, coin }) => {
  const downloadCSV = () => {
    if (trades.length === 0) return;

    // Build the CSV Header
    const headers = ['Trade ID', 'Market Pair', 'Type', 'Price (USDT)', `Amount (${coin.symbol})`, 'Total Value (USDT)', 'Timestamp'];
    
    // Convert trade data to CSV rows
    const rows = trades.map((trade) => [
      trade.id,
      `${coin.symbol}/USDT`,
      trade.type.toUpperCase(),
      trade.price.toFixed(coin.decimals),
      trade.amount.toFixed(4),
      (trade.price * trade.amount).toFixed(4),
      trade.time,
    ]);

    // Format all elements to handle commas and double quotes correctly
    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create standard data blob download link trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${coin.symbol}_trades_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="recent-trades-card" className="bg-[#161a1e] border-b lg:border-b-0 border-[#2b3139] flex flex-col h-[320px] select-none text-[11px] font-mono font-medium">
      {/* Title */}
      <div className="px-3 py-2 border-b border-[#2b3139] flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-200">Recent Trades</span>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={trades.length === 0}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
              trades.length === 0
                ? 'opacity-40 cursor-not-allowed bg-transparent border-gray-700 text-gray-600'
                : 'bg-[#1e2329] hover:bg-[#2b3139] border-[#2b3139] text-[#848e9c] hover:text-[#eab308] cursor-pointer'
            }`}
            title="Download trades as CSV"
          >
            <Download size={11} className="stroke-[2.5]" />
            <span>CSV</span>
          </button>
          <span className="text-[10px] text-[#0ecb81] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" /> Live Feed
          </span>
        </div>
      </div>

      {/* Header labels */}
      <div className="grid grid-cols-3 text-gray-500 px-3 py-1.5 border-b border-[#1e2229] uppercase text-[9px] tracking-wide shrink-0">
        <span>Price(USDT)</span>
        <span className="text-right">Amount({coin.symbol})</span>
        <span className="text-right">Time</span>
      </div>

      {/* Scrolling body lists */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2b3139] pr-1">
        {trades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Waiting for market ticks...</div>
        ) : (
          trades.map((trade) => {
            const isBuy = trade.type === 'buy';
            return (
              <div
                key={trade.id}
                id={`trade-${trade.id}`}
                className="grid grid-cols-3 px-3 py-1 hover:bg-[#1e2329]/50 transition-colors"
              >
                <span className={`font-semibold ${isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {trade.price.toFixed(coin.decimals)}
                </span>
                <span className="text-right text-gray-300">
                  {trade.amount.toFixed(4)}
                </span>
                <span className="text-right text-gray-500">
                  {trade.time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
