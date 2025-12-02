import React, { useState } from 'react';
import { Task, ChecklistItem, ChecklistTemplate } from '../types';
import { Plus, Trash2, Save, User, FileText, Copy, ArrowLeft, Ticket } from 'lucide-react';

interface TaskCreatorProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  initialTask?: Task | null;
  templates: ChecklistTemplate[]; // Recebe templates do App.tsx
}

const TaskCreator: React.FC<TaskCreatorProps> = ({ onSave, onCancel, initialTask, templates }) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [sector, setSector] = useState(initialTask?.sector || '');
  const [ticketId, setTicketId] = useState(initialTask?.ticketId || '');
  const [responsible, setResponsible] = useState(initialTask?.responsible || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [checklistInput, setChecklistInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialTask?.checklist || []
  );

  const isEditing = !!initialTask;

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      label: checklistInput,
      checked: false
    };
    setChecklist([...checklist, newItem]);
    setChecklistInput('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const applyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newItems = template.items.map((label, index) => ({
        id: `${Date.now()}-${index}-${Math.random()}`, // Ensure unique IDs
        label,
        checked: false
      }));
      
      setChecklist(prev => [...prev, ...newItems]);
    }
    
    // Reset select to allow re-selection if needed
    e.target.value = "";
  };

  const handleSave = () => {
    if (!title || !sector || !responsible || checklist.length === 0) {
      alert("Por favor, preencha o título, setor, responsável e adicione itens ao checklist.");
      return;
    }
    const newTask: Task = {
      id: initialTask?.id || Date.now().toString(), // Mantém ID se editando, cria novo se criando
      title,
      sector,
      ticketId,
      responsible,
      description,
      checklist,
      createdAt: initialTask?.createdAt || Date.now()
    };
    onSave(newTask);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button onClick={onCancel} className="md:hidden text-slate-500 dark:text-slate-400">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Editar Tarefa' : 'Nova Tarefa de Ronda'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{isEditing ? 'Atualize os dados da ronda.' : 'Cadastre uma nova rotina e defina o checklist.'}</p>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título da Atividade</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Ex: Ronda Noturna - Galpão A"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Setor / Local</label>
            <input 
              type="text" 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ex: Almoxarifado"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº Chamado (Opcional)</label>
            <div className="relative">
                <input 
                type="text" 
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Ex: #12345"
                />
                <Ticket className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável Padrão</label>
            <div className="relative">
              <input 
                type="text" 
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Nome do encarregado"
              />
              <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição (Opcional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition h-24 resize-none"
            placeholder="Detalhes sobre como realizar a ronda..."
          />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checklist de Verificação</label>
          
          {/* Template Selector */}
          <div className="flex items-center gap-2 mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
            <Copy size={18} className="text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <label className="block text-xs text-blue-800 dark:text-blue-300 font-semibold mb-1">Usar Modelo (Opcional)</label>
              <select 
                onChange={applyTemplate}
                defaultValue=""
                className="w-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white text-sm border border-blue-200 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Selecione um modelo para adicionar itens...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Digite um item personalizado e pressione Enter"
            />
            <button 
              onClick={addChecklistItem}
              className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
              title="Adicionar Item"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {checklist.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                Nenhum item no checklist. Adicione manualmente ou use um modelo acima.
              </p>
            )}
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 animate-fade-in">
                <span className="text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                <button onClick={() => removeChecklistItem(item.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none"
        >
          <Save size={18} />
          {isEditing ? 'Salvar Alterações' : 'Salvar Tarefa'}
        </button>
      </div>
    </div>
  );
};

export default TaskCreator;