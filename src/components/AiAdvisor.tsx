import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WalletAsset, Coin, Candle } from '../types';
import { Send, Sparkles, BrainCircuit, RotateCcw, HelpCircle, TrendingUp, ShieldAlert } from 'lucide-react';

interface AiAdvisorProps {
  wallet: WalletAsset[];
  selectedCoin: Coin;
  candles: Candle[];
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onClearChat: () => void;
  isAiLoading: boolean;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  wallet,
  selectedCoin,
  candles,
  chatHistory,
  onSendMessage,
  onClearChat,
  isAiLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Instant pre-baked helper commands
  const suggestedPrompts = [
    {
      label: 'Ask Buy/Sell Signal',
      text: `Give me a quantitative buy/sell signal for ${selectedCoin.symbol} based on our active price close of $${selectedCoin.price}. Extract details from the MA(7) and MA(25) lines.`,
      icon: <TrendingUp size={12} className="text-[#0ecb81]" />,
    },
    {
      label: 'Audit My Portfolio',
      text: "Perform a quick risk audit on my mock portfolio allocation. Highlight if I am holding too much USDT cash or if my positions are diversified safely.",
      icon: <BrainCircuit size={12} className="text-[#f1f5f9]" />,
    },
    {
      label: 'How Limit Orders Work',
      text: 'Explain when I should place a "Limit Order" instead of a "Market Order" in this trading simulator, and how it handles order matching.',
      icon: <HelpCircle size={12} className="text-[#f0b90b]" />,
    },
  ];

  return (
    <div id="ai-advisor-panel" className="bg-[#161a1e] border-t lg:border-t-0 lg:border-l border-[#2b3139] flex flex-col h-[400px] lg:h-full select-none">
      {/* Advisor header title */}
      <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between shrink-0 bg-[#181d23]">
        <div className="flex items-center gap-1.5 text-[#f0b90b]">
          <BrainCircuit size={16} className="animate-pulse" />
          <h3 className="text-sm font-bold text-gray-200">Gemini AI Quant Advisor</h3>
        </div>
        <button
          id="clear-chat-btn"
          onClick={onClearChat}
          className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#2b3139] transition-all cursor-pointer"
          title="Reset chat logs"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Chat messages viewport */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-[#2b3139] bg-[#14181c]">
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
            <div className="bg-[#f0b90b]/10 text-[#f0b90b] p-3 rounded-full mb-3">
              <Sparkles size={24} />
            </div>
            <h4 className="text-xs font-bold text-gray-300 mb-1">Meet your AI Quant Coach</h4>
            <p className="text-[10px] text-gray-500 leading-relaxed max-w-[220px]">
              Query Gemini dynamically about signals, risk metrics, or market indicators. I have access to your active chart and wallet!
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                id={`chat-item-${msg.id}`}
                className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-[9px] text-gray-500 mb-0.5 font-mono">
                  {isUser ? 'You' : 'Gemini Quant Bot'} • {msg.timestamp}
                </span>
                <div
                  className={`rounded p-2.5 text-xs leading-relaxed break-words text-left ${
                    isUser
                      ? 'bg-[#f0b90b] text-black font-medium rounded-tr-none'
                      : 'bg-[#2b3139] text-gray-100 rounded-tl-none border border-[#1e2329]'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}

        {/* AI Thinking indicator */}
        {isAiLoading && (
          <div className="flex flex-col mr-auto max-w-[80%] items-start animate-pulse">
            <span className="text-[9.5px] text-[#f0b90b] mb-1 font-bold font-mono">Calculating insights...</span>
            <div className="bg-[#2b3139] rounded px-3 py-2 text-xs flex items-center gap-2 text-gray-400 rounded-tl-none border border-[#1e2329]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Anchor point */}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggested prompts buttons */}
      <div className="p-2 border-t border-[#2b3139] bg-[#181d23] flex flex-col gap-1.5 shrink-0 select-none">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold pl-1">Suggested Inquiries:</span>
        <div className="flex flex-col gap-1">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              id={`suggest-btn-${idx}`}
              onClick={() => {
                if (!isAiLoading) onSendMessage(p.text);
              }}
              className="text-left bg-[#1e2329]/80 hover:bg-[#2b3139] border border-[#2b3139] rounded px-2.5 py-1.5 text-[10px] text-gray-300 hover:text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {p.icon}
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action form input send */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#2b3139] bg-[#161a1e] flex gap-2 shrink-0">
        <input
          id="ai-advisor-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about indicator strategies..."
          className="flex-1 bg-[#1e2329] border border-[#2b3139] rounded px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#f0b90b] transition-all"
        />
        <button
          id="ai-send-btn"
          type="submit"
          disabled={!inputText.trim() || isAiLoading}
          className="bg-[#f0b90b] hover:bg-yellow-500 disabled:opacity-40 text-black p-2 rounded cursor-pointer transition-all shrink-0 flex items-center justify-center"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
