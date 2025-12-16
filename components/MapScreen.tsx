
import React, { useState, useMemo } from 'react';
import { Task, RoundLog, User, UserRole } from '../types';
import FacilityMap from './FacilityMap';
import { FilterX, List, Ticket, PlayCircle, Copy, Pencil, Trash2, Map as MapIcon } from 'lucide-react';

interface MapScreenProps {
  tasks: Task[];
  history: RoundLog[];
  currentUser: User | null;
  onStartTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ 
  tasks, 
  history, 
  currentUser, 
  onStartTask, 
  onEditTask, 
  onDuplicateTask, 
  onDeleteTask 
}) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Filtrar dados com base no setor selecionado
  const filteredTasks = useMemo(() => {
    return selectedSector ? tasks.filter(t => t.sector === selectedSector) : tasks;
  }, [tasks, selectedSector]);

  // Permissões (reutilizando lógica do Dashboard)
  const canManageTasks = currentUser?.role === UserRole.ANALYST || currentUser?.role === UserRole.SUPERVISOR || currentUser?.role === UserRole.ADMIN;
  const canDelete = currentUser?.role === UserRole.SUPERVISOR || currentUser?.role === UserRole.ADMIN;

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      onDeleteTask(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapIcon className="text-blue-600" /> Mapa em Tempo Real
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
            Visualize o status dos setores e selecione uma área para ver as tarefas disponíveis.
        </p>
      </header>

      {/* Mapa */}
      <FacilityMap 
        tasks={tasks} 
        history={history} 
        selectedSector={selectedSector} 
        onSelectSector={setSelectedSector} 
      />

      {/* Indicador de Filtro */}
      {selectedSector && (
         <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl animate-fade-in">
             <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                 <FilterX size={20} />
                 <span className="font-medium">Exibindo tarefas do setor: <strong>{selectedSector}</strong></span>
             </div>
             <button 
                onClick={() => setSelectedSector(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
             >
                Limpar Filtro (Ver Todas)
             </button>
         </div>
      )}

      {/* Lista de Tarefas Filtrada */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                 {selectedSector ? `Tarefas em: ${selectedSector}` : 'Todas as Tarefas da Planta'}
             </h3>
             <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                 {filteredTasks.length} encontrada(s)
             </span>
         </div>

         {filteredTasks.length === 0 ? (
           <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
             <List size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
             <p className="text-slate-500 dark:text-slate-400 mb-1">
                 {selectedSector ? `Nenhuma tarefa cadastrada para o setor "${selectedSector}".` : 'Nenhuma tarefa cadastrada.'}
             </p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredTasks.map(task => (
               <div key={task.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition group bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 relative flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2 pr-2">
                        <h4 className="font-semibold text-slate-800 dark:text-white truncate flex-1" title={task.title}>{task.title}</h4>
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
                  </div>
                  
                  {/* Botões de Ação */}
                  <div>
                    {canManageTasks && (
                        <div className="absolute top-4 right-4 flex gap-1 bg-white dark:bg-slate-800 rounded shadow-sm p-0.5 border border-slate-100 dark:border-slate-600">
                            <button 
                                onClick={() => onDuplicateTask(task)}
                                className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded-md transition"
                                title="Duplicar"
                            >
                                <Copy size={14} />
                            </button>
                            <button 
                                onClick={() => onEditTask(task)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition"
                                title="Editar"
                            >
                                <Pencil size={14} />
                            </button>
                            {canDelete && (
                                <button 
                                    onClick={() => handleDeleteClick(task.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition"
                                    title="Excluir"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={() => onStartTask(task)}
                        className="w-full py-2 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition flex items-center justify-center gap-2 group-hover:shadow-md"
                    >
                        <PlayCircle size={18} /> Iniciar
                    </button>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
};

export default MapScreen;
