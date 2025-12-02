import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Edit, Trash2, Save, X, Shield, CheckCircle, XCircle, UserX, UserCheck, Lock } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  onSave: (user: User) => void;
  onToggleStatus: (userId: string) => void;
  onCancel: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onSave, onToggleStatus, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TECHNICIAN);

  const handleEditClick = (user: User) => {
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setEditingId(user.id);
    setIsEditing(true);
  };

  const handleNewClick = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole(UserRole.TECHNICIAN);
    setEditingId(null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    const newUser: User = {
      id: editingId || Date.now().toString(),
      name,
      email,
      password,
      role,
      active: editingId ? (users.find(u => u.id === editingId)?.active ?? true) : true
    };

    onSave(newUser);
    setIsEditing(false);
    setEditingId(null);
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case UserRole.SUPERVISOR: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case UserRole.ANALYST: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Usuários</h2>
          <p className="text-slate-500 dark:text-slate-400">Cadastre novos usuários e gerencie permissões.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleNewClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} /> Novo Usuário
          </button>
        )}
      </header>

      {isEditing ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-2xl mx-auto">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email de Acesso</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perfil de Acesso</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={UserRole.TECHNICIAN}>Técnico (Apenas Rondas)</option>
                  <option value={UserRole.ANALYST}>Analista (Cria Tarefas)</option>
                  <option value={UserRole.SUPERVISOR}>Supervisor (Relatórios)</option>
                  <option value={UserRole.ADMIN}>Administrador (Total)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Save size={18} /> Salvar Usuário
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                  <th className="p-4 font-semibold">Usuário</th>
                  <th className="p-4 font-semibold">Perfil</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.active ? 'bg-slate-700' : 'bg-slate-400'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-medium ${user.active ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.active ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle size={14} /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-sm font-medium">
                          <XCircle size={14} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                          onClick={() => onToggleStatus(user.id)}
                          className={`p-1.5 rounded-md transition ${user.active ? 'text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20' : 'text-green-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20'}`}
                          title={user.active ? "Desativar Usuário" : "Ativar Usuário"}
                         >
                           {user.active ? <UserX size={18} /> : <UserCheck size={18} />}
                         </button>
                         <button 
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-md transition"
                          title="Editar"
                         >
                           <Edit size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;