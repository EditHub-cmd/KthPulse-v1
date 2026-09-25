import React, { useState } from 'react';
import { Employee } from '../types';
import { 
  LogIn, 
  Lock, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  Globe, 
  Laptop 
} from 'lucide-react';

interface LoginViewProps {
  allEmployees: Employee[];
  onLoginSuccess: (employee: Employee) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allEmployees,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('manager@astutexperience.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim().toLowerCase();
    const found = allEmployees.find(
      (emp) => emp.email.toLowerCase() === trimmedEmail
    );

    if (!found) {
      setErrorMsg('No user account found with that email address.');
      return;
    }

    if (found.password && found.password !== password) {
      setErrorMsg('Incorrect password. Default demo password is "password123".');
      return;
    }

    onLoginSuccess(found);
  };

  const handleQuickLogin = (emp: Employee) => {
    setEmail(emp.email);
    setPassword(emp.password || 'password123');
    onLoginSuccess(emp);
  };

  const managerUser = allEmployees.find((e) => e.role === 'manager');
  const johnUser = allEmployees.find((e) => e.name.toLowerCase().includes('john'));
  const otherStaff = allEmployees.filter(
    (e) => e.role === 'staff' && e.id !== johnUser?.id
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 opacity-90" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          StaffPulse Management Portal
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Staff Attendance, 10:00 AM Punctuality Tracking, Offer Letter Leave Quotas & Supervisor Approvals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200/80 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@astutexperience.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Portal</span>
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              Quick Log In (One-Click Demo Access)
            </div>

            {/* Manager Login Button */}
            {managerUser && (
              <button
                type="button"
                onClick={() => handleQuickLogin(managerUser)}
                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 transition-colors flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={managerUser.avatar}
                    alt={managerUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-200"
                  />
                  <div>
                    <div className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                      <span>{managerUser.name}</span>
                      <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-medium">
                        Manager
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-700">
                      {managerUser.email}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>
            )}

            {/* John Doe Staff Login (Specifically requested in user prompt) */}
            {johnUser && (
              <button
                type="button"
                onClick={() => handleQuickLogin(johnUser)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={johnUser.avatar}
                    alt={johnUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{johnUser.name}</span>
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-1 rounded font-medium">
                        India WFH
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {johnUser.email} · Clocked in at 10:01 AM
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 group-hover:translate-x-0.5 transition-transform">
                  Login →
                </span>
              </button>
            )}

            {/* Other Staff Members */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {otherStaff.slice(0, 2).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleQuickLogin(st)}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-slate-800 truncate">{st.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{st.department}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
