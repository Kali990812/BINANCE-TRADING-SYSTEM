import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Wallet, 
  Coins, 
  Activity, 
  Check, 
  X, 
  FileText, 
  UserPlus, 
  Power, 
  Terminal, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Award, 
  Clock, 
  Lock, 
  Unlock, 
  AlertCircle 
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: { name: string; username: string; email: string; role: string };
  onClose: () => void;
  onRefreshDEXBalance?: () => void;
}

export function AdminPortal({ currentUser, onClose, onRefreshDEXBalance }: AdminPortalProps) {
  const isSenior = currentUser.role === 'senior_admin';
  const roleName = isSenior ? 'Senior Administrator' : 'Junior Administrator';

  // State caches loaded from localStorage
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [txRequests, setTxRequests] = useState<any[]>([]);
  const [investmentReqs, setInvestmentReqs] = useState<any[]>([]);
  const [siteLogs, setSiteLogs] = useState<any[]>([]);
  const [juniorApproved, setJuniorApproved] = useState<boolean>(false);

  // New User Form fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserBalance, setNewUserBalance] = useState('1000');
  const [createUserMsg, setCreateUserMsg] = useState('');

  // Active admin console tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits' | 'withdrawals' | 'investments' | 'logs'>('overview');

  // Load state from localStorage on mount and when log updates occur
  const loadLocalStorageState = () => {
    // 1. Registered users
    const usersRaw = localStorage.getItem('binance_registered_users');
    if (usersRaw) {
      setRegisteredUsers(JSON.parse(usersRaw));
    } else {
      const defaultUsers = [
        { id: 'user-1', name: 'John Doe', username: 'john_doe', email: 'john@binance-sim.net', status: 'approved', balanceUsdt: 24500, createdAt: '2026-06-10 14:32' },
        { id: 'user-2', name: 'Sarah Connor', username: 'sarah_c', email: 'sarah@binance-sim.net', status: 'approved', balanceUsdt: 5000, createdAt: '2026-06-11 09:12' }
      ];
      localStorage.setItem('binance_registered_users', JSON.stringify(defaultUsers));
      setRegisteredUsers(defaultUsers);
    }

    // 2. Transaction requests (deposits/withdrawals)
    const txRaw = localStorage.getItem('binance_transaction_requests');
    setTxRequests(txRaw ? JSON.parse(txRaw) : []);

    // 3. Investment requests
    const invRaw = localStorage.getItem('binance_investment_requests');
    setInvestmentReqs(invRaw ? JSON.parse(invRaw) : []);

    // 4. Site activity logs
    const logsRaw = localStorage.getItem('binance_site_activities');
    setSiteLogs(logsRaw ? JSON.parse(logsRaw) : []);

    // 5. Junior Admin approval status
    const approvedVal = localStorage.getItem('binance_junior_approved');
    setJuniorApproved(approvedVal === 'true');
  };

  useEffect(() => {
    loadLocalStorageState();
    // Log Admin entry
    const logsRaw = localStorage.getItem('binance_site_activities');
    const logs = logsRaw ? JSON.parse(logsRaw) : [];
    logs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      actor: currentUser.username,
      role: currentUser.role,
      action: 'Admin Panel Access',
      details: `${roleName} entered the Admin Control Dashboard to monitor operations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    });
    localStorage.setItem('binance_site_activities', JSON.stringify(logs));
    setSiteLogs(logs);
  }, []);

  const addLog = (action: string, details: string) => {
    const logsRaw = localStorage.getItem('binance_site_activities');
    const logs = logsRaw ? JSON.parse(logsRaw) : [];
    logs.unshift({
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      actor: currentUser.username,
      role: currentUser.role,
      action: action,
      details: details,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    });
    localStorage.setItem('binance_site_activities', JSON.stringify(logs));
    setSiteLogs(logs);
  };

  // Senior Admin action wrappers -> check senior permission
  const checkSeniorPermission = (): boolean => {
    if (!isSenior) {
      alert('🔒 Authorization Denied: Junior Administrators have Read-Only permissions only.');
      return false;
    }
    return true;
  };

  // Toggle Junior approved status
  const handleToggleJuniorApproved = () => {
    if (!checkSeniorPermission()) return;
    const nextVal = !juniorApproved;
    localStorage.setItem('binance_junior_approved', nextVal.toString());
    setJuniorApproved(nextVal);
    addLog(
      nextVal ? 'Approved Junior Admin Session' : 'Suspended Junior Admin Session', 
      `Senior Admin toggled login permission for "junior_admin". Status set to: ${nextVal ? 'APPROVED' : 'RESTRICTED'}.`
    );
  };

  // Approve a user registration
  const handleApproveUser = (username: string) => {
    if (!checkSeniorPermission()) return;
    const updatedUsers = registeredUsers.map(user => {
      if (user.username === username) {
        return { ...user, status: 'approved' };
      }
      return user;
    });
    localStorage.setItem('binance_registered_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);
    
    addLog('Approved User Account', `Approved pending user registration for "${username}"`);
    alert(`User Account ${username} approved & activated!`);
  };

  // Create a new approved user directly
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkSeniorPermission()) return;
    
    if (!newUserName || !newUserUsername || !newUserEmail || !newUserPassword) {
      setCreateUserMsg('⚠️ Please fill in all fields.');
      return;
    }

    const usernameLower = newUserUsername.toLowerCase().trim();
    const emailLower = newUserEmail.toLowerCase().trim();

    // Check if username already exists
    if (registeredUsers.some(u => u.username === usernameLower)) {
      setCreateUserMsg('⚠️ Username is already taken.');
      return;
    }

    const initialUsdt = parseFloat(newUserBalance) || 0;
    const newUserObj = {
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      name: newUserName,
      username: usernameLower,
      email: emailLower,
      password: newUserPassword,
      status: 'approved', // Directly approved by Senior Admin!
      balanceUsdt: initialUsdt,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedUsers = [...registeredUsers, newUserObj];
    localStorage.setItem('binance_registered_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);

    addLog('Created New User Account', `Senior Admin created approved user profile for "${usernameLower}" with entry deposit of $${initialUsdt} USDT.`);
    
    setNewUserName('');
    setNewUserUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserBalance('1000');
    setCreateUserMsg('✓ User account successfully created in active state!');
  };

  // Approve a deposit request
  const handleApproveDeposit = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let depositAmt = 0;

    const updatedTx = txRequests.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        depositAmt = req.amount;
        return { ...req, status: 'approved' };
      }
      return req;
    });

    localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedTx));
    setTxRequests(updatedTx);

    // Add USDT to the target user's registered user balance
    const updatedUsers = registeredUsers.map(u => {
      if (u.username === targetUsername) {
        return { ...u, balanceUsdt: Number(((u.balanceUsdt || 0) + depositAmt).toFixed(2)) };
      }
      return u;
    });
    localStorage.setItem('binance_registered_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);

    // If the currently active logged-in trader is the same as the target of this deposit, we also update the current session's lock-free wallet immediately
    const loggedInUser = JSON.parse(localStorage.getItem('binance_current_user') || '{}');
    if (loggedInUser.username === targetUsername) {
      const walletRaw = localStorage.getItem('binance_mock_wallet');
      if (walletRaw) {
        const wallet = JSON.parse(walletRaw);
        const updatedWallet = wallet.map((w: any) => {
          if (w.symbol === 'USDT') {
            return { ...w, free: Number((w.free + depositAmt).toFixed(2)) };
          }
          return w;
        });
        localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));
      }
    }

    addLog('Approved Deposit', `Approved pending deposit request (${requestId}) for "${targetUsername}" of $${depositAmt} USDT.`);
    if (onRefreshDEXBalance) {
      onRefreshDEXBalance();
    }
    alert(`Verified TxHash & Approved Deposit of $${depositAmt} USDT for @${targetUsername}. Account credited!`);
  };

  // Reject a deposit request
  const handleRejectDeposit = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let depositAmt = 0;

    const updatedTx = txRequests.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        depositAmt = req.amount;
        return { ...req, status: 'rejected' };
      }
      return req;
    });

    localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedTx));
    setTxRequests(updatedTx);

    addLog('Rejected Deposit', `Rejected invalid pending deposit request (${requestId}) for "${targetUsername}" of $${depositAmt} USDT.`);
    alert(`Deposit request of $${depositAmt} USDT for @${targetUsername} has been rejected.`);
  };

  // Approve a withdrawal request
  const handleApproveWithdrawal = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let withdrawAmt = 0;
    let netAmt = 0;

    const updatedTx = txRequests.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        withdrawAmt = req.amount;
        netAmt = req.netAmount;
        return { ...req, status: 'approved' };
      }
      return req;
    });

    localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedTx));
    setTxRequests(updatedTx);

    addLog('Approved Withdrawal', `Approved pending withdrawal (${requestId}) for @${targetUsername} of $${withdrawAmt} USDT. Net payout: $${netAmt} USDT.`);
    alert(`Withdrawal Approved successfully! Net payout of $${netAmt} USDT processed for @${targetUsername}.`);
  };

  // Reject a withdrawal request (Deduction Refund)
  const handleRejectWithdrawal = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let withdrawAmt = 0;

    const updatedTx = txRequests.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        withdrawAmt = req.amount;
        return { ...req, status: 'rejected' };
      }
      return req;
    });

    localStorage.setItem('binance_transaction_requests', JSON.stringify(updatedTx));
    setTxRequests(updatedTx);

    // Refund the user's registered user balance
    const updatedUsers = registeredUsers.map(u => {
      if (u.username === targetUsername) {
        return { ...u, balanceUsdt: Number(((u.balanceUsdt || 0) + withdrawAmt).toFixed(2)) };
      }
      return u;
    });
    localStorage.setItem('binance_registered_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);

    // Refund standard session wallet if they are currently logged in
    const loggedInUser = JSON.parse(localStorage.getItem('binance_current_user') || '{}');
    if (loggedInUser.username === targetUsername) {
      const walletRaw = localStorage.getItem('binance_mock_wallet');
      if (walletRaw) {
        const wallet = JSON.parse(walletRaw);
        const updatedWallet = wallet.map((w: any) => {
          if (w.symbol === 'USDT') {
            return { ...w, free: Number((w.free + withdrawAmt).toFixed(2)) };
          }
          return w;
        });
        localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));
      }
    }

    addLog('Rejected Withdrawal & Refunded', `Rejected pending withdrawal request (${requestId}) for "${targetUsername}". Refunded $${withdrawAmt} USDT back to available trading balance.`);
    if (onRefreshDEXBalance) {
      onRefreshDEXBalance();
    }
    alert(`Withdrawal request of $${withdrawAmt} USDT rejected! Funds refunded back to @${targetUsername}'s account available trading balance.`);
  };

  // Approve a pending Investment allocation
  const handleApproveInvestment = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let planId = '';
    let depositAmt = 0;
    let yieldDailyUsd = 0;
    let durationDays = 30;

    // 1. Update request status
    const updatedReqs = investmentReqs.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        planId = req.planId;
        depositAmt = req.depositAmount;
        yieldDailyUsd = req.yieldDailyUsd;
        durationDays = req.durationDays;
        return { ...req, status: 'approved' };
      }
      return req;
    });
    localStorage.setItem('binance_investment_requests', JSON.stringify(updatedReqs));
    setInvestmentReqs(updatedReqs);

    // 2. Add as live active investment in `'binance_active_investments'`
    const activeRaw = localStorage.getItem('binance_active_investments') || '[]';
    const activeList = JSON.parse(activeRaw);
    
    const newActiveInv = {
      id: `inv-${Math.random().toString(36).substring(2, 9)}`,
      planId: planId,
      depositAmount: depositAmt,
      accruedProfit: 0,
      timestamp: Date.now(), // Active starting now
      lastUpdated: Date.now(),
      username: targetUsername,
      yieldDailyUsd: yieldDailyUsd,
      status: 'approved'
    };

    activeList.unshift(newActiveInv);
    localStorage.setItem('binance_active_investments', JSON.stringify(activeList));

    addLog('Activated Staking Investment', `Approved and activated investment plan "${planId}" ($${depositAmt} USDT) for user "@${targetUsername}".`);
    alert(`Investment activated! User @${targetUsername} has officially allocation of $${depositAmt} USDT with live yield accumulation.`);
  };

  // Reject a pending Investment allocation (Refund)
  const handleRejectInvestment = (requestId: string) => {
    if (!checkSeniorPermission()) return;

    let targetUsername = '';
    let depositAmt = 0;
    let planId = '';

    const updatedReqs = investmentReqs.map(req => {
      if (req.id === requestId) {
        targetUsername = req.username;
        depositAmt = req.depositAmount;
        planId = req.planId;
        return { ...req, status: 'rejected' };
      }
      return req;
    });
    localStorage.setItem('binance_investment_requests', JSON.stringify(updatedReqs));
    setInvestmentReqs(updatedReqs);

    // Refund User USDT balance
    const updatedUsers = registeredUsers.map(u => {
      if (u.username === targetUsername) {
        return { ...u, balanceUsdt: Number(((u.balanceUsdt || 0) + depositAmt).toFixed(2)) };
      }
      return u;
    });
    localStorage.setItem('binance_registered_users', JSON.stringify(updatedUsers));
    setRegisteredUsers(updatedUsers);

    // Refund active session wallet if they are logged in
    const loggedInUser = JSON.parse(localStorage.getItem('binance_current_user') || '{}');
    if (loggedInUser.username === targetUsername) {
      const walletRaw = localStorage.getItem('binance_mock_wallet');
      if (walletRaw) {
        const wallet = JSON.parse(walletRaw);
        const updatedWallet = wallet.map((w: any) => {
          if (w.symbol === 'USDT') {
            return { ...w, free: Number((w.free + depositAmt).toFixed(2)) };
          }
          return w;
        });
        localStorage.setItem('binance_mock_wallet', JSON.stringify(updatedWallet));
      }
    }

    addLog('Rejected Staking Plan', `Rejected pending staking allocation "${planId}" for @${targetUsername}. Refunded $${depositAmt} USDT.`);
    if (onRefreshDEXBalance) {
      onRefreshDEXBalance();
    }
    alert(`Investment purchase of $${depositAmt} USDT for @${targetUsername} was rejected. Funds refunded.`);
  };

  // Metric summaries
  const pendingUsersCount = registeredUsers.filter(u => u.status === 'pending').length;
  const pendingDeposits = txRequests.filter(tx => tx.type === 'deposit' && tx.status === 'pending');
  const pendingWithdrawals = txRequests.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending');
  const pendingInvestments = investmentReqs.filter(inv => inv.status === 'pending');

  return (
    <div id="admin-overall-portal-curtain" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div id="admin-panel-main-modal" className="w-full max-w-6xl bg-[#0b0e11] border border-[#2b3139] rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-[85vh] overflow-hidden text-gray-200">
        
        {/* TOP STATUS BAR */}
        <div className="bg-[#12161a] border-b border-[#2b3139] px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#f0b90b]/15 text-[#f0b90b] p-2 rounded-lg animate-pulse">
              <Shield size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wider uppercase text-white font-sans">
                  Binance Paper DEX Administrator Registry
                </h2>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isSenior ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/15'
                }`}>
                  {isSenior ? 'Senior Authority' : 'Junior Sandbox Access'}
                </span>
              </div>
              <p className="text-gray-400 text-[11px] font-mono mt-0.5">
                Active Session Operator: <strong className="text-gray-200">@{currentUser.username}</strong> ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="bg-[#2b3139] hover:bg-gray-700 text-white font-black px-4 py-1.5 rounded text-[10.5px] uppercase tracking-wider cursor-pointer transition-colors"
            >
              Exit to DEX Live Node
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* SIDEBAR TABS */}
          <div className="w-full md:w-56 bg-[#12161a]/60 border-r border-[#2b3139]/80 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 select-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center gap-2 border-b md:border-b-0 border-r md:border-r-0 border-[#2b3139] shrink-0 font-sans ${
                activeTab === 'overview' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={14} />
              DEX Overview Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center justify-between gap-2 border-b md:border-b-0 border-r md:border-r-0 border-[#2b3139] shrink-0 font-sans ${
                activeTab === 'users' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users size={14} />
                User Registry
              </span>
              {pendingUsersCount > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{pendingUsersCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center justify-between gap-2 border-b md:border-b-0 border-r md:border-r-0 border-[#2b3139] shrink-0 font-sans ${
                activeTab === 'deposits' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-[#0ecb81]" />
                Deposit Requests
              </span>
              {pendingDeposits.length > 0 && (
                <span className="bg-[#0ecb81]/25 text-[#0ecb81] text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingDeposits.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center justify-between gap-2 border-b md:border-b-0 border-r md:border-r-0 border-[#2b3139] shrink-0 font-sans ${
                activeTab === 'withdrawals' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ArrowUpRight size={14} className="text-[#f6465d]" />
                Withdrawal Audits
              </span>
              {pendingWithdrawals.length > 0 && (
                <span className="bg-red-500/25 text-red-400 text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingWithdrawals.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center justify-between gap-2 border-b md:border-b-0 border-r md:border-r-0 border-[#2b3139] shrink-0 font-sans ${
                activeTab === 'investments' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Award size={14} />
                Plan Approvals
              </span>
              {pendingInvestments.length > 0 && (
                <span className="bg-yellow-500/25 text-[#f0b90b] text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingInvestments.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 md:flex-none py-3.5 px-5 text-left text-xs font-bold uppercase transition-colors flex items-center gap-2 shrink-0 font-sans ${
                activeTab === 'logs' ? 'bg-[#0b0e11] text-[#f0b90b] border-l-2 border-l-[#f0b90b]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity size={14} />
              Site Action Logs
            </button>
          </div>

          {/* MAIN TAB CONTENT */}
          <div className="flex-1 p-5 overflow-y-auto">
            
            {/* OVERVIEW TABLE */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-gray-400 font-bold uppercase">Total Users</span>
                    <strong className="text-2xl text-white font-black font-mono">{registeredUsers.length}</strong>
                    <span className="text-[10px] text-gray-500 mt-1">Registrés sur le simulateur</span>
                  </div>
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-gray-400 font-bold uppercase">Pending Registrations</span>
                    <strong className="text-2xl text-red-400 font-black font-mono">{pendingUsersCount}</strong>
                    <span className="text-[10px] text-gray-500 mt-1">Require Senior Approval</span>
                  </div>
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-gray-400 font-bold uppercase">Pending Treasury Ops</span>
                    <strong className="text-2xl text-[#0ecb81] font-black font-mono">
                      {pendingDeposits.length + pendingWithdrawals.length}
                    </strong>
                    <span className="text-[10px] text-gray-500 mt-1">Deposits / Withdrawals</span>
                  </div>
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs text-gray-400 font-bold uppercase">Pending Investments</span>
                    <strong className="text-2xl text-[#f0b90b] font-black font-mono">{pendingInvestments.length}</strong>
                    <span className="text-[10px] text-gray-500 mt-1">Staking Tier Activations</span>
                  </div>
                </div>

                {/* READ-ONLY DISCLAIMER ON JUNIOR */}
                {!isSenior && (
                  <div className="bg-[#eab308]/5 border border-[#eab308]/20 rounded-lg p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="text-[#eab308] shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-[#eab308] font-bold text-xs uppercase tracking-wide">Junior Admin mode active (Monitor Only)</h4>
                      <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                        You are logged in under a read-only role. You are free to inspect users, audit logs, verify transactions, and monitor junior activities on the site but cannot alter standard user accounts or toggle financial authorizations.
                      </p>
                    </div>
                  </div>
                )}

                {/* SENIOR EXCLUSIVE TARIFF JUNIOR APPROVAL */}
                <div className="bg-[#12161a]/90 border border-[#2b3139] rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={16} className="text-[#f0b90b]" />
                      Junior Admin Control Panel Session Gateway
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 max-w-xl leading-relaxed">
                      All Junior Admin logins require explicit Senior Admin approval before they are allowed to initiate sessions. Suspended logins will prompt a 🔒 locked warning at the access terminal.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-[#0b0e11] px-4 py-2.5 rounded-lg border border-[#2b3139]/80 shrink-0 select-none">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Junior Admin Status</span>
                      <strong className={`text-xs font-mono font-extrabold capitalize ${juniorApproved ? 'text-[#0ecb81]' : 'text-red-400'}`}>
                        {juniorApproved ? 'Approved Logging Allowed' : 'Strictly Restricted'}
                      </strong>
                    </div>

                    <button
                      type="button"
                      disabled={!isSenior}
                      onClick={handleToggleJuniorApproved}
                      className={`ml-2 px-3.5 py-1.5 rounded text-[10px] uppercase font-black cursor-pointer transition-all flex items-center gap-1.5 ${
                        !isSenior 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : juniorApproved 
                            ? 'bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-[#0ecb81]/20'
                      }`}
                    >
                      {juniorApproved ? (
                        <>
                          <Lock size={12} />
                          Revoke Login
                        </>
                      ) : (
                        <>
                          <Unlock size={12} />
                          Authorize Login
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ACTIONS FEED SYNOPSIS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Pending Transactions */}
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col h-[280px]">
                    <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3">
                      Pending Transfers awaiting audit ({pendingDeposits.length + pendingWithdrawals.length})
                    </span>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1.5">
                      {pendingDeposits.map((req) => (
                        <div key={req.id} className="bg-[#0b0e11] border border-[#2b3139]/50 rounded p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[9px] font-black uppercase px-2 py-0.5 rounded mr-2">Deposit</span>
                            <span className="font-mono text-gray-300 font-extrabold">@{req.username}</span>
                            <p className="text-[10px] text-gray-500 mt-1">TxHash: {req.refHash?.substring(0, 18)}...</p>
                          </div>
                          <strong className="text-[#0ecb81] font-mono font-black">+${req.amount} USDT</strong>
                        </div>
                      ))}
                      {pendingWithdrawals.map((req) => (
                        <div key={req.id} className="bg-[#0b0e11] border border-[#2b3139]/50 rounded p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="bg-red-500/15 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded mr-2">Withdraw</span>
                            <span className="font-mono text-gray-300 font-extrabold">@{req.username}</span>
                            <p className="text-[10px] text-gray-500 mt-1">Fee (9%): ${req.fee?.toFixed(2)} USDT</p>
                          </div>
                          <strong className="text-red-400 font-mono font-black">-${req.amount} USDT</strong>
                        </div>
                      ))}
                      {pendingDeposits.length === 0 && pendingWithdrawals.length === 0 && (
                        <div className="text-center text-gray-500 py-10 font-mono text-xs">
                          No pending cash workflows registered.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Site activity snapshot */}
                  <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4 flex flex-col h-[280px]">
                    <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3">
                      Real-time Operations Trail (Junior Highlighted)
                    </span>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1.5 font-mono text-[10.5px]">
                      {siteLogs.slice(0, 15).map((log) => {
                        const isJuniorAction = log.actor === 'junior_admin';
                        return (
                          <div key={log.id} className={`p-2 rounded border ${
                            isJuniorAction 
                              ? 'bg-[#eab308]/5 border-[#eab308]/25 text-[#eab308]' 
                              : 'bg-[#0b0e11] border-[#2b3139]/40 text-gray-300'
                          }`}>
                            <div className="flex justify-between font-bold">
                              <span>{log.action}</span>
                              <span className="text-gray-500 font-normal">{log.timestamp?.split(' ')[0]}</span>
                            </div>
                            <p className={`mt-1 text-[10px] leading-relaxed ${isJuniorAction ? 'text-gray-300' : 'text-gray-400'}`}>
                              Actor: <strong className="text-gray-200">@{log.actor}</strong> • {log.details}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USER REGISTRY AND ACCOUNT CREATION */}
            {activeTab === 'users' && (
              <div className="flex flex-col gap-5">
                {/* 1. Create Direct Active sandbox User Accounts (Senior exclusive) */}
                <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                  <h3 className="text-xs text-white font-black uppercase tracking-wider border-b border-[#2b3139] pb-2 mb-3.5 flex items-center gap-1.5">
                    <UserPlus size={14} className="text-[#0ecb81]" />
                    Register and Provision Approved Sandbox User (Senior Admin Exclusive)
                  </h3>

                  <form onSubmit={handleCreateNewUser} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-bold uppercase">Human Full Name</label>
                      <input
                        type="text"
                        required
                        disabled={!isSenior}
                        placeholder="John Doe"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-bold uppercase">Username Profile</label>
                      <input
                        type="text"
                        required
                        disabled={!isSenior}
                        placeholder="john_doe"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-bold uppercase">Sandbox Email</label>
                      <input
                        type="email"
                        required
                        disabled={!isSenior}
                        placeholder="john@binance-sim.net"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-bold uppercase">Secure Password</label>
                      <input
                        type="password"
                        required
                        disabled={!isSenior}
                        placeholder="••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] text-gray-400 font-bold uppercase">USDT Seed Balance</label>
                      <input
                        type="number"
                        required
                        disabled={!isSenior}
                        min="0"
                        placeholder="1000"
                        value={newUserBalance}
                        onChange={(e) => setNewUserBalance(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] px-2.5 py-1.5 rounded font-mono text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                    </div>
                    
                    <div className="sm:col-span-5 flex justify-between items-center mt-2 border-t border-[#2b3139]/40 pt-3">
                      <span className="text-[10.5px] font-mono text-gray-400">{createUserMsg}</span>
                      <button
                        type="submit"
                        disabled={!isSenior}
                        className={`px-5 py-1.5 rounded text-[10px] font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
                          !isSenior 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-[#2b3139]' 
                            : 'bg-[#f0b90b] hover:bg-yellow-500 text-black font-extrabold cursor-pointer'
                        }`}
                      >
                        <UserPlus size={13} />
                        Register & Approve Account
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Registered Users list (Approve pending ones, see details) */}
                <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                  <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3.5">
                    User Registry Database Directory ({registeredUsers.length} Users)
                  </span>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#2b3139] text-gray-400 text-[10px] font-sans">
                          <th className="pb-2.5 pl-2 font-bold uppercase">Name</th>
                          <th className="pb-2.5 font-bold uppercase">Username</th>
                          <th className="pb-2.5 font-bold uppercase">Email</th>
                          <th className="pb-2.5 font-bold uppercase">Created At</th>
                          <th className="pb-2.5 text-right font-bold uppercase">Trading Funds</th>
                          <th className="pb-2.5 text-center font-bold uppercase">Approval Status</th>
                          <th className="pb-2.5 pr-2 text-right font-bold uppercase">Core Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredUsers.map((user) => (
                          <tr key={user.id || user.username} className="border-b border-[#2b3139]/40 hover:bg-gray-800/25 transition-colors">
                            <td className="py-2.5 pl-2 text-white font-medium">{user.name}</td>
                            <td className="py-2.5 text-gray-300">@{user.username}</td>
                            <td className="py-2.5 text-gray-400">{user.email}</td>
                            <td className="py-2.5 text-gray-500">{user.createdAt || 'N/A'}</td>
                            <td className="py-2.5 text-right font-bold text-gray-200">
                              ${(user.balanceUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                user.status === 'approved' 
                                  ? 'bg-[#0ecb81]/15 text-[#0ecb81]' 
                                  : 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/20'
                              }`}>
                                {user.status || 'approved'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-2 text-right">
                              {user.status === 'pending' ? (
                                <button
                                  disabled={!isSenior}
                                  onClick={() => handleApproveUser(user.username)}
                                  className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase transition-all ${
                                    !isSenior 
                                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-[#2b3139]' 
                                      : 'bg-[#0ecb81]/20 hover:bg-[#0ecb81] hover:text-black text-[#0ecb81] cursor-pointer'
                                  }`}
                                >
                                  Approve Account
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-500 italic">No Action Needed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DEPOSIT VERIFICATION CHECKS */}
            {activeTab === 'deposits' && (
              <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3.5">
                  Deposit Request Queue Verification Terminal
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#2b3139] text-gray-400 text-[10px] font-sans">
                        <th className="pb-2.5 pl-2 font-bold uppercase">Timestamp</th>
                        <th className="pb-2.5 font-bold uppercase">Applicant</th>
                        <th className="pb-2.5 font-bold uppercase">Blockchain Protocol</th>
                        <th className="pb-2.5 font-bold uppercase">Staking TxHash</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Amount</th>
                        <th className="pb-2.5 text-center font-bold uppercase">Auditor Status</th>
                        <th className="pb-2.5 pr-2 text-right font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txRequests.filter(tx => tx.type === 'deposit').map((req) => (
                        <tr key={req.id} className="border-b border-[#2b3139]/40 hover:bg-gray-800/25 transition-colors">
                          <td className="py-2.5 pl-2 text-gray-400">{req.timestamp}</td>
                          <td className="py-2.5 text-white font-bold">@{req.username}</td>
                          <td className="py-2.5 text-gray-400 uppercase">{req.network}</td>
                          <td className="py-2.5 text-[#eab308] cursor-pointer hover:underline text-[11px]" title={req.refHash}>
                            {req.refHash ? `${req.refHash.substring(0, 20)}...` : 'Direct API Faucet'}
                          </td>
                          <td className="py-2.5 text-right text-[#0ecb81] font-black">${req.amount?.toLocaleString()} USDT</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              req.status === 'approved' 
                                ? 'bg-[#0ecb81]/15 text-[#0ecb81]' 
                                : req.status === 'rejected' 
                                  ? 'bg-red-500/15 text-red-400' 
                                  : 'bg-[#eab308]/15 text-[#eab308] animate-pulse border border-[#eab308]/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            {req.status === 'pending' ? (
                              <div className="inline-flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleApproveDeposit(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81] hover:text-black cursor-pointer'
                                  }`}
                                  title="Approve / Crediter USDT"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleRejectDeposit(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer'
                                  }`}
                                  title="Reject Transaction"
                                >
                                  <X size={14} className="stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 uppercase italic font-sans font-bold">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {txRequests.filter(tx => tx.type === 'deposit').length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-gray-500 py-12 font-mono">
                            No external deposits filed in memory. Users can file deposit allocations using the USDT Deposit Desk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WITHDRAWAL AUDITS */}
            {activeTab === 'withdrawals' && (
              <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3.5">
                  Withdrawal Payment Gateway Audit Desk (Enforcing flat 9% interest exit tax)
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#2b3139] text-gray-400 text-[10px] font-sans">
                        <th className="pb-2.5 pl-2 font-bold uppercase">Timestamp</th>
                        <th className="pb-2.5 font-bold uppercase">Applicant</th>
                        <th className="pb-2.5 font-bold uppercase">Network</th>
                        <th className="pb-2.5 font-bold uppercase">Target Wallet Address</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Staked Term Amount</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Fee (9% flat)</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Net Payout</th>
                        <th className="pb-2.5 text-center font-bold uppercase">Auditor Status</th>
                        <th className="pb-2.5 pr-2 text-right font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txRequests.filter(tx => tx.type === 'withdrawal').map((req) => (
                        <tr key={req.id} className="border-b border-[#2b3139]/40 hover:bg-gray-800/25 transition-colors">
                          <td className="py-2.5 pl-2 text-gray-400">{req.timestamp}</td>
                          <td className="py-2.5 text-white font-bold">@{req.username}</td>
                          <td className="py-2.5 text-gray-400 uppercase">{req.network}</td>
                          <td className="py-2.5 text-gray-150" title={req.address}>
                            {req.address ? `${req.address.substring(0, 18)}...` : 'Direct API Faucet'}
                          </td>
                          <td className="py-2.5 text-right text-gray-300">${req.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</td>
                          <td className="py-2.5 text-right text-red-400">${req.fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</td>
                          <td className="py-2.5 text-right text-[#0ecb81] font-black">${req.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              req.status === 'approved' 
                                ? 'bg-[#0ecb81]/15 text-[#0ecb81]' 
                                : req.status === 'rejected' 
                                  ? 'bg-red-500/15 text-red-400' 
                                  : 'bg-[#eab308]/15 text-[#eab308] animate-pulse border border-[#eab308]/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            {req.status === 'pending' ? (
                              <div className="inline-flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleApproveWithdrawal(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81] hover:text-black cursor-pointer'
                                  }`}
                                  title="Approve payout"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleRejectWithdrawal(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer'
                                  }`}
                                  title="Reject & Refund"
                                >
                                  <X size={14} className="stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 uppercase italic font-sans font-bold">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {txRequests.filter(tx => tx.type === 'withdrawal').length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center text-gray-500 py-12 font-mono">
                            No pending withdrawal orders filed in memory.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INVESTMENT PLAN ACTIVATIONS */}
            {activeTab === 'investments' && (
              <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                <span className="text-xs text-white font-extrabold uppercase tracking-wider block border-b border-[#2b3139] pb-2 mb-3.5">
                  Pending Staking Contract Activations Queue
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[#2b3139] text-gray-400 text-[10px] font-sans">
                        <th className="pb-2.5 pl-2 font-bold uppercase">Applicant</th>
                        <th className="pb-2.5 font-bold uppercase">Investment Plan</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Duration</th>
                        <th className="pb-2.5 text-right font-bold uppercase">Daily return Yield</th>
                        <th className="pb-2.5 text-right font-bold uppercase font-black">Deposit Allocation</th>
                        <th className="pb-2.5 text-center font-bold uppercase">Status</th>
                        <th className="pb-2.5 pr-2 text-right font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investmentReqs.map((req) => (
                        <tr key={req.id} className="border-b border-[#2b3139]/40 hover:bg-gray-800/25 transition-colors">
                          <td className="py-2.5 pl-2 text-white font-bold">@{req.username}</td>
                          <td className="py-2.5 text-gray-200">
                            <span className="bg-gradient-to-r from-yellow-500/10 to-transparent text-[#f0b90b] px-2 py-0.5 rounded border border-[#f0b90b]/15 font-sans font-bold text-[10px] tracking-wide">
                              {req.planName}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-gray-400">{req.durationDays} Days</td>
                          <td className="py-2.5 text-right text-emerald-400 font-bold">+${req.yieldDailyUsd} USDT/Day</td>
                          <td className="py-2.5 text-right text-white font-black">${req.depositAmount} USDT</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              req.status === 'approved' 
                                ? 'bg-[#0ecb81]/15 text-[#0ecb81]' 
                                : req.status === 'rejected' 
                                  ? 'bg-red-500/15 text-red-400' 
                                  : 'bg-[#eab308]/15 text-[#eab308] animate-pulse border border-[#eab308]/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            {req.status === 'pending' ? (
                              <div className="inline-flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleApproveInvestment(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81] hover:text-black cursor-pointer'
                                  }`}
                                  title="Approve & Activate Yield contract"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!isSenior}
                                  onClick={() => handleRejectInvestment(req.id)}
                                  className={`p-1 rounded transition-colors ${
                                    !isSenior 
                                      ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed' 
                                      : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer'
                                  }`}
                                  title="Reject & Refund USDT"
                                >
                                  <X size={14} className="stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 uppercase italic font-sans font-bold">Activated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {investmentReqs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-gray-500 py-12 font-mono">
                            No pending staking plans requested for approval yet. Users can request them under the "Invest" tab.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ACTION LOGS */}
            {activeTab === 'logs' && (
              <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-4">
                <div className="flex justify-between items-center border-b border-[#2b3139] pb-2 mb-3.5">
                  <span className="text-xs text-white font-extrabold uppercase tracking-wider">
                    Site Operations Audit Trail Logbook
                  </span>
                  <span className="text-[9px] bg-yellow-500/10 text-[#f0b90b] px-2 py-0.5 rounded font-mono font-bold">
                    SECURED CRYPTO LOGS
                  </span>
                </div>

                <div className="flex flex-col gap-2 font-mono text-[10.5px] max-h-[50vh] overflow-y-auto pr-1.5">
                  {siteLogs.map((log) => {
                    const isJuniorLog = log.actor === 'junior_admin';
                    const isSeniorLog = log.role === 'senior_admin';
                    return (
                      <div key={log.id} className={`p-2.5 rounded border ${
                        isJuniorLog 
                          ? 'bg-[#eab308]/5 border-[#eab308]/20 text-[#eab308]' 
                          : isSeniorLog 
                            ? 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                            : 'bg-[#0b0e11] border-[#2b3139]/40 text-gray-300'
                      }`}>
                        <div className="flex justify-between font-bold text-[10px] opacity-80 mb-1">
                          <span className="uppercase">[{log.action}]</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">
                          Actor: <strong>@{log.actor}</strong> ({log.role}) • {log.details}
                        </p>
                      </div>
                    );
                  })}
                  {siteLogs.length === 0 && (
                    <div className="text-center text-gray-500 py-12 font-mono">
                      Log trail initialization empty.
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* BOTTOM FOOLPROOF AUDIT BANNER */}
        <div className="bg-[#12161a] border-t border-[#2b3139] px-5 py-3 flex justify-between items-center text-[10px] font-mono text-gray-500 select-none">
          <span>Licensed Core Admin Portal Ledger System v4.5</span>
          <span>DEX Clock (UTC): {new Date().toUTCString()}</span>
        </div>
      </div>
    </div>
  );
}
