import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, History as HistoryIcon, ShieldCheck, LogOut, ListChecks, Sun, Moon, Users, Settings } from 'lucide-react';
import { Task, RoundLog, AppView, ChecklistTemplate, User, UserRole, ReportConfig } from './types';
import Dashboard from './components/Dashboard';
import TaskCreator from './components/TaskCreator';
import ActiveRound from './components/ActiveRound';
import History from './components/History';
import TemplateManager from './components/TemplateManager';
import UserManager from './components/UserManager';
import ReportConfigScreen from './components/ReportConfig';
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

// Default Users for Mock
const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Carlos Técnico', email: 'tec@rondaguard.com', password: '123', role: UserRole.TECHNICIAN, active: true },
  { id: 'u2', name: 'Ana Analista', email: 'ana@rondaguard.com', password: '123', role: UserRole.ANALYST, active: true },
  { id: 'u3', name: 'Roberto Supervisor', email: 'sup@rondaguard.com', password: '123', role: UserRole.SUPERVISOR, active: true },
  { id: 'u4', name: 'Administrador', email: 'admin@rondaguard.com', password: '123', role: UserRole.ADMIN, active: true },
];

const DEFAULT_REPORT_CONFIG: ReportConfig = {
  companyName: 'RondaGuard Pro',
  logo: null,
  headerColor: '#3b82f6'
};

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

