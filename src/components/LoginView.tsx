import React, { useState } from 'react';
import { AlertCircle, Clock, LoaderCircle, Lock, LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsSubmitting(false);
    if (error) {
      setErrorMsg('Sign in failed. Check your email and password, and make sure your email is confirmed.');
      return;
    }
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 opacity-90" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"><Clock className="w-6 h-6" /></div>
        <h2 className="text-2xl font-bold tracking-tight text-white">StaffPulse Management Portal</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">Staff attendance, leave requests, and supervisor approvals</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span>{errorMsg}</span></div>}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" /></div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" /></div>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
              {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{isSubmitting ? 'Signing in…' : 'Log In to Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
