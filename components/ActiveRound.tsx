import React, { useState, useEffect, useRef } from 'react';
import { Task, RoundLog, ChecklistItem } from '../types';
import { Play, Square, Camera, CheckSquare, Square as SquareIcon, AlertOctagon, User, PenTool, Eraser, Ticket } from 'lucide-react';

interface ActiveRoundProps {
  task: Task;
  onFinish: (log: RoundLog) => void;
  onCancel: () => void;
}

const ActiveRound: React.FC<ActiveRoundProps> = ({ task, onFinish, onCancel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist.map(i => ({...i, checked: false})));
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [issuesDetected, setIssuesDetected] = useState(false);
  const [currentResponsible, setCurrentResponsible] = useState(task.responsible || '');
  
  // Signature State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    if (!currentResponsible.trim()) {
        alert("Por favor, identifique o responsável pela ronda.");
        return;
    }
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handleToggleItem = (id: string) => {
    if (!isRunning) return;
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Signature Logic ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Prevent scrolling on mobile while signing
    if(e.type === 'touchmove') {
      e.preventDefault(); 
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };
  // -----------------------

  const handleFinish = () => {
    if (!startTime) return;
    
    if (!hasSignature) {
      if (!confirm("A ronda não foi assinada digitalmente. Deseja concluir mesmo assim?")) {
        return;
      }
    }

    const endTime = Date.now();
    
    // Generate Signature Image
    let signatureData = undefined;
    if (hasSignature && canvasRef.current) {
        signatureData = canvasRef.current.toDataURL('image/png');
    }

    // Generate Unique Validation Token
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timePart = endTime.toString().slice(-6);
    const validationToken = `RND-${randomPart}-${timePart}`;

    const incomplete = checklist.some(i => !i.checked);
    const finalIssuesDetected = issuesDetected || incomplete;

    const log: RoundLog = {
      id: Date.now().toString(),
      taskId: task.id,
      taskTitle: task.title,
      ticketId: task.ticketId, // Persist ticket ID
      sector: task.sector,
      responsible: currentResponsible,
      startTime,
      endTime,
      durationSeconds: elapsedSeconds,
      checklistState: checklist,
      observations,
      issuesDetected: finalIssuesDetected,
      photos,
      signature: signatureData,
      validationToken: validationToken
    };
    onFinish(log);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-0">
      {/* Header & Timer */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{task.title}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-slate-500 dark:text-slate-400 text-sm">
             <span>{task.sector}</span>
             {task.ticketId && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                    <Ticket size={12} /> {task.ticketId}
                </span>
             )}
             {isRunning && <span className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-600 pl-4 ml-2"><User size={14}/> {currentResponsible}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-500'}`}></div>
          <span className="text-2xl font-mono font-medium text-slate-700 dark:text-slate-200">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {!isRunning ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={32} fill="currentColor" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Pronto para iniciar?</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Confirme o responsável e clique em iniciar. O cronômetro começará imediatamente.
          </p>
          
          <div className="max-w-xs mx-auto mb-6 text-left">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável pela execução</label>
             <div className="relative">
                <input 
                  type="text" 
                  value={currentResponsible}
                  onChange={(e) => setCurrentResponsible(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
             </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button onClick={onCancel} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition">
              Voltar
            </button>
            <button onClick={handleStart} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition transform active:scale-95">
              Iniciar Ronda
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Checklist */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <CheckSquare size={18} /> Checklist
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleToggleItem(item.id)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition ${item.checked ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <button className={`flex-shrink-0 transition-colors ${item.checked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-500'}`}>
                    {item.checked ? <CheckSquare size={24} /> : <SquareIcon size={24} />}
                  </button>
                  <span className={`text-sm md:text-base ${item.checked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations & Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Observações</label>
              <textarea 
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Descreva irregularidades ou notas importantes..."
              />
              <div className="mt-4 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="issues" 
                  checked={issuesDetected} 
                  onChange={(e) => setIssuesDetected(e.target.checked)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                />
                <label htmlFor="issues" className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                   <AlertOctagon size={16} /> Marcar como "Com Ocorrência"
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Evidências (Fotos)</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 relative group">
                    <img src={photo} alt="evidencia" className="w-full h-full object-cover" />
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition"
                >
                  <Camera size={24} />
                  <span className="text-xs mt-1">Adicionar</span>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" // Forces camera on mobile
                onChange={handlePhotoUpload} 
              />
            </div>
          </div>

          {/* Digital Signature */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assinatura do Responsável</label>
                <button 
                  onClick={clearSignature} 
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1"
                  disabled={!hasSignature}
                >
                  <Eraser size={14} /> Limpar
                </button>
             </div>
             {/* Keep canvas white for better contrast with black ink signature */}
             <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white relative touch-none">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  className="w-full h-36 bg-white cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSignature && !isDrawing && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                        <PenTool size={16} /> Assine aqui
                      </span>
                   </div>
                )}
             </div>
             <p className="text-xs text-slate-400 mt-2">Ao assinar, você confirma que a ronda foi executada conforme os procedimentos.</p>
          </div>

          {/* Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between md:relative md:bg-transparent md:border-0 md:p-0 md:pt-4">
             <button onClick={onCancel} className="text-red-500 font-medium px-4">Cancelar</button>
             <button 
              onClick={handleFinish}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-200 dark:shadow-none hover:bg-green-700 transition flex items-center gap-2"
             >
               <Square size={18} fill="currentColor" /> Concluir Ronda
             </button>
          </div>
          {/* Spacer for fixed footer on mobile */}
          <div className="h-20 md:hidden"></div>
        </>
      )}
    </div>
  );
};

export default ActiveRound;