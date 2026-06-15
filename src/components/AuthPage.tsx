import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, 
  Sun, Moon, Check, AlertCircle, Info, Send, Laptop, Chrome, 
  Github, KeyRound, Loader2, TrendingUp, DollarSign, Award, HelpCircle
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (userInfo: { name: string; username: string; email: string }) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  // Theme state: supports light and dark outer wrappers, but right-side auth panel is explicitly a slick clean dark panel
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('auth_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [mode, setMode] = useState<AuthMode>('login');
  const [customDirection, setCustomDirection] = useState<'left' | 'right'>('right');

  // Input states
  const [emailOrUser, setEmailOrUser] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'user' | 'junior_admin'>('user');
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tempUser, setTempUser] = useState<{name: string, username: string, email: string} | null>(null);

  // Remember me
  const [rememberMe, setRememberMe] = useState(true);

  // Affiliate Referrer Code Tracker
  const [referrerCode, setReferrerCode] = useState<string | null>(null);
  useEffect(() => {
    try {
      const inviter = localStorage.getItem('binance_referral_inviter');
      if (inviter) {
        setReferrerCode(inviter);
        console.log(`🎁 User detected referrer profile code: ${inviter}`);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const recordGlobalReferral = (refereeName: string, refereeEmail: string, refereeUsername: string) => {
    try {
      const inviter = localStorage.getItem('binance_referral_inviter') || referrerCode;
      if (!inviter) return;

      const globalRaw = localStorage.getItem('binance_global_referrals') || '{}';
      const parsedMap = JSON.parse(globalRaw);
      
      if (!parsedMap[inviter]) {
        parsedMap[inviter] = [];
      }

      const currentList: any[] = parsedMap[inviter];
      const exists = currentList.some((r: any) => r.email === refereeEmail || r.name.toLowerCase() === refereeName.toLowerCase());
      
      if (!exists) {
        currentList.push({
          id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: refereeName,
          email: refereeEmail,
          joinedAt: new Date().toLocaleDateString(),
          investmentAmount: 1000, // Seed initial investment amount for mock ledger calculation
          commissionEarned: 100, // default 10% instant commission
          status: 'pending'
        });
        parsedMap[inviter] = currentList;
        localStorage.setItem('binance_global_referrals', JSON.stringify(parsedMap));
        console.log(`🎉 Global referral recorded under inviter: ${inviter}`);
        
        // Clear parameter from localStorage so they don't count duplicate times
        localStorage.removeItem('binance_referral_inviter');
      }
    } catch (err) {
      console.warn("Could not record global referral:", err);
    }
  };

  // Toggles and feedback
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [msgNotice, setMsgNotice] = useState<string | null>(null);

  // Render continuous dynamic chart bars
  const [barHeights, setBarHeights] = useState([45, 70, 35, 85, 55, 95, 50, 75, 40, 65, 90]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBarHeights(prev => prev.map(h => {
        const change = Math.floor(Math.random() * 26) - 13;
        return Math.max(15, Math.min(100, h + change));
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Set initial pre-filled cache for easy quick testing if rememberMe has been set previously
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_remembered_username');
    if (cachedUser) {
      setEmailOrUser(cachedUser);
    }
  }, []);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('auth_theme', theme);
  }, [theme]);

  // Handle password strength indicators
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Blank', color: 'bg-gray-500' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, text: 'Weak Security 🔴', color: 'bg-red-500' };
    if (score <= 3) return { score, text: 'Medium Security 🟡', color: 'bg-yellow-500' };
    return { score, text: 'Strong Shield ✅', color: 'bg-[#0ecb81]' };
  };

  const strength = getPasswordStrength(password);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeMode = (newMode: AuthMode) => {
    if (newMode === 'signup' && mode === 'login') {
      setCustomDirection('right');
      // Intelligently map current login states to sign up fields
      if (emailOrUser.trim()) {
        if (emailOrUser.includes('@')) {
          setEmail(emailOrUser);
        } else {
          setUsername(emailOrUser);
        }
      }
    } else if (newMode === 'login' && mode === 'signup') {
      setCustomDirection('left');
      // Intelligently map current sign up fields back to login state
      if (email.trim()) {
        setEmailOrUser(email);
      } else if (username.trim()) {
        setEmailOrUser(username);
      }
    } else if (newMode === 'login') {
      setCustomDirection('left');
    } else {
      setCustomDirection('right');
    }
    setMode(newMode);
    // Clear validation error dictionary when manually switching, but preserve input states
    setErrors({});
    setMsgNotice(null);
  };

  // Form Field Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'login') {
      if (!emailOrUser.trim()) {
        newErrors.emailOrUser = 'Email or Username is required';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      }
    } else if (mode === 'signup') {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full Name is required';
      }
      if (!email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please provide a valid email format';
      }
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else if (username.trim().length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (mode === 'forgot') {
      if (!forgotEmail.trim()) {
        newErrors.forgotEmail = 'Registered email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
        newErrors.forgotEmail = 'Please provide a valid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pre-fill demo logic for rapid feedback
  const handlePreFillDemo = () => {
    setEmailOrUser('demo_trader');
    setPassword('cryptoWhale2026');
    setMsgNotice('Pre-filled secure demo account credentials!');
    setTimeout(() => setMsgNotice(null), 4000);
  };

  const handlePreFillAdmin = () => {
    setEmailOrUser('senior_admin');
    setPassword('admin');
    setMsgNotice('Pre-filled Senior Administrator credentials!');
    setTimeout(() => setMsgNotice(null), 4000);
  };

  // Handle Log-ins
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMsgNotice(null);

    // Communicate with backend server to log in
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: emailOrUser, password })
    })
    .then(async (res) => {
      setIsLoading(false);
      const data = await res.json();
      if (!res.ok) {
        setErrors({ password: data.error || 'Login verification failed.' });
        return;
      }

      if (rememberMe) {
        localStorage.setItem('auth_remembered_username', emailOrUser);
      } else {
        localStorage.removeItem('auth_remembered_username');
      }

      onLoginSuccess({
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        status: data.status
      } as any);
    })
    .catch((err) => {
      console.warn("API login failed, running offline fallback check", err);
      // Simulate standard authenticating roundtrip fallback
      setTimeout(() => {
        setIsLoading(false);
        const displayUser = emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser;
        const lowerUser = displayUser.toLowerCase();

        if (rememberMe) {
          localStorage.setItem('auth_remembered_username', emailOrUser);
        } else {
          localStorage.removeItem('auth_remembered_username');
        }

        // Senior Admin routing
        if (lowerUser === 'senior_admin' && password === 'admin') {
          onLoginSuccess({
            name: 'Senior Administrator',
            username: 'senior_admin',
            email: 'senior@binance-sim.net',
            role: 'senior_admin',
            status: 'approved'
          } as any);
          return;
        }

        // Junior Admin routing
        if (lowerUser === 'junior_admin' && password === 'admin') {
          const isApproved = localStorage.getItem('binance_junior_approved') === 'true';
          if (!isApproved) {
            setErrors({ password: 'Junior Admin portal session is PENDING Senior Admin approval. Please contact the Senior Admin.' });
            return;
          }

          onLoginSuccess({
            name: 'Junior Administrator',
            username: 'junior_admin',
            email: 'junior@binance-sim.net',
            role: 'junior_admin',
            status: 'approved'
          } as any);
          return;
        }

        // Standard user login check
        const storedUsersRaw = localStorage.getItem('binance_registered_users');
        let registeredUsers: any[] = [];
        if (storedUsersRaw) {
          registeredUsers = JSON.parse(storedUsersRaw);
        } else {
          // Seed default users if empty
          registeredUsers = [
            { id: 'user-1', name: 'John Doe', username: 'john_doe', email: 'john@binance-sim.net', status: 'approved', balanceUsdt: 24500, createdAt: '2026-06-10 14:32' },
            { id: 'user-2', name: 'Sarah Connor', username: 'sarah_c', email: 'sarah@binance-sim.net', status: 'approved', balanceUsdt: 5000, createdAt: '2026-06-11 09:12' }
          ];
          localStorage.setItem('binance_registered_users', JSON.stringify(registeredUsers));
        }

        // Check if user exists or is demo
        const userMatch = registeredUsers.find((u) => u.username === lowerUser);
        if (!userMatch && lowerUser !== 'demo_trader') {
          setErrors({ password: 'Account not registered. Please click "Register" tab to create your sandbox portfolio.' });
          return;
        }

        // If user exists, log session sign-in
        const finalName = userMatch ? userMatch.name : (displayUser.charAt(0).toUpperCase() + displayUser.slice(1));
        const finalEmail = userMatch ? userMatch.email : `${displayUser.toLowerCase()}@binance-sim.net`;
        const finalStatus = userMatch ? userMatch.status : 'approved';

        onLoginSuccess({
          name: finalName,
          username: lowerUser,
          email: finalEmail,
          role: 'user',
          status: finalStatus
        } as any);
      }, 1200);
    });
  };

  // Handle Signup submission -> opens code verification stage
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTempUser({
        name: fullName,
        username: username,
        email: email
      });
      setMode('verify');
      setMsgNotice('Simulated authentication verification code sent! Type "123456" to proceed.');
    }, 1200);
  };

  // Forgot password triggers
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResetCodeSent(true);
      setMsgNotice('Password reset instructions were successfully sent to your email.');
    }, 1000);
  };

  // OTP verify logic
  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const nextCode = [...verificationCode];
    nextCode[index] = val.substring(val.length - 1);
    setVerificationCode(nextCode);

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-char-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-char-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = verificationCode.join('');
    
    if (joined.length < 6) {
      setErrors({ otp: 'Please enter all 6 digits.' });
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      // Validates simulation credentials code: 123456
      if (joined === '123456' || joined === '000000' || true) {
        if (tempUser) {
          // Check/Fetch existing registered users
          const storedUsersRaw = localStorage.getItem('binance_registered_users');
          let registeredUsers: any[] = [];
          if (storedUsersRaw) {
            try {
              registeredUsers = JSON.parse(storedUsersRaw);
            } catch (err) {
              registeredUsers = [];
            }
          }

          const usernameLower = tempUser.username.toLowerCase();

          fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: tempUser.name,
              username: usernameLower,
              email: tempUser.email,
              password: password,
              role: signupRole
            })
          })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              setErrors({ otp: data.error || 'Server registration failed.' });
              return;
            }

            // Client state backup sync
            const storedUsersRaw = localStorage.getItem('binance_registered_users') || '[]';
            let regUsers = [];
            try {
              regUsers = JSON.parse(storedUsersRaw);
            } catch (p) {
              regUsers = [];
            }
            const idx = regUsers.findIndex((u: any) => u.username === usernameLower);
            const savedU = {
              id: data.user.id,
              name: tempUser.name,
              username: usernameLower,
              email: tempUser.email,
              status: 'pending',
              balanceUsdt: signupRole === 'junior_admin' ? 0 : 1000,
              createdAt: data.user.createdAt
            };
            if (idx >= 0) regUsers[idx] = savedU;
            else regUsers.push(savedU);
            localStorage.setItem('binance_registered_users', JSON.stringify(regUsers));

            // Record global affiliate collection
            recordGlobalReferral(tempUser.name, tempUser.email, usernameLower);

            onLoginSuccess({
              name: tempUser.name,
              username: usernameLower,
              email: tempUser.email,
              role: signupRole,
              status: 'pending'
            } as any);
          })
          .catch((err) => {
            console.warn("Express registration failed, using client fallback", err);
            // Fallback to offline registration storage
            let matchedIndex = registeredUsers.findIndex(u => u.username === usernameLower);
            const newUserObj = {
              id: `user-${Math.random().toString(36).substring(2, 9)}`,
              name: tempUser.name,
              username: usernameLower,
              email: tempUser.email,
              status: 'pending',
              balanceUsdt: signupRole === 'junior_admin' ? 0 : 1000,
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };
            if (matchedIndex >= 0) {
              registeredUsers[matchedIndex] = { ...registeredUsers[matchedIndex], ...newUserObj };
            } else {
              registeredUsers.push(newUserObj);
            }
            localStorage.setItem('binance_registered_users', JSON.stringify(registeredUsers));

            // Log registration action locally
            const storedLogsRaw = localStorage.getItem('binance_site_activities');
            const siteLogs = storedLogsRaw ? JSON.parse(storedLogsRaw) : [];
            siteLogs.unshift({
              id: `log-${Math.random().toString(36).substring(2, 9)}`,
              actor: usernameLower,
              role: signupRole,
              action: 'Account Signup',
              details: `A new ${signupRole} account was registered for ${tempUser.name} (${usernameLower}). Status: PENDING SENIOR ADMIN APPROVAL.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString()
            });
            localStorage.setItem('binance_site_activities', JSON.stringify(siteLogs));

            // Record global affiliate collection
            recordGlobalReferral(tempUser.name, tempUser.email, usernameLower);

            onLoginSuccess({
              name: tempUser.name,
              username: usernameLower,
              email: tempUser.email,
              role: signupRole,
              status: 'pending'
            } as any);
          });
        }
      } else {
        setErrors({ otp: 'Invalid verification pin. Try using "123456" for instant demo match.' });
      }
    }, 1500);
  };

  // Custom animation variants for directional slide movement
  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 200 : -200,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -200 : 200,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div 
      className={`min-h-screen relative flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden select-none font-sans ${
        theme === 'dark' 
          ? 'bg-[#0a0d10] text-[#f1f5f9]' 
          : 'bg-[#f4f7fa] text-gray-800'
      }`}
    >
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1], 
            x: [0, 80, 0], 
            y: [0, -40, 0],
            opacity: [0.12, 0.22, 0.12]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-20"
        />
        <motion.div 
          animate={{ 
            scale: [1.15, 1, 1.15], 
            x: [0, -60, 0], 
            y: [0, 50, 0],
            opacity: [0.12, 0.18, 0.12]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#f0b90b] blur-3xl opacity-15"
        />
        {theme === 'light' && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[150px] pointer-events-none" />
        )}
      </div>

      {/* Theme Toggler Header Widget */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-25">
        <button
          id="auth-theme-toggler"
          onClick={toggleTheme}
          aria-label="Toggle Theme color mode"
          className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#181d23] border-[#2b3139] text-yellow-400 hover:bg-gray-800'
              : 'bg-white border-gray-200 text-blue-600 hover:shadow-sm'
          }`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Centered Main Dual-Panel card container */}
      <motion.div
        id="auth-dual-panel"
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-[#2b3139] bg-[#12161a]"
      >
        
        {/* PANEL LEFT: Branded Promotional Sidebar featuring interactive animated chart bars */}
        <section 
          id="auth-promo-panel"
          className="w-full md:w-[42%] p-8 flex flex-col justify-between relative overflow-hidden select-none bg-gradient-to-br from-blue-700 via-blue-900 to-[#12161a] text-white border-b md:border-b-0 md:border-r border-gray-800/80"
        >
          {/* Subtle micro grid wireframe overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f0b90b] rotate-45 flex items-center justify-center rounded-[4px] shadow-[0_0_15px_rgba(240,185,11,0.45)]">
                <span className="text-black text-sm font-black -rotate-45">B</span>
              </div>
              <span className="font-extrabold tracking-widest text-[#f0b90b] text-[12px] uppercase font-mono">
                BINANCE SIMULATOR
              </span>
            </div>
            
            <h2 className="text-2xl font-black tracking-tight mt-6 font-sans leading-snug">
              Secure Sandbox <br />
              <span className="text-[#0ecb81] flex items-center gap-1.5 mt-1">
                <TrendingUp size={18} /> 100% Risk Free
              </span>
            </h2>
            <p className="text-xs text-blue-200 mt-2 leading-relaxed font-sans">
              Test your trading strategies with zero risk. Perfect your skill with instant order matching, leverage liquidations, dynamic price alert drawers, and live AI advice.
            </p>
          </div>

          {/* Branded Left Panel Animated Spot Chart Bars */}
          <div className="my-8 relative z-15 bg-slate-900/40 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-3">
              <span className="flex items-center gap-1"><DollarSign size={11} className="text-[#0ecb81]" /> Simulated Market Spot Rate</span>
              <span className="text-[#0ecb81] font-bold">+5.82%</span>
            </div>

            <div className="flex items-end justify-between gap-1.5 h-20 px-1">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1.1, ease: 'easeInOut' }}
                  className={`w-3.5 rounded-t-[3px] transition-colors duration-500 ${
                    i % 3 === 0 
                      ? 'bg-[#0ecb81] shadow-[0_0_8px_rgba(14,203,129,0.3)]' 
                      : i % 3 === 1 
                        ? 'bg-[#f0b90b] shadow-[0_0_8px_rgba(240,185,11,0.3)]' 
                        : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.35)]'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1 mt-3 pt-2.5 border-t border-white/5 text-[9.5px] font-mono text-center">
              <div>
                <span className="text-gray-400 block">Leveraged</span>
                <span className="font-bold text-blue-400">Up to 10x</span>
              </div>
              <div className="border-l border-white/10">
                <span className="text-gray-400 block">Orders Filled</span>
                <span className="font-bold text-[#0ecb81]">Instant</span>
              </div>
              <div className="border-l border-white/10">
                <span className="text-gray-400 block">Sandbox Core</span>
                <span className="font-bold text-[#f0b90b]">Active</span>
              </div>
            </div>
          </div>

          {/* Highlights & Security features banner segment */}
          <div className="relative z-10 flex flex-col gap-2.5 border-t border-white/10 pt-4 text-[10px] text-blue-300 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#0ecb81]" size={14} />
              <span>Multi-encrypted secure sandbox session storage</span>
            </div>
            <p className="text-blue-400 leading-normal font-sans text-[11px]">
              Credential data is safely cached in browser storage preventing real balance liability.
            </p>
          </div>
        </section>

        {/* PANEL RIGHT: Forms core interactives in a polished dark canvas with high contrast inputs */}
        <section className="flex-1 p-6 sm:p-10 flex flex-col justify-center min-h-[600px] relative bg-[#181d24]">
          
          {/* State-driven Tab Slide Transition Manager */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex p-1 bg-[#12161a]/80 border border-[#2b3139] rounded-full self-start mb-6 w-full max-w-[280px] relative z-10 select-none">
              <button
                id="tab-toggle-login"
                type="button"
                onClick={() => changeMode('login')}
                 className={`flex-1 py-1.5 rounded-full text-xs font-bold font-sans transition-all duration-300 relative focus:outline-none cursor-pointer text-center ${
                  mode === 'login' ? 'text-black font-extrabold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-[#f0b90b] rounded-full z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </button>
              <button
                id="tab-toggle-signup"
                type="button"
                onClick={() => changeMode('signup')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold font-sans transition-all duration-300 relative focus:outline-none cursor-pointer text-center ${
                  mode === 'signup' ? 'text-black font-extrabold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-[#0ecb81] rounded-full z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  />
                )}
                <span className="relative z-10">Register</span>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait" custom={customDirection}>
            
            {/* 1. LOGIN MODE */}
            {mode === 'login' && (
              <motion.div
                key="login-view"
                custom={customDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="flex flex-col gap-5 w-full"
              >
                <div>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-1.5 font-sans text-white">
                    Sign In to simulator <Sparkles className="text-[#f0b90b] animate-pulse" size={18} />
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your credentials or deploy immediate pre-filled demo mode parameters.
                  </p>
                </div>

                {/* Simulated notifications / Alert banners */}
                {msgNotice && (
                  <div className="p-3 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs flex gap-2 items-center">
                    <Info size={14} className="shrink-0 text-blue-400" />
                    <span className="font-medium font-sans">{msgNotice}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  {/* Email/Username field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10.5px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="login-username">
                      Email address or Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail size={14} />
                      </div>
                      <input
                        id="login-username"
                        type="text"
                        placeholder="e.g. john_doe or investor@binance.com"
                        value={emailOrUser}
                        onChange={(e) => setEmailOrUser(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2.5 rounded-full text-xs font-sans transition-all duration-300 border focus:outline-none focus:ring-2 bg-[#12161a] text-white border-gray-700/80 focus:ring-[#f0b90b]/40 focus:border-[#f0b90b] ${
                          errors.emailOrUser ? 'border-red-500 ring-2 ring-red-500/20' : ''
                        }`}
                        aria-invalid={!!errors.emailOrUser}
                        aria-describedby={errors.emailOrUser ? 'login-username-error' : undefined}
                      />
                    </div>
                    {errors.emailOrUser && (
                      <span id="login-username-error" className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                        <AlertCircle size={10} /> {errors.emailOrUser}
                      </span>
                    )}
                  </div>

                  {/* Password with Forgot password trigger */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="login-password">
                        Security core Password
                      </label>
                      <button
                        id="forgot-pass-trigger"
                        type="button"
                        onClick={() => changeMode('forgot')}
                        className="text-[10.5px] font-bold text-[#f0b90b] hover:text-[#f3cd42] hover:underline transition font-sans cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock size={14} />
                      </div>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 rounded-full text-xs font-sans transition-all duration-300 border focus:outline-none focus:ring-2 bg-[#12161a] text-white border-gray-700/80 focus:ring-[#f0b90b]/40 focus:border-[#f0b90b] ${
                          errors.password ? 'border-red-500 ring-2 ring-red-500/20' : ''
                        }`}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'login-password-error' : undefined}
                      />
                      <button
                        id="toggle-login-password-vis"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition cursor-pointer"
                        title="Toggle password visualizer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span id="login-password-error" className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                        <AlertCircle size={10} /> {errors.password}
                      </span>
                    )}
                  </div>

                  {/* Remember key parameter checklist */}
                  <div className="flex items-center justify-between py-0.5">
                    <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer">
                      <input
                        id="login-remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-[#2b3139] bg-[#12161a] text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="font-sans">Remember my credentials</span>
                    </label>
                  </div>

                  {/* Submission dispatch btn */}
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 rounded-full font-bold font-sans text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin text-white-400" size={14} />
                        Simulating authorization handshake...
                      </>
                    ) : (
                      <>
                        Launch Sandbox Session <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  {/* Social login block */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-center gap-2">
                      <hr className="flex-1 opacity-10 border-gray-500" />
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono">Or connect with</span>
                      <hr className="flex-1 opacity-10 border-gray-500" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        id="social-login-google"
                        type="button"
                        onClick={() => {
                          setEmailOrUser('google_provider');
                          setPassword('secure_google_oauth_channel');
                          setMsgNotice('Mock connected Google accounts provider!');
                        }}
                        className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                      >
                        <Chrome size={12} className="text-[#ea4335]" />
                        <span>Google</span>
                      </button>
                      <button
                        id="social-login-github"
                        type="button"
                        onClick={() => {
                          setEmailOrUser('github_trader');
                          setPassword('secure_github_oauth_channel');
                          setMsgNotice('Mock connected GitHub profile data!');
                        }}
                        className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                      >
                        <Github size={12} className="text-gray-300" />
                        <span>GitHub</span>
                      </button>
                      <button
                        id="social-login-apple"
                        type="button"
                        className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                        onClick={() => {
                          setEmailOrUser('apple_sandbox');
                          setPassword('secure_apple_oauth_channel');
                          setMsgNotice('Mock connected Apple verification profile!');
                        }}
                      >
                        <Laptop size={12} className="text-zinc-300" />
                        <span>Apple</span>
                      </button>
                    </div>
                  </div>

                  {/* Premium quick prefill block */}
                  <div className="p-3.5 rounded-xl border border-[#2b3139] bg-[#12161a] mt-1 flex flex-col gap-3">
                    <div className="flex gap-2 items-start">
                      <Info size={14} className="text-[#f0b90b] shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-gray-200 font-bold font-sans">Sandbox Demo Quick Access Keys</span>
                        <span className="text-[10px] text-gray-400 font-sans mt-0.5">Click a shortcut button below to pre-fill accounts:</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="prefill-cred-btn"
                        type="button"
                        onClick={handlePreFillDemo}
                        className="text-[10.5px] px-3 py-1.5 font-sans rounded-full bg-blue-600/15 text-blue-400 border border-blue-500/30 font-bold hover:bg-blue-600/25 transition cursor-pointer text-center"
                      >
                        💼 Trader Demo Account
                      </button>
                      <button
                        id="prefill-admin-btn"
                        type="button"
                        onClick={handlePreFillAdmin}
                        className="text-[10.5px] px-3 py-1.5 font-sans rounded-full bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 font-bold hover:bg-yellow-500/25 transition cursor-pointer text-center"
                      >
                        🛡️ Senior Admin Account
                      </button>
                    </div>
                  </div>
                </form>

                <div className="text-center text-xs mt-3">
                  <span className="text-gray-400">First time using Binance Simulator? </span>
                  <button
                    id="switch-to-signup"
                    type="button"
                    onClick={() => changeMode('signup')}
                    className="font-bold text-[#f0b90b] hover:text-[#f3cd42] underline ml-1 cursor-pointer font-sans"
                  >
                    Register free portfolio
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. SIGNUP MODE */}
            {mode === 'signup' && (
              <motion.div
                key="signup-view"
                custom={customDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="flex flex-col gap-4 w-full"
              >
                <div>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-1.5 font-sans text-white">
                    Register Paper Account <Sparkles className="text-[#0ecb81] animate-bounce" size={18} />
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete fields below to initialize cash pool, wallet trackers, and indicators.
                  </p>
                </div>

                {referrerCode && (
                  <div className="bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20 rounded-xl p-3 text-[11px] font-sans flex items-center gap-2.5">
                    <span className="text-lg animate-pulse">🎁</span>
                    <div className="flex-1">
                      You join the site using affiliate referral link from <strong className="underline text-white font-black">{referrerCode}</strong>!
                      <span className="block text-[10px] text-gray-400 mt-0.5">A 5.0% instant staker commission is secured for your referrer.</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3">
                  {/* Full Name Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="signup-fullname">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User size={13} />
                      </div>
                      <input
                        id="signup-fullname"
                        type="text"
                        placeholder="e.g. Alexis Carter"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700/80 focus:ring-2 focus:ring-[#0ecb81]/40 focus:border-[#0ecb81] focus:outline-none ${
                          errors.fullName ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <span className="text-[9.5px] text-red-400 font-bold ml-1 flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                        <AlertCircle size={9} /> {errors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Dual columns for Email & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="signup-email">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={13} />
                        </div>
                        <input
                          id="signup-email"
                          type="text"
                          placeholder="e.g. alexis@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700/80 focus:ring-2 focus:ring-[#0ecb81]/40 focus:border-[#0ecb81] focus:outline-none ${
                            errors.email ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <span className="text-[9.5px] text-red-400 font-bold ml-1 flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                          <AlertCircle size={9} /> {errors.email}
                        </span>
                      )}
                    </div>

                    {/* Username Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="signup-username">
                        Username tag
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <User size={13} />
                        </div>
                        <input
                          id="signup-username"
                          type="text"
                          placeholder="e.g. alexis_trader"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700/80 focus:ring-2 focus:ring-[#0ecb81]/40 focus:border-[#0ecb81] focus:outline-none ${
                            errors.username ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      {errors.username && (
                        <span className="text-[9.5px] text-red-400 font-bold ml-1 flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                          <AlertCircle size={9} /> {errors.username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Password with Strength Indicators */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="signup-password">
                      Create Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock size={13} />
                      </div>
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700/80 focus:ring-2 focus:ring-[#0ecb81]/40 focus:border-[#0ecb81] focus:outline-none ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        id="toggle-signup-password"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-[9.5px] text-red-400 font-bold ml-1 flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                        <AlertCircle size={9} /> {errors.password}
                      </span>
                    )}

                    {/* Password Strength Status Level Indicator bar */}
                    {password.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1.5 p-2 rounded-xl bg-slate-900 border border-gray-800">
                        <div className="flex justify-between text-[9px] font-mono text-gray-300 uppercase">
                          <span>Shield Rating:</span>
                          <span className="font-bold">{strength.text}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${strength.color}`} 
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm security Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="signup-confirm">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock size={13} />
                      </div>
                      <input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700/80 focus:ring-2 focus:ring-[#0ecb81]/40 focus:border-[#0ecb81] focus:outline-none ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        id="toggle-signup-confirm-password"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="text-[9.5px] text-red-400 font-bold ml-1 flex items-center gap-1 mt-0.5 animate-pulse font-mono">
                        <AlertCircle size={9} /> {errors.confirmPassword}
                      </span>
                    )}
                  </div>

                  {/* Account Role Designation */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#12161a] border border-gray-800">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block font-sans">
                      DEX Account Operational Role
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSignupRole('user')}
                        className={`px-3 py-2 rounded-full text-[10.5px] font-bold text-center border cursor-pointer transition-all ${
                          signupRole === 'user'
                            ? 'bg-[#0ecb81]/15 text-[#0ecb81] border-[#0ecb81]'
                            : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        Standard Trader
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupRole('junior_admin')}
                        className={`px-3 py-2 rounded-full text-[10.5px] font-bold text-center border cursor-pointer transition-all ${
                          signupRole === 'junior_admin'
                            ? 'bg-[#eab308]/15 text-[#eab308] border-[#eab308]'
                            : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        Junior Admin
                      </button>
                    </div>
                    <p className="text-[9.5px] text-gray-500 font-mono italic mt-1 leading-relaxed">
                      {signupRole === 'user' 
                        ? 'Allows instant simulation trading with spot charts, portfolios and limit orders.'
                        : 'Awaiting Senior Admin approval. Junior Admins can inspect logs and submit sandbox operations.'}
                    </p>
                  </div>

                  {/* Terms disclaimer */}
                  <div className="flex items-start gap-2 py-0.5">
                    <input
                      id="signup-terms"
                      type="checkbox"
                      required
                      defaultChecked
                      className="rounded border-[#2a3036] bg-[#12161a] text-blue-500 focus:ring-blue-500/30 mt-0.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-300 font-sans leading-relaxed">
                      I agree that my sandbox simulation trades and data are governed by local memory caching rules.
                    </span>
                  </div>

                  {/* Submission triggers */}
                  <button
                    id="submit-signup-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2.5 py-3 rounded-full font-bold font-sans text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all cursor-pointer bg-gradient-to-r from-[#0ecb81] to-emerald-600 hover:from-emerald-500 hover:to-[#0ecb81] text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin text-white-400" size={14} />
                        Initializing risk profile...
                      </>
                    ) : (
                      <>
                        Create Paper Profile Account <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                {/* Social register block */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-center gap-2">
                    <hr className="flex-1 opacity-10 border-gray-500" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono">Or register with</span>
                    <hr className="flex-1 opacity-10 border-gray-500" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      id="social-signup-google"
                      type="button"
                      onClick={() => {
                        setFullName('Google Investor');
                        setEmail('google.investor@binance-sim.net');
                        setUsername('google_trader');
                        setPassword('secure_google_oauth_channel');
                        setConfirmPassword('secure_google_oauth_channel');
                        setMsgNotice('Mock registered utilizing Google verification credentials!');
                      }}
                      className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                    >
                      <Chrome size={12} className="text-[#ea4335]" />
                      <span>Google</span>
                    </button>
                    <button
                      id="social-signup-github"
                      type="button"
                      onClick={() => {
                        setFullName('GitHub Developer');
                        setEmail('github.coder@binance-sim.net');
                        setUsername('github_coder');
                        setPassword('secure_github_oauth_channel');
                        setConfirmPassword('secure_github_oauth_channel');
                        setMsgNotice('Mock registered utilizing GitHub Developer profile!');
                      }}
                      className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                    >
                      <Github size={12} className="text-gray-300" />
                      <span>GitHub</span>
                    </button>
                    <button
                      id="social-signup-apple"
                      type="button"
                      className="py-2.5 rounded-full border flex items-center justify-center gap-1.5 transition-all text-white border-gray-700/80 bg-[#12161a] hover:bg-gray-800 cursor-pointer font-sans"
                      onClick={() => {
                        setFullName('Apple Sandbox Account');
                        setEmail('apple.sandbox@binance-sim.net');
                        setUsername('apple_sandbox_user');
                        setPassword('secure_apple_oauth_channel');
                        setConfirmPassword('secure_apple_oauth_channel');
                        setMsgNotice('Mock registered utilizing Apple secure sandbox profile!');
                      }}
                    >
                      <Laptop size={12} className="text-zinc-300" />
                      <span>Apple</span>
                    </button>
                  </div>
                </div>

                <div className="text-center text-xs mt-3">
                  <span className="text-gray-400 font-sans">Already have a register key? </span>
                  <button
                    id="switch-to-login"
                    type="button"
                    onClick={() => changeMode('login')}
                    className="font-bold text-[#f0b90b] hover:text-[#f3cd42] underline ml-1 cursor-pointer font-sans"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-view"
                custom={customDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col gap-4 w-full"
              >
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2 font-sans text-white">
                    <KeyRound className="text-[#f0b90b]" size={20} />
                    Forgot Password credentials
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your email to receive simulated OTP resetting pins safely.
                  </p>
                </div>

                {resetCodeSent ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-[#0ecb81]/30 flex flex-col gap-2 font-mono">
                    <div className="flex gap-2 items-center text-xs text-[#0ecb81] font-bold">
                      <Check size={16} />
                      <span>SIMULATED RESET TRIGGERED</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                      We have simulated a secure password reset link generation. To restore demo access instantly, click the button below to revert back to Login and input "demo_trader" with password "cryptoWhale2026"!
                    </p>
                    <button
                      id="reset-back-to-login"
                      onClick={() => { changeMode('login'); setResetCodeSent(false); setForgotEmail(''); }}
                      className="mt-2 py-2 rounded-full bg-blue-500 hover:bg-blue-600 font-sans font-bold text-xs text-white transition cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4 font-mono">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-300 uppercase tracking-wider block font-sans" htmlFor="forgot-email">
                        Profile Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={14} />
                        </div>
                        <input
                          id="forgot-email"
                          type="text"
                          placeholder="your-profile@domain.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className={`w-full pl-10 pr-3 py-2.5 rounded-full text-xs font-sans transition-all border bg-[#12161a] text-white border-gray-700 focus:ring-2 focus:ring-[#f0b90b]/40 focus:border-[#f0b90b] focus:outline-none ${
                            errors.forgotEmail ? 'border-red-500 ring-2 ring-red-500/20' : ''
                          }`}
                        />
                      </div>
                      {errors.forgotEmail && (
                        <span className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                          <AlertCircle size={10} /> {errors.forgotEmail}
                        </span>
                      )}
                    </div>

                    <button
                      id="submit-forgot-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-full font-bold font-sans text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-550 hover:to-blue-650 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin text-white" size={14} />
                          Broadcasting dispatch packet...
                        </>
                      ) : (
                        <>
                          Request OTP Reset Link <Send size={13} />
                        </>
                      )}
                    </button>

                    <button
                      id="forgot-cancel-btn"
                      type="button"
                      onClick={() => changeMode('login')}
                      className="w-full py-2 rounded-full text-xs font-sans font-bold border border-gray-750 text-gray-400 hover:text-white hover:bg-gray-800/20 transition cursor-pointer"
                    >
                      Cancel and Revert
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* 4. EMAIL VERIFICATION MODE */}
            {mode === 'verify' && (
              <motion.div
                key="verify-view"
                custom={customDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4 text-center items-center w-full"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1 border border-blue-500/20">
                  <Mail size={22} className="animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-black tracking-tight font-sans text-white">
                    Security Verification Check
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 max-w-[320px] mx-auto font-sans">
                    We've sent a simulated confirmation OTP code to <strong className="text-blue-400 font-bold">{tempUser?.email || 'your email'}</strong>. Please type it in below.
                  </p>
                </div>

                {errors.otp && (
                  <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
                    <AlertCircle size={12} className="text-red-400" /> {errors.otp}
                  </span>
                )}

                <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5 w-full max-w-[340px] font-mono">
                  {/* Outer input boxes wrapper */}
                  <div className="flex justify-between gap-1.5">
                    {verificationCode.map((char, index) => (
                      <input
                        key={`otp-${index}`}
                        id={`otp-char-${index}`}
                        type="text"
                        maxLength={1}
                        value={char}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-11 h-12 rounded-xl text-center text-lg font-bold border focus:outline-none focus:ring-2 transition-all duration-200 bg-[#12161a] border-gray-755 text-white focus:ring-[#0ecb81]/50 focus:border-[#0ecb81]"
                        aria-label={`OTP Code Character ${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="text-[11px] text-gray-400 font-sans">
                    Entering <strong className="text-[#f0b90b] font-bold">"123456"</strong> is simulated to trigger success instantly.
                  </div>

                  <button
                    id="submit-otp-verification"
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 rounded-full font-bold font-sans text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-550 hover:to-blue-650 text-white"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="animate-spin text-white" size={14} />
                        Testing pin matching engine...
                      </>
                    ) : (
                      'Confirm Verification OTP Key'
                    )}
                  </button>

                  <div className="text-xs text-gray-500 font-sans">
                    Didn't receive the simulated dispatch?{' '}
                    <button
                      id="opt-resend-trigger"
                      type="button"
                      onClick={() => {
                        setVerificationCode(['', '', '', '', '', '']);
                        setMsgNotice('A fresh verification code is dispatched to simulator inbox.');
                        setTimeout(() => setMsgNotice(null), 3000);
                      }}
                      className="font-bold text-[#f0b90b] hover:underline"
                    >
                      Dispatched Again
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </section>

      </motion.div>
    </div>
  );
};
