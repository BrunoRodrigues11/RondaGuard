
import React, { useState, useMemo } from 'react';
import { RoundLog, ReportConfig } from '../types';
import { FileText, Calendar, Clock, MapPin, Search, Download, User, ShieldCheck, Ticket, CloudOff, Filter, X, RotateCcw } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface HistoryProps {
  logs: RoundLog[];
  onUpdateLog?: (updatedLog: RoundLog) => void;
  reportConfig: ReportConfig;
}

const History: React.FC<HistoryProps> = ({ logs, reportConfig }) => {
  // --- Estados de Filtro ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues' | 'normal'>('all');

  // --- Dados Únicos para os Selects ---
  const uniqueSectors = useMemo(() => 
    Array.from(new Set(logs.map(l => l.sector))).sort()
  , [logs]);

  const uniqueResponsibles = useMemo(() => 
    Array.from(new Set(logs.map(l => l.responsible))).sort()
  , [logs]);

  // --- Lógica de Filtragem Combinada ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Busca textual (Search Term)
      const matchesSearch = 
        log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.responsible?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filtro de Data
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (log.startTime < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (log.startTime > end) return false;
      }

      // 3. Setor
      if (selectedSector && log.sector !== selectedSector) return false;

      // 4. Responsável
      if (selectedResponsible && log.responsible !== selectedResponsible) return false;

      // 5. Status (Ocorrência)
      if (statusFilter === 'issues' && !log.issuesDetected) return false;
      if (statusFilter === 'normal' && log.issuesDetected) return false;

      return true;
    }).sort((a, b) => b.startTime - a.startTime);
  }, [logs, searchTerm, startDate, endDate, selectedSector, selectedResponsible, statusFilter]);

  // --- Limpar Filtros ---
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedSector('');
    setSelectedResponsible('');
    setStatusFilter('all');
  };

  const hasActiveFilters = startDate || endDate || selectedSector || selectedResponsible || statusFilter !== 'all';

  const generatePDF = (log: RoundLog) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    
    // Header Configuration
    const headerColor = reportConfig.headerColor || '#3b82f6';
    const companyTitle = reportConfig.companyName || "Relatório de Ronda";
    
    // Header Background
    doc.setFillColor(headerColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo & Title
    doc.setTextColor(255, 255, 255);
    
    let textX = 20;
    
    if (reportConfig.logo) {
        try {
            // Add Logo (Right aligned for header)
            doc.addImage(reportConfig.logo, 'PNG', 170, 5, 30, 30);
        } catch (e) {
            console.error("Erro ao carregar logo", e);
        }
    }

    doc.setFontSize(22);
    doc.text(companyTitle, textX, 20);
    
    if (reportConfig.companyName) {
        doc.setFontSize(12);
        doc.text("Relatório de Execução de Ronda", textX, 30);
    }

    doc.setFontSize(10);
    if(log.validationToken) {
        doc.text(`Token: ${log.validationToken}`, textX, 38);
    }
    
    // Info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    let y = 50;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Atividade: ${log.taskTitle}`, 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.text(`Setor: ${log.sector}`, 20, y);
    doc.text(`Data: ${new Date(log.startTime).toLocaleDateString()}`, 120, y);
    
    if (log.ticketId) {
        y += 10;
        doc.text(`Nº Chamado: ${log.ticketId}`, 20, y);
    }

    y += 10;
    doc.text(`Responsável: ${log.responsible || 'N/A'}`, 20, y);
    y += 10;
    doc.text(`Início: ${new Date(log.startTime).toLocaleTimeString()}`, 20, y);
    doc.text(`Fim: ${new Date(log.endTime).toLocaleTimeString()}`, 80, y);
    doc.text(`Duração: ${log.durationSeconds}s`, 140, y);
    
    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Checklist
    doc.setFont("helvetica", "bold");
    doc.text("Checklist de Verificação:", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    
    log.checklistState.forEach(item => {
      // Check for page break
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      
      const status = item.checked ? "[ OK ]" : "[ ERRO ]";
      doc.setTextColor(item.checked ? 60 : 200, item.checked ? 60 : 0, 60);
      doc.text(`${status} ${item.label}`, 20, y);
      y += 8;
    });
    doc.setTextColor(60, 60, 60);
    
    y += 10;
    if (y > pageHeight - 50) { doc.addPage(); y = 20; }
    doc.line(20, y, 190, y);
    y += 10;
    
    // Observations
    doc.setFont("helvetica", "bold");
    doc.text("Observações & Ocorrências:", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    
    const obsText = log.observations || "Nenhuma observação registrada.";
    const splitObs = doc.splitTextToSize(obsText, 170);
    doc.text(splitObs, 20, y);
    y += (splitObs.length * 7) + 10;
    

    // Signature Section
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Assinatura do Responsável:", 20, y);
    y += 5;

    if (log.signature) {
        try {
            // Add image (x, y, width, height)
            doc.addImage(log.signature, 'PNG', 20, y, 60, 20);
            y += 25;
        } catch (e) {
            doc.text("[Erro ao renderizar imagem da assinatura]", 20, y + 10);
            y += 15;
        }
    } else {
        doc.text("[Não Assinado Digitalmente]", 20, y + 10);
        y += 15;
    }

    if (log.validationToken) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Token de Validação Digital: ${log.validationToken}`, 20, y);
        doc.text("Documento gerado eletronicamente pelo sistema RondaGuard Pro.", 20, y + 4);
    }
    
    // Sanitize filename date
    const dateStr = new Date(log.startTime).toLocaleDateString().replace(/\//g, '-');
    doc.save(`Ronda_${log.taskTitle}_${dateStr}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Histórico de Rondas</h2>
              <p className="text-slate-500 dark:text-slate-400">Consulte relatórios detalhados.</p>
            </div>
            
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                    showFilters || hasActiveFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                    <Filter size={18} />
                    <span className="hidden sm:inline">Filtros Avançados</span>
                    {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </button>
            </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
                {/* Busca Textual */}
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Busca Rápida</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Setor, Título ou Ticket..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                </div>

                {/* Datas */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Início</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data Fim</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Setor */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Setor</label>
                    <select 
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todos</option>
                        {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Responsável */}
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Responsável</label>
                    <select 
                        value={selectedResponsible}
                        onChange={(e) => setSelectedResponsible(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todos</option>
                        {uniqueResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                 {/* Status */}
                 <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">Todos</option>
                        <option value="issues">Com Ocorrência</option>
                        <option value="normal">Normal</option>
                    </select>
                </div>

                {/* Botão Limpar */}
                <div className="flex items-end">
                    <button 
                        onClick={clearFilters}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2"
                        title="Limpar todos os filtros"
                    >
                        <RotateCcw size={16} /> Limpar
                    </button>
                </div>
            </div>
        )}
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma ronda encontrada com os filtros atuais.</p>
            {hasActiveFilters && (
                <button 
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:underline text-sm"
                >
                    Limpar filtros
                </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {filteredLogs.length} registros encontrados
                </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                  <th className="p-4 font-semibold">Data</th>
                  <th className="p-4 font-semibold">Tarefa / Responsável</th>
                  <th className="p-4 font-semibold">Duração</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition">
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(log.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-1">
                        <Clock size={12} />
                        {new Date(log.startTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                        {log.taskTitle}
                        {log.synced === false && (
                            <span className="text-red-500 bg-red-50 dark:bg-red-900/30 p-1 rounded" title="Pendente de sincronização (Salvo Offline)">
                                <CloudOff size={14} />
                            </span>
                        )}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                         <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                             <MapPin size={12} /> {log.sector}
                         </span>
                         <span className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                <User size={12} /> {log.responsible}
                            </span>
                            {log.ticketId && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                    <Ticket size={10} /> {log.ticketId}
                                </span>
                            )}
                         </span>
                         {log.validationToken && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded w-fit" title="Ronda validada digitalmente">
                                <ShieldCheck size={10} /> Validado
                            </span>
                         )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {log.durationSeconds}s
                    </td>
                    <td className="p-4">
                      {log.issuesDetected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                          Ocorrência
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                                onClick={() => generatePDF(log)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Baixar PDF"
                            >
                                <Download size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
