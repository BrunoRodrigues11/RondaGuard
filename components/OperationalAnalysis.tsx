
import React, { useMemo, useState } from 'react';
import { RoundLog } from '../types';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle, ShieldCheck, CalendarRange, TrendingDown } from 'lucide-react';

interface OperationalAnalysisProps {
  logs: RoundLog[];
}

const OperationalAnalysis: React.FC<OperationalAnalysisProps> = ({ logs }) => {
  const [timeRange, setTimeRange] = useState(30); // Dias para análise

  // --- 1. Índice de Estabilidade do Ambiente ---
  // Fórmula: (Rondas 100% OK / Total de rondas) * 100
  const stabilityMetrics = useMemo(() => {
    if (logs.length === 0) return { index: 0, totalOk: 0, totalIssues: 0 };
    
    // Filtra logs do período selecionado
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    const recentLogs = logs.filter(l => l.startTime >= cutoff.getTime());

    if (recentLogs.length === 0) return { index: 0, totalOk: 0, totalIssues: 0 };

    const totalOk = recentLogs.filter(l => !l.issuesDetected).length;
    const totalIssues = recentLogs.filter(l => l.issuesDetected).length;
    const index = (totalOk / recentLogs.length) * 100;

    return { index: parseFloat(index.toFixed(1)), totalOk, totalIssues, total: recentLogs.length };
  }, [logs, timeRange]);

  // --- 2. Tendência de Ocorrências (Linha do Tempo) ---
  const trendData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    
    const map = new Map<string, { date: string, issues: number, total: number }>();
    
    // Inicializa datas zeradas para o gráfico não ficar buraco
    for (let i = 0; i <= timeRange; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (timeRange - i));
        const key = d.toLocaleDateString('pt-BR').slice(0, 5); // DD/MM
        map.set(key, { date: key, issues: 0, total: 0 });
    }

    logs.forEach(log => {
      if (log.startTime >= cutoff.getTime()) {
        const key = new Date(log.startTime).toLocaleDateString('pt-BR').slice(0, 5);
        if (map.has(key)) {
            const entry = map.get(key)!;
            entry.total += 1;
            if (log.issuesDetected) entry.issues += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [logs, timeRange]);

  // --- 3. Setores com Maior Crescimento de Incidentes ---
  // Compara os últimos X/2 dias com os X/2 dias anteriores
  const growthData = useMemo(() => {
    const midPointDays = Math.floor(timeRange / 2);
    const now = Date.now();
    const midPointTime = now - (midPointDays * 24 * 60 * 60 * 1000);
    const startPointTime = now - (timeRange * 24 * 60 * 60 * 1000);

    const currentPeriodIssues: Record<string, number> = {};
    const previousPeriodIssues: Record<string, number> = {};
    const allSectors = new Set<string>();

    logs.forEach(log => {
        if (log.issuesDetected) {
            if (log.startTime >= midPointTime) {
                currentPeriodIssues[log.sector] = (currentPeriodIssues[log.sector] || 0) + 1;
                allSectors.add(log.sector);
            } else if (log.startTime >= startPointTime && log.startTime < midPointTime) {
                previousPeriodIssues[log.sector] = (previousPeriodIssues[log.sector] || 0) + 1;
                allSectors.add(log.sector);
            }
        }
    });

    const growth = Array.from(allSectors).map(sector => {
        const curr = currentPeriodIssues[sector] || 0;
        const prev = previousPeriodIssues[sector] || 0;
        const diff = curr - prev;
        return { sector, curr, prev, diff };
    });

    // Ordena por maior crescimento (diferença positiva)
    return growth.sort((a, b) => b.diff - a.diff).slice(0, 5);
  }, [logs, timeRange]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-600" /> Análise Operacional
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Inteligência de dados e indicadores de performance (KPIs).
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex">
            {[7, 30, 90].map(days => (
                <button
                    key={days}
                    onClick={() => setTimeRange(days)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                        timeRange === days 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    {days} Dias
                </button>
            ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Índice de Estabilidade */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={80} />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Índice de Estabilidade</h3>
            <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${
                    stabilityMetrics.index >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 
                    stabilityMetrics.index >= 70 ? 'text-amber-500 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}>
                    {stabilityMetrics.index}%
                </span>
                <span className="text-sm text-slate-400 mb-1">das rondas sem problemas</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                        stabilityMetrics.index >= 90 ? 'bg-emerald-500' : 
                        stabilityMetrics.index >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${stabilityMetrics.index}%` }}
                ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Baseado em {stabilityMetrics.total} execuções no período.</p>
        </div>

        {/* Volume de Ocorrências */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle size={80} />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total de Incidentes</h3>
            <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-slate-800 dark:text-white">
                    {stabilityMetrics.totalIssues}
                </span>
                <span className="text-sm text-slate-400 mb-1">ocorrências registradas</span>
            </div>
             <p className="text-xs text-slate-400 mt-6">
                 Requer atenção imediata em {((stabilityMetrics.totalIssues / (stabilityMetrics.total || 1)) * 100).toFixed(1)}% das rondas.
             </p>
        </div>

        {/* Projeção (Simples) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CalendarRange size={80} />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Média Diária</h3>
            <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {(stabilityMetrics.total / timeRange).toFixed(1)}
                </span>
                <span className="text-sm text-slate-400 mb-1">rondas / dia</span>
            </div>
            <p className="text-xs text-slate-400 mt-6">
                Ritmo operacional atual.
            </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tendência de Ocorrências */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-500" /> Tendência de Ocorrências
            </h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="date" tick={{fontSize: 12}} minTickGap={30} />
                        <YAxis allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" name="Rondas Totais" />
                        <Area type="monotone" dataKey="issues" stroke="#ef4444" fillOpacity={1} fill="url(#colorIssues)" name="Incidentes" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Setores com Maior Crescimento */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <TrendingUp size={18} className="text-red-500" /> Setores com Maior Crescimento de Incidentes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Comparativo: Últimos {Math.floor(timeRange/2)} dias vs Período Anterior</p>
            
            {growthData.length === 0 ? (
                 <div className="h-80 flex flex-col items-center justify-center text-slate-400">
                    <ShieldCheck size={48} className="mb-2 opacity-20" />
                    <p>Sem crescimento de incidentes no período.</p>
                 </div>
            ) : (
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={growthData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="sector" type="category" width={100} tick={{fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                            />
                            <ReferenceLine x={0} stroke="#000" />
                            <Bar dataKey="diff" fill="#ef4444" radius={[0, 4, 4, 0]} name="Aumento (Qtd)" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            
            {/* Tabela Resumo */}
            {growthData.length > 0 && (
                <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                     {growthData.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center text-sm mb-2">
                             <span className="text-slate-600 dark:text-slate-300">{item.sector}</span>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-400">Anterior: {item.prev}</span>
                                 <span className="font-bold text-red-600">+{item.diff}</span>
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default OperationalAnalysis;
