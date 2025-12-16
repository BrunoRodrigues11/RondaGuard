
import React, { useMemo } from 'react';
import { RoundLog, Task, User, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, List, TrendingUp, Calendar, Activity, Briefcase, Trophy, Medal, AlertOctagon, User as UserIcon, PieChart as PieChartIcon } from 'lucide-react';

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
  const canViewStats = currentUser?.role !== UserRole.TECHNICIAN;

  // Calculate average time
  const avgTime = totalRounds > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.durationSeconds, 0) / totalRounds) 
    : 0;

  // --- Data Preparation for Charts ---

  // 1. Activity by Sector (Existing)
  const sectorData = useMemo(() => {
    return history.reduce((acc: any, curr) => {
      const existing = acc.find((item: any) => item.name === curr.sector);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: curr.sector, count: 1 });
      }
      return acc;
    }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 10); // Top 10 sectors
  }, [history]);

  // 2. Weekly Evolution (New) - Last 7 Days
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const startOfDay = new Date(d.setHours(0,0,0,0)).getTime();
        const endOfDay = new Date(d.setHours(23,59,59,999)).getTime();

        const count = history.filter(h => h.startTime >= startOfDay && h.startTime <= endOfDay).length;
        data.push({ name: label, rondas: count });
    }
    return data;
  }, [history]);

  // 3. Status Distribution (New)
  const statusData = useMemo(() => {
    const normal = totalRounds - issuesCount;
    return [
        { name: 'Normal', value: normal },
        { name: 'Com Ocorrência', value: issuesCount }
    ];
  }, [totalRounds, issuesCount]);

  // --- Rankings Logic ---

  // 4. Top Technicians (Most rounds performed)
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

  // 5. Sectors with Most Issues
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const STATUS_COLORS = ['#10b981', '#ef4444']; // Green, Red

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
              ? 'Visualize suas métricas e desempenho.' 
              : 'Visão geral da operação de segurança.'}
          </p>
        </div>
      </header>

      {/* Stats Cards Row */}
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

      {/* Main Charts Row */}
      {canViewStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Weekly Evolution (Area Chart) - Takes 2 cols */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={20} /> Evolução Semanal de Rondas
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="colorRondas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} />
                            <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="rondas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRondas)" name="Rondas" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Distribution (Pie Chart) - Takes 1 col */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <PieChartIcon className="text-emerald-500" size={20} /> Status Geral
                </h3>
                <div className="h-64 w-full relative">
                    {totalRounds > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                             <PieChartIcon size={40} className="mb-2 opacity-20" />
                             <p>Sem dados registrados</p>
                        </div>
                    )}
                    
                    {/* Center Text for Pie Chart */}
                    {totalRounds > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center -mt-5">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">{totalRounds}</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Rankings and Secondary Charts Grid */}
      {canViewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Activity Chart (Bar) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase className="text-purple-500" size={20} /> Volume por Setor
                </h3>
                <div className="h-64 w-full">
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
                                    width={90}
                                    tick={{fill: '#64748b', fontSize: 11}} 
                                />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Rondas" />
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
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <UserIcon size={32} className="mb-2 opacity-20" />
                        <p className="text-sm text-center">Sem dados de performance.</p>
                    </div>
                )}
            </div>

            {/* 3. Problematic Sectors Ranking */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertOctagon className="text-red-500" size={20} /> Setores Críticos
                </h3>
                {mostIssuesSectors.length > 0 ? (
                    <div className="space-y-4">
                        {mostIssuesSectors.map((item, index) => (
                            <div key={item.name} className="relative">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">{item.count}</span>
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
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                        <CheckCircle size={32} className="mx-auto text-green-500 mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma ocorrência crítica registrada.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
