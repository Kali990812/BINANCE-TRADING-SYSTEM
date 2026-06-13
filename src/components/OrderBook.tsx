import React from 'react';
import { OrderBook as OrderBookType, Coin } from '../types';

interface OrderBookProps {
  orderBook: OrderBookType;
  coin: Coin;
  onSelectPrice: (price: number) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook, coin, onSelectPrice }) => {
  const currentPrice = coin.price;
  const spread = orderBook.asks.length > 0 && orderBook.bids.length > 0
    ? orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price
    : 0;
  const spreadPercent = (spread / currentPrice) * 100;

  // Find max total for bar visualization width
  const maxTotal = Math.max(
    orderBook.asks.reduce((max, x) => Math.max(max, x.total), 0),
    orderBook.bids.reduce((max, x) => Math.max(max, x.total), 0),
    1
  );

  return (
    <div id="orderbook-panel" className="bg-[#161a1e] border-r border-[#2b3139] flex flex-col h-[350px] lg:h-full select-none text-[11px] font-mono font-medium">
      {/* Title */}
      <div className="px-3 py-2 border-b border-[#2b3139] flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-200">Order Book</span>
        <span className="text-[10px] text-gray-500">0.01 depth</span>
      </div>

      {/* Header Fields */}
      <div className="grid grid-cols-3 text-gray-500 px-3 py-1.5 border-b border-[#1e2229] uppercase text-[9px] tracking-wide shrink-0">
        <span>Price(USDT)</span>
        <span className="text-right">Size({coin.symbol})</span>
        <span className="text-right">Total(USDT)</span>
      </div>

      {/* ASKS (Sells - red) */}
      <div className="flex-1 flex flex-col-reverse overflow-y-hidden justify-end">
        {orderBook.asks.slice(-7).map((ask, idx) => {
          const depthPercent = Math.min(100, (ask.total / maxTotal) * 100);
          return (
            <button
              key={`ask-${idx}-${ask.price}`}
              id={`orderbook-ask-${idx}`}
              onClick={() => onSelectPrice(ask.price)}
              className="grid grid-cols-3 relative px-3 py-0.5 hover:bg-[#2b3139]/50 text-left cursor-pointer transition-colors w-full"
            >
              {/* Depth background slider block */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-[#f6465d] z-10">{ask.price.toFixed(coin.decimals)}</span>
              <span className="text-right text-gray-300 z-10">{ask.amount.toFixed(4)}</span>
              <span className="text-right text-gray-400 z-10">{Math.round(ask.total).toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {/* SPREAD/MID PRICE SECTION */}
      <div className="bg-[#1e2229] px-3 py-2 border-y border-[#2b3139] text-center flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-base font-bold ${coin.change24h >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {coin.price.toLocaleString(undefined, {
              minimumFractionDigits: coin.decimals,
              maximumFractionDigits: coin.decimals,
            })}
          </span>
          <span className="text-[10px] text-gray-500">≈ ${coin.price.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end text-[9px] text-gray-400">
          <span>Spread</span>
          <span className="font-semibold text-gray-300">
            {spread.toFixed(coin.decimals)} ({spreadPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* BIDS (Buys - green) */}
      <div className="flex-1 flex flex-col overflow-y-hidden">
        {orderBook.bids.slice(0, 7).map((bid, idx) => {
          const depthPercent = Math.min(100, (bid.total / maxTotal) * 100);
          return (
            <button
              key={`bid-${idx}-${bid.price}`}
              id={`orderbook-bid-${idx}`}
              onClick={() => onSelectPrice(bid.price)}
              className="grid grid-cols-3 relative px-3 py-0.5 hover:bg-[#2b3139]/50 text-left cursor-pointer transition-colors w-full"
            >
              {/* Depth background slider block */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/10 pointer-events-none transition-all"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-[#0ecb81] z-10">{bid.price.toFixed(coin.decimals)}</span>
              <span className="text-right text-gray-300 z-10">{bid.amount.toFixed(4)}</span>
              <span className="text-right text-gray-400 z-10">{Math.round(bid.total).toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
