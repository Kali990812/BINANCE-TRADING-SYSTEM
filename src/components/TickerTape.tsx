import React from 'react';
import { Coin } from '../types';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface TickerTapeProps {
  coins: Coin[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  mockUsdtBalance: number;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  coins,
  selectedSymbol,
  onSelectCoin,
  mockUsdtBalance,
}) => {
  const selectedCoin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  return (
    <div id="ticker-tape-container" className="bg-[#161a1e] border-b border-[#2b3139] px-4 py-2 text-xs text-gray-400 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Market list row */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {coins.map((coin) => {
            const isSelected = coin.symbol === selectedSymbol;
            const isPositive = coin.change24h >= 0;

            return (
              <button
                key={coin.symbol}
                id={`ticker-item-${coin.symbol.toLowerCase()}`}
                onClick={() => onSelectCoin(coin.symbol)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all cursor-pointer mr-1 shrink-0 ${
                  isSelected
                    ? 'bg-[#2b3139] border border-[#f0b90b]/80 text-white'
                    : 'bg-[#1e2329] hover:bg-[#2b3139] text-gray-300 border border-transparent'
                }`}
              >
                <span className="font-bold">{coin.symbol}/USDT</span>
                <span className={`font-mono ${isSelected ? 'text-[#f0b90b]' : 'text-gray-100'}`}>
                  ${coin.price.toLocaleString(undefined, {
                    minimumFractionDigits: coin.decimals,
                    maximumFractionDigits: coin.decimals,
                  })}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-mono text-[10px] ${
                    isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                  }`}
                >
                  {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isPositive ? '+' : ''}
                  {coin.change24h.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected asset high/low specs */}
        <div className="flex items-center flex-wrap gap-4 md:gap-6 text-gray-400 border-t md:border-t-0 border-[#2b3139] pt-2 md:pt-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Active Pair</span>
            <span className="text-white font-bold text-sm flex items-center gap-1">
              {selectedCoin.name} <span className="text-[10px] bg-yellow-500/10 text-[#f0b90b] px-1 rounded">SPOT</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">24h High</span>
            <span className="text-gray-200 font-mono">
              ${selectedCoin.high24h.toLocaleString(undefined, {
                minimumFractionDigits: selectedCoin.decimals,
                maximumFractionDigits: selectedCoin.decimals,
              })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">24h Low</span>
            <span className="text-gray-200 font-mono">
              ${selectedCoin.low24h.toLocaleString(undefined, {
                minimumFractionDigits: selectedCoin.decimals,
                maximumFractionDigits: selectedCoin.decimals,
              })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">24h Volume</span>
            <span className="text-gray-200 font-mono">
              {selectedCoin.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} {selectedCoin.symbol}
            </span>
          </div>

          <div className="flex flex-col border-l border-[#2b3139] pl-4">
            <span className="text-[10px] text-[#f0b90b] uppercase tracking-wider font-semibold">Available Funds</span>
            <span className="text-[#0ecb81] font-mono font-bold text-sm">
              ${mockUsdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-gray-500 font-normal text-xs">USDT</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
