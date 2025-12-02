
import React from 'react';
import { RoundLog, Task, User, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, List, PlayCircle, Pencil, Trash2, Ticket, Copy, Lock } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  history: RoundLog[];
  currentUser: User;
  onNavigate: (view: any) => void;
  onStartTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, history, currentUser, onNavigate, onStartTask, onEditTask, onDuplicateTask, onDeleteTask }) => {
  const totalRounds = history.length;
  const issuesCount = history.filter(h => h.issuesDetected).length;
  
  // Calculate average time
  const avgTime = totalRounds > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.durationSeconds, 0) / totalRounds) 
    : 0;

  // Prepare chart data (Rounds per Sector)
  const sectorData = history.reduce((acc: any, curr) => {
    const existing = acc.find((item: any) => item.name === curr.sector);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: curr.sector, count: 1 });
    }
    return acc;
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa? O histórico de rondas não será afetado.")) {
      onDeleteTask(id);
    }
  };

  // Visibility Logic
  const showStats = currentUser.role === UserRole.SUPERVISOR;
  const canEdit = currentUser.role === UserRole.ANALYST;
  const canExecute = currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.SUPERVISOR; // Supervisor can test too for demo purposes, or remove if strict

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Olá, {currentUser.name.split(' ')[0]}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
            {currentUser.role === UserRole.TECHNICIAN ? 'Suas tarefas pendentes para hoje.' : 'Visão geral do sistema.'}
        </p>
      </header>

      {/* Stats Cards - Only for Supervisor */}
      {showStats && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Rondas Realizadas</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalRounds}</p>
                </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ocorrências</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{issuesCount}</p>
                </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tempo Médio</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(avgTime)}</p>
                </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                    <List size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tarefas Cadastradas</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{tasks.length}</p>
                </div>
                </div>
            </div>

            {/* Charts Section - Only for Supervisor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Rondas por Setor</h3>
                <div className="h-64 w-full">
                {sectorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: '#1e293b',
                            color: '#f8fafc'
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                    Sem dados suficientes para exibir o gráfico.
                    </div>
                )}
                </div>
            </div>
        </>
      )}

      {/* Tasks List */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {canEdit ? 'Gerenciar Tarefas' : 'Tarefas Disponíveis'}
            </h3>
            {canEdit && (
                <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Modo Edição Ativo</span>
            )}
         </div>
         
         {tasks.length === 0 ? (
           <div className="text-center py-8">
             <p className="text-slate-500 dark:text-slate-400 mb-4">Nenhuma tarefa cadastrada.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {tasks.map(task => (
               <div key={task.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition group bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 relative">
                  <div className="flex justify-between items-start mb-2 pr-16">
                     <h4 className="font-semibold text-slate-800 dark:text-white truncate" title={task.title}>{task.title}</h4>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 px-2 py-1 rounded inline-block">{task.sector}</span>
                    {task.ticketId && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Ticket size={10} /> {task.ticketId}
                        </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">{task.description || "Sem descrição."}</p>
                  
                  {/* Action Buttons - Only for Analyst */}
                  {canEdit && (
                    <div className="absolute top-4 right-4 flex gap-1">
                        <button 
                            onClick={() => onDuplicateTask(task)}
                            className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-slate-600 rounded-md transition"
                            title="Duplicar"
                        >
                            <Copy size={16} />
                        </button>
                        <button 
                            onClick={() => onEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-md transition"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-600 rounded-md transition"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  )}

                  {/* Start Button - Technician and Supervisor */}
                  {canExecute ? (
                    <button 
                        onClick={() => onStartTask(task)}
                        className="w-full py-2 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition flex items-center justify-center gap-2 group-hover:shadow-md"
                    >
                        <PlayCircle size={18} /> Iniciar
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs text-slate-400 border border-transparent">
                       Apenas visualização
                    </div>
                  )}
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;
