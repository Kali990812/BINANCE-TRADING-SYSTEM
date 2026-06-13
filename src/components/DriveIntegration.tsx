import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  Award, 
  Download, 
  Upload, 
  ShieldCheck, 
  Key, 
  FileCode, 
  Search, 
  BookOpen, 
  AlertCircle,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { WalletAsset, TradingOrder } from '../types';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
}

interface DriveIntegrationProps {
  wallet: WalletAsset[];
  orders: TradingOrder[];
  onImportWallet: (importedWallet: WalletAsset[]) => void;
  currentUser?: { name: string; username: string; email: string } | null;
}

export function DriveIntegration({ wallet, orders, onImportWallet, currentUser }: DriveIntegrationProps) {
  // Authentication & Configuration State
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return localStorage.getItem('google_drive_client_id') || '';
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('google_drive_access_token') || null;
  });
  const [googleUser, setGoogleUser] = useState<any>(() => {
    const saved = localStorage.getItem('google_drive_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Mode & UI State
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    return localStorage.getItem('google_drive_use_sandbox') !== 'false';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDexOnly, setShowDexOnly] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Directory of Available Files (Live or Sandbox)
  const [files, setFiles] = useState<DriveFile[]>([]);

  // Sandbox Files Mock State
  const [sandboxFiles, setSandboxFiles] = useState<DriveFile[]>([
    { 
      id: 'mock-file-1', 
      name: 'Binance_DEX_Trade_Ledger_Sandbox_2026.csv', 
      mimeType: 'text/csv', 
      size: '2048', 
      createdTime: '2026-06-12T14:32:00.000Z' 
    },
    { 
      id: 'mock-file-2', 
      name: 'Binance_Paper_DEX_ROI_Certificate_John.txt', 
      mimeType: 'text/plain', 
      size: '512', 
      createdTime: '2026-06-13T09:12:00.000Z' 
    },
    { 
      id: 'mock-file-3', 
      name: 'Binance_DEX_Wallet_State.json', 
      mimeType: 'application/json', 
      size: '1024', 
      createdTime: '2026-06-13T10:05:00.000Z' 
    }
  ]);

  // Sandbox mocked File Content storage
  const [sandboxFileContents, setSandboxFileContents] = useState<Record<string, string>>({
    'mock-file-1': `Symbol,Side,Price,Amount,Total,Timestamp\nBTC/USDT,BUY,68250.00,0.5,34125.00,2026-06-12 14:32\nSOL/USDT,SELL,145.20,10.0,1452.00,2026-06-13 09:11`,
    'mock-file-2': `========================================================\n          BINANCE PAPER DEX TRADING CERTIFICATE\n========================================================\nTrader: @${currentUser?.username || 'Guest'}\nAccount Email: ${currentUser?.email || 'N/A'}\nActive Balance: $${wallet.find(w => w.symbol === 'USDT')?.free.toFixed(2) || '0.00'}\nPerformance Status: Approved Sovereign Investor\nAccrued Ledger Assets: ${wallet.length} currencies\nGenerated on: 2026-06-13\n========================================================`,
    'mock-file-3': JSON.stringify([
      { symbol: 'USDT', name: 'Tether USD', free: 25000, locked: 0 },
      { symbol: 'BTC', name: 'Bitcoin', free: 1.25, locked: 0 },
      { symbol: 'SOL', name: 'Solana', free: 45, locked: 0 }
    ], null, 2)
  });

  // Watch for Token Callback inside the current hash params
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setAccessToken(token);
        sessionStorage.setItem('google_drive_access_token', token);
        setIsSandboxMode(false);
        localStorage.setItem('google_drive_use_sandbox', 'false');
        
        // Fetch user profile info
        fetchUserProfile(token);
        
        // Clean hash of token and parameters to keep screen elegant
        window.history.replaceState(null, '', window.location.pathname);
        showToast('Successfully authenticated live Google Session!', 'success');
      }
    }
  }, []);

  // Sync state modifications
  useEffect(() => {
    localStorage.setItem('google_drive_client_id', googleClientId);
  }, [googleClientId]);

  useEffect(() => {
    localStorage.setItem('google_drive_use_sandbox', String(isSandboxMode));
    loadDriveFiles();
  }, [isSandboxMode, accessToken]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setActionMessage({ text: message, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 5000);
  };

  // Fetch Google User Info
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const profile = await response.json();
        setGoogleUser(profile);
        localStorage.setItem('google_drive_user_profile', JSON.stringify(profile));
      } else {
        // Expired Token
        handleLogout();
      }
    } catch (e) {
      console.warn("Couldn't retrieve authenticated user details", e);
    }
  };

  // Trigger implicit flow popup/redirect
  const handleLiveConnect = () => {
    if (!googleClientId) {
      showToast('Please insert a valid Google Web Client ID from your GCP Console first.', 'error');
      return;
    }

    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&` +
      `prompt=consent`;

    // Direct redirect is cleaner with frame rules or open in window
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('google_drive_access_token');
    localStorage.removeItem('google_drive_user_profile');
    setAccessToken(null);
    setGoogleUser(null);
    setIsSandboxMode(true);
    showToast('Signed out of Drive and returned safely to sandbox mode.', 'info');
  };

  // Load Directory of Files
  const loadDriveFiles = async () => {
    if (isSandboxMode) {
      setFiles(sandboxFiles);
      return;
    }

    if (!accessToken) return;

    setIsLoading(true);
    try {
      const query = showDexOnly 
        ? "name contains 'Binance_DEX' or name contains 'Paper_DEX' and trashed = false" 
        : "trashed = false";

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=50&fields=files(id,name,mimeType,size,createdTime)&orderBy=createdTime%20desc`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        const errorText = await response.text();
        if (response.status === 401) {
          showToast('Live authorization has expired. Re-connecting...', 'error');
          handleLogout();
        } else {
          showToast(`Error from Google APIs: ${response.statusText}`, 'error');
        }
      }
    } catch (error: any) {
      showToast(`Failed to load Google Drive files: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Drive File (Strict confirmation policy!)
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const doubleConfirm = window.confirm(
      `⚠️ CORE SECURITY EXPORT DELETION AUDIT:\n\nAre you absolutely sure you want to permanently delete "${fileName}" from Google Drive?\n\nThis action is irreversible and the document will be permanently expunged.`
    );
    
    if (!doubleConfirm) return;

    setIsLoading(true);
    try {
      if (isSandboxMode) {
        // Handle local simulation deletion
        const nextFiles = sandboxFiles.filter(f => f.id !== fileId);
        setSandboxFiles(nextFiles);
        setFiles(nextFiles);
        const nextContents = { ...sandboxFileContents };
        delete nextContents[fileId];
        setSandboxFileContents(nextContents);
        showToast('Successfully purged report from Sandbox Drive.', 'success');
      } else {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (response.ok) {
          showToast(`Successfully purged "${fileName}" from Google Drive!`, 'success');
          loadDriveFiles();
        } else {
          showToast(`Purge failed: ${response.statusText}`, 'error');
        }
      }
    } catch (e: any) {
      showToast(`Delete failed: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload/Create Drive backup files
  const createDriveFile = async (name: string, content: string, mimeType: string) => {
    setIsLoading(true);
    try {
      if (isSandboxMode) {
        // mock files addition
        const nextId = `mock-file-${Math.random().toString(36).substring(2, 9)}`;
        const newFile: DriveFile = {
          id: nextId,
          name,
          mimeType,
          size: String(content.length),
          createdTime: new Date().toISOString()
        };
        const nextFiles = [newFile, ...sandboxFiles];
        setSandboxFiles(nextFiles);
        setFiles(nextFiles);
        setSandboxFileContents({
          ...sandboxFileContents,
          [nextId]: content
        });
        showToast(`Document [${name}] exported into Sandbox system!`, 'success');
      } else {
        // Multipart Upload to Live Google Drive
        const metadata = {
          name,
          mimeType
        };
        const boundary = 'dex_drive_multi_part_boundary';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delimiter = `\r\n--${boundary}--`;

        const body = 
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n` +
          content +
          close_delimiter;

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: body
        });

        if (response.ok) {
          showToast(`Document [${name}] successfully exported and uploaded to Google Drive!`, 'success');
          loadDriveFiles();
        } else {
          showToast(`Backup upload failed: ${response.statusText}`, 'error');
        }
      }
    } catch (e: any) {
      showToast(`Backup failed: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Export 1: Trade Ledger CSV
  const handleExportTradeLedger = () => {
    if (orders.length === 0) {
      showToast('There is no registered trade history to export.', 'info');
      return;
    }
    
    let csv = 'ID,Symbol,Type,Side,Price,Amount,Total,Status,Timestamp\n';
    orders.forEach(o => {
      csv += `"${o.id}","${o.symbol}","${o.type}","${o.side}",${o.price},${o.amount},${o.total},"${o.status}","${o.timestamp}"\n`;
    });

    const timestamp = new Date().toISOString().slice(0,10);
    createDriveFile(`Binance_DEX_Trade_Ledger_${timestamp}.csv`, csv, 'text/csv');
  };

  // Export 2: Certified Trading Performance Certificate (.txt)
  const handleExportPerformanceCertificate = () => {
    const timestamp = new Date().toISOString().slice(0,10);
    const totalUsdtEquivalent = wallet.reduce((acc, current) => {
      return acc + (current.free + current.locked); // relative valuation mock
    }, 0);

    const certificate = `========================================================
            BINANCE PAPER DEX TRADING DIPLOMA
========================================================

AUTHORIZED CODES: [SHA256SEC-HASH]
INVESTOR REGISTERED: @${currentUser?.username || 'Guest Trader'}
AUTHENTICATED EMAIL: ${currentUser?.email || 'N/A'}
DATE OF GENERATION: ${new Date().toLocaleDateString()}

VALUATIONS:
--------------------------------------------------------
- Total Assets Tracked: ${wallet.length} Cryptocurrencies
- USDT Faucet Reserves: $${wallet.find(w => w.symbol === 'USDT')?.free.toFixed(2) || '0.00'} USDT
- Total Sandbox Value: $${totalUsdtEquivalent.toFixed(2)} USDT Equivalent

STAKING PORTFOLIO:
--------------------------------------------------------
Active trades logged: ${orders.length} transactions executed.

Authorized by: Binance Paper DEX Senior Controller on Cloud Run Node 3000.
========================================================`;

    createDriveFile(`Binance_Paper_DEX_ROI_Certificate_${currentUser?.username || 'Guest'}.txt`, certificate, 'text/plain');
  };

  // Export 3: Wallet Backup JSON file (can be read back and imported!)
  const handleExportWalletState = () => {
    const stateContent = JSON.stringify(wallet, null, 2);
    createDriveFile(`Binance_DEX_Wallet_State.json`, stateContent, 'application/json');
  };

  // Download and view file content
  const handlePreviewFileContent = async (file: DriveFile) => {
    try {
      let content = '';
      if (isSandboxMode) {
        content = sandboxFileContents[file.id] || 'No content provided.';
      } else {
        setIsLoading(true);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          content = await response.text();
        } else {
          showToast(`Could not fetch file content: ${response.statusText}`, 'error');
          return;
        }
      }

      alert(`📄 PREVIEW FILE content of "${file.name}":\n\n${content.substring(0, 1000)}${content.length > 1000 ? '\n... [TRUNCATED] ...' : ''}`);
    } catch (e: any) {
      showToast(`Preview failed: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore Ledger (Balance state import) from selected json file!
  const handleImportBalanceState = async (file: DriveFile) => {
    const doubleAudit = window.confirm(
      `🔄 RESTORE LEDGER AND RE-CREDIT BACKUP?\n\nAre you sure you want to load "${file.name}" to overwrite and configure your mock trading wallet?\n\nThis will instantly re-credit your live balances conforming to the archived snapshots.`
    );
    if (!doubleAudit) return;

    try {
      let content = '';
      if (isSandboxMode) {
        content = sandboxFileContents[file.id];
      } else {
        setIsLoading(true);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          content = await response.text();
        } else {
          showToast(`Restore download failed: ${response.statusText}`, 'error');
          return;
        }
      }

      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && 'symbol' in parsed[0] && 'free' in parsed[0]) {
        onImportWallet(parsed);
        showToast(`Successfully initialized and restored user balance structures of ${parsed.length} assets!`, 'success');
      } else {
        showToast('Restore rejected: Selected JSON file has an invalid wallet config schema.', 'error');
      }
    } catch (e: any) {
      showToast(`Validation check failed: invalid archived profile content. ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#12161a] border border-[#2b3139] rounded-lg p-5 font-sans relative overflow-hidden flex flex-col gap-5">
      
      {/* Toast Alert message panel overlay */}
      {actionMessage && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-2.5 rounded-md shadow-2xl text-xs font-semibold flex items-center gap-2 border transition-all animate-pulse ${
          actionMessage.type === 'success' 
            ? 'bg-[#0ecb81]/90 text-black border-[#0ecb81]' 
            : actionMessage.type === 'error'
              ? 'bg-red-500/95 text-white border-red-500'
              : 'bg-[#1e2329]/95 text-[#f0b90b] border-[#f0b90b]/50'
        }`}>
          <ShieldCheck size={14} className="shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2b3139] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-[#f0b90b]/10 text-[#f0b90b] p-1.5 rounded">
              <Cloud size={18} className="stroke-[2.5]" />
            </div>
            <h3 className="text-white text-sm font-black uppercase tracking-wider">
              Google Drive Corporate ledger Vault
            </h3>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed mt-1">
            Securely backup trade statements, export authenticated ROI certificates, and load transaction archives into your trading node.
          </p>
        </div>

        {/* AUTH CONSOLE & MODE SELECTION */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="bg-[#181d23] border border-[#2b3139] rounded p-1 flex gap-1 text-[10px] font-black uppercase select-none">
            <button
              onClick={() => setIsSandboxMode(true)}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                isSandboxMode 
                  ? 'bg-[#2b3139] text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sandbox Vault
            </button>
            <button
              onClick={() => {
                if (!accessToken) {
                  showToast('Please authenticate with G-Suite below to engage live.', 'info');
                } else {
                  setIsSandboxMode(false);
                }
              }}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 ${
                !isSandboxMode 
                  ? 'bg-gradient-to-r from-emerald-950/20 to-[#2b3139] text-[#0ecb81]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${accessToken ? 'bg-[#0ecb81] animate-ping' : 'bg-gray-600'}`}></div>
              Live G-Drive
            </button>
          </div>

          {/* Auth Button */}
          {accessToken ? (
            <div className="flex items-center gap-2 bg-emerald-950/20 border border-[#0ecb81]/20 px-2.5 py-1 rounded">
              {googleUser?.picture ? (
                <img 
                  src={googleUser.picture} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full border border-[#0ecb81]/40" 
                />
              ) : (
                <div className="w-4 h-4 bg-[#0ecb81] text-black text-[9px] font-bold rounded-full flex items-center justify-center">G</div>
              )}
              <span className="text-white text-[10px] font-mono font-bold max-w-[120px] truncate" title={googleUser?.email}>
                {googleUser?.name || 'Authorized'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-[9.5px] text-red-400 hover:text-red-300 font-extrabold cursor-pointer uppercase transition-colors ml-1.5 border-l border-[#2b3139] pl-1.5"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
              <CloudOff size={11} /> offline
            </span>
          )}
        </div>
      </div>

      {/* DETAILED CREDENTIAL CONFIGURATION PANEL (If Live Drive Offline) */}
      {!accessToken && (
        <div className="bg-[#181d23]/80 border border-[#2b3139]/70 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <h4 className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
              <Key size={13} className="text-[#f0b90b]" />
              Conjoin live Google Cloud Credentials
            </h4>
            <p className="text-gray-400 text-[10.5px] leading-relaxed mt-1">
              Connect this Binance paper DEX to your real Google Drive! Generate your Web Client ID from the Google Cloud Console (APIs & Services &gt; Credentials &gt; OAuth 2.0 Web Client ID) and grant access to Drive API.
            </p>
            <div className="mt-2.5 flex items-center gap-4 text-[10px] text-[#f0b90b]/80">
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-[#2b3139]">
                Authorized JS Origin: <strong className="text-white">{window.location.origin}</strong>
              </span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-[#2b3139]">
                Auth Scopes: <strong className="text-white">drive</strong>
              </span>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-2 bg-[#0b0e11] p-3 rounded border border-[#2b3139]">
            <label className="text-[9px] text-gray-400 font-black uppercase font-sans">CLIENT ID REGISTER</label>
            <input
              type="text"
              placeholder="pasted-client-id.apps.googleusercontent.com"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value.trim())}
              className="bg-[#12161a] border border-[#2b3139] px-2 py-1 text-[11px] font-mono text-white rounded focus:outline-none focus:border-[#f0b90b]"
            />
            <button
              onClick={handleLiveConnect}
              className="bg-[#f0b90b] hover:bg-yellow-500 text-black text-[10px] font-black uppercase py-1.5 px-3 rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              Sign In With Google
            </button>
          </div>
        </div>
      )}

      {/* QUICK WORKFLOW EXPORT TOOLBAR */}
      <div className="bg-[#181d23] border border-[#2b3139] rounded-lg p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-white text-xs font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Upload size={13} className="text-[#0ecb81]" />
            DEX Backup dispatch and Export Ledger
          </h4>
          <p className="text-gray-400 text-[10px] mt-0.5">
            Compile active local session data structures and upload them to the {isSandboxMode ? 'Sandbox Simulated Storage' : 'Live Google Drive Account'}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportTradeLedger}
            className="bg-[#2b3139] hover:bg-gray-700 text-gray-200 text-[10px] font-black uppercase px-2.5 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1.5 border border-gray-700/55"
          >
            <FileSpreadsheet size={12} className="text-[#0ecb81]" />
            Trade History (CSV)
          </button>
          <button
            onClick={handleExportPerformanceCertificate}
            className="bg-[#2b3139] hover:bg-gray-700 text-gray-200 text-[10px] font-black uppercase px-2.5 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1.5 border border-gray-700/55"
          >
            <Award size={12} className="text-yellow-400" />
            ROI Certificate (TXT)
          </button>
          <button
            onClick={handleExportWalletState}
            className="bg-emerald-950/20 hover:bg-emerald-900/30 text-[#0ecb81] border border-[#0ecb81]/25 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <FileCode size={12} />
            Wallet Archive (JSON)
          </button>
        </div>
      </div>

      {/* LOWER FILE SYSTEM EXPLORER */}
      <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 min-h-[250px] flex flex-col gap-3">
        {/* Search & Filtering header */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-[#2b3139]/60 pb-3">
          <span className="text-xs text-white font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            {isSandboxMode ? 'Simulated Sandbox Drive Core' : 'Remote Google Drive Cloud Storage'}
            {isLoading && <Loader2 size={12} className="text-[#f0b90b] animate-spin" />}
          </span>

          <div className="flex items-center gap-2">
            {/* Show All vs DEX Only toggle */}
            {!isSandboxMode && (
              <button
                onClick={() => {
                  setShowDexOnly(!showDexOnly);
                  loadDriveFiles();
                }}
                className={`text-[9.5px] px-2 py-1 rounded transition-all cursor-pointer font-bold ${
                  showDexOnly 
                    ? 'bg-[#2b3139] text-[#f0b90b]' 
                    : 'bg-black/50 text-gray-500 hover:text-gray-300'
                }`}
              >
                {showDexOnly ? 'DEX Files Only' : 'Show All Drive Content'}
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={loadDriveFiles}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors cursor-pointer"
              title="Refresh ledger files"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search size={11} className="absolute left-2 top-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search backups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#12161a] border border-[#2b3139] rounded pl-6.5 pr-2 py-1 text-[10.5px] text-white focus:outline-none focus:border-[#f0b90b] w-36 sm:w-44 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Directory Row Content */}
        <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 flex flex-col gap-1.5">
          {filteredFiles.map((file) => {
            const isJsonWallet = file.name.endsWith('.json') && file.name.includes('Wallet');
            return (
              <div 
                key={file.id} 
                className="bg-[#12161a]/70 hover:bg-gray-800/25 border border-[#2b3139]/40 hover:border-[#2b3139] p-3 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded text-xs ${
                    file.name.endsWith('.csv') 
                      ? 'bg-[#0ecb81]/10 text-[#0ecb81]' 
                      : file.name.endsWith('.json')
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    <FileCode size={16} />
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-mono font-bold hover:underline cursor-pointer" onClick={() => handlePreviewFileContent(file)}>
                      {file.name}
                    </h5>
                    <div className="flex items-center gap-2.5 text-[9.5px] text-gray-500 mt-1 font-mono">
                      <span>DocID: {file.id.substring(0, 14)}...</span>
                      {file.size && <span>• {(parseFloat(file.size)/1024).toFixed(2)} KB</span>}
                      {file.createdTime && <span>• Created {new Date(file.createdTime).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Preview Button */}
                  <button
                    onClick={() => handlePreviewFileContent(file)}
                    className="p-1 px-2.5 bg-[#2b3139]/40 hover:bg-gray-800 text-gray-300 text-[9.5px] font-bold uppercase rounded cursor-pointer transition-colors flex items-center gap-1"
                    title="Preview file content"
                  >
                    <Eye size={12} />
                    View Content
                  </button>

                  {/* Restore Wallet (For JSON files only) */}
                  {isJsonWallet && (
                    <button
                      onClick={() => handleImportBalanceState(file)}
                      className="p-1 px-2.5 bg-[#0ecb81]/10 hover:bg-[#0ecb81] text-[#0ecb81] hover:text-black text-[9.5px] font-black uppercase rounded cursor-pointer transition-colors flex items-center gap-1"
                      title="Import balances from backup"
                    >
                      <Download size={12} />
                      Restore Balance
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                    title="Purge document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CloudOff size={24} className="text-gray-600 mb-2" />
              <p className="text-gray-400 text-xs font-bold uppercase">No Ledger Archives Retrieved</p>
              <p className="text-gray-500 text-[10px] mt-0.5">
                {searchTerm ? 'No backups match your search filters.' : 'Use the export tools above to register your first DEX backup.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* INFO GRAPHIC GUIDE */}
      <div className="bg-[#181d23] border border-[#2b3139] rounded-lg p-3.5 flex items-start gap-2.5">
        <AlertCircle size={15} className="text-[#f0b90b] shrink-0 mt-0.5" />
        <div>
          <h5 className="text-[#f0b90b] text-[11px] font-black uppercase tracking-wide">Developer & Sandbox Credentials Note</h5>
          <p className="text-[#848e9c] text-[10px] leading-relaxed mt-0.5">
            If you do not have a live Google Developer Console OAuth Client ID, you can use the fully functional **Sandbox Vault Mode**. In Sandbox Mode, any backups or exports you run will correctly compile files locally and simulate Drive directories. Let traders safely verify file structures, preview exported balances, download CSV logs, or restore account states with 100% offline precision.
          </p>
        </div>
      </div>

    </div>
  );
}
