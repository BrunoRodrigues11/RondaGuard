
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

export enum UserRole {
  TECHNICIAN = 'TECHNICIAN', // Apenas executa
  ANALYST = 'ANALYST',       // Cria tarefas e templates
  SUPERVISOR = 'SUPERVISOR'  // Vê relatórios e dashboards
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
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
  signature?: string; 
  validationToken?: string; 
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE_TASK = 'CREATE_TASK',
  EXECUTE_ROUND = 'EXECUTE_ROUND',
  HISTORY = 'HISTORY',
  TEMPLATES = 'TEMPLATES',
}
