import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Lock, ChevronRight, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[]; // Login now receives the user list to validate credentials
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        setError('Usuário não encontrado.');
        return;
    }

    if (user.password !== password) {
        setError('Senha incorreta.');
        return;
    }

    if (!user.active) {
        setError('Acesso bloqueado. Contate o administrador.');
        return;
    }

    onLogin(user);
  };

  const loginAsDemo = (role: UserRole) => {
    // Find the first active user with this role for demo purposes
    const demoUser = users.find(u => u.role === role && u.active);
    if (demoUser) {
        onLogin(demoUser);
    } else {
        setError(`Nenhum usuário ativo encontrado para o perfil ${role}.`);
    }
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
              />
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Entrar
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Acesso Rápido (Demo)</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button 
              onClick={() => loginAsDemo(UserRole.TECHNICIAN)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">T</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Técnico</p>
                  <p className="text-xs text-slate-500">Apenas executa rondas</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-green-500" />
            </button>

            <button 
              onClick={() => loginAsDemo(UserRole.ANALYST)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">A</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Analista</p>
                  <p className="text-xs text-slate-500">Cria tarefas e modelos</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-500" />
            </button>

            <button 
              onClick={() => loginAsDemo(UserRole.SUPERVISOR)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">S</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Supervisor</p>
                  <p className="text-xs text-slate-500">Relatórios e gestão total</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-orange-500" />
            </button>

            <button 
              onClick={() => loginAsDemo(UserRole.ADMIN)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">ADM</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">Administrador</p>
                  <p className="text-xs text-slate-500">Gestão de Usuários e Sistema</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;