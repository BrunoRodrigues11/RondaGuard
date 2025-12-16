
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
  users?: User[]; // Optional now, since we verify via API
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Helper (for showcase purposes only - simulates typing)
  const setDemoCredentials = (role: string) => {
      let u = '', p = '123';
      switch(role) {
          case 'TECHNICIAN': u = 'tec@rondaguard.com'; break;
          case 'ANALYST': u = 'ana@rondaguard.com'; break;
          case 'SUPERVISOR': u = 'sup@rondaguard.com'; break;
          case 'ADMIN': u = 'admin@rondaguard.com'; break;
      }
      setEmail(u);
      setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 text-blue-600 dark:text-blue-400">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">RondaGuard Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="seu@email.com"
                required
              />
              <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded animate-fade-in">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 mb-2">Para testar (se o banco estiver populado):</p>
            <div className="flex gap-2 justify-center flex-wrap">
                <button type="button" onClick={() => setDemoCredentials('ADMIN')} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Admin</button>
                <button type="button" onClick={() => setDemoCredentials('TECHNICIAN')} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Técnico</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
    