const loadUsers = (): User[] => {
    try {
        const saved = localStorage.getItem('ronda_users');
        return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch(e) { return DEFAULT_USERS; }
};

const loadReportConfig = (): ReportConfig => {
    try {
        const saved = localStorage.getItem('ronda_report_config');
        return saved ? JSON.parse(saved) : DEFAULT_REPORT_CONFIG;
    } catch(e) { return DEFAULT_REPORT_CONFIG; }
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<RoundLog[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
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
    setUsersList(loadUsers());
    setReportConfig(loadReportConfig());
    
    // Check for logged user in session
    const savedUser = sessionStorage.getItem('ronda_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Re-validate against current list to check if active
      const currentList = loadUsers();
      const validUser = currentList.find(u => u.id === parsedUser.id && u.active);
      
      if (validUser) {
        setUser(validUser);
      } else {
        sessionStorage.removeItem('ronda_user');
      }
    }
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

  useEffect(() => {
    localStorage.setItem('ronda_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('ronda_report_config', JSON.stringify(reportConfig));
  }, [reportConfig]);

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
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('ronda_user', JSON.stringify(loggedInUser));
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('ronda_user');
    setCurrentView(AppView.DASHBOARD);
  };

  // --- Handlers ---
  
  // Tasks
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
    setCurrentView(AppView.HISTORY);
  };
  
  const handleUpdateLog = (updatedLog: RoundLog) => {
      setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
  };

  const handleCancelCreate = () => {
    setTaskToEdit(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleCreateNewClick = () => {
    setTaskToEdit(null); 
    setCurrentView(AppView.CREATE_TASK);
  };

  // Templates
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

  // Users
  const handleSaveUser = (userToSave: User) => {
    setUsersList(prev => {
        const exists = prev.some(u => u.id === userToSave.id);
        if (exists) {
            return prev.map(u => u.id === userToSave.id ? userToSave : u);
        } else {
            return [...prev, userToSave];
        }
    });
  };

  const handleToggleUserStatus = (userId: string) => {
      setUsersList(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, active: !u.active };
          }
          return u;
      }));
  };

  // Settings
  const handleSaveReportConfig = (config: ReportConfig) => {
      setReportConfig(config);
      setCurrentView(AppView.DASHBOARD);
  };

  // --- Render Helpers ---

  // If not logged in, show login screen
  if (!user) {
    return (
        <div className="font-sans">
            <div className="fixed top-4 right-4 z-50">
                 <button 
                    onClick={toggleTheme}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-500 rounded-full shadow-md"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <Login onLogin={handleLogin} users={usersList} />
        </div>
    );
  }

  // Permission Logic
  const canCreate = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canViewHistory = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageTemplates = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageUsers = user.role === UserRole.ADMIN;
  const canAccessSettings = user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR;

  const renderContent = () => {
    switch(currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            tasks={tasks} 
            history={logs} 
            currentUser={user}
            onNavigate={setCurrentView}
            onStartTask={handleStartTask}
            onEditTask={handleEditTask}
            onDuplicateTask={handleDuplicateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case AppView.CREATE_TASK:
        if (!canCreate) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
          <TaskCreator 
            onSave={handleSaveTask} 
            onCancel={handleCancelCreate} 
            initialTask={taskToEdit}
            templates={templates}
          />
        );
      case AppView.EXECUTE_ROUND:
        return activeTask ? (
            <ActiveRound 
                task={activeTask} 
                currentUser={user}
                onFinish={handleFinishRound} 
                onCancel={() => { setActiveTask(null); setCurrentView(AppView.DASHBOARD); }} 
            />
        ) : <div>Erro: Nenhuma tarefa selecionada</div>;
      case AppView.HISTORY:
        if (!canViewHistory) return <div className="p-8 text-center text-red-500">Acesso Negado: Apenas supervisores podem acessar o histórico.</div>;
        return <History logs={logs} onUpdateLog={handleUpdateLog} reportConfig={reportConfig} />;
      case AppView.TEMPLATES:
        if (!canManageTemplates) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
          <TemplateManager 
            templates={templates} 
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
          />
        );
      case AppView.USER_MANAGEMENT:
        if (!canManageUsers) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
            <UserManager 
                users={usersList}
                onSave={handleSaveUser}
                onToggleStatus={handleToggleUserStatus}
                onCancel={() => setCurrentView(AppView.DASHBOARD)}
            />
        );
      case AppView.SETTINGS:
        if (!canAccessSettings) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
            <ReportConfigScreen 
                config={reportConfig}
                onSave={handleSaveReportConfig}
                onCancel={() => setCurrentView(AppView.DASHBOARD)}
            />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
             <ShieldCheck className="text-blue-500" size={32} />
             <span className="hidden md:block ml-3 font-bold text-white text-lg tracking-tight">RondaGuard</span>
          </div>

          <div className="px-4 py-4 md:hidden text-center border-b border-slate-800 mb-2">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white mx-auto font-bold text-xs">
                {user.role.charAt(0)}
             </div>
          </div>
          
          <div className="hidden md:flex px-6 py-4 items-center gap-3 border-b border-slate-800 mb-2">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize truncate">{user.role.toLowerCase()}</p>
             </div>
          </div>

          <nav className="mt-4 flex flex-col gap-2 px-2 md:px-4">
            <button 
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:block ml-3 font-medium">Dashboard</span>
            </button>

            {canCreate && (
                <button 
                onClick={handleCreateNewClick}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.CREATE_TASK ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <PlusCircle size={20} />
                <span className="hidden md:block ml-3 font-medium">Nova Tarefa</span>
                </button>
            )}

            {canViewHistory && (
                <button 
                onClick={() => setCurrentView(AppView.HISTORY)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.HISTORY ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <HistoryIcon size={20} />
                <span className="hidden md:block ml-3 font-medium">Histórico</span>
                </button>
            )}

            {canManageTemplates && (
                <button 
                onClick={() => setCurrentView(AppView.TEMPLATES)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.TEMPLATES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <ListChecks size={20} />
                <span className="hidden md:block ml-3 font-medium">Modelos</span>
                </button>
            )}

            {canManageUsers && (
                <button 
                onClick={() => setCurrentView(AppView.USER_MANAGEMENT)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.USER_MANAGEMENT ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <Users size={20} />
                <span className="hidden md:block ml-3 font-medium">Usuários</span>
                </button>
            )}
            
            {canAccessSettings && (
                <button 
                onClick={() => setCurrentView(AppView.SETTINGS)}
                className={`flex items-center p-3 rounded-lg transition-colors ${currentView === AppView.SETTINGS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                <Settings size={20} />
                <span className="hidden md:block ml-3 font-medium">Configurações</span>
                </button>
            )}
          </nav>
        </div>
        
        <div className="p-4 space-y-2">
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