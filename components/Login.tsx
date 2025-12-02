
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Settings, BarChart3, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Carlos Técnico', role: UserRole.TECHNICIAN },
  { id: '2', name: 'Ana Analista', role: UserRole.ANALYST },
  { id: '3', name: 'Roberto Supervisor', role: UserRole.SUPERVISOR },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.TECHNICIAN: return <UserIcon size={24} className="text-blue-500" />;
      case UserRole.ANALYST: return <Settings size={24} className="text-purple-500" />;
      case UserRole.SUPERVISOR: return <BarChart3 size={24} className="text-emerald-500" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.TECHNICIAN: return 'Técnico';
      case UserRole.ANALYST: return 'Analista';
      case UserRole.SUPERVISOR: return 'Supervisor';
    }
  };

  const getRoleDesc = (role: UserRole) => {
    switch (role) {
      case UserRole.TECHNICIAN: return 'Execução de rondas e preenchimento de checklists.';
      case UserRole.ANALYST: return 'Gestão de tarefas, criação de checklists e processos.';
      case UserRole.SUPERVISOR: return 'Acesso a relatórios, histórico e dashboards gerenciais.';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ShieldCheck className="text-blue-600 dark:text-blue-500" size={48} />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">RondaGuard Pro</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Sistema Inteligente de Gestão de Rondas</p>
      </div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 text-center">Selecione seu perfil de acesso</h2>

        <div className="space-y-3">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${
                selectedUser?.id === user.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-900/50' 
                  : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className={`p-3 rounded-full ${
                selectedUser?.id === user.id ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-700'
              }`}>
                {getRoleIcon(user.role)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white">{user.name}</span>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {getRoleLabel(user.role)}
                    </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    {getRoleDesc(user.role)}
                </p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={!selectedUser}
          className={`w-full mt-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            selectedUser 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-y-0' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          Acessar Sistema <ArrowRight size={20} />
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-400 dark:text-slate-600">
        &copy; 2025 RondaGuard Security Systems
      </p>
    </div>
  );
};

export default Login;
