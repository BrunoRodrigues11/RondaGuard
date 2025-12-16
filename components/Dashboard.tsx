
import React, { useMemo } from 'react';
import { RoundLog, Task, User, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, List, PlayCircle, Pencil, Trash2, Ticket, Copy, Calendar, Activity, TrendingUp, Briefcase, Trophy, Medal, AlertOctagon, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  history: RoundLog[];
  currentUser: User | null;
  onNavigate: (view: any) => void;
  onStartTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, history, currentUser, onNavigate, onStartTask, onEditTask, onDuplicateTask, onDeleteTask }) => {
  
  const totalRounds = history.length;
  const issuesCount = history.filter(h => h.issuesDetected).length;
  
  // Role checks
  const isTechnician = currentUser?.role === UserRole.TECHNICIAN;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canManageTasks = currentUser?.role === UserRole.ANALYST || currentUser?.role === UserRole.SUPERVISOR || isAdmin;
  const canDelete = currentUser?.role === UserRole.SUPERVISOR || isAdmin;
  const canViewStats = currentUser?.role !== UserRole.TECHNICIAN;

  // Calculate average time
  const avgTime = totalRounds > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.durationSeconds, 0) / totalRounds) 
    : 0;

  // Prepare chart data (Rounds per Sector)
  const sectorData = useMemo(() => {
    return history.reduce((acc: any, curr) => {
      const existing = acc.find((item: any) => item.name === curr.sector);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: curr.sector, count: 1 });
      }
      return acc;
    }, []);
  }, [history]);

  // --- New Rankings Logic ---

  // 1. Top Technicians (Most rounds performed)
  const topTechnicians = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(log => {
      counts[log.responsible] = (counts[log.responsible] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [history]);

  // 2. Sectors with Most Issues
  const mostIssuesSectors = useMemo(() => {
    const counts: Record<string, number> = {};
    history.filter(h => h.issuesDetected).forEach(log => {
        counts[log.sector] = (counts[log.sector] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [history]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Helper to color code task cards based on sector
  const getSectorColor = (sector: string) => {
    const colors = [
      'border-l-blue-500',
      'border-l-emerald-500',
      'border-l-purple-500',
      'border-l-amber-500',
      'border-l-rose-500',
      'border-l-indigo-500',
    ];
    let hash = 0;
    for (let i = 0; i < sector.length; i++) {
      hash = sector.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Calendar size={14} />
            <span className="capitalize">{currentDate}</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
             {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{currentUser?.name.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            {isTechnician 
              ? 'Pronto para iniciar suas atividades de hoje?' 
              : 'Aqui está o resumo operacional da planta.'}
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      {canViewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Rounds Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={60} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rondas Totais</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalRounds}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    <TrendingUp size={12} />
                    <span>Dados consolidados</span>
                </div>
            </div>

            {/* Issues Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertTriangle size={60} className="text-red-600 dark:text-red-400" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/20">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ocorrências</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{issuesCount}</h3>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atenção necessária em {issuesCount} registros
                </p>
            </div>

            {/* Avg Time Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Clock size={60} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tempo Médio</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(avgTime)}</h3>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Média por execução
                </p>
            </div>

            {/* Available Tasks Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Briefcase size={60} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/20">
                        <List size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tarefas Ativas</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{tasks.length}</h3>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prontas para execução
                </p>
            </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
        {/* Main Column: Task List (Takes 2/3 on Large screens) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <List className="text-blue-500" /> Tarefas Disponíveis
                </h3>
                <span className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-medium">
                    {tasks.length}
                </span>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-4">
                        <List size={32} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma tarefa cadastrada no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.map(task => {
                        const borderClass = getSectorColor(task.sector);
                        
                        return (
                            <div 
                                key={task.id} 
                                className={`bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 ${borderClass} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                            {task.sector}
                                        </span>
                                        {/* Action Menu (Visible on hover or always on mobile) */}
                                        {canManageTasks && (
                                            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onDuplicateTask(task)} className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition" title="Duplicar">
                                                    <Copy size={16} />
                                                </button>
                                                <button onClick={() => onEditTask(task)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" title="Editar">
                                                    <Pencil size={16} />
                                                </button>
                                                {canDelete && (
                                                    <button onClick={() => handleDeleteClick(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1 line-clamp-1" title={task.title}>
                                        {task.title}
                                    </h4>
                                    
                                    {task.ticketId && (
                                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mb-3">
                                            <Ticket size={12} />
                                            <span>Ticket: {task.ticketId}</span>
                                        </div>
                                    )}

                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 min-h-[2.5rem]">
                                        {task.description || "Verifique os itens de segurança e conformidade deste setor."}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => onStartTask(task)}
                                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group/btn"
                                >
                                    <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                    Iniciar Ronda
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Sidebar Column: Stats & Rankings (Takes 1/3 on Large screens) - Only for Admins/Supervisors */}
        {(currentUser?.role === UserRole.SUPERVISOR || isAdmin) && (
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. Activity Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Atividade por Setor</h3>
                    <div className="h-48 w-full">
                        {sectorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={80}
                                        tick={{fill: '#64748b', fontSize: 11}} 
                                    />
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
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                                <Activity size={32} className="mb-2 opacity-20" />
                                <span className="text-sm">Sem dados suficientes</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Top Technicians Ranking */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} /> Top Técnicos
                    </h3>
                    {topTechnicians.length > 0 ? (
                        <div className="space-y-4">
                            {topTechnicians.map((tech, index) => (
                                <div key={tech.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                                            index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{tech.name}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {index === 0 ? 'Líder em execuções' : 'Colaborador ativo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                        <Medal size={12} className="text-blue-500" />
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{tech.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">Sem dados de performance.</p>
                    )}
                </div>

                {/* 3. Problematic Sectors Ranking */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertOctagon className="text-red-500" size={20} /> Setores Críticos
                    </h3>
                    {mostIssuesSectors.length > 0 ? (
                        <div className="space-y-3">
                            {mostIssuesSectors.map((item, index) => (
                                <div key={item.name} className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                        <span className="text-xs font-bold text-red-600 dark:text-red-400">{item.count} ocorrências</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full" 
                                            style={{ width: `${Math.min((item.count / mostIssuesSectors[0].count) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CheckCircle size={32} className="mx-auto text-green-500 mb-2 opacity-50" />
                            <p className="text-sm text-slate-500">Nenhuma ocorrência crítica registrada.</p>
                        </div>
                    )}
                </div>

            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
