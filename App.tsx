
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History as HistoryIcon, ShieldCheck, LogOut, ListChecks, Sun, Moon, Users, Settings, BarChart3, Map as MapIcon, Briefcase, Menu, X } from 'lucide-react';
import { Task, RoundLog, AppView, ChecklistTemplate, User, UserRole, ReportConfig } from './types';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import ActiveRound from './components/ActiveRound';
import History from './components/History';
import TemplateManager from './components/TemplateManager';
import UserManager from './components/UserManager';
import ReportConfigScreen from './components/ReportConfig';
import AdvancedReports from './components/AdvancedReports';
import MapScreen from './components/MapScreen';
import Login from './components/Login';
import OfflineIndicator from './components/OfflineIndicator';
import { api } from './services/api';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<RoundLog[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
      companyName: 'RondaGuard Pro', headerColor: '#3b82f6', logo: null
  });

  // UI State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Initialization: Load User from Session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ronda_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Initialization: Load Data when User is Logged In
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedTasks, fetchedLogs, fetchedTemplates, fetchedUsers, fetchedConfig] = await Promise.all([
        api.getTasks(),
        api.getRounds(),
        api.getTemplates(),
        api.getUsers(),
        api.getSettings()
      ]);

      setTasks(fetchedTasks);
      setLogs(fetchedLogs);
      setTemplates(fetchedTemplates);
      setUsersList(fetchedUsers);
      setReportConfig(fetchedConfig);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Don't alert here, it might just be offline.
    } finally {
      setIsLoading(false);
    }
  };

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
    setTasks([]);
    setLogs([]);
  };

  // --- Handlers ---
  const handleNavClick = (view: AppView) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
  };
  
  // Tasks
  const handleSaveTask = async (task: Task) => {
    try {
        await api.saveTask(task);
        const updatedTasks = await api.getTasks();
        setTasks(updatedTasks);
        setTaskToEdit(null);
        // We stay on the tasks view
    } catch (e) {
        alert("Erro ao salvar tarefa");
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCurrentView(AppView.TASKS); // Redirect to Tasks view with edit mode active
  };

  const handleDuplicateTask = (task: Task) => {
    const taskCopy: Task = {
        ...task,
        id: Date.now().toString(), 
        title: `${task.title} (Cópia)`,
        createdAt: Date.now()
    };
    setTaskToEdit(taskCopy);
    setCurrentView(AppView.TASKS); // Redirect to Tasks view with copy ready to edit
  };

  const handleDeleteTask = async (taskId: string) => {
      try {
          await api.deleteTask(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (e) {
          alert("Erro ao excluir tarefa");
      }
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    setCurrentView(AppView.EXECUTE_ROUND);
  };

  const handleFinishRound = async (log: RoundLog) => {
    try {
        await api.saveRound(log);
        const updatedLogs = await api.getRounds();
        setLogs(updatedLogs);
        
        setActiveTask(null);
        setCurrentView(AppView.HISTORY);
    } catch (e: any) {
        if (e.message === "OFFLINE_SAVED") {
            const updatedLogs = await api.getRounds();
            setLogs(updatedLogs);
            setActiveTask(null);
            setCurrentView(AppView.HISTORY);
        } else {
            alert("Erro ao salvar ronda: " + e.message);
        }
    }
  };

  const handleUpdateLog = (updatedLog: RoundLog) => {
     console.log("Update log not implemented yet in backend for history view update");
  };

  const handleCancelCreate = () => {
    setTaskToEdit(null);
    // If cancelling from standalone creator, go back to Dashboard, but now we use TaskManager primarily
    if (currentView === AppView.CREATE_TASK) {
        setCurrentView(AppView.DASHBOARD);
    }
  };

  // Templates
  const handleSaveTemplate = async (template: ChecklistTemplate) => {
    try {
        await api.saveTemplate(template);
        const updated = await api.getTemplates();
        setTemplates(updated);
    } catch (e) {
        alert("Erro ao salvar modelo");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
        await api.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
        alert("Erro ao excluir modelo");
    }
  };

  // Users
  const handleSaveUser = async (userToSave: User) => {
    try {
        await api.saveUser(userToSave);
        const updatedUsers = await api.getUsers();
        setUsersList(updatedUsers);
    } catch (e) {
        alert("Erro ao salvar usuário");
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const user = usersList.find(u => u.id === userId);
      if (user) {
          try {
              await api.toggleUserStatus(userId, !user.active);
              const updatedUsers = await api.getUsers();
              setUsersList(updatedUsers);
          } catch (e) {
              alert("Erro ao alterar status");
          }
      }
  };

  // Settings
  const handleSaveReportConfig = async (config: ReportConfig) => {
      try {
          await api.saveSettings(config);
          setReportConfig(config);
          setCurrentView(AppView.DASHBOARD);
      } catch (e) {
          alert("Erro ao salvar configurações");
      }
  };

  // Handle Sync Complete
  const handleSyncComplete = async () => {
      const updatedLogs = await api.getRounds();
      setLogs(updatedLogs);
  };

  // --- Render Helpers ---

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
            <Login onLogin={handleLogin} />
        </div>
    );
  }

  // Permission Logic
  const canCreate = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canViewHistory = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canViewReports = user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageTemplates = user.role === UserRole.ANALYST || user.role === UserRole.SUPERVISOR || user.role === UserRole.ADMIN;
  const canManageUsers = user.role === UserRole.ADMIN;
  const canAccessSettings = user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR;

  const renderContent = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

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
      case AppView.TASKS:
        return (
            <TaskManager 
                tasks={tasks}
                templates={templates}
                currentUser={user}
                taskToEdit={taskToEdit}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onStartTask={handleStartTask}
                onDuplicateTask={handleDuplicateTask}
                onEditTaskRequest={handleEditTask}
                onClearTaskToEdit={() => setTaskToEdit(null)}
            />
        );
      case AppView.MAP:
        return (
            <MapScreen 
                tasks={tasks}
                history={logs}
                currentUser={user}
                onStartTask={handleStartTask}
                onEditTask={handleEditTask}
                onDuplicateTask={handleDuplicateTask}
                onDeleteTask={handleDeleteTask}
            />
        );
      case AppView.CREATE_TASK: 
        // Keep for fallback
        if (!canCreate) return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
        return (
          <TaskManager 
            tasks={tasks}
            templates={templates}
            currentUser={user}
            taskToEdit={taskToEdit || null}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onStartTask={handleStartTask}
            onDuplicateTask={handleDuplicateTask}
            onEditTaskRequest={handleEditTask}
            onClearTaskToEdit={() => setTaskToEdit(null)}
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
      case AppView.REPORTS:
        if (!canViewReports) return <div className="p-8 text-center text-red-500">Acesso Negado: Apenas supervisores/admin.</div>;
        return <AdvancedReports logs={logs} reportConfig={reportConfig} />;
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

  const navItemClass = (view: AppView) => 
    `w-full flex items-center p-3 rounded-lg transition-colors ${currentView === view ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;

  const mobileNavItemClass = (view: AppView) =>
    `flex flex-col items-center justify-center py-2 px-4 transition-colors ${currentView === view ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Offline Indicator at the bottom */}
      <OfflineIndicator onSyncComplete={handleSyncComplete} />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Responsive Drawer on Mobile) */}
      <aside className={`
          fixed md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
             <div className="flex items-center">
                <ShieldCheck className="text-blue-500" size={32} />
                <span className="ml-3 font-bold text-white text-lg tracking-tight">RondaGuard</span>
             </div>
             {/* Close Button for Mobile Drawer */}
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                 <X size={24} />
             </button>
          </div>
          
          <div className="flex px-6 py-4 items-center gap-3 border-b border-slate-800 mb-2 flex-shrink-0">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize truncate">{user.role.toLowerCase()}</p>
             </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1 px-4 overflow-y-auto flex-1 scrollbar-hide">
            {/* Categoria: Visão Geral */}
            <div className="mb-4">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Visão Geral</p>
                <div className="space-y-1">
                    <button onClick={() => handleNavClick(AppView.DASHBOARD)} className={navItemClass(AppView.DASHBOARD)}>
                        <LayoutDashboard size={20} />
                        <span className="ml-3 font-medium">Dashboard</span>
                    </button>
                    
                    <button onClick={() => handleNavClick(AppView.MAP)} className={navItemClass(AppView.MAP)}>
                        <MapIcon size={20} />
                        <span className="ml-3 font-medium">Mapa</span>
                    </button>

                    <button onClick={() => { setTaskToEdit(null); handleNavClick(AppView.TASKS); }} className={navItemClass(AppView.TASKS)}>
                        <Briefcase size={20} />
                        <span className="ml-3 font-medium">Tarefas</span>
                    </button>
                </div>
            </div>

            {/* Categoria: Gestão */}
            {(canViewHistory || canViewReports) && (
                <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gestão</p>
                    <div className="space-y-1">
                        {canViewHistory && (
                            <button onClick={() => handleNavClick(AppView.HISTORY)} className={navItemClass(AppView.HISTORY)}>
                                <HistoryIcon size={20} />
                                <span className="ml-3 font-medium">Histórico</span>
                            </button>
                        )}

                        {canViewReports && (
                            <button onClick={() => handleNavClick(AppView.REPORTS)} className={navItemClass(AppView.REPORTS)}>
                                <BarChart3 size={20} />
                                <span className="ml-3 font-medium">Relatórios</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Categoria: Sistema */}
            {(canManageTemplates || canManageUsers || canAccessSettings) && (
                <div className="mb-4">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sistema</p>
                    <div className="space-y-1">
                        {canManageTemplates && (
                            <button onClick={() => handleNavClick(AppView.TEMPLATES)} className={navItemClass(AppView.TEMPLATES)}>
                                <ListChecks size={20} />
                                <span className="ml-3 font-medium">Modelos</span>
                            </button>
                        )}

                        {canManageUsers && (
                            <button onClick={() => handleNavClick(AppView.USER_MANAGEMENT)} className={navItemClass(AppView.USER_MANAGEMENT)}>
                                <Users size={20} />
                                <span className="ml-3 font-medium">Usuários</span>
                            </button>
                        )}
                        
                        {canAccessSettings && (
                            <button onClick={() => handleNavClick(AppView.SETTINGS)} className={navItemClass(AppView.SETTINGS)}>
                                <Settings size={20} />
                                <span className="ml-3 font-medium">Configurações</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
          </nav>
        </div>
        
        <div className="p-4 space-y-2 border-t border-slate-800 bg-slate-900 flex-shrink-0">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-start w-full p-3 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="ml-3 font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-start w-full p-3 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut size={20} />
            <span className="ml-3 font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         {/* Mobile Header (Only Visible on Mobile since Sidebar is Hidden) */}
         <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 flex-shrink-0">
             <div className="flex items-center gap-2">
                 <ShieldCheck className="text-blue-500" size={24} />
                 <span className="font-bold text-white text-lg">RondaGuard</span>
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={toggleTheme} className="text-slate-400 hover:text-yellow-400">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </button>
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                     {user.name.charAt(0)}
                 </div>
             </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 mb-16 md:mb-0">
            {renderContent()}
         </div>

         {/* Mobile Bottom Navigation */}
         <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30 flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
             <button onClick={() => setCurrentView(AppView.DASHBOARD)} className={mobileNavItemClass(AppView.DASHBOARD)}>
                 <LayoutDashboard size={22} />
                 <span className="text-[10px] font-medium mt-1">Inicio</span>
             </button>
             
             <button onClick={() => setCurrentView(AppView.TASKS)} className={mobileNavItemClass(AppView.TASKS)}>
                 <Briefcase size={22} />
                 <span className="text-[10px] font-medium mt-1">Tarefas</span>
             </button>

             <button onClick={() => setCurrentView(AppView.MAP)} className={mobileNavItemClass(AppView.MAP)}>
                 <MapIcon size={22} />
                 <span className="text-[10px] font-medium mt-1">Mapa</span>
             </button>
             
             <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center justify-center py-2 px-4 text-slate-500 dark:text-slate-400">
                 <Menu size={22} />
                 <span className="text-[10px] font-medium mt-1">Menu</span>
             </button>
         </nav>
      </main>
    </div>
  );
};

export default App;
