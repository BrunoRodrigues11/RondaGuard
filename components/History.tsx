import React, { useState } from 'react';
import { RoundLog } from '../types';
import { FileText, Calendar, Clock, MapPin, Search, Download, User, ShieldCheck, Ticket } from 'lucide-react';
import jsPDF from 'jspdf';

interface HistoryProps {
  logs: RoundLog[];
  onUpdateLog?: (updatedLog: RoundLog) => void;
}

const History: React.FC<HistoryProps> = ({ logs }) => {
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(log => 
    log.taskTitle.toLowerCase().includes(filter.toLowerCase()) ||
    log.sector.toLowerCase().includes(filter.toLowerCase()) ||
    log.responsible?.toLowerCase().includes(filter.toLowerCase()) ||
    log.ticketId?.toLowerCase().includes(filter.toLowerCase()) ||
    new Date(log.startTime).toLocaleDateString().includes(filter)
  ).sort((a, b) => b.startTime - a.startTime);

  const generatePDF = (log: RoundLog) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    doc.setFillColor(59, 130, 246); // Blue header
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Relatório de Ronda", 20, 25);
    
    doc.setFontSize(10);
    if(log.validationToken) {
        doc.text(`Token: ${log.validationToken}`, 150, 25);
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

    doc.save(`Ronda_${log.taskTitle}_${new Date(log.startTime).toLocaleDateString()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Histórico de Rondas</h2>
          <p className="text-slate-500 dark:text-slate-400">Consulte relatórios e gere PDFs.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por setor, chamado..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full md:w-64"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma ronda encontrada no histórico.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <p className="font-medium text-slate-800 dark:text-white">{log.taskTitle}</p>
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