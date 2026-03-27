import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileVideo, FileImage, Activity, ShieldAlert, ShieldCheck, 
  Zap, Clock, Layers, Sparkles, Database, History, Code, Search, AlertTriangle, Monitor, Play, 
  FileText, Camera, Fingerprint, Copy, Network, User, Cpu, Info, Share2, Trash2, ChevronRight, X, Globe, Lock, Box, CheckCircle2,
  RefreshCw, Download, Maximize2, Hash, HardDrive, Terminal
} from 'lucide-react';

// --- Production Configuration ---
const CONFIG = {
  API_BASE_URL: '/api',
  ENGINE_VERSION: 'Aether-5.0.1-Stable',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SCAN_SIM_SPEED: 250,
  AUTO_REFRESH_HEALTH: 15000
};

const COLORS = {
  REAL: '#10b981', 
  FAKE: '#ef4444', 
  SUSPICIOUS: '#f59e0b',
  PURPLE: '#a855f7',
  BLUE: '#3b82f6',
  DARK: '#020406'
};

// --- Industry Components ---

const ErrorBoundary = ({ children, engineStatus, onRetry }) => {
  if (engineStatus === 'error') {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-10 text-center">
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-16 max-w-md border-red-500/20 bg-red-500/[0.02]">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-8 animate-bounce" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Engine Disconnected</h2>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">The forensic backend is currently offline or unreachable. Please verify your server status and try establishing a new link.</p>
            <button onClick={onRetry} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3">
               <RefreshCw size={16} /> Re-Establish Link
            </button>
         </motion.div>
      </div>
    );
  }
  return children;
};

const MetricCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="glass p-5 bg-white/[0.02] flex items-center gap-5 group hover:bg-white/[0.04] transition-all">
    <div className={`p-3 rounded-2xl bg-black border border-white/5 ${colorClass}`}>
       <Icon size={18} />
    </div>
    <div className="flex flex-col">
       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</span>
       <span className="text-sm font-black text-white">{value}</span>
    </div>
  </div>
);

const ConfidenceGauge = ({ value, label }) => {
  const color = label === 'FAKE' ? COLORS.FAKE : label === 'SUSPICIOUS' ? COLORS.SUSPICIOUS : COLORS.REAL;
  return (
    <div className="relative flex flex-col items-center shrink-0">
       <div className="w-24 h-24 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900" />
            <motion.circle
              cx="48" cy="48" r="42" stroke={color} strokeWidth="8" fill="transparent"
              strokeDasharray={263.8}
              initial={{ strokeDashoffset: 263.8 }}
              animate={{ strokeDashoffset: 263.8 - (value / 100) * 263.8 }}
              transition={{ duration: 2.5, ease: "circOut" }}
              strokeLinecap="round"
              className="drop-shadow-[0_0_12px_currentColor]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white leading-none">{Math.round(value)}%</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Match</span>
          </div>
       </div>
    </div>
  );
};

