
import React, { useState, useMemo, useEffect } from 'react';
import { Task, ChecklistTemplate, User, UserRole } from '../types';
import TaskCreator from './TaskCreator';
import { Plus, Search, Filter, Briefcase, Ticket, PlayCircle, Copy, Pencil, Trash2, List, X, CheckCircle } from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  templates: ChecklistTemplate[];
  currentUser: User | null;
  taskToEdit: Task | null;
  onSaveTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartTask: (task: Task) => void;
  onDuplicateTask: (task: Task) => void;
  onEditTaskRequest: (task: Task) => void; // Solicita edição ao App.tsx (ou seta localmente)
  onClearTaskToEdit: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  templates,
  currentUser,
  taskToEdit,
  onSaveTask,
  onDeleteTask,
  onStartTask,
  onDuplicateTask,
  onEditTaskRequest,
  onClearTaskToEdit
}) => {
  // Estado local para controlar se estamos criando uma NOVA tarefa (sem ser edição de existente)
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  
  // Estado para notificação de sucesso
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Permissões
  const canCreate = currentUser?.role === UserRole.ANALYST || currentUser?.role === UserRole.SUPERVISOR || currentUser?.role === UserRole.ADMIN;
  const canDelete = currentUser?.role === UserRole.SUPERVISOR || currentUser?.role === UserRole.ADMIN;

  // Se taskToEdit mudar (vindo do pai), garantimos que o modo de criação local esteja desligado para focar na edição
  useEffect(() => {
    if (taskToEdit) {
      setIsCreatingNew(false);
    }
  }, [taskToEdit]);

  // Determina se o formulário está visível
  const isFormVisible = isCreatingNew || !!taskToEdit;

  // Filtros
  const uniqueSectors = useMemo(() => Array.from(new Set(tasks.map(t => t.sector))).sort(), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        task.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSector = selectedSector === 'all' || task.sector === selectedSector;

      return matchesSearch && matchesSector;
    });
  }, [tasks, searchTerm, selectedSector]);

  // Handlers
  const handleCancelForm = () => {
    setIsCreatingNew(false);
    onClearTaskToEdit();
  };

  const handleSuccessSave = (task: Task) => {
    onSaveTask(task);
    handleCancelForm();
    setSuccessMessage("Tarefa salva com sucesso!");
    
    // Remove a mensagem após 3 segundos
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      onDeleteTask(id);
    }
  };

  // --- Renderização do Formulário ---
  if (isFormVisible) {
    return (
      <div className="animate-fade-in">
         <TaskCreator 
            onSave={handleSuccessSave}
            onCancel={handleCancelForm}
            initialTask={taskToEdit}
            templates={templates}
         />
      </div>
    );
  }

  // --- Renderização da Lista ---
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="text-blue-600" /> Gestão de Tarefas
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie, inicie e monitore as atividades de ronda.
          </p>
        </div>
        {canCreate && (
            <button 
                onClick={() => setIsCreatingNew(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
            >
                <Plus size={20} /> Nova Tarefa
            </button>
        )}
      </header>

      {/* Notificação de Sucesso */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="font-medium">{successMessage}</span>
            </div>
            <button 
                onClick={() => setSuccessMessage(null)} 
                className="text-green-600 dark:text-green-300 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full p-1 transition"
            >
                <X size={18} />
            </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <input 
                type="text" 
                placeholder="Buscar por título, setor ou ticket..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
         </div>
         <div className="w-full md:w-64 relative">
            <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none dark:text-white"
            >
                <option value="all">Todos os Setores</option>
                {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
         </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
         <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
             <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <List size={20} /> Lista de Atividades
             </span>
             <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                 {filteredTasks.length} resultados
             </span>
         </div>

         {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
                <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-700/50 mb-4">
                    <Briefcase size={32} className="text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">Nenhuma tarefa encontrada.</p>
                {searchTerm || selectedSector !== 'all' ? (
                    <button onClick={() => { setSearchTerm(''); setSelectedSector('all'); }} className="text-blue-600 text-sm mt-2 hover:underline">
                        Limpar filtros
                    </button>
                ) : null}
            </div>
         ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTasks.map(task => (
                    <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition flex flex-col md:flex-row md:items-center gap-4 group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                    {task.sector}
                                </span>
                                {task.ticketId && (
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                        <Ticket size={10} /> {task.ticketId}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{task.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                                {task.description || "Sem descrição adicional."}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <button 
                                onClick={() => onStartTask(task)}
                                className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none"
                            >
                                <PlayCircle size={18} /> <span className="md:hidden lg:inline">Iniciar</span>
                            </button>
                            
                            {/* Menu de Ações (Sempre visível ou on hover) */}
                            <div className="flex gap-1 border-l border-slate-200 dark:border-slate-600 pl-2 ml-2">
                                {canCreate && (
                                    <>
                                        <button 
                                            onClick={() => onDuplicateTask(task)}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                                            title="Duplicar"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onEditTaskRequest(task)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </>
                                )}
                                {canDelete && (
                                    <button 
                                        onClick={() => handleDeleteClick(task.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default TaskManager;
