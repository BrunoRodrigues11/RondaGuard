import React, { useState, useRef } from 'react';
import { ReportConfig } from '../types';
import { Save, Upload, Trash2, FileText, Settings } from 'lucide-react';

interface ReportConfigProps {
  config: ReportConfig;
  onSave: (config: ReportConfig) => void;
  onCancel: () => void;
}

const ReportConfigScreen: React.FC<ReportConfigProps> = ({ config, onSave, onCancel }) => {
  const [companyName, setCompanyName] = useState(config.companyName);
  const [headerColor, setHeaderColor] = useState(config.headerColor);
  const [logo, setLogo] = useState<string | null>(config.logo);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    onSave({
      companyName,
      logo,
      headerColor
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="text-blue-600" /> Personalização de Relatório
        </h2>
        <p className="text-slate-500 dark:text-slate-400">Configure a identidade visual dos PDFs gerados.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa / Título</label>
                <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: RondaGuard Segurança Patrimonial"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor do Cabeçalho</label>
                <div className="flex items-center gap-3">
                    <input 
                        type="color" 
                        value={headerColor}
                        onChange={(e) => setHeaderColor(e.target.value)}
                        className="h-10 w-20 p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{headerColor}</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logomarca</label>
                <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-500 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {logo ? (
                            <img src={logo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-xs text-slate-400 text-center px-1">Sem Logo</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-2"
                        >
                            <Upload size={14} /> Carregar Imagem
                        </button>
                        {logo && (
                            <button 
                                onClick={removeLogo}
                                className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Remover
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleLogoUpload} 
                            className="hidden" 
                            accept="image/*" 
                        />
                        <p className="text-xs text-slate-400">Recomendado: PNG transparente</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pré-visualização do PDF (Cabeçalho)</label>
             <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white shadow-sm">
                 {/* Simulated PDF Header */}
                 <div style={{ backgroundColor: headerColor }} className="h-24 w-full p-4 flex items-center justify-between transition-colors duration-300">
                     <div className="text-white">
                         <h1 className="text-xl font-bold">{companyName || "Relatório de Ronda"}</h1>
                         {companyName && <p className="text-sm opacity-80">Relatório Operacional</p>}
                     </div>
                     {logo && (
                         <div className="bg-white/90 p-1 rounded-md h-16 w-16 flex items-center justify-center">
                             <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                         </div>
                     )}
                 </div>
                 <div className="p-4 space-y-3 bg-white">
                     <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                     <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                     <div className="h-4 bg-slate-100 rounded w-full"></div>
                 </div>
             </div>
             <p className="text-xs text-slate-400 text-center mt-2">Imagem meramente ilustrativa.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition"
        >
            Voltar
        </button>
        <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
        >
            <Save size={18} /> Salvar Configuração
        </button>
      </div>
    </div>
  );
};

export default ReportConfigScreen;