
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  items: string[];
}

export interface Task {
  id: string;
  sector: string;
  title: string;
  ticketId?: string;
  description: string;
  responsible: string; 
  checklist: ChecklistItem[];
  createdAt: number;
}

export interface RoundLog {
  id: string;
  taskId: string;
  taskTitle: string;
  ticketId?: string;
  sector: string;
  responsible: string; 
  startTime: number;
  endTime: number;
  durationSeconds: number;
  checklistState: ChecklistItem[]; 
  observations: string;
  issuesDetected: boolean;
  photos: string[]; 
  aiAnalysis?: string;
  signature?: string; // Base64 image
  validationToken?: string; // Unique hash
  synced?: boolean; // Offline sync status
}

export interface ReportConfig {
  companyName: string;
  logo: string | null; // Base64
  headerColor: string; // Hex Code
}

export const AppView = {
  DASHBOARD: 'DASHBOARD',
  TASKS: 'TASKS', // Nova view unificada
  CREATE_TASK: 'CREATE_TASK',
  EXECUTE_ROUND: 'EXECUTE_ROUND',
  HISTORY: 'HISTORY',
  TEMPLATES: 'TEMPLATES',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  SETTINGS: 'SETTINGS',
  REPORTS: 'REPORTS',
  MAP: 'MAP',
  ANALYSIS: 'ANALYSIS', // Nova tela de KPIs
} as const;

export type AppView = typeof AppView[keyof typeof AppView];

// --- Auth Types ---

export const UserRole = {
  TECHNICIAN: 'TECHNICIAN', // Apenas executa
  ANALYST: 'ANALYST',       // Cria tarefas e modelos
  SUPERVISOR: 'SUPERVISOR', // Vê relatórios e gerencia tarefas
  ADMIN: 'ADMIN'            // Acesso total + Gestão de Usuários
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}
