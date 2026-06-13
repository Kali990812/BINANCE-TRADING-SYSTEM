import React, { useState, useEffect } from 'react';
import { Coin, WalletAsset } from '../types';
import { Sparkles } from 'lucide-react';

interface OrderFormProps {
  coin: Coin;
  wallet: WalletAsset[];
  onPlaceOrder: (order: {
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
  }) => void;
  overridePrice?: number;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  coin,
  wallet,
  onPlaceOrder,
  overridePrice,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState<string>(coin.price.toString());
  const [amount, setAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync price if active coin changes or a price is selected from Order Book
  useEffect(() => {
    if (orderType === 'limit') {
      if (overridePrice) {
        setPrice(overridePrice.toString());
      } else {
        setPrice(coin.price.toString());
      }
    }
  }, [coin.price, overridePrice, orderType]);

  // Find respective asset balances
  const usdtAsset = wallet.find((w) => w.symbol === 'USDT') || { free: 0, locked: 0 };
  const cryptoAsset = wallet.find((w) => w.symbol === coin.symbol) || { free: 0, locked: 0 };

  const availableBalance = side === 'buy' ? usdtAsset.free : cryptoAsset.free;
  const balanceLabel = side === 'buy' ? 'USDT' : coin.symbol;

  // Calculators
  const numPrice = orderType === 'market' ? coin.price : Number(price) || 0;
  const numAmount = Number(amount) || 0;
  const estimatedTotal = numPrice * numAmount;

  // Error validation
  useEffect(() => {
    setErrorMsg(null);
    if (numAmount <= 0) return;

    if (side === 'buy') {
      if (estimatedTotal > usdtAsset.free) {
        setErrorMsg(`Insufficient USDT balance (${estimatedTotal.toFixed(2)} needed).`);
      }
    } else {
      if (numAmount > cryptoAsset.free) {
        setErrorMsg(`Insufficient ${coin.symbol} balance.`);
      }
    }
  }, [amount, price, side, orderType, cryptoAsset.free, usdtAsset.free, coin.symbol]);

  // Balance fraction sliders
  const handlePercentageClick = (pct: number) => {
    if (availableBalance <= 0) {
      setAmount('');
      return;
    }

    if (side === 'buy') {
      // Amount = availableUSDT / price * percentage
      const targetUsdt = availableBalance * pct;
      const targetAmount = targetUsdt / numPrice;
      setAmount(targetAmount.toFixed(4));
    } else {
      // Amount = availableCrypto * percentage
      const targetAmount = availableBalance * pct;
      setAmount(targetAmount.toFixed(4));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (errorMsg) return;

    onPlaceOrder({
      type: orderType,
      side,
      price: numPrice,
      amount: numAmount,
    });

    setAmount(''); // Reset size
  };

  return (
    <div id="order-form-card" className="bg-[#161a1e] border-t lg:border-t-0 lg:border-l border-[#2b3139] p-4 flex flex-col h-full justify-between select-none">
      <div className="flex flex-col gap-4">
        {/* Buy/Sell Side tab panels */}
        <div className="grid grid-cols-2 bg-[#1e2329] p-0.5 rounded">
          <button
            id="order-side-buy"
            type="button"
            onClick={() => setSide('buy')}
            className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              side === 'buy'
                ? 'bg-[#0ecb81] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            id="order-side-sell"
            type="button"
            onClick={() => setSide('sell')}
            className={`py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              side === 'sell'
                ? 'bg-[#f6465d] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Limit / Market Order selector tabs */}
        <div className="flex gap-4 text-xs font-semibold text-gray-400 border-b border-[#2b3139] pb-2">
          <button
            id="order-type-limit"
            type="button"
            onClick={() => setOrderType('limit')}
            className={`focus:outline-none cursor-pointer ${
              orderType === 'limit' ? 'text-[#f0b90b] font-bold' : 'hover:text-white'
            }`}
          >
            Limit
          </button>
          <button
            id="order-type-market"
            type="button"
            onClick={() => setOrderType('market')}
            className={`focus:outline-none cursor-pointer ${
              orderType === 'market' ? 'text-[#f0b90b] font-bold' : 'hover:text-white'
            }`}
          >
            Market
          </button>
        </div>

        {/* Free Asset wallet display */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Available</span>
          <span className="font-mono text-gray-200">
            {availableBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}{' '}
            {balanceLabel}
          </span>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Price input (not displayed/disabled in Market mode) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Price</label>
            <div className="relative flex items-center">
              <input
                id="order-price-input"
                type="number"
                step="any"
                value={orderType === 'market' ? '' : price}
                disabled={orderType === 'market'}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={orderType === 'market' ? 'Market Price' : '0.00'}
                className="w-full bg-[#1e2329] border border-[#2b3139] rounded px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#f0b90b] disabled:opacity-50 disabled:bg-gray-90s select-all text-right pr-12"
              />
              <span className="absolute right-3 text-[10px] uppercase font-bold text-gray-500">USDT</span>
            </div>
          </div>

          {/* Amount input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-wide">Amount</label>
            <div className="relative flex items-center">
              <input
                id="order-amount-input"
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000"
                className="w-full bg-[#1e2329] border border-[#2b3139] rounded px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#f0b90b] text-right pr-12"
              />
              <span className="absolute right-3 text-[10px] uppercase font-bold text-gray-500">
                {coin.symbol}
              </span>
            </div>
          </div>

          {/* Percentage control pill sliders */}
          <div className="grid grid-cols-4 gap-1.5 my-1">
            {[0.25, 0.5, 0.75, 1.0].map((term) => (
              <button
                key={term}
                id={`pct-btn-${term * 100}`}
                type="button"
                onClick={() => handlePercentageClick(term)}
                className="bg-[#1e2329] hover:bg-[#2b3139] border border-transparent hover:border-gray-700 rounded py-1 px-1 text-[10px] font-mono font-semibold text-gray-400 hover:text-white font-mono cursor-pointer transition-all"
              >
                {term * 100}%
              </button>
            ))}
          </div>

          {/* Est Total */}
          <div className="flex justify-between items-center text-xs border-t border-[#1e2329] pt-2 mt-2">
            <span className="text-gray-500">Est. Total:</span>
            <span className="font-mono font-bold text-gray-200">
              ${estimatedTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-gray-500 text-[10px]">USDT</span>
            </span>
          </div>

          {/* Verification warning notifications */}
          {errorMsg && (
            <div id="order-error-banner" className="text-[10px] text-[#f6465d] bg-[#f6465d]/10 rounded px-2.5 py-2 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            id="place-order-submit"
            type="submit"
            disabled={!!errorMsg}
            className={`w-full py-2.5 rounded font-bold text-sm cursor-pointer transition-all ${
              side === 'buy'
                ? 'bg-[#0ecb81] hover:bg-[#0baf6f] text-white disabled:opacity-40'
                : 'bg-[#f6465d] hover:bg-[#d63c50] text-white disabled:opacity-40'
            }`}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {coin.symbol}
          </button>
        </form>
      </div>

      {/* Security alert footer */}
      <div className="flex items-center gap-1 bg-[#1e2329] rounded p-2 text-[9px] text-[#f0b90b] mt-4 lg:mt-0 font-medium leading-relaxed">
        <Sparkles size={11} className="shrink-0" />
        <span>Mock Paper Trading environment. Transactions settle immediately with zero financial risk.</span>
      </div>
    </div>
  );
};
