import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const { login, register, loginWithGoogle } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setError('');
    setLoading(true);
    try {
      // Simulate Google Sign-in details
      await loginWithGoogle("user@gmail.com", "Alex Mercer");
      onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-12 px-4 flex flex-col justify-center min-h-[80vh]">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-100">
            {isLogin ? "Welcome back" : "Create an Account"}
          </h2>
          <p className="text-xs text-slate-400">
            {isLogin ? "Sign in to track price drops & see wishlist items" : "Join to save queries and setup price notifications"}
          </p>
        </div>

        {/* Errors Alert */}
        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs text-rose-400 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-xl px-4 py-3 pl-10 text-xs text-slate-200 placeholder-slate-600 outline-none transition"
              />
              <User className="absolute left-3.5 top-3.5 text-slate-600" size={14} />
            </div>
          )}

          <div className="relative">
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-xl px-4 py-3 pl-10 text-xs text-slate-200 placeholder-slate-600 outline-none transition"
              required
            />
            <Mail className="absolute left-3.5 top-3.5 text-slate-600" size={14} />
          </div>

          <div className="relative">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 rounded-xl px-4 py-3 pl-10 text-xs text-slate-200 placeholder-slate-600 outline-none transition"
              required
            />
            <Lock className="absolute left-3.5 top-3.5 text-slate-600" size={14} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-lg shadow-violet-600/10 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-slate-100"></span>
            ) : (
              <span>{isLogin ? "Sign In" : "Sign Up"}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 text-slate-700 text-[10px] uppercase font-bold tracking-widest">
          <div className="h-[1px] bg-slate-850 flex-1"></div>
          <span>Or Continue With</span>
          <div className="h-[1px] bg-slate-850 flex-1"></div>
        </div>

        {/* Google OAuth Simulation Button */}
        <button 
          onClick={handleGoogleMock}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition"
        >
          {/* SVG for Google logo */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.78 0 3.39.61 4.65 1.8l3.47-3.47C17.97 1.25 15.18.5 12 .5 7.42.5 3.49 3.12 1.57 6.94l3.99 3.1c.94-2.82 3.57-5 6.44-5z"/>
            <path fill="#4285F4" d="M23.5 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.46c-.28 1.48-1.11 2.73-2.37 3.58l3.68 2.85c2.15-1.98 3.38-4.9 3.38-8.31z"/>
            <path fill="#FBBC05" d="M5.56 10.04a7.1 7.1 0 0 1 0-4.14L1.57 2.8a11.96 11.96 0 0 0 0 10.37l3.99-3.13z"/>
            <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.68-2.85c-1.02.68-2.33 1.09-3.96 1.09-2.87 0-5.3-1.93-6.17-4.52L1.76 17.3c1.92 3.82 5.85 6.2 10.24 6.2z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle link */}
        <p className="text-center text-xs text-slate-500">
          {isLogin ? "New to PriceVision? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-violet-400 font-bold hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
