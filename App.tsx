
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Header.tsx';
import ResourceCard from './components/ResourceCard.tsx';
import ExamDisplay from './components/ExamDisplay.tsx';
import { Resource, ResourceType, Exam, ExamConfig, ExamHistoryItem } from './types.ts';
import { generateExamFromResources, analyzeResourceContent } from './geminiService.ts';

interface UploadingFile {
  id: string;
  name: string;
  type: ResourceType;
}

const App: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Analysis State
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ id: string, text: string } | null>(null);
  
  const [activeType, setActiveType] = useState<ResourceType>(ResourceType.TEXTBOOK);
  const [inputText, setInputText] = useState('');
  const [config, setConfig] = useState<ExamConfig>({
    numQuestions: 10,
    difficulty: 'Medium',
    focusTopics: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('exam_history');
    if (saved) {
      try {
        setExamHistory(JSON.parse(saved));
      } catch (e) { console.error("History load error", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('exam_history', JSON.stringify(examHistory));
  }, [examHistory]);

  const addResource = useCallback((resource: Resource) => {
    setResources(prev => [...prev, resource]);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files) as File[];
    const newUploads = fileList.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      type: activeType
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadRef = newUploads[i];
      const isBinary = file.type.startsWith('image/') || file.type === 'application/pdf';
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        let content = '';
        if (isBinary) {
          content = (event.target?.result as string).split(',')[1];
        } else {
          content = event.target?.result as string;
        }

        addResource({
          id: uploadRef.id,
          type: uploadRef.type,
          content: content,
          mimeType: file.type || 'text/plain',
          name: file.name,
          isBinary: isBinary
        });

        setUploadingFiles(prev => prev.filter(u => u.id !== uploadRef.id));
      };
      
      if (isBinary) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;
    addResource({
      id: Math.random().toString(36).substring(2, 11),
      type: activeType,
      content: inputText,
      mimeType: 'text/plain',
      name: `Input Text (${activeType})`,
      isBinary: false
    });
    setInputText('');
  };

  const handleAnalyze = async (resource: Resource) => {
    setAnalyzingId(resource.id);
    setAnalysisResult(null);
    try {
      const insight = await analyzeResourceContent(resource);
      setAnalysisResult({ id: resource.id, text: insight });
    } catch (err) {
      alert("Failed to analyze image.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerate = async () => {
    if (resources.length === 0) {
      alert("Please add at least one resource!");
      return;
    }
    
    setIsGenerating(true);
    setExam(null);
    setAnalysisResult(null);
    setGenerationStep('Initializing Intelligence...');

    const steps = [
      'Deconstructing Textbooks...',
      'Mapping Difficulty Vectors...',
      'Synthesizing Questions...',
      'Refining mark schemes...',
      'Finalizing structural integrity...'
    ];

    let stepIdx = 0;
    // Faster interval (2s) to reflect the optimized thinking budget and keep UI lively
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setGenerationStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 2000);

    try {
      const result = await generateExamFromResources(resources, config);
      const examWithDate = { ...result, createdAt: new Date().toISOString() };
      setExam(examWithDate);
      
      setExamHistory(prev => [{
        id: examWithDate.id || Math.random().toString(36).substring(2, 11),
        title: examWithDate.title,
        date: examWithDate.createdAt,
        exam: examWithDate
      }, ...prev].slice(0, 10));
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Exam generation timed out. Try with fewer sources.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const getAcceptTypes = () => activeType === ResourceType.TEXTBOOK ? ".pdf" : "image/*,.pdf,.txt";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 font-mono">1</span>
                Knowledge Sources
              </h2>
              {examHistory.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} className="text-indigo-600 text-xs font-bold hover:underline">
                  History ({examHistory.length})
                </button>
              )}
            </div>

            {showHistory && (
              <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                {examHistory.map(item => (
                  <div key={item.id} onClick={() => {setExam(item.exam); setShowHistory(false);}} className="p-3 hover:bg-white cursor-pointer border-b border-slate-100 flex justify-between items-center group transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              {[ResourceType.TEXTBOOK, ResourceType.SPECIFICATION, ResourceType.SAMPLE].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                    activeType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {activeType !== ResourceType.TEXTBOOK && (
                <div className="relative">
                  <textarea
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all resize-none"
                    placeholder={`Paste ${activeType.toLowerCase()} text...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button onClick={handleTextSubmit} className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              )}

              <div className="relative">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept={getAcceptTypes()} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all group"
                >
                  <svg className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="text-sm font-bold tracking-tight">Drop Source Files</span>
                  <p className="text-[10px] mt-1 text-slate-400">PDF, TXT, or Photos of Pages</p>
                </button>
              </div>
            </div>

            {(resources.length > 0 || uploadingFiles.length > 0) && (
              <div className="mt-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Inventory</h3>
                <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {resources.map(res => (
                    <ResourceCard 
                      key={res.id} 
                      resource={res} 
                      onRemove={(id) => setResources(prev => prev.filter(r => r.id !== id))} 
                      onAnalyze={res.mimeType.startsWith('image/') ? handleAnalyze : undefined}
                      isAnalyzing={analyzingId === res.id}
                    />
                  ))}
                  {uploadingFiles.map(u => (
                    <div key={u.id} className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex items-center space-x-3 opacity-60 animate-pulse">
                      <div className="w-10 h-10 rounded bg-slate-200 animate-spin"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-600 truncate">{u.name}</p>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase">UPLOADING</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Config */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 font-mono">2</span>
              Parameters
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Questions ({config.numQuestions})</label>
                <input type="range" min="5" max="30" step="5" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={config.numQuestions} onChange={(e) => setConfig({...config, numQuestions: parseInt(e.target.value)})} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Easy', 'Medium', 'Hard'].map(diff => (
                  <button key={diff} onClick={() => setConfig({...config, difficulty: diff as any})} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${config.difficulty === diff ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{diff.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={isGenerating || resources.length === 0} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${isGenerating || resources.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100'}`}>
                {isGenerating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Thinking...</span></> : <span>Forge Exam</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-7">
          {analysisResult && (
            <div className="mb-8 p-6 bg-indigo-900 text-indigo-50 rounded-2xl shadow-xl border border-indigo-700 animate-in zoom-in-95 duration-300 relative">
              <button onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 text-indigo-300 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-indigo-600 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <h3 className="font-bold tracking-tight">AI Content Analysis</h3>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-indigo-100 leading-relaxed font-medium">
                {analysisResult.text.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
              </div>
            </div>
          )}

          {!exam && !isGenerating && !analysisResult && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a4 4 0 01-2.506.326l-1.866-.373a2 2 0 00-1.022.547l-1.17 1.17a2 2 0 00.707 3.414l3.3 1.1a2 2 0 00.707 0l3.3-1.1a2 2 0 00.707-3.414l-1.17-1.17z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Your Exam Workspace</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Provide textbook chapters, specifications, or even a photo of your notes to begin.</p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700">
               <div className="relative">
                <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
                      <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                   </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Gemini is Thinking...</h3>
                <p className="text-indigo-600 font-mono font-bold text-sm tracking-widest uppercase animate-pulse">
                  {generationStep || 'Processing Data Streams...'}
                </p>
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}

          {exam && <ExamDisplay exam={exam} />}
        </div>
      </main>

      <footer className="py-6 border-t border-slate-200 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        <p>Powered by Gemini 3 Pro Intelligence &bull; ExamForge AI &copy; 2024</p>
      </footer>

      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
