
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History as HistoryIcon, ShieldCheck, LogOut, ListChecks, Sun, Moon } from 'lucide-react';
import { Task, RoundLog, AppView, ChecklistTemplate, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import TaskCreator from './components/TaskCreator';
import ActiveRound from './components/ActiveRound';
import History from './components/History';
import TemplateManager from './components/TemplateManager';
import Login from './components/Login';

// Default templates
const DEFAULT_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "tpl_1",
    name: "Ronda Perimetral de Segurança",
    items: [
      "Verificar integridade da cerca elétrica",
      "Checar cadeados dos portões externos",
      "Verificar iluminação do perímetro",
      "Inspecionar guaritas desativadas",
      "Verificar ausência de objetos suspeitos"
    ]
  },
  {
    id: "tpl_2",
    name: "Prevenção de Incêndio (Extintores/Hidrantes)",
    items: [
      "Verificar lacre dos extintores",
      "Checar validade da carga dos extintores",
      "Verificar desobstrução dos hidrantes",
      "Checar sinalização de emergência",
      "Testar portas corta-fogo"
    ]
  },
  {
    id: "tpl_3",
    name: "Fechamento Geral (Fim de Expediente)",
    items: [
      "Apagar luzes dos escritórios",
      "Desligar aparelhos de ar-condicionado",
      "Trancar portas de acesso restrito",
      "Verificar janelas fechadas",
      "Ativar sistema de alarme",
      "Verificar banheiros (vazamentos/luzes)"
    ]
  },
  {
    id: "tpl_4",
    name: "Limpeza e Conservação",
    items: [
      "Verificar lixeiras (esvaziamento)",
      "Checar reposição de papel/sabonete",
      "Inspecionar limpeza do hall de entrada",
      "Verificar funcionamento de bebedouros"
    ]
  }
];

// --- LocalStorage Helpers ---
const loadTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem('ronda_tasks');
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
};

const loadHistory = (): RoundLog[] => {
  try {
    const saved = localStorage.getItem('ronda_history');
    return saved ? JSON.parse(saved) : [];
  } catch(e) { return []; }
};

const loadTemplates = (): ChecklistTemplate[] => {
  try {
    const saved = localStorage.getItem('ronda_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  } catch(e) { return DEFAULT_TEMPLATES; }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<RoundLog[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Initialization
  useEffect(() => {
    setTasks(loadTasks());
    setLogs(loadHistory());
    setTemplates(loadTemplates());
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ronda_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ronda_history', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('ronda_templates', JSON.stringify(templates));
  }, [templates]);

  // Theme Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Task Handlers
  const handleSaveTask = (task: Task) => {
    setTasks(prev => {
        const exists = prev.some(t => t.id === task.id);
        if (exists) {
            return prev.map(t => t.id === task.id ? task : t);
        } else {
            return [task, ...prev];
        }
    });
    setTaskToEdit(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCurrentView(AppView.CREATE_TASK);
  };

  const handleDuplicateTask = (task: Task) => {
    const taskCopy: Task = {
        ...task,
        id: '', 
        title: `${task.title} (Cópia)`,
        createdAt: Date.now()
    };
    setTaskToEdit(taskCopy);
    setCurrentView(AppView.CREATE_TASK);
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    setCurrentView(AppView.EXECUTE_ROUND);
  };

  const handleFinishRound = (log: RoundLog) => {
    setLogs(prev => [log, ...prev]);
    setActiveTask(null);
    // If Supervisor, go to History. If Technician, back to Dashboard.
    if (currentUser?.role === UserRole.SUPERVISOR) {
        setCurrentView(AppView.HISTORY);
    } else {
        setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleCancelCreate = () => {
    setTaskToEdit(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleCreateNewClick = () => {
    setTaskToEdit(null); 
    setCurrentView(AppView.CREATE_TASK);
  };

  // Template Handlers
  const handleSaveTemplate = (template: ChecklistTemplate) => {
    setTemplates(prev => {
      const exists = prev.some(t => t.id === template.id);
      if (exists) {
        return prev.map(t => t.id === template.id ? template : t);
      } else {
        return [template, ...prev];
      }
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // --- Render Helpers ---

  // Check permissions for Views
  const canAccessHistory = currentUser?.role === UserRole.SUPERVISOR;
  const canAccessTemplates = currentUser?.role === UserRole.ANALYST;
  const canCreateTasks = currentUser?.role === UserRole.ANALYST;

  const renderContent = () => {
    if (!currentUser) return null;

    switch(currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            tasks={tasks} 
            history={logs} 
            currentUser={currentUser}
            onNavigate={setCurrentView}
            onStartTask={handleStartTask}
            onEditTask={handleEditTask}
            onDuplicateTask={handleDuplicateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case AppView.CREATE_TASK:
        return canCreateTasks ? (
          <TaskCreator 
            onSave={handleSaveTask} 
            onCancel={handleCancelCreate} 
            initialTask={taskToEdit}
            templates={templates}
          />
        ) : <div>Acesso Negado</div>;
      case AppView.EXECUTE_ROUND:
        return activeTask ? (
            <ActiveRound 
                task={activeTask} 
                user={currentUser}
                onFinish={handleFinishRound} 
                onCancel={() => { setActiveTask(null); setCurrentView(AppView.DASHBOARD); }} 
            />
        ) : <div>Erro: Nenhuma tarefa selecionada</div>;
      case AppView.HISTORY:
        return canAccessHistory ? (
            <History logs={logs} />
        ) : <div>Acesso restrito a Supervisores.</div>;
      case AppView.TEMPLATES:
        return canAccessTemplates ? (
          <TemplateManager 
            templates={templates} 
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
          />
        ) : <div>Acesso restrito a Analistas.</div>;
      default:
        return <div>View not found</div>;
    }
  };

  if (!currentUser) {
    return (
        <div className="font-sans">
             <div className="absolute top-4 right-4 z-50">
                <button 
                    onClick={toggleTheme}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 rounded-full shadow-sm hover:text-blue-500"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
             </div>
            <Login onLogin={handleLogin} />
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar - Permissions Based */}
      <aside className="w-20 md:w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
             <ShieldCheck className="text-blue-500" size={32} />
             <span className="hidden md:block ml-3 font-bold text-white text-lg tracking-tight">RondaGuard</span>
          </div>

          <nav className="mt-8 flex flex-col gap-2 px-2 md:px-4">
            <button 
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:block ml-3 font-medium">Dashboard</span>
            </button>

            {canCreateTasks && (
                <button 
                onClick={handleCreateNewClick}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.CREATE_TASK ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <PlusCircle size={20} />
                <span className="hidden md:block ml-3 font-medium">Nova Tarefa</span>
                </button>
            )}

            {canAccessHistory && (
                <button 
                onClick={() => setCurrentView(AppView.HISTORY)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <HistoryIcon size={20} />
                <span className="hidden md:block ml-3 font-medium">Histórico</span>
                </button>
            )}

            {canAccessTemplates && (
                <button 
                onClick={() => setCurrentView(AppView.TEMPLATES)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.TEMPLATES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <ListChecks size={20} />
                <span className="hidden md:block ml-3 font-medium">Modelos</span>
                </button>
            )}
          </nav>
        </div>
        
        <div className="p-4 space-y-2">
            <div className="px-3 py-2 text-xs text-slate-500 uppercase font-semibold">
                {currentUser.name}
            </div>
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center md:justify-start w-full p-3 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition"
            title={darkMode ? "Modo Claro" : "Modo Escuro"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="hidden md:block ml-3 font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start w-full p-3 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="hidden md:block ml-3 font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;
