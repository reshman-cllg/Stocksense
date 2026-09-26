import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Boxes, ShieldCheck, UserCheck, ArrowRight, KeyRound, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot_password' | 'otp_verify' | 'new_password';

export const AuthModalOrView: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const { setCurrentUser, switchUserRole } = useInventory();
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [email, setEmail] = useState('d.vance@stocksense.logistics');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState(['8', '4', '9', '2', '0', '1']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManagerQuickLogin = () => {
    switchUserRole('manager');
    onLoginSuccess();
  };

  const handleStaffQuickLogin = () => {
    switchUserRole('staff');
    onLoginSuccess();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }
    // Log user in
    setCurrentUser((prev) => ({
      ...prev,
      email,
      name: email.includes('chen') ? 'Marcus Chen' : 'David Vance',
      role: email.includes('chen') ? 'staff' : 'manager',
    }));
    onLoginSuccess();
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setMessage({ type: 'error', text: 'Please complete all required sign-up fields.' });
      return;
    }
    setCurrentUser({
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      warehouseId: 'wh-main',
    });
    setMessage({ type: 'success', text: 'Account created! Welcome to StockSense.' });
    setTimeout(() => {
      onLoginSuccess();
    }, 600);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Enter your registered corporate email.' });
      return;
    }
    setMessage({ type: 'success', text: '6-digit OTP code sent! Use "849201" for demonstration.' });
    setMode('otp_verify');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setMessage({ type: 'error', text: 'Enter complete 6-digit code.' });
      return;
    }
    setMessage({ type: 'success', text: 'OTP verified successfully! Create a new secure password.' });
    setMode('new_password');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords must match and have at least 8 characters.' });
      return;
    }
    setMessage({ type: 'success', text: 'Password reset successfully! You can now sign in.' });
    setTimeout(() => {
      setMode('login');
      setMessage(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Brand Banner */}
        <div className="bg-slate-950 px-8 pt-8 pb-6 text-center text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3">
            <Boxes className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">StockSense</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Intelligent Enterprise Inventory Management System
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Demo Access - Odoo Hackathon Jury Shortcut */}
          {mode === 'login' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Demo 1-Click Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleManagerQuickLogin}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Manager Role</span>
                </button>
                <button
                  type="button"
                  onClick={handleStaffQuickLogin}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Staff Role</span>
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setMessage(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Need a new staff account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="Marcus Chen"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="m.chen@stocksense.logistics"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Flow */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Password Recovery</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your email address to receive a one-time OTP verification code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Send 6-Digit OTP
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* OTP Verification Step */}
          {mode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-800">Enter OTP Verification Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We've simulated sending a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className="flex justify-between gap-2 my-4">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      const copy = [...otpCode];
                      copy[index] = val;
                      setOtpCode(copy);
                    }}
                    className="w-11 h-12 text-center text-lg font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Verify Code
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode('forgot_password')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* New Password Step */}
          {mode === 'new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-800">Create New Password</h3>
                <p className="text-xs text-slate-500 mt-1">Ensure your password is at least 8 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Save New Password & Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
