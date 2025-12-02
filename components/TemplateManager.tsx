import React, { useState } from 'react';
import { ChecklistTemplate } from '../types';
import { Plus, Trash2, Save, X, Edit, ListChecks, ArrowLeft } from 'lucide-react';

interface TemplateManagerProps {
  templates: ChecklistTemplate[];
  onSave: (template: ChecklistTemplate) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onSave, onDelete, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [items, setItems] = useState<string[]>([]);

  const handleEditClick = (template: ChecklistTemplate) => {
    setName(template.name);
    setItems([...template.items]);
    setEditingId(template.id);
    setIsEditing(true);
  };

  const handleNewClick = () => {
    setName('');
    setItems([]);
    setEditingId(null);
    setIsEditing(true);
  };

  const handleAddItem = () => {
    if (!itemInput.trim()) return;
    setItems([...items, itemInput]);
    setItemInput('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || items.length === 0) {
      alert("Defina um nome e adicione pelo menos um item.");
      return;
    }

    const template: ChecklistTemplate = {
      id: editingId || Date.now().toString(),
      name,
      items
    };

    onSave(template);
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Modelos de Checklist</h2>
          <p className="text-slate-500 dark:text-slate-400">Crie padrões de verificação para agilizar o cadastro de rondas.</p>
        </div>
        {!isEditing && (
            <button 
                onClick={handleNewClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
            >
                <Plus size={20} /> Novo Modelo
            </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Templates */}
        <div className={`lg:col-span-1 space-y-4 ${isEditing ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
           {templates.length === 0 ? (
               <div className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500">
                   <ListChecks size={40} className="mx-auto mb-2 opacity-20" />
                   <p>Nenhum modelo cadastrado.</p>
               </div>
           ) : (
               templates.map(tpl => (
                   <div key={tpl.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition group relative">
                       <h3 className="font-semibold text-slate-800 dark:text-white pr-16">{tpl.name}</h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tpl.items.length} itens de verificação</p>
                       
                       <div className="absolute top-4 right-4 flex gap-1">
                           <button 
                            onClick={() => handleEditClick(tpl)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition"
                           >
                               <Edit size={16} />
                           </button>
                           <button 
                            onClick={() => { if(window.confirm('Excluir este modelo?')) onDelete(tpl.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition"
                           >
                               <Trash2 size={16} />
                           </button>
                       </div>
                   </div>
               ))
           )}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2">
            {isEditing ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Modelo' : 'Novo Modelo'}</h3>
                        <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Modelo</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Extintores - Bloco B"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Itens do Checklist</label>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    value={itemInput}
                                    onChange={(e) => setItemInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Digite um item e pressione Enter"
                                />
                                <button 
                                    onClick={handleAddItem}
                                    className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                {items.length === 0 && (
                                    <p className="text-center text-slate-400 dark:text-slate-500 text-sm italic">Nenhum item adicionado.</p>
                                )}
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200">
                                        <span>{item}</span>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Save size={18} /> Salvar Modelo
                        </button>
                    </div>
                </div>
            ) : (
                <div className="hidden lg:flex h-full items-center justify-center text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="text-center">
                        <ListChecks size={48} className="mx-auto mb-2" />
                        <p>Selecione um modelo para editar ou crie um novo.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;