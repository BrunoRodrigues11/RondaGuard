
import React, { useState, useMemo } from 'react';
import { RoundLog, ReportConfig } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { FileDown, Calendar, Filter, PieChart as PieIcon, BarChart3, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdvancedReportsProps {
  logs: RoundLog[];
  reportConfig: ReportConfig;
}

const AdvancedReports: React.FC<AdvancedReportsProps> = ({ logs, reportConfig }) => {
  // Estado dos Filtros
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Últimos 30 dias por padrão
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');
  const [issueFilter, setIssueFilter] = useState<'all' | 'with_issues' | 'no_issues'>('all');

  // Listas únicas para os selects
  const sectors = useMemo(() => Array.from(new Set(logs.map(l => l.sector))).sort(), [logs]);
  const responsibles = useMemo(() => Array.from(new Set(logs.map(l => l.responsible))).sort(), [logs]);

  // Lógica de Filtragem Robusta
  const filteredData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // Criação segura de datas locais baseadas na string YYYY-MM-DD
    const startParts = startDate.split('-').map(Number);
    // Mês é 0-indexed no construtor de Date
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0).getTime();

    const endParts = endDate.split('-').map(Number);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999).getTime();

    return logs.filter(log => {
      const logDate = log.startTime;
      const matchDate = logDate >= start && logDate <= end;
      const matchSector = selectedSector === 'all' || log.sector === selectedSector;
      const matchResp = selectedResponsible === 'all' || log.responsible === selectedResponsible;
      
      let matchIssue = true;
      if (issueFilter === 'with_issues') matchIssue = log.issuesDetected;
      if (issueFilter === 'no_issues') matchIssue = !log.issuesDetected;

      return matchDate && matchSector && matchResp && matchIssue;
    }).sort((a, b) => a.startTime - b.startTime);
  }, [logs, startDate, endDate, selectedSector, selectedResponsible, issueFilter]);

  // KPIs
  const totalRounds = filteredData.length;
  const totalIssues = filteredData.filter(l => l.issuesDetected).length;
  const issueRate = totalRounds > 0 ? ((totalIssues / totalRounds) * 100).toFixed(1) : '0';
  const avgDuration = totalRounds > 0 
    ? Math.round(filteredData.reduce((acc, curr) => acc + curr.durationSeconds, 0) / totalRounds) 
    : 0;

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Preparar dados para Gráficos
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string, count: number, issues: number }>();
    
    // Pre-fill dates is tricky without external lib, so we map existing data
    filteredData.forEach(log => {
      const dateObj = new Date(log.startTime);
      const dateKey = dateObj.toLocaleDateString('pt-BR'); // Formato DD/MM/YYYY
      
      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, count: 0, issues: 0 });
      }
      const entry = map.get(dateKey)!;
      entry.count += 1;
      if (log.issuesDetected) entry.issues += 1;
    });
    
    return Array.from(map.values());
  }, [filteredData]);

  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(log => {
        map.set(log.sector, (map.get(log.sector) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Gerar PDF Gerencial
  const generateManagementReport = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const headerColor = reportConfig.headerColor || '#3b82f6';
    const companyTitle = reportConfig.companyName || "Relatório Gerencial";

    // Cabeçalho
    doc.setFillColor(headerColor);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    
    if (reportConfig.logo) {
      try {
        doc.addImage(reportConfig.logo, 'PNG', 170, 5, 25, 25);
      } catch (e) { console.error(e); }
    }

    doc.setFontSize(20);
    doc.text(companyTitle, 20, 18);
    doc.setFontSize(10);
    doc.text("Relatório Gerencial de Rondas", 20, 26);

    // Filtros Aplicados
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    // Reformat dates for display in PDF
    const startDisplay = startDate.split('-').reverse().join('/');
    const endDisplay = endDate.split('-').reverse().join('/');
    
    doc.text(`Período: ${startDisplay} a ${endDisplay}`, 20, 45);
    doc.text(`Setor: ${selectedSector === 'all' ? 'Todos' : selectedSector}`, 20, 50);
    doc.text(`Responsável: ${selectedResponsible === 'all' ? 'Todos' : selectedResponsible}`, 110, 50);

    // KPIs Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 60, 170, 25, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Rondas", 35, 70);
    doc.text("Com Ocorrência", 85, 70);
    doc.text("Tempo Médio", 145, 70);

    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text(totalRounds.toString(), 35, 80);
    
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`${totalIssues} (${issueRate}%)`, 85, 80);
    
    doc.setTextColor(16, 185, 129); // Green
    doc.text(formatTime(avgDuration), 145, 80);

    // Tabela Resumida
    let y = 100;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento Filtrado", 20, y);
    y += 10;

    // Table Header
    doc.setFillColor(230, 230, 230);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFontSize(9);
    doc.text("Data/Hora", 22, y + 6);
    doc.text("Setor", 60, y + 6);
    doc.text("Atividade", 100, y + 6);
    doc.text("Status", 160, y + 6);
    y += 10;

    doc.setFont("helvetica", "normal");
    filteredData.forEach((log) => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }

        const dateStr = new Date(log.startTime).toLocaleString();
        const status = log.issuesDetected ? "OCORRÊNCIA" : "OK";
        
        if (log.issuesDetected) doc.setTextColor(220, 50, 50);
        else doc.setTextColor(60, 60, 60);

        doc.text(dateStr, 22, y);
        doc.text(log.sector.substring(0, 20), 60, y);
        doc.text(log.taskTitle.substring(0, 30), 100, y);
        doc.text(status, 160, y);
        
        y += 7;
        doc.setDrawColor(240, 240, 240);
        doc.line(20, y - 2, 190, y - 2);
    });

    // Rodapé
    const today = new Date().toLocaleDateString();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${today} via RondaGuard Pro`, 20, pageHeight - 10);

    doc.save("Relatorio_Gerencial_Rondas.pdf");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Relatórios Gerenciais
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Análise de desempenho e auditoria de rondas.</p>
        </div>
        <button 
          onClick={generateManagementReport}
          disabled={filteredData.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown size={20} /> Exportar PDF
        </button>
      </header>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200 font-semibold">
           <Filter size={18} /> Filtros de Pesquisa
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Setor</label>
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Responsável</label>
            <select 
              value={selectedResponsible}
              onChange={(e) => setSelectedResponsible(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos</option>
              {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
             <select 
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="all">Todos</option>
                <option value="no_issues">Sem Ocorrências</option>
                <option value="with_issues">Com Ocorrências</option>
             </select>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
           <Info size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
           <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Sem dados para exibir</h3>
           <p className="text-slate-500 dark:text-slate-400">Nenhuma ronda encontrada para os filtros selecionados.</p>
           <button 
             onClick={() => {
                const d = new Date(); 
                setStartDate(new Date(d.setDate(d.getDate() - 30)).toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
                setSelectedSector('all');
                setSelectedResponsible('all');
                setIssueFilter('all');
             }}
             className="mt-4 text-blue-600 hover:underline text-sm"
           >
             Limpar filtros
           </button>
        </div>
      ) : (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total de Rondas</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalRounds}</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                    <CheckCircle size={24} />
                </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Índice de Ocorrências</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl font-bold ${Number(issueRate) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                            {issueRate}%
                        </h3>
                        <span className="text-xs text-slate-400">({totalIssues} eventos)</span>
                    </div>
                </div>
                <div className={`p-3 rounded-full ${Number(issueRate) > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    <AlertTriangle size={24} />
                </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tempo Médio</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatTime(avgDuration)}</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
                    <Clock size={24} />
                </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras - Linha do Tempo */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[350px]">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" /> Rondas por Dia
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" name="Total Rondas" radius={[4,4,0,0]} />
                                <Bar dataKey="issues" fill="#ef4444" name="Com Ocorrência" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pizza - Setores */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[350px]">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <PieIcon size={18} className="text-purple-500" /> Distribuição por Setor
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sectorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default AdvancedReports;
