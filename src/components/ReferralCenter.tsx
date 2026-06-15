import React, { useState, useEffect } from 'react';
import { 
  Users, Award, DollarSign, Copy, Check, Share2, PlusCircle, Gift, 
  ArrowUpRight, Sparkles, BadgePercent, ShieldCheck, HelpCircle, UserCheck,
  Trophy, Crown, TrendingUp, Medal, Twitter, Send, MessageCircle, QrCode
} from 'lucide-react';

interface Referral {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  investmentAmount: number;
  commissionEarned: number;
  status: 'pending' | 'credited' | 'settled';
}

interface ReferralCenterProps {
  currentUser?: { name: string; username: string; email: string } | null;
  onUpdateUsdtBalance?: (change: number, message?: string) => void;
  onReferralsUpdated?: () => void;
}

export const ReferralCenter: React.FC<ReferralCenterProps> = ({
  currentUser,
  onUpdateUsdtBalance,
  onReferralsUpdated
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralsList, setReferralsList] = useState<Referral[]>(() => {
    const username = currentUser?.username || 'member';
    
    // Check global referrals map first
    let globalRefsForUser: Referral[] = [];
    try {
      const globalRaw = localStorage.getItem('binance_global_referrals');
      if (globalRaw) {
        const parsedMap = JSON.parse(globalRaw);
        if (parsedMap && parsedMap[username]) {
          globalRefsForUser = parsedMap[username];
        }
      }
    } catch (e) {
      console.warn("Could not read binance_global_referrals:", e);
    }

    const saved = localStorage.getItem('binance_user_referrals');
    let localSaved: Referral[] = [];
    if (saved) {
      try {
        localSaved = JSON.parse(saved);
      } catch (e) {
        localSaved = [];
      }
    } else {
      localSaved = [
        {
          id: 'ref-1',
          name: 'Sarah Connor',
          email: 's.connor@cyberdyne.net',
          joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          investmentAmount: 1500,
          commissionEarned: 150,
          status: 'pending'
        },
        {
          id: 'ref-2',
          name: 'Bruce Wayne',
          email: 'bruce@wayne-enterprise.com',
          joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          investmentAmount: 10000,
          commissionEarned: 1000,
          status: 'pending'
        }
      ];
    }

    // Merge them by unique ID to make sure we don't duplicate
    const mergedMap = new Map<string, Referral>();
    localSaved.forEach(r => mergedMap.set(r.id, r));
    globalRefsForUser.forEach(r => {
      if (mergedMap.has(r.id)) {
        const existing = mergedMap.get(r.id)!;
        mergedMap.set(r.id, {
          ...existing,
          ...r,
          investmentAmount: Math.max(existing.investmentAmount, r.investmentAmount),
          commissionEarned: Math.max(existing.commissionEarned, r.commissionEarned),
        });
      } else {
        mergedMap.set(r.id, r);
      }
    });

    return Array.from(mergedMap.values());
  });

  // Simulator input fields state
  const [refName, setRefName] = useState('');
  const [refInvAmount, setRefInvAmount] = useState('');
  const [showSimNotification, setShowSimNotification] = useState(false);

  // Auto-save referrals list and trigger notification updates
  useEffect(() => {
    localStorage.setItem('binance_user_referrals', JSON.stringify(referralsList));
    
    // Also sync back to global registry
    try {
      const username = currentUser?.username || 'member';
      const globalRaw = localStorage.getItem('binance_global_referrals') || '{}';
      const parsedMap = JSON.parse(globalRaw);
      parsedMap[username] = referralsList;
      localStorage.setItem('binance_global_referrals', JSON.stringify(parsedMap));
    } catch (e) {
      console.warn("Could not save to binance_global_referrals:", e);
    }

    if (onReferralsUpdated) {
      onReferralsUpdated();
    }
  }, [referralsList, currentUser?.username]);

  // Unique Referral code URL builder
  const referralCode = currentUser?.username || 'member';
  const referralUrl = `https://binancetradingsystem.bit006223.workers.dev/?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Math helper for total referral stats
  const totalReferralsCount = referralsList.length;
  const pendingReferralBalance = referralsList
    .filter(r => r.status === 'pending')
    .reduce((acc, r) => acc + r.commissionEarned, 0);

  const totalBonusEarned = referralsList.reduce((acc, r) => acc + r.commissionEarned, 0);

  // Gamified Leaderboard with seeded referral superstars compiled with realuser changes
  interface LeaderboardUser {
    rank?: number;
    username: string;
    referralCount: number;
    totalVolume: number;
    totalEarnings: number;
    isCurrentUser?: boolean;
  }

  const leaderboardData = React.useMemo<LeaderboardUser[]>(() => {
    const staticReferrers: LeaderboardUser[] = [
      { username: 'CryptoKing_99', referralCount: 14, totalVolume: 142500, totalEarnings: 14250 },
      { username: 'DeFi_Wizard', referralCount: 9, totalVolume: 98000, totalEarnings: 9800 },
      { username: 'AlphaStaker', referralCount: 6, totalVolume: 45050, totalEarnings: 4505 },
      { username: 'MoonLover', referralCount: 3, totalVolume: 18000, totalEarnings: 1800 },
      { username: 'Satoshi_Son', referralCount: 1, totalVolume: 8000, totalEarnings: 800 },
    ];

    const currentUserVolume = referralsList.reduce((acc, r) => acc + r.investmentAmount, 0);
    const currentUserStats: LeaderboardUser = {
      username: currentUser?.username || currentUser?.email?.split('@')[0] || 'You (Consul)',
      referralCount: referralsList.length,
      totalVolume: currentUserVolume,
      totalEarnings: totalBonusEarned,
      isCurrentUser: true,
    };

    // Combine static referrers + active user
    const combined = [...staticReferrers];
    const existingIndex = combined.findIndex(u => u.username === currentUserStats.username);
    if (existingIndex > -1) {
      combined[existingIndex] = currentUserStats;
    } else {
      combined.push(currentUserStats);
    }

    // Sort by referral count descending, then total volume descending
    combined.sort((a, b) => {
      if (b.referralCount !== a.referralCount) {
        return b.referralCount - a.referralCount;
      }
      return b.totalVolume - a.totalVolume;
    });

    // Take top 5 and assign matching rank index
    return combined.slice(0, 5).map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  }, [referralsList, currentUser, totalBonusEarned]);

  // Simulate new friend signup & initial stake investment
  const handleAddNewReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refName.trim()) {
      alert('Please provide a friend name for the simulation.');
      return;
    }
    const amount = parseFloat(refInvAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid investment stake amount (greater than 0).');
      return;
    }

    // 10% commission calculation
    const referralBonus = Number((amount * 0.1).toFixed(2));
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const mockEmail = `${refName.toLowerCase().replace(/\s+/g, '')}_${randomSuffix}@binance-paper.com`;

    const newReferral: Referral = {
      id: `ref-${Date.now()}-${randomSuffix}`,
      name: refName,
      email: mockEmail,
      joinedAt: new Date().toLocaleDateString(),
      investmentAmount: amount,
      commissionEarned: referralBonus,
      status: 'pending'
    };

    setReferralsList((prev) => [newReferral, ...prev]);
    setRefName('');
    setRefInvAmount('');
    setShowSimNotification(true);
    setTimeout(() => setShowSimNotification(false), 5000);

    // Prompt toast notification via wallet update or direct action message
    if (onUpdateUsdtBalance) {
      // Prompt user about their new pending balance
      onUpdateUsdtBalance(0, `🎉 Simulated registration check! ${refName} subscribed. +$${referralBonus} USDT added to Pending Referrals.`);
    }
  };

  // Claim pending referral rewards into actual wallet balance
  const handleClaimPendingBonus = () => {
    if (pendingReferralBalance <= 0) {
      alert('You do not have any pending referral rewards to claim.');
      return;
    }

    if (onUpdateUsdtBalance) {
      onUpdateUsdtBalance(
        pendingReferralBalance,
        `🎉 Successfully settled and claimed +$${pendingReferralBalance.toLocaleString()} USDT from Referral Bonuses!`
      );
    }

    // Mark all pending referrals as settled/credited
    setReferralsList((prev) => 
      prev.map((r) => r.status === 'pending' ? { ...r, status: 'credited' } : r)
    );
  };

  return (
    <div id="referrals-center-wrapper" className="flex flex-col gap-4 font-sans text-xs">
      
      {/* Header Info Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1e2329]/40 rounded-lg p-3 border border-[#2b3139] gap-3">
        <div>
          <h3 className="text-gray-100 font-black text-sm flex items-center gap-1.5 uppercase tracking-wide">
            <BadgePercent size={15} className="text-[#eab308]" /> Affiliate Referral System
          </h3>
          <p className="text-gray-400 text-[10.5px] mt-0.5 leading-relaxed">
            Invite your peers using your coordinate bond and earn an immediate <strong className="text-[#eab308]">10% cash bonus</strong> on their staking investments.
          </p>
        </div>
        
        {/* Claim button directly in header */}
        <button
          onClick={handleClaimPendingBonus}
          disabled={pendingReferralBalance <= 0}
          className={`px-3 py-1.5 rounded text-[11px] font-black flex items-center gap-1.5 cursor-pointer select-none transition-all ${
            pendingReferralBalance > 0
              ? 'bg-[#eab308] text-black hover:bg-yellow-500 hover:shadow-[0_0_12px_rgba(234,179,8,0.25)]'
              : 'bg-[#2b3139] text-gray-500 cursor-not-allowed'
          }`}
        >
          <Gift size={13} />
          Settle & Claim Pending Bonus
        </button>
      </div>

      {/* Grid container: Referral details stats + Simulator tool */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* LEFT COLUMN: Stat Overview widgets and Copy URL block */}
        <div className="md:col-span-4 flex flex-col gap-3">
          
          {/* Main stats boxes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#181d23]/50 border border-[#2b3139] rounded-lg p-3 flex flex-col justify-between">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-gray-550 flex items-center gap-1">
                <Users size={12} className="text-[#0ecb81]" /> Total Peers
              </span>
              <p className="text-lg font-black text-gray-150 mt-1.5 font-mono">{totalReferralsCount}</p>
              <div className="text-[9px] text-gray-500 mt-0.5">joined members</div>
            </div>

            <div className="bg-[#181d23]/50 border border-[#2b3139] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-[#eab308] flex items-center gap-1">
                <Gift size={12} /> Pending Payout
              </span>
              <p className="text-lg font-black text-[#eab308] mt-1.5 font-mono">${pendingReferralBalance.toLocaleString()}</p>
              <button 
                onClick={handleClaimPendingBonus} 
                disabled={pendingReferralBalance <= 0}
                className="text-[9px] text-[#eab308] hover:underline font-bold mt-0.5 text-left flex items-center gap-0.5 block disabled:no-underline disabled:text-gray-500"
              >
                Claim to Wallet <ArrowUpRight size={10} className="stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Core Unique Link box */}
          <div className="bg-[#181d23]/40 border border-[#2b3139] rounded-lg p-3 flex flex-col justify-between gap-2.5">
            <div>
              <label className="text-[9.5px] text-[#848e9c] font-black uppercase tracking-wider block">
                Your Personal Ambassador Link
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="bg-[#12161a] border border-[#2b3139] rounded px-2.5 py-1.5 flex-1 font-mono text-[9px] text-[#eab308] select-all cursor-text focus:outline-none focus:border-[#eab308]"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-[#eab308] hover:bg-yellow-500 text-black p-1.5 rounded shrink-0 cursor-pointer transition-colors"
                  title="Copy Link to Clipboard"
                >
                  {copiedLink ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Dynamic generated QR Code component block */}
              <div className="mt-3.5 bg-[#12161a] border border-[#2b3139]/70 rounded-md p-3 flex flex-col items-center gap-2.5 text-center shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <QrCode size={11} className="text-[#eab308]" /> Personal QR Scan Code
                </span>
                
                <div className="p-2 bg-white rounded-md inline-block border-2 border-[#eab308]/60 shadow-[0_0_12px_rgba(234,179,8,0.1)]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(referralUrl)}&color=000000&bgcolor=ffffff`}
                    alt="Scan to join staker platform"
                    width="110"
                    height="110"
                    className="block"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <span className="text-[8.5px] text-gray-500 max-w-[170px] leading-relaxed">
                  Point any phone camera at this matrix to instantly load your exclusive coordinate signup page.
                </span>
              </div>

              {/* Quick social share action group */}
              <div className="mt-3.5 pt-3 border-t border-[#2b3139]/60">
                <label className="text-[9px] text-[#848e9c] font-black uppercase tracking-wider block mb-2">
                  ⚡ Spread Your Referral Link
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join the ultimate staker portal with me and earn premium yields! Use my referral link to get started: ")}&url=${encodeURIComponent(referralUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 bg-[#12161a] hover:bg-[#1da1f2]/10 border border-[#2b3139] hover:border-[#1da1f2]/40 text-gray-300 hover:text-[#1da1f2] py-2 px-1 rounded transition-all cursor-pointer text-center group"
                    title="Share on Twitter / X"
                  >
                    <Twitter size={14} className="stroke-[2]" />
                    <span className="text-[8.5px] mt-1 font-bold">X / Twitter</span>
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Join the ultimate yield & staking portal with me and earn high-yield daily payouts!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 bg-[#12161a] hover:bg-[#0088cc]/10 border border-[#2b3139] hover:border-[#0088cc]/40 text-gray-300 hover:text-[#0088cc] py-2 px-1 rounded transition-all cursor-pointer text-center group"
                    title="Share on Telegram"
                  >
                    <Send size={14} className="stroke-[2]" />
                    <span className="text-[8.5px] mt-1 font-bold">Telegram</span>
                  </a>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Join the ultimate yield & staking portal with me and earn high-yield daily payouts! " + referralUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 bg-[#12161a] hover:bg-[#25d366]/10 border border-[#2b3139] hover:border-[#25d366]/40 text-gray-300 hover:text-[#25d366] py-2 px-1 rounded transition-all cursor-pointer text-center group"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle size={14} className="stroke-[2]" />
                    <span className="text-[8.5px] mt-1 font-bold">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#2b3139]/80 pt-2 text-[9px] text-gray-500 leading-relaxed">
              We credit an immediate 10% commission on any amount standard friends deposit or stake across our crypto packages.
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Peer simulation registrar */}
        <div className="md:col-span-4 bg-[#181d23]/50 border border-[#2b3139] rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle size={13} className="text-[#0ecb81]" /> Sandbox Referral Simulator
            </span>
            <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">
              Manually deploy new mock signups onto your referee network to confirm rapid 10% commission calculations and state changes first-hand.
            </p>

            <form onSubmit={handleAddNewReferral} className="flex flex-col gap-2.5 mt-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Referree Full Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Alice Smith"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  className="bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-bold text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#eab308]"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase">Staking Investment Base ($ USDT)</span>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    min="1"
                    value={refInvAmount}
                    onChange={(e) => setRefInvAmount(e.target.value)}
                    className="w-full bg-[#12161a] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono font-bold text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#eab308] pr-12 text-right"
                  />
                  <span className="absolute right-3.5 top-1.5 pt-0.5 font-bold font-mono text-gray-500 text-[9px]">USDT</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0ecb81] hover:bg-emerald-500 text-black py-1.5 px-3 text-[10.5px] font-black rounded cursor-pointer transition-all flex items-center justify-center gap-1 mt-1"
              >
                <Sparkles size={11.5} className="stroke-[3]" /> Register Simulated Referral
              </button>
            </form>
          </div>

          {showSimNotification && (
            <div className="mt-2 text-[9px] bg-[#0ecb81]/10 text-[#0ecb81] rounded py-1 px-2 border border-[#0ecb81]/30 animate-pulse flex items-center gap-1.5">
              <UserCheck size={11} />
              Simulated Registration Completed successfully! 10% bonus added below.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Total Reward Overview chart/cards */}
        <div className="md:col-span-4 bg-[#181d23]/30 border border-[#2b3139] rounded-lg p-3 flex flex-col justify-between gap-2.5">
          <div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-gray-400 block font-mono">
              Reward Allocation Breakdown
            </span>
            <div className="flex flex-col gap-2 mt-2.5 font-mono">
              <div className="flex justify-between border-b border-[#2b3139]/50 pb-1.5 text-gray-400">
                <span>Commissions Pending:</span>
                <span className="font-bold text-[#eab308]">${pendingReferralBalance.toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between border-b border-[#2b3139]/50 pb-1.5 text-gray-400">
                <span>Commissions Settled:</span>
                <span className="font-bold text-[#0ecb81]">
                  ${(totalBonusEarned - pendingReferralBalance).toLocaleString()} USDT
                </span>
              </div>
              <div className="flex justify-between pb-0.5 text-gray-300 font-bold">
                <span>All-Time Commissions:</span>
                <span className="font-bold font-black text-white">${totalBonusEarned.toLocaleString()} USDT</span>
              </div>
            </div>
          </div>

          {/* High conversion guidelines summary */}
          <div className="bg-[#12161a] border border-[#2b3139]/70 rounded p-2 text-gray-450 leading-relaxed text-[9px] flex gap-1.5 items-start">
            <ShieldCheck size={13} className="text-[#0ecb81] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-300">Audited Payouts</p>
              All pending commissions are computed in sandbox real-time ledger records. Claiming transfers the balances instantly into your live USDT trading funds.
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM LAYOUT: Referee Logs and Competitive Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: REFERRAL HISTORY LISTING TABLE */}
        <div className="lg:col-span-8 bg-[#12161a]/40 border border-[#2b3139] rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-gray-410 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users size={12} className="text-[#eab308]" /> Detailed Referral History
              </span>
              <span className="text-[8.5px] bg-[#eab308]/10 text-[#eab308] font-bold px-1.5 py-0.5 rounded border border-[#eab308]/20 font-mono">
                10% Instant Bonus Rate
              </span>
            </div>

            {referralsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-500 py-8 text-center h-full min-h-[160px]">
                <Share2 className="opacity-15 mb-2" size={24} />
                <span>No records in your referral history yet. Share your portal link or register a simulated signup above to get started.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10.5px] font-mono min-w-[450px]">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#2b3139] pb-1.5 font-semibold text-[9.5px]">
                      <th className="pb-2 pl-2">Referee Details</th>
                      <th className="pb-2">Date Joined</th>
                      <th className="pb-2 text-right">Initial Stake ($)</th>
                      <th className="pb-2 text-right text-[#eab308]">Specific Bonus Earned (10%)</th>
                      <th className="pb-2 text-right pr-2">Ledger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2229]">
                    {referralsList.map((ref) => (
                      <tr key={ref.id} className="hover:bg-[#1e2329]/50 transition-all text-gray-300">
                        <td className="py-2.5 pl-2 font-bold text-gray-250">
                          <div className="flex flex-col">
                            <span>{ref.name}</span>
                            <span className="text-[9px] text-gray-550 font-normal">{ref.email}</span>
                          </div>
                        </td>
                        <td className="py-2 text-gray-450">
                          {ref.joinedAt}
                        </td>
                        <td className="py-2 text-right font-bold text-gray-200">
                          ${ref.investmentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-right font-extrabold text-[#eab308]">
                          +${ref.commissionEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                        </td>
                        <td className="py-2 text-right pr-2">
                          <span className={`inline-block px-2 py-0.5 rounded-[3px] text-[8.5px] uppercase font-bold tracking-wider ${
                            ref.status === 'pending'
                              ? 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/25'
                              : 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/25'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: COMPETITIVE LEADERBOARD */}
        <div className="lg:col-span-4 bg-[#12161a]/45 border border-[#2b3139] rounded-lg p-3.5 flex flex-col gap-3">
          <div>
            <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider font-mono block mb-1 flex items-center gap-1.5">
              <Trophy size={13} className="text-[#eab308]" /> Top Referrers Leaderboard
            </span>
            <p className="text-gray-400 text-[9.5px] leading-tight">
              Settle packages to expand your affiliate sphere and ascend the network elite rankings!
            </p>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {leaderboardData.map((user) => {
              const goldStyle = user.rank === 1 ? 'border-l-2 border-[#eab308] bg-[#eab308]/5' : '';
              const currentUserBg = user.isCurrentUser ? 'bg-[#0ecb81]/10 border border-[#0ecb81]/30 font-bold' : '';
              
              return (
                <div
                  key={user.username}
                  className={`flex items-center justify-between p-2 rounded-md ${goldStyle} ${currentUserBg} bg-[#181d23]/40 border border-[#2b3139]/50 transition-all duration-200`}
                >
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                      {user.rank === 1 ? (
                        <Crown size={12} className="text-[#eab308]" />
                      ) : user.rank === 2 ? (
                        <Medal size={11} className="text-gray-300" />
                      ) : user.rank === 3 ? (
                        <Medal size={11} className="text-amber-600" />
                      ) : (
                        <span className="text-gray-500">{user.rank}</span>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-200 flex items-center gap-1">
                        {user.username}
                        {user.isCurrentUser && (
                          <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[8px] font-extrabold px-1 py-0.5 rounded uppercase font-sans tracking-wide">
                            You
                          </span>
                        )}
                      </span>
                      <span className="text-[8.5px] text-gray-500 font-mono">
                        Vol: ${user.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT
                      </span>
                    </div>
                  </div>

                  {/* Referrals & Commissions Info */}
                  <div className="text-right font-mono">
                    <div className="text-[11.5px] text-gray-100 font-black">
                      {user.referralCount} {user.referralCount === 1 ? 'peer' : 'peers'}
                    </div>
                    <div className="text-[8.5px] text-[#eab308] font-bold">
                      +${user.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1e2329]/50 border border-[#2b3139]/80 p-2 rounded text-[9px] text-gray-450 leading-relaxed mt-auto flex items-start gap-1.5">
            <TrendingUp size={12} className="text-[#0ecb81] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-300 block mb-0.5">Top Tier Reward Multipliers</span>
              Get to #1 to grab a supercharged 1.5x commission multiplier dynamic on all new referrals. Register more refs in the sandbox to test your progress!
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
