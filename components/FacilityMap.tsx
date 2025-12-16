
import React, { useMemo } from 'react';
import { RoundLog, Task } from '../types';
import { MapPin, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

interface FacilityMapProps {
  tasks: Task[];
  history: RoundLog[];
  selectedSector: string | null;
  onSelectSector: (sector: string | null) => void;
}

// Helper to generate deterministic positions based on string hash
// giving a "stable" position for the same sector name every time.
const getStablePosition = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Pre-defined overrides for common demo names for better visual layout
  const overrides: Record<string, {x: number, y: number}> = {
    'Almoxarifado': { x: 20, y: 30 },
    'Galpão A': { x: 75, y: 65 },
    'Produção': { x: 50, y: 50 },
    'Recepção': { x: 25, y: 80 },
    'Escritório': { x: 80, y: 25 },
    'Estacionamento': { x: 15, y: 15 },
    'Corredor B': { x: 60, y: 20 },
  };

  if (overrides[str]) return overrides[str];

  // Map hash to 10-90% range to keep inside container
  const x = Math.abs(hash % 80) + 10; 
  const y = Math.abs((hash >> 2) % 80) + 10;
  return { x, y };
};

const FacilityMap: React.FC<FacilityMapProps> = ({ tasks, history, selectedSector, onSelectSector }) => {
  // Extract unique sectors from both tasks and history
  const sectorsData = useMemo(() => {
    const uniqueSectors = new Set<string>();
    tasks.forEach(t => uniqueSectors.add(t.sector));
    history.forEach(h => uniqueSectors.add(h.sector));

    return Array.from(uniqueSectors).map(sector => {
      // Find latest status for this sector
      const sectorHistory = history.filter(h => h.sector === sector).sort((a, b) => b.startTime - a.startTime);
      const lastRound = sectorHistory[0];
      const hasIssue = lastRound?.issuesDetected;
      const pos = getStablePosition(sector);
      const pendingTasks = tasks.filter(t => t.sector === sector).length;

      return {
        name: sector,
        x: pos.x,
        y: pos.y,
        hasIssue,
        lastRoundTime: lastRound?.startTime,
        pendingTasks
      };
    });
  }, [tasks, history]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
             <Navigation className="text-blue-600" size={20} /> Mapa da Instalação
           </h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">
             Visão em tempo real dos setores. Clique para filtrar.
           </p>
        </div>
        {selectedSector && (
          <button 
            onClick={() => onSelectSector(null)}
            className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-slate-900 rounded-lg overflow-hidden group shadow-inner border border-slate-700">
        
        {/* Grid Background Pattern (Blueprint style) */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>
        
        {/* Floor Plan Shapes (Decorative) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10 stroke-slate-500" strokeWidth="2">
            <rect x="10%" y="10%" width="30%" height="30%" fill="none" />
            <rect x="50%" y="10%" width="40%" height="20%" fill="none" />
            <rect x="10%" y="50%" width="80%" height="40%" fill="none" />
            <path d="M 40% 40% L 60% 40% L 60% 60% L 40% 60% Z" fill="none" />
        </svg>

        {/* Sector Markers */}
        {sectorsData.map((sector) => {
           const isSelected = selectedSector === sector.name;
           const isDimmed = selectedSector && !isSelected;

           return (
             <button
               key={sector.name}
               onClick={() => onSelectSector(isSelected ? null : sector.name)}
               style={{ left: `${sector.x}%`, top: `${sector.y}%` }}
               className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/pin transition-all duration-300 z-10 
                 ${isDimmed ? 'opacity-30 scale-90 grayscale' : 'opacity-100 scale-100'}
                 ${isSelected ? 'z-20 scale-110' : ''}
               `}
             >
               {/* Pulse Effect for Issues */}
               {sector.hasIssue && (
                 <span className="absolute w-full h-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
               )}

               {/* Pin Icon */}
               <div className={`
                 relative p-2 rounded-full shadow-lg border-2 transition-colors
                 ${sector.hasIssue 
                    ? 'bg-red-600 border-red-400 text-white' 
                    : isSelected 
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'}
               `}>
                 <MapPin size={20} fill={isSelected || sector.hasIssue ? "currentColor" : "none"} />
               </div>

               {/* Label */}
               <div className={`
                 mt-2 px-2 py-1 rounded bg-slate-900/90 text-xs font-medium whitespace-nowrap border border-slate-700 backdrop-blur-sm transition-all
                 ${isSelected ? 'text-white border-blue-500 shadow-blue-900/50 shadow-lg' : 'text-slate-300 group-hover/pin:text-white'}
               `}>
                 {sector.name}
               </div>

               {/* Tooltip on Hover */}
               <div className="absolute bottom-full mb-2 hidden group-hover/pin:block w-48 bg-slate-800 text-left p-3 rounded-lg shadow-xl border border-slate-700 z-30">
                  <p className="font-bold text-white text-sm border-b border-slate-700 pb-1 mb-1">{sector.name}</p>
                  <div className="space-y-1">
                      <p className="text-xs text-slate-400 flex justify-between">
                          Tarefas: <span className="text-white">{sector.pendingTasks}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                          Status: 
                          {sector.hasIssue ? (
                              <span className="text-red-400 ml-1 flex items-center inline-flex gap-1"><AlertCircle size={10}/> Ocorrência</span>
                          ) : (
                              <span className="text-emerald-400 ml-1 flex items-center inline-flex gap-1"><CheckCircle size={10}/> Normal</span>
                          )}
                      </p>
                      {sector.lastRoundTime && (
                          <p className="text-[10px] text-slate-500 mt-1">
                              Última: {new Date(sector.lastRoundTime).toLocaleDateString()}
                          </p>
                      )}
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
               </div>
             </button>
           );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur p-2 rounded border border-slate-700 text-[10px] text-slate-300 flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div> Selecionado
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600"></div> Com Ocorrência
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700 border border-slate-500"></div> Normal
            </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityMap;