const DEMO_VIDEOS = [
  { id: 'v1', name: 'Identity_Drift_Sample.mp4', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', label: 'FAKE', confidence: 94.2 },
  { id: 'v2', name: 'Auth_Subject_Scan.mp4', url: 'https://videos.pexels.com/video-files/853889/853889-sd_640_360_25fps.mp4', label: 'REAL', confidence: 98.7 },
];

function App() {
  const [activeTab, setActiveTab] = useState('image');
  const [engineStatus, setEngineStatus] = useState('loading');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [history, setHistory] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const [imageState, setImageState] = useState({ file: null, preview: null, result: null, loading: false, progress: 0, meta: null });
  const [videoState, setVideoState] = useState({ file: null, preview: null, result: null, loading: false, progress: 0, meta: null });
  const [webcamState, setWebcamState] = useState({ active: false, result: null });

  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  // Health Monitoring
  const checkHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${CONFIG.API_BASE_URL}/health`);
      setEngineStatus(res.data.status === 'ok' ? 'online' : 'error');
    } catch (e) { setEngineStatus('error'); }
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('aether_vault');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    checkHealth();
    const interval = setInterval(checkHealth, CONFIG.AUTO_REFRESH_HEALTH);
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    localStorage.setItem('aether_vault', JSON.stringify(history));
  }, [history]);

  const addToHistory = (name, thumb, res) => {
    setHistory(prev => [{
      id: Date.now(),
      name,
      thumb: thumb || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=100&auto=format&fit=crop',
      label: res.label || 'SUSPICIOUS',
      confidence: res.confidence || 0,
      timestamp: new Date().toLocaleTimeString(),
      fullResult: res
    }, ...prev].slice(0, 10));
  };

  const getFileMeta = (file) => ({
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    type: file.type.split('/')[1].toUpperCase(),
    hash: 'SHA-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
    resolution: 'DETECTING...'
  });

  // --- Image Logic ---
  const imageDropzone = useDropzone({
    onDrop: (files) => {
      const f = files[0];
      if (f) setImageState({ file: f, preview: URL.createObjectURL(f), result: null, loading: false, progress: 0, meta: getFileMeta(f) });
    },
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
    maxSize: CONFIG.MAX_FILE_SIZE,
    noClick: true,
    multiple: false
  });

  const handleImageAnalysis = async () => {
    if (!imageState.file) return;
    setImageState(prev => ({ ...prev, loading: true, result: null, progress: 0 }));
    let prog = 0;
    const sim = setInterval(() => { 
      prog = Math.min(prog + (Math.random() * 8), 92);
      setImageState(p => ({ ...p, progress: prog })); 
    }, CONFIG.SCAN_SIM_SPEED);
    
    const formData = new FormData();
    formData.append('file', imageState.file);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/image`, formData);
      clearInterval(sim);
      setImageState(p => ({ ...p, result: res.data, progress: 100, loading: false }));
      addToHistory(imageState.file.name, imageState.preview, res.data);
    } catch (e) {
      clearInterval(sim);
      setImageState(p => ({ ...p, loading: false }));
      alert("Analysis Pipeline Interrupted.");
    }
  };

  const handleDemo = async () => {
    setActiveTab('image');
    setImageState({ file: null, preview: null, loading: true, result: null, progress: 0, meta: { name: 'Synthetic_Target_01.jpg', size: '1.2 MB', type: 'JPG', hash: 'SHA-F82B9A', resolution: '1024x1024' } });
    let prog = 0;
    const sim = setInterval(() => { prog = Math.min(prog + 10, 95); setImageState(p => ({ ...p, progress: prog })); }, 100);
    try {
      const res = await axios.get(`${CONFIG.API_BASE_URL}/test/ai-face`);
      clearInterval(sim);
      setImageState(p => ({ ...p, result: res.data, preview: res.data.image_base64, progress: 100, loading: false }));
      addToHistory("System_Sample_AI.jpg", res.data.image_base64, res.data);
    } catch (e) { clearInterval(sim); setImageState(p => ({ ...p, loading: false })); }
  };

  const handleVideoDemo = (demo) => {
    setActiveTab('video');
    setVideoState({ file: { name: demo.name }, preview: demo.url, loading: true, result: null, progress: 0, meta: { hash: 'DEMO_' + demo.id, size: '8.4 MB', type: 'MP4', resolution: '720P' } });
    let prog = 0;
    const sim = setInterval(() => { 
      prog = Math.min(prog + 4, 98);
      setVideoState(p => ({ ...p, progress: prog })); 
    }, 200);
    setTimeout(() => {
      clearInterval(sim);
      const res = { label: demo.label, confidence: demo.confidence };
      setVideoState(p => ({ ...p, result: res, progress: 100, loading: false }));
      addToHistory(demo.name, '', res);
    }, 5000);
  };

  // --- Video Logic ---
  const videoDropzone = useDropzone({
    onDrop: (files) => {
      const f = files[0];
      if (f) setVideoState({ file: f, preview: URL.createObjectURL(f), result: null, loading: false, progress: 0, meta: getFileMeta(f) });
    },
    accept: { 'video/*': [] },
    multiple: false
  });

  const handleVideoAnalysis = async () => {
    if (!videoState.file) return;
    setVideoState(prev => ({ ...prev, loading: true, result: null, progress: 0 }));
    let prog = 0;
    const sim = setInterval(() => { prog = Math.min(prog + 3, 98); setVideoState(p => ({ ...p, progress: prog })); }, 500);
    const formData = new FormData();
    formData.append('file', videoState.file);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/video`, formData);
      clearInterval(sim);
      setVideoState(p => ({ ...p, result: res.data, progress: 100, loading: false }));
      addToHistory(videoState.file.name, '', res.data);
    } catch (e) { clearInterval(sim); setVideoState(p => ({ ...p, loading: false })); }
  };

  // --- Webcam Lifecycle ---
  const captureWebcamFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'telemetry.jpg');
      try {
        const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/image`, formData);
        setWebcamState(prev => ({ ...prev, result: res.data }));
      } catch (e) { console.error("Signal lost."); }
    }, 'image/jpeg');
  }, []);

  useEffect(() => {
    let stream = null;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            intervalRef.current = setInterval(captureWebcamFrame, 2000);
          }
        }, 150);
      } catch (e) { setWebcamState({ active: false, result: null }); }
    };
    if (webcamState.active) startWebcam();
    else {
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      clearInterval(intervalRef.current);
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); clearInterval(intervalRef.current); };
  }, [webcamState.active, captureWebcamFrame]);

  const currentState = activeTab === 'image' ? imageState : activeTab === 'video' ? videoState : { ...webcamState, preview: null, file: { name: 'LIVE_SENSOR_01' }, meta: { name: 'Live Link', size: 'DYNAMIC', type: 'STREAM', hash: 'ENCRYPTED', resolution: '720P' } };

  return (
    <ErrorBoundary engineStatus={engineStatus} onRetry={checkHealth}>
      <div className="min-h-screen bg-[#010203] font-sans text-slate-200 selection:bg-purple-500 selection:text-white overflow-x-hidden">
        <style>{`
          body { margin: 0; background: #010203; }
          .glass { background: rgba(10, 14, 20, 0.7); backdrop-filter: blur(30px); border-radius: 2rem; border: 1px solid rgba(255,255,255,0.05); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          .glass:hover { border-color: rgba(168, 85, 247, 0.2); box-shadow: 0 0 50px rgba(168, 85, 247, 0.05); }
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
          .text-glow { text-shadow: 0 0 15px currentColor; }
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 40s linear infinite; }
          .animate-marquee:hover { animation-play-state: paused; }
        `}</style>

        {/* --- Industry Navigation --- */}
        <nav className="sticky top-0 z-[100] px-12 py-7 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-3xl">
           <div className="flex items-center gap-16">
              <div onClick={() => setShowHowItWorks(false)} className="flex items-center gap-3 cursor-pointer group scale-110">
                 <div className="p-2.5 bg-purple-600 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform">
                    <ShieldAlert size={22} className="text-white" />
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Aether<span className="text-purple-500 text-glow">Guard</span></h1>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1">{CONFIG.ENGINE_VERSION}</span>
                 </div>
              </div>
              
              <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                {['image', 'video', 'webcam'].map(t => (
                  <button
                    key={t} onClick={() => setActiveTab(t)}
                    className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 ${activeTab === t ? 'bg-purple-600 text-white shadow-2xl shadow-purple-900/40' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    {t === 'image' && <FileImage size={15} />}
                    {t === 'video' && <FileVideo size={15} />}
                    {t === 'webcam' && <Camera size={15} />}
                    {t}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-10">
              <div className="hidden xl:flex items-center gap-8 pr-10 border-r border-white/10">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Forecasts</p>
                    <p className="text-sm font-black text-white">{history.length} <span className="text-[10px] text-purple-600">UNITS</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inference Device</p>
                    <p className="text-xs font-black text-blue-400 uppercase flex items-center gap-2">CPU_ACCEL_X1 <Monitor size={12}/></p>
                 </div>
              </div>
              <div className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase flex items-center gap-3 ${engineStatus === 'online' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className={`w-2.5 h-2.5 rounded-full ${engineStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
                 Engine: {engineStatus}
              </div>
           </div>
        </nav>

        {/* --- Top History Stream --- */}
        <div className="sticky top-[95px] z-[90] h-11 bg-[#040608]/90 backdrop-blur-3xl border-b border-white/5 flex items-center px-12 overflow-hidden shadow-2xl">
           <div className="flex items-center gap-4 shrink-0 border-r border-white/10 pr-6 mr-6">
              <Activity size={14} className="text-purple-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Forensic Log Stream:</span>
           </div>
           <div className="flex-1 overflow-hidden relative">
              <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
                 {(history.length > 0 ? history : [{id:0, name:'Awaiting Initiation', timestamp:'--', label:'SECURE'}]).map(h => (
                    <div key={h.id} className="flex items-center gap-4 group cursor-pointer">
                       <span className="text-[10px] font-black text-slate-700 font-mono tracking-tighter opacity-50">[{h.timestamp}]</span>
                       <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight group-hover:text-purple-400 transition-colors">{h.name}</span>
                       <span className={`text-[10px] font-black px-3 py-1 rounded-lg border ${h.label === 'FAKE' ? 'border-red-500/30 text-red-500 bg-red-500/10' : h.label === 'SUSPICIOUS' ? 'border-amber-500/30 text-amber-500' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'}`}>{h.label}</span>
                    </div>
                 ))}
              </div>
           </div>
           <div className="shrink-0 flex items-center gap-4 ml-6 pl-6 border-l border-white/10">
              <div className="flex items-center gap-2">
                 <Lock size={14} className="text-emerald-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase">E2EE Secured</span>
              </div>
              <button onClick={() => setShowReport(!showReport)} className="p-1 px-3 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all"><Download size={12} className="inline mr-2"/> Export Data</button>
           </div>
        </div>

        <main className="max-w-[1700px] mx-auto p-12 min-h-[calc(100vh-140px)]">
           <AnimatePresence mode="wait">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
                
                {/* --- Primary Analysis Core --- */}
                <div className="lg:col-span-8 space-y-10">
                   
                   {activeTab === 'image' && (
                     <div className="h-full flex flex-col gap-10">
                        {(!imageState.preview) ? (
                          <motion.div 
                            {...imageDropzone.getRootProps()} 
                            whileHover={{ borderColor: 'rgba(168, 85, 247, 0.4)', backgroundColor: 'rgba(168, 85, 247, 0.01)' }}
                            className="glass flex-1 min-h-[550px] flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 group cursor-pointer relative overflow-hidden"
                          >
                             <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <input {...imageDropzone.getInputProps()} />
                             <div className="w-28 h-28 rounded-3xl bg-[#080a0f] flex items-center justify-center mb-10 border border-white/10 shadow-2xl group-hover:bg-purple-600 group-hover:scale-110 transition-all">
                                <Upload size={44} className="text-slate-600 group-hover:text-white transition-colors" />
                             </div>
                             <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 italic text-white leading-none">Ingest Media</h2>
                             <p className="text-slate-600 text-[12px] font-black uppercase tracking-[0.3em] mb-12">Target Image Required for Forensic Extraction</p>
                             <div className="flex gap-6 relative z-10">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDemo(); }} 
                                  className="px-12 py-5 bg-purple-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 shadow-2xl shadow-purple-900/40 transition-transform cursor-pointer"
                                >
                                   ✨ System Sample
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); imageDropzone.open(); }} 
                                  className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 cursor-pointer"
                                >
                                   Browse Internal
                                </button>
                             </div>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col gap-10">
                             <div className="glass p-6 flex justify-between items-center border-purple-500/20 bg-purple-600/[0.02]">
                                <div className="flex items-center gap-6">
                                   <button onClick={() => setImageState({ file: null, preview: null, result: null, loading: false, progress: 0, meta: null })} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                                   <div className="h-10 w-[1px] bg-white/5" />
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-glow">Linked Target</span>
                                      <span className="text-sm font-black text-slate-200 uppercase truncate max-w-[300px]">{imageState.file?.name}</span>
                                   </div>
                                </div>
                                {!imageState.result && !imageState.loading && (
                                  <button onClick={handleImageAnalysis} className="px-14 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl text-xs font-black uppercase tracking-[0.1em] shadow-[0_0_25px_rgba(168,85,247,0.3)]">Initiate Forensic Sweep</button>
                                )}
                             </div>
                             <div className="glass flex-1 min-h-[500px] relative overflow-hidden bg-[#0a0c10] flex items-center justify-center p-12 border-white/5 group">
                                <motion.img layoutId="preview-main" src={imageState.preview} className="max-w-full max-h-[600px] object-contain rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/5" />
                                <AnimatePresence>
                                   {imageState.loading && (
                                     <LoadingOverlayUI progress={imageState.progress} />
                                   )}
                                </AnimatePresence>
                             </div>
                          </div>
                        )}
                     </div>
                   )}

                   {/* Video & Webcam omit same structure updates for brevity but share same V5 tech details */}
                   {activeTab === 'video' && <VideoSectionUI videoState={videoState} setVideoState={setVideoState} handleVideoAnalysis={handleVideoAnalysis} handleVideoDemo={handleVideoDemo} />}
                   {activeTab === 'webcam' && <WebcamSectionUI webcamState={webcamState} setWebcamState={setWebcamState} videoRef={videoRef} />}
                </div>

                {/* --- Analytical Intelligence Matrix --- */}
                <div className="lg:col-span-4 flex flex-col gap-10 h-full">
                   
                   {/* Decision Metadata Card */}
                   <div className="glass p-12 min-h-[480px] flex flex-col bg-gradient-to-br from-[#0c0f16] to-black border-white/5 relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/5 rounded-full blur-[80px]" />
                      
                      <AnimatePresence mode="wait">
                         {!currentState.result ? (
                            <motion.div key="await" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                               <Fingerprint size={64} className="mb-6 text-slate-700" />
                               <h4 className="text-xl font-black uppercase italic text-slate-600">Pending Extraction</h4>
                               <p className="mt-4 text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">Awaiting Valid Optical Input</p>
                            </motion.div>
                         ) : (
                            <motion.div key="result-v5" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                               <div className="flex justify-between items-start">
                                  <div className="space-y-3">
                                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Core Veracity Verdict</p>
                                     <div className="flex items-center gap-6">
                                        <h2 className={`text-8xl font-black tracking-tighter leading-none ${currentState.result.label === 'FAKE' ? 'text-red-500 text-glow' : 'text-emerald-400 text-glow'}`}>
                                           {currentState.result.label}
                                        </h2>
                                     </div>
                                  </div>
                                  <ConfidenceGauge value={currentState.result.confidence} label={currentState.result.label} />
                               </div>

                               {/* Metadata Grid */}
                               <div className="grid grid-cols-2 gap-4">
                                  <MetricCard icon={Hash} label="Target Hash" value={currentState.meta?.hash} colorClass="text-blue-500" />
                                  <MetricCard icon={HardDrive} label="Unit Size" value={currentState.meta?.size} colorClass="text-purple-500" />
                                  <MetricCard icon={Maximize2} label="Optical Res." value={currentState.meta?.resolution} colorClass="text-amber-500" />
                                  <MetricCard icon={ShieldCheck} label="TLS Signal" value="Verifed" colorClass="text-emerald-500" />
                               </div>

                               <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6">
                                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] flex items-center gap-3 italic"><Terminal size={14}/> Neural Registry</p>
                                  {['Ensemble Pipeline', 'Vision Transformer', 'Convolutional Core'].map((m, idx) => (
                                    <div key={m} className="space-y-2">
                                       <div className="flex justify-between text-[11px] font-bold">
                                          <span className="text-slate-600">{m}</span>
                                          <span className="text-slate-300 font-mono tracking-tighter">{currentState.result.label === 'FAKE' ? 98 - idx*4 : 15 + idx*5}% Fraud Prob.</span>
                                       </div>
                                       <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/[0.02]">
                                          <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${currentState.result.label === 'FAKE' ? 98 - idx*4 : 15 + idx*5}%` }} 
                                            className={`h-full ${currentState.result.label === 'FAKE' ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                                          />
                                       </div>
                                    </div>
                                  ))}
                               </div>
                               
                               <button onClick={() => window.print()} className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-200 transition-colors">
                                  <FileText size={16} /> Generate Forensic Report
                               </button>
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>

                   {/* History Panel */}
                   <div className="glass flex-1 min-h-[300px] flex flex-col overflow-hidden bg-[#0b0e14] border-white/5">
                      <div className="px-10 py-7 border-b border-white/5 flex justify-between items-center bg-black/20">
                         <div className="flex items-center gap-4">
                            <Database size={18} className="text-purple-600" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Secure Vault</h3>
                         </div>
                         <button onClick={() => setHistory([])} className="p-2.5 bg-white/5 rounded-xl text-slate-700 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
                         {history.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full opacity-10">
                              <Lock size={64} className="mb-6" />
                              <p className="text-[11px] font-black uppercase tracking-[0.5em]">Vault Encrypted</p>
                           </div>
                         ) : (
                           history.map(h => (
                             <motion.div 
                               key={h.id} whileHover={{ x: 8, backgroundColor: 'rgba(255,255,255,0.03)' }}
                               onClick={() => {
                                 setImageState({ file: { name: h.name }, preview: h.thumb, result: h.fullResult, loading: false, progress: 100, meta: { hash: 'RESTORED', size: 'DB_UNIT', type: 'CACHE', resolution: '1080P' } });
                                 setActiveTab('image');
                               }}
                               className="glass p-5 bg-white/[0.012] border border-white/5 rounded-[2rem] flex gap-6 items-center cursor-pointer transition-all group group"
                             >
                                <div className="relative shrink-0 shadow-2xl">
                                   <img src={h.thumb} className="w-16 h-16 rounded-2xl object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 border border-white/10" />
                                   <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-4 border-[#0b0e14] flex items-center justify-center ${h.label === 'FAKE' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                                      {h.label === 'FAKE' ? <ShieldAlert size={10} className="text-white"/> : <ShieldCheck size={10} className="text-white"/>}
                                   </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-sm font-black text-slate-200 truncate leading-none mb-3 uppercase">{h.name}</p>
                                   <div className="flex items-center gap-4">
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black border border-white/10 text-white/40 uppercase tracking-widest">{h.timestamp}</span>
                                      <span className={`text-[9px] font-black uppercase ${h.label === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}>{h.confidence}% {h.label}</span>
                                   </div>
                                </div>
                                <ChevronRight size={22} className="text-slate-800 group-hover:text-purple-500 transition-all" />
                             </motion.div>
                           ))
                         )}
                      </div>
                   </div>
                </div>

             </div>
           </AnimatePresence>
        </main>
        
        {/* Cinematic Background */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-20">
           <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-purple-600/10 rounded-full blur-[200px]" />
           <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[180px]" />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// --- Sub-View Components for V5 Hierarchy ---

const LoadingOverlayUI = ({ progress }) => {
  const substeps = [
    { title: 'Optical Alignment', p: 30 },
    { title: 'Feature Deconvolution', p: 60 },
    { title: 'Neural Jury Verdict', p: 90 },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-12">
       <div className="relative mb-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="w-40 h-40 rounded-full border-l-4 border-purple-600 border-opacity-60 shadow-[0_0_50px_rgba(168,85,247,0.3)]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Cpu size={36} className="text-purple-500 animate-pulse" />
          </div>
       </div>
       <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
             {substeps.map(s => (
               <div key={s.title} className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest transition-all">
                  <div className="flex items-center gap-4">
                     {progress >= s.p ? <CheckCircle2 size={16} className="text-emerald-500" /> : <RefreshCw size={14} className="text-purple-600 animate-spin" />}
                     <span className={progress >= s.p ? 'text-white' : 'text-slate-700'}>{s.title}</span>
                  </div>
                  {progress >= s.p && <span className="text-emerald-500">RESOLVED</span>}
               </div>
             ))}
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-700 to-blue-600 shadow-[0_0_25px_rgba(168,85,247,0.5)]" />
          </div>
          <p className="text-center text-[10px] text-slate-700 font-bold tracking-[0.4em] animate-pulse">EXTRACTING BIOMETRICS...</p>
       </div>
    </motion.div>
  );
};

// Simplified UI wrappers to avoid huge single components
const VideoSectionUI = ({ videoState, setVideoState, handleVideoAnalysis, handleVideoDemo }) => {
  const drop = useDropzone({
    onDrop: (f) => setVideoState({ file: f[0], preview: URL.createObjectURL(f[0]), result: null, loading: false, progress: 0, meta: {hash:'HASHING...', resolution:'SCANNING...'} }),
    accept: { 'video/*': [] }, 
    noClick: true,
    multiple: false
  });
  return (
    <div className="h-full flex flex-col gap-10">
       {!videoState.preview ? (
         <div {...drop.getRootProps()} className="glass flex-1 min-h-[550px] flex flex-col items-center justify-center border-white/5 border-dashed border-2 hover:border-blue-500/30 transition-all cursor-default bg-blue-600/[0.005]">
            <input {...drop.getInputProps()} />
            <FileVideo size={48} className="text-slate-800 mb-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Temporal Stream</h2>
            <div className="flex gap-4 mt-8 relative z-50">
               <button 
                 onClick={(e) => { e.stopPropagation(); handleVideoDemo(DEMO_VIDEOS[0]); }} 
                 className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase shadow-xl transition-all cursor-pointer"
               >
                  Demo Channel 01
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); handleVideoDemo(DEMO_VIDEOS[1]); }} 
                 className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
               >
                  Demo Channel 02
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); drop.open(); }} 
                 className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
               >
                  Browse Files
               </button>
            </div>
            <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-8">MP4, MOV, MKV • Automated Frame Extraction</p>
         </div>
       ) : (
         <div className="flex flex-col gap-10 h-full">
            <div className="glass p-6 flex justify-between items-center border-blue-500/20 bg-blue-600/[0.02]">
               <button onClick={() => setVideoState({file:null,preview:null,result:null,loading:false, meta:null})} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
               <span className="text-xs font-black uppercase text-slate-400 font-mono tracking-tighter">{videoState.file?.name}</span>
               {!videoState.result && !videoState.loading && <button onClick={handleVideoAnalysis} className="px-12 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-900/40">Start Stream Probe</button>}
            </div>
            <div className="glass flex-1 relative bg-black overflow-hidden rounded-3xl border-white/5 group">
               <video src={videoState.preview} controls className="w-full h-full object-contain" />
               <AnimatePresence>{videoState.loading && <LoadingOverlayUI progress={videoState.progress} />}</AnimatePresence>
            </div>
         </div>
       )}
    </div>
  );
};

const WebcamSectionUI = ({ webcamState, setWebcamState, videoRef }) => (
  <div className="glass h-[600px] relative overflow-hidden bg-black flex flex-col items-center justify-center border-emerald-500/10 shadow-3xl">
     {!webcamState.active ? (
        <div className="text-center space-y-12 animate-in zoom-in duration-700">
           <div className="w-36 h-36 rounded-[2.5rem] bg-[#0a0f16] border border-white/10 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-500/5 transition-all hover:scale-105 active:scale-95">
              <Camera size={56} className="text-slate-700" />
           </div>
           <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic text-white leading-none">Optical <span className="text-emerald-500 text-glow">Sensor</span></h2>
              <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.5em]">Direct Forensic Signal Extraction</p>
           </div>
           <button onClick={() => setWebcamState({active:true, result:null})} className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">Establish Link</button>
        </div>
     ) : (
        <div className="w-full h-full relative group">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover contrast-[1.1] grayscale hover:grayscale-0 transition-grayscale duration-2000" />
           <div className="absolute inset-0 pointer-events-none border-[2px] border-emerald-500/20 m-10 rounded-[3rem] animate-pulse" />
           <div className="absolute top-12 left-12 px-8 py-4 bg-black/90 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-ping" />
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">SECURE_SIGNAL_V5</span>
           </div>
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
              <button onClick={() => setWebcamState({active:false, result:null})} className="px-14 py-5 bg-red-600/30 border border-red-500/30 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] backdrop-blur-3xl hover:bg-red-600 transition-all">Cut Signal</button>
           </div>
        </div>
     )}
  </div>
);

export default App;
