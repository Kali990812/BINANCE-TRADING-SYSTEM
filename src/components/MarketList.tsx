import React, { useState } from 'react';
import { Coin } from '../types';
import { Search, Star } from 'lucide-react';

interface MarketListProps {
  coins: Coin[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  favorites: string[];
  onToggleFavorite: (symbol: string) => void;
}

export const MarketList: React.FC<MarketListProps> = ({
  coins,
  selectedSymbol,
  onSelectCoin,
  favorites,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'Favorites' | 'Layer-1' | 'DeFi' | 'Meme'>('all');

  const filteredCoins = coins.filter((coin) => {
    const matchesSearch =
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'Favorites') return matchesSearch && favorites.includes(coin.symbol);
    return matchesSearch && coin.category === activeTab;
  });

  return (
    <div id="market-list-card" className="bg-[#161a1e] border-b lg:border-b-0 border-[#2b3139] flex flex-col h-[320px] select-none">
      {/* Title */}
      <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Markets</h3>
        <span className="text-[10px] text-gray-500 font-mono">Real-time simulator</span>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <input
            id="market-search-box"
            type="text"
            placeholder="Search coin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e2329] border border-[#2b3139] rounded px-8 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#f0b90b] transition-all"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-2 border-b border-[#2b3139] gap-1 text-[11px] font-semibold text-gray-400 overflow-x-auto scrollbar-none">
        {(['all', 'Favorites', 'Layer-1', 'DeFi', 'Meme'] as const).map((tab) => (
          <button
            key={tab}
            id={`market-tab-${tab.toLowerCase()}`}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 border-b-2 hover:text-white transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-[#f0b90b] text-white font-bold'
                : 'border-transparent text-gray-400'
            }`}
          >
            {tab === 'all' ? 'All' : tab}
          </button>
        ))}
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2b3139] pr-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500 text-[10px] border-b border-[#2b3139]">
              <th className="py-2 pl-3">Pair</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right pr-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No markets found
                </td>
              </tr>
            ) : (
              filteredCoins.map((coin) => {
                const isSelected = coin.symbol === selectedSymbol;
                const isFav = favorites.includes(coin.symbol);
                const isPositive = coin.change24h >= 0;

                return (
                  <tr
                    key={coin.symbol}
                    id={`market-row-${coin.symbol.toLowerCase()}`}
                    onClick={() => onSelectCoin(coin.symbol)}
                    className={`hover:bg-[#1e2329]/75 transition-all cursor-pointer ${
                      isSelected ? 'bg-[#1e2329]' : ''
                    }`}
                  >
                    <td className="py-2 py-2.5 pl-3 flex items-center gap-1.5">
                      <button
                        id={`fav-btn-${coin.symbol.toLowerCase()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(coin.symbol);
                        }}
                        className="text-gray-500 hover:text-[#f0b90b] transition-colors"
                      >
                        <Star
                          size={11}
                          className={isFav ? 'fill-[#f0b90b] text-[#f0b90b]' : 'text-gray-500'}
                        />
                      </button>
                      <span className="font-bold text-gray-200">
                        {coin.symbol}
                        <span className="text-[9px] text-gray-500 font-normal">/USDT</span>
                      </span>
                    </td>
                    <td className={`py-2 text-right font-mono font-medium ${isSelected ? 'text-[#f0b90b]' : 'text-gray-100'}`}>
                      {coin.price.toLocaleString(undefined, {
                        minimumFractionDigits: coin.decimals,
                        maximumFractionDigits: coin.decimals,
                      })}
                    </td>
                    <td
                      className={`py-2 text-right pr-3 font-mono font-semibold ${
                        isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {coin.change24h.toFixed(2)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
