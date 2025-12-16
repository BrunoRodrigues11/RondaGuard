
import { Task, RoundLog, ChecklistTemplate, User, ReportConfig, UserRole } from '../types';

// Mock Data / LocalStorage Implementation

const STORAGE_KEYS = {
  USERS: 'ronda_users',
  TASKS: 'ronda_tasks',
  ROUNDS: 'ronda_rounds',
  OFFLINE_QUEUE: 'ronda_offline_queue', // New key for offline data
  TEMPLATES: 'ronda_templates',
  SETTINGS: 'ronda_settings'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Default Data
const initData = () => {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const defaultUsers: User[] = [
        { id: '1', name: 'Admin User', email: 'admin@rondaguard.com', password: '123', role: UserRole.ADMIN, active: true },
        { id: '2', name: 'João Técnico', email: 'tec@rondaguard.com', password: '123', role: UserRole.TECHNICIAN, active: true },
        { id: '3', name: 'Maria Supervisora', email: 'sup@rondaguard.com', password: '123', role: UserRole.SUPERVISOR, active: true },
        { id: '4', name: 'Carlos Analista', email: 'ana@rondaguard.com', password: '123', role: UserRole.ANALYST, active: true },
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
  } catch (e) {
    console.error("Error initializing local storage data", e);
  }
};

// Safe initialization
if (typeof window !== 'undefined') {
  initData();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) throw new Error('Credenciais inválidas.');
    if (!user.active) throw new Error('Usuário inativo.');
    
    return user;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },
  
  saveUser: async (user: User): Promise<void> => {
    await delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  toggleUserStatus: async (userId: string, active: boolean): Promise<void> => {
    await delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === userId);
    if (user) {
      user.active = active;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  },

  saveTask: async (task: Task): Promise<void> => {
    await delay(300);
    const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const index = tasks.findIndex(t => t.id === task.id);
    
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await delay(300);
    const tasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
  },

  // Templates
  getTemplates: async (): Promise<ChecklistTemplate[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
  },

  saveTemplate: async (template: ChecklistTemplate): Promise<void> => {
    await delay(300);
    const templates: ChecklistTemplate[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    const index = templates.findIndex(t => t.id === template.id);
    
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await delay(300);
    const templates: ChecklistTemplate[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filtered));
  },

  // Rounds / History with Offline Support
  getRounds: async (): Promise<RoundLog[]> => {
    // Return both synced rounds AND offline queue rounds so user sees everything
    const syncedRounds: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUNDS) || '[]');
    const offlineQueue: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    
    // Merge arrays. Note: Offline queue items are usually newer.
    return [...offlineQueue, ...syncedRounds];
  },

  saveRound: async (log: RoundLog): Promise<void> => {
    // Check for internet connection
    if (!navigator.onLine) {
      // Save to Offline Queue
      const offlineQueue: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      const offlineLog = { ...log, synced: false };
      offlineQueue.unshift(offlineLog);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
      
      // Simulate minimal delay for local save
      await delay(100);
      throw new Error("OFFLINE_SAVED"); // Special signal for UI
    }

    // Normal Online Save
    await delay(500);
    const rounds: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUNDS) || '[]');
    const syncedLog = { ...log, synced: true };
    rounds.unshift(syncedLog);
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(rounds));
  },

  syncOfflineData: async (): Promise<number> => {
    if (!navigator.onLine) return 0;

    const offlineQueue: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    if (offlineQueue.length === 0) return 0;

    const rounds: RoundLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUNDS) || '[]');
    
    // Process items
    // In a real API, we would POST each one here.
    const syncedItems = offlineQueue.map(item => ({ ...item, synced: true }));
    
    // Add to main list (at the beginning, but we might need to resort later)
    const newRounds = [...syncedItems, ...rounds];
    
    // Sort by Date DESC to keep integrity
    newRounds.sort((a, b) => b.startTime - a.startTime);

    // Save Main
    localStorage.setItem(STORAGE_KEYS.ROUNDS, JSON.stringify(newRounds));
    
    // Clear Queue
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, '[]');
    
    await delay(1000); // Simulate network sync time
    return syncedItems.length;
  },

  // Settings
  getSettings: async (): Promise<ReportConfig> => {
    await delay(200);
    const defaults = { companyName: 'RondaGuard Pro', headerColor: '#3b82f6', logo: null };
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(defaults));
  },

  saveSettings: async (config: ReportConfig): Promise<void> => {
    await delay(300);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(config));
  }
};
