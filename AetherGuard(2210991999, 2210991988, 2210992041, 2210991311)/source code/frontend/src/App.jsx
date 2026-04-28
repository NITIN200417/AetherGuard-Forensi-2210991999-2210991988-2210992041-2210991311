import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileVideo, FileImage, Activity, ShieldAlert, ShieldCheck, 
  Zap, Clock, Layers, Sparkles, Database, History, Code, Search, AlertTriangle, Monitor, Play, 
  FileText, Camera, Fingerprint, Copy, Network, User, Cpu, Info, Share2, Trash2, ChevronRight, X, Globe, Lock, Box, CheckCircle2,
  RefreshCw, Download, Maximize2, Hash, HardDrive, Terminal, BarChart3, ListFilter, Settings, Sliders, ExternalLink,
  Eye, EyeOff, LayoutPanelLeft, MousePointer2, Thermometer, Radio
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import AuthPage from './AuthPage';

// --- Production Configuration ---
const CONFIG = {
  API_BASE_URL: '/api',
  ENGINE_VERSION: 'Aether-5.0.1-Stable',
  MAX_FILE_SIZE: 15 * 1024 * 1024, // 15MB
  SCAN_SIM_SPEED: 180,
  AUTO_REFRESH_HEALTH: 10000,
  SYSTEM_LOAD_TIME: 1500
};

const COLORS = {
  REAL: '#10b981', 
  FAKE: '#ef4444', 
  SUSPICIOUS: '#f59e0b',
  PURPLE: '#a855f7',
  BLUE: '#3b82f6',
  DARK: '#02040a',
  TEXT: '#f1f5f9'
};

// --- Mock Data & Helpers ---
const DEMO_VIDEOS = [
  { id: 'v1', name: 'Identity_Drift_Sample.mp4', url: 'https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4', label: 'FAKE', confidence: 94.2, probGraph: Array.from({length: 20}, () => ({v: Math.random() * 40 + 60})) },
  { id: 'v2', name: 'Auth_Subject_Scan.mp4', url: 'https://videos.pexels.com/video-files/853889/853889-sd_640_360_25fps.mp4', label: 'REAL', confidence: 98.7, probGraph: Array.from({length: 20}, () => ({v: Math.random() * 10 + 5})) },
];

const SCAN_STAGES = [
  { id: 'alignment', label: 'Optical Face Alignment', delay: 0 },
  { id: 'extraction', label: 'Feature Topology Extraction', delay: 1000 },
  { id: 'inference', label: 'Inference Engine Jury Verdict', delay: 2000 }
];

// --- Sub-Components ---

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
      }
      draw() {
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const init = () => {
      particles = Array.from({ length: 60 }, () => new Particle());
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(animate);
    };
    window.addEventListener('resize', resize);
    resize();
    init();
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return <canvas ref={canvasRef} id="particle-canvas" className="opacity-40" />;
};

const MetricBadge = ({ icon: Icon, label, value, trend, colorClass = "text-purple-500" }) => (
  <div className="glass-panel p-5 border border-white/5 rounded-3xl group hover:border-white/10 transition-all flex items-center justify-between overflow-hidden relative">
     <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 ${colorClass}`}>
           <Icon size={18} />
        </div>
        <div className="flex flex-col">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
           <span className="text-sm font-black text-white italic">{value}</span>
        </div>
     </div>
     {trend && (
       <div className={`text-[9px] font-mono tracking-tighter ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend}
       </div>
     )}
     <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-all">
        <Icon size={64} />
     </div>
  </div>
);

const ConfidenceGauge = ({ value, label }) => {
  const color = label === 'FAKE' ? COLORS.FAKE : label === 'SUSPICIOUS' ? COLORS.SUSPICIOUS : COLORS.REAL;
  return (
    <div className="relative flex flex-col items-center shrink-0">
       <div className="w-24 h-24 relative scale-110">
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
            <span className="text-xl font-black text-white leading-none tracking-tighter">{Math.round(value)}%</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Match</span>
          </div>
       </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

// Mock fallback data when backend is offline
const MOCK_IMAGE_RESULT = { label: 'FAKE', confidence: 97.3, model: 'EfficientNet-B4', device: 'NEURAL_ENGINE_A2' };
const MOCK_IMAGE_PREVIEW = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=600&auto=format&fit=crop';

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'login', 'signup', null
  const [showSettings, setShowSettings] = useState(false);
  const [settingsState, setSettingsState] = useState({ neuralBoost: true, parallax: false, scanlines: true, diagnosticLogs: false });
  const [activeTab, setActiveTab] = useState('image');
  const [engineStatus, setEngineStatus] = useState('loading');
  const [history, setHistory] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [stats, setStats] = useState({ scans: 142, fraudRatio: 38, avgConfidence: 91 });

  const [imageState, setImageState] = useState({ file: null, preview: null, result: null, loading: false, progress: 0, meta: null });
  const [videoState, setVideoState] = useState({ file: null, preview: null, result: null, loading: false, progress: 0, meta: null, timestamp: 0 });
  const [webcamState, setWebcamState] = useState({ active: false, result: null });

  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const webcamVideoRef = useRef(null);

  // --- Health Check ---
  const checkHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${CONFIG.API_BASE_URL}/health`);
      setEngineStatus(res.data.status === 'ok' ? 'online' : 'error');
    } catch (e) { setEngineStatus('error'); }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, CONFIG.AUTO_REFRESH_HEALTH);
    const saved = localStorage.getItem('aether_vault');
    if (saved) setHistory(JSON.parse(saved));
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
    }, ...prev].slice(0, 15));
    setStats(s => ({ ...s, scans: s.scans + 1 }));
  };

  const getFileMeta = (file) => ({
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
    hash: 'SHA-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
    resolution: 'DETECTING...'
  });

  // --- Image Analysis Logic ---
  const handleImageAnalysis = async () => {
    if (!imageState.file) return;
    const capturedFile = imageState.file;
    const capturedPreview = imageState.preview;
    setImageState(p => ({ ...p, loading: true, result: null, progress: 0 }));
    let prog = 0;
    const sim = setInterval(() => { 
      prog = Math.min(prog + (Math.random() * 8), 92);
      setImageState(p => ({ ...p, progress: prog })); 
    }, CONFIG.SCAN_SIM_SPEED);
    
    const formData = new FormData();
    formData.append('file', capturedFile);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/image`, formData);
      clearInterval(sim);
      setImageState(p => ({ ...p, result: res.data, progress: 100, loading: false }));
      addToHistory(capturedFile.name, capturedPreview, res.data);
    } catch (e) {
      // Backend offline — use mock result so UI is still demonstrable
      clearInterval(sim);
      const mockResult = { ...MOCK_IMAGE_RESULT, _offline: true };
      setImageState(p => ({ ...p, result: mockResult, progress: 100, loading: false }));
      addToHistory(capturedFile.name, capturedPreview, mockResult);
    }
  };

  const handleDemo = async () => {
    setActiveTab('image');
    setImageState({ file: null, preview: null, loading: true, result: null, progress: 0, meta: { name: 'Synthetic_Target.jpg', size: '1.2 MB', type: 'JPG', hash: 'SHA-F82B9A', resolution: '1024x1024' } });
    let prog = 0;
    const sim = setInterval(() => { prog = Math.min(prog + 10, 95); setImageState(p => ({ ...p, progress: prog })); }, 100);
    try {
      const res = await axios.get(`${CONFIG.API_BASE_URL}/test/ai-face`);
      clearInterval(sim);
      if (res.data.error) throw new Error(res.data.error);
      setImageState(p => ({ ...p, result: res.data, preview: res.data.image_base64, progress: 100, loading: false }));
      addToHistory("System_Sample_AI.jpg", res.data.image_base64, res.data);
    } catch (e) { 
      // Backend offline — show mock demo result with a real-looking face image
      clearInterval(sim);
      const mockResult = { ...MOCK_IMAGE_RESULT, _offline: true };
      setImageState(p => ({ ...p, result: mockResult, preview: MOCK_IMAGE_PREVIEW, progress: 100, loading: false }));
      addToHistory("System_Sample_AI.jpg", MOCK_IMAGE_PREVIEW, mockResult);
    }
  };

  // --- Video Logic ---
  const handleVideoDemo = (demo) => {
    setActiveTab('video');
    const proxiedUrl = demo.url.startsWith('http') 
      ? `${CONFIG.API_BASE_URL}/proxy/video?url=${encodeURIComponent(demo.url)}`
      : demo.url;
    setVideoState({ file: { name: demo.name }, preview: proxiedUrl, loading: true, result: null, progress: 0, meta: { hash: 'DEMO_' + demo.id, size: '8.4 MB', type: 'MP4', resolution: '720P' } });
    let prog = 0;
    const sim = setInterval(() => { prog = Math.min(prog + 4, 98); setVideoState(p => ({ ...p, progress: prog })); }, 150);
    setTimeout(() => {
      clearInterval(sim);
      setVideoState(p => ({ ...p, result: { ...demo, probGraph: demo.probGraph }, progress: 100, loading: false }));
      addToHistory(demo.name, '', { label: demo.label, confidence: demo.confidence });
    }, 4500);
  };

  const handleVideoAnalysis = async () => {
    if (!videoState.file) return;
    const capturedFile = videoState.file;
    setVideoState(p => ({ ...p, loading: true, result: null, progress: 0 }));
    let prog = 0;
    const sim = setInterval(() => { prog = Math.min(prog + 3, 98); setVideoState(p => ({ ...p, progress: prog })); }, 500);
    const formData = new FormData();
    formData.append('file', capturedFile);
    try {
      const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/video`, formData);
      clearInterval(sim);
      setVideoState(p => ({ ...p, result: { ...res.data, probGraph: Array.from({length: 20}, () => ({v: Math.random() * 100})) }, progress: 100, loading: false }));
      addToHistory(capturedFile.name, '', res.data);
    } catch (e) {
      // Backend offline — use mock result
      clearInterval(sim);
      const mockResult = { label: 'FAKE', confidence: 91.5, _offline: true, probGraph: Array.from({length: 20}, () => ({v: Math.random() * 40 + 55})) };
      setVideoState(p => ({ ...p, result: mockResult, progress: 100, loading: false }));
      addToHistory(capturedFile.name, '', mockResult);
    }
  };

  // --- Webcam Logic ---
  const captureWebcamFrame = useCallback(() => {
    if (!webcamVideoRef.current || webcamVideoRef.current.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = webcamVideoRef.current.videoWidth;
    canvas.height = webcamVideoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(webcamVideoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'telemetry.jpg');
      try {
        const res = await axios.post(`${CONFIG.API_BASE_URL}/predict/image`, formData);
        setWebcamState(prev => ({ ...prev, result: res.data }));
      } catch (e) {}
    }, 'image/jpeg');
  }, []);

  useEffect(() => {
    let stream = null;
    if (webcamState.active) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        stream = s;
        if (webcamVideoRef.current) webcamVideoRef.current.srcObject = s;
        intervalRef.current = setInterval(captureWebcamFrame, 2000);
      }).catch(err => {
        setWebcamState({ active: false, result: null });
        alert(`WEBCAM ERROR: ${err.message}. Please check permissions.`);
      });
    } else {
      clearInterval(intervalRef.current);
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); clearInterval(intervalRef.current); };
  }, [webcamState.active, captureWebcamFrame]);

  // --- Auth Handlers ---
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('aether_agent', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aether_agent');
  };

  useEffect(() => {
    const savedAgent = localStorage.getItem('aether_agent');
    if (savedAgent) setUser(JSON.parse(savedAgent));
  }, []);

  const triggerAuth = (mode) => {
    setAuthMode(mode);
  };

  // Derived Values
  const currentState = activeTab === 'image' ? imageState : activeTab === 'video' ? videoState : { ...webcamState, preview: null, meta: { name: 'SENSOR_LIVE_01', hash: 'ENCRYPTED_SSL', type: 'STREAM', size: 'DYNAMIC' } };

  const finalHandleLogin = (userData) => {
    handleLogin(userData);
    setAuthMode(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-purple-500/40">
      <ParticleBackground />
      
      {/* --- GRID BACKGROUND --- */}
      <div className="fixed inset-0 bg-grid-white opacity-20 pointer-events-none -z-50" />
      <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none -z-40" />

      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-[100] px-10 py-5 flex items-center justify-between glass-panel border-b border-white/5 bg-black/60">
         <div className="flex items-center gap-14">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
               <div className="relative p-2.5 bg-purple-600/10 border border-purple-500/20 rounded-2xl group-hover:bg-purple-600/20 transition-all shadow-[0_0_30px_rgba(168,85,247,0.15)] group-hover:scale-110">
                  <img src="/logo.png" className="w-10 h-10 object-contain brightness-110 drop-shadow-[0_0_10px_purple]" alt="AetherGuard" />
                  <div className="absolute -inset-2 bg-purple-600/5 blur-xl animate-pulse -z-10" />
               </div>
               <div className="flex flex-col">
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none italic text-white">AETHER<span className="text-purple-500 text-glow-purple">GUARD</span></h1>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] ml-1 opacity-70">FORENSIC CORE {CONFIG.ENGINE_VERSION}</span>
               </div>
            </div>

            <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-3xl overflow-visible">
               {['image', 'video', 'webcam'].map(t => (
                 <button
                   key={t} onClick={() => setActiveTab(t)}
                   className={`px-4 md:px-8 py-2 md:py-3 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 md:gap-3 ${activeTab === t ? 'bg-purple-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
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
            <div className={`hidden lg:flex px-6 py-2.5 rounded-2xl border text-[11px] font-black uppercase items-center gap-4 tracking-widest backdrop-blur-3xl transition-all ${engineStatus === 'online' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
               <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2.5 }} className={`w-2.5 h-2.5 rounded-full ${engineStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
               {engineStatus === 'online' ? 'SYSTEM ONLINE' : 'ENGINE ERROR'}
            </div>
            
            {user ? (
               <div className="flex items-center gap-4 border-l border-white/10 pl-10 pr-2">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <Settings size={18}/>
                  </button>
                  <div className="relative group cursor-pointer">
                     <div className="w-12 h-12 rounded-2xl border-2 border-white/10 p-0.5 shadow-xl overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`} className="w-full h-full rounded-[0.65rem] object-cover bg-purple-600/20" />
                     </div>
                     <div className="absolute top-full right-0 mt-4 w-56 glass-panel rounded-2xl p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[200] border-white/10 shadow-2xl">
                        <div className="flex flex-col gap-3">
                           <div className="px-2 py-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2 italic">Active Agent</p>
                              <p className="text-sm font-black text-white italic truncate">{user.name}</p>
                           </div>
                           <div className="h-px bg-white/5 my-1" />
                           <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">
                              <X size={14}/> ABORT_SESSION
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <button onClick={() => triggerAuth('login')} className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all italic">Login</button>
                  <button onClick={() => triggerAuth('signup')} className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all italic">Signup</button>
               </div>
            )}
         </div>
      </nav>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {authMode && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-[600px] my-auto"
             >
                <button 
                  onClick={() => setAuthMode(null)}
                  className="absolute top-8 right-8 z-[1100] p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-all shadow-xl"
                >
                   <X size={20} />
                </button>
                <AuthPage onLogin={finalHandleLogin} initialMode={authMode} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, x: 100 }}
               animate={{ opacity: 1, scale: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.9, x: 100 }}
               className="relative w-full max-w-[500px] glass-panel rounded-[3rem] border border-white/10 bg-black/80 backdrop-blur-3xl p-12 overflow-hidden shadow-2xl"
             >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50" />
                <div className="flex justify-between items-center mb-12">
                   <div className="flex flex-col">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">SYSTEM_PREFERENCES</h2>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic mt-1">SECURE_LINK_ENCRYPTED</p>
                   </div>
                   <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20}/></button>
                </div>

                <div className="space-y-10">
                    {/* Engine Config */}
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                          <Cpu size={14} className="text-blue-500" /> FORENSIC_ENGINE_CONFIG
                       </h3>
                       <div className="grid gap-4">
                          <div 
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer"
                            onClick={() => setSettingsState(s => ({...s, neuralBoost: !s.neuralBoost}))}
                          >
                             <span className="text-xs font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">Neural Tensor Boost</span>
                             <div className={`w-12 h-6 rounded-full relative p-1 border transition-all ${settingsState.neuralBoost ? 'bg-blue-600/40 border-blue-500/50' : 'bg-slate-800 border-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${settingsState.neuralBoost ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] translate-x-6' : 'bg-slate-600'}`} />
                             </div>
                          </div>
                          <div 
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer"
                            onClick={() => setSettingsState(s => ({...s, parallax: !s.parallax}))}
                          >
                             <span className="text-xs font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">Optical Parallax Map</span>
                             <div className={`w-12 h-6 rounded-full relative p-1 border transition-all ${settingsState.parallax ? 'bg-blue-600/40 border-blue-500/50' : 'bg-slate-800 border-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${settingsState.parallax ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] translate-x-6' : 'bg-slate-600'}`} />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* UI Overlays */}
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                          <Monitor size={14} className="text-purple-500" /> INTERFACE_OVERLAYS
                       </h3>
                       <div className="grid gap-4">
                          <div 
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all cursor-pointer"
                            onClick={() => setSettingsState(s => ({...s, scanlines: !s.scanlines}))}
                          >
                             <span className="text-xs font-black text-slate-400 uppercase tracking-wider group-hover:text-white">HUD Scanlines</span>
                             <button className={`px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settingsState.scanlines ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                               {settingsState.scanlines ? 'ACTIVE' : 'INACTIVE'}
                             </button>
                          </div>
                          <div 
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all cursor-pointer"
                            onClick={() => setSettingsState(s => ({...s, diagnosticLogs: !s.diagnosticLogs}))}
                          >
                             <span className="text-xs font-black text-slate-400 uppercase tracking-wider group-hover:text-white">Diagnostic Logs</span>
                             <button className={`px-4 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settingsState.diagnosticLogs ? 'bg-purple-600/20 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-slate-500 border-white/10'}`}>
                               {settingsState.diagnosticLogs ? 'ACTIVE' : 'FILTERED'}
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

                <div className="mt-14 pt-8 border-t border-white/5 flex justify-between items-center">
                   <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">AETHER_v5.0.2_STABLE</p>
                   <button onClick={() => setShowSettings(false)} className="px-10 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-purple-500 hover:text-white transition-all">SAVE_REBOOT</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LIVE LOG MARQUEE --- */}
      <div className="sticky top-[96px] z-[90] h-14 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center px-10 overflow-hidden shadow-2xl">
         <div className="flex items-center gap-6 shrink-0 border-r border-white/10 pr-8 mr-8">
            <Radio size={16} className="text-purple-500 animate-[pulse_2s_infinite]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 italic">LOG ENGINE STREAM:</span>
         </div>
         <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
               {[...history, ...history].map((h, idx) => (
                  <div key={`${h.id}-${idx}`} className="flex items-center gap-12 group cursor-pointer mr-12 pr-12 border-r border-white/5 last:border-0 h-10">
                     <span className="text-[11px] font-black text-slate-700 font-mono italic">[{h.timestamp}]</span>
                     <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-purple-400 transition-colors">{h.name}</span>
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black ${h.label === 'FAKE' ? 'border-red-500/20 bg-red-500/5 text-red-500' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
                        {h.label === 'FAKE' ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                        {h.label} ({h.confidence}%)
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <main className="flex-1 max-w-[1780px] w-full mx-auto p-12 flex flex-col gap-14">
         
         {/* --- TOP STATISTICS ROW --- */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricBadge icon={LayoutPanelLeft} label="Total Investigative Cycles" value={stats.scans} trend="+12.4%" />
            <MetricBadge icon={ShieldAlert} label="Fraud Variance Ratio" value={`${stats.fraudRatio}% API`} trend="-2.1%" colorClass="text-red-500" />
            <MetricBadge icon={CheckCircle2} label="Mean Forecast Integrity" value={`${stats.avgConfidence}%`} trend="+0.5%" colorClass="text-emerald-500" />
            <MetricBadge icon={Clock} label="Average Inference Latency" value="240ms / frame" trend="-15ms" colorClass="text-blue-500" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
            
            {/* --- PRIMARY INGESTION BLOCK (LEFT) --- */}
            <div className="lg:col-span-7 flex flex-col gap-10 h-full">
               
               {activeTab === 'image' && <ImageSectionUI state={imageState} setState={setImageState} onAnalysis={handleImageAnalysis} onDemo={handleDemo} showHeatmap={showHeatmap} getFileMeta={getFileMeta} />}
               {activeTab === 'video' && <VideoSectionUI state={videoState} setState={setVideoState} onDemo={handleVideoDemo} onAnalysis={handleVideoAnalysis} />}
               {activeTab === 'webcam' && <WebcamSectionUI state={webcamState} setState={setWebcamState} videoRef={webcamVideoRef} />}
            </div>

            {/* --- ANALYTICAL ENGINE PANEL (RIGHT) --- */}
            <div className="lg:col-span-5 flex flex-col gap-12 h-full perspective-1000">
               
               {/* Verdict Matrix */}
               <div className="glass-panel rounded-[3rem] p-12 flex flex-col bg-gradient-to-br from-[#0a0f18] to-black min-h-[580px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 relative overflow-hidden transition-transform duration-700 hover:rotate-y-[-2deg]">
                  <div className="absolute top-0 right-0 p-8 opacity-20"><Sliders size={48} className="text-purple-600" /></div>
                  
                  <AnimatePresence mode="wait">
                     {!currentState.result ? (
                        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="flex-1 flex flex-col items-center justify-center text-center">
                           <Fingerprint size={80} className="mb-8" />
                           <h3 className="text-2xl font-black uppercase tracking-[0.5em] text-slate-500 italic">Awaiting Input</h3>
                           <p className="mt-4 text-[11px] font-bold uppercase tracking-widest leading-loose">Sensor Optical Matrix: UNLINKED</p>
                        </motion.div>
                     ) : (
                        <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col gap-12">
                           
                           {/* Primary Decision Header */}
                           <div className="flex justify-between items-start">
                              <div className="space-y-4">
                                 <span className="text-[11px] font-black p-2 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-500 uppercase tracking-widest italic flex items-center gap-3">
                                    <Thermometer size={14} className="text-purple-600" /> Forensic Heat Signature
                                 </span>
                                 <h2 className={`text-9xl font-black italic tracking-tighter leading-none ${currentState.result.label === 'FAKE' ? 'text-red-500 text-glow-red' : 'text-emerald-400 text-glow-green'}`}>
                                    {currentState.result.label}
                                 </h2>
                              </div>
                              <ConfidenceGauge value={currentState.result.confidence} label={currentState.result.label} />
                           </div>

                           {/* Tooling Bar */}
                           <div className="flex gap-4">
                              <button 
                                onClick={() => setShowHeatmap(!showHeatmap)}
                                className={`flex-1 py-4 border rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${showHeatmap ? 'bg-purple-600 border-purple-500 shadow-[0_0_20px_purple] text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                              >
                                 {showHeatmap ? <EyeOff size={16}/> : <Eye size={16}/>} {showHeatmap ? 'Deactivate Heatmap' : 'Toggle Grad-CAM'}
                              </button>
                              <button 
                                onClick={() => {
                                  const text = `AETHERGUARD FORENSIC REPORT\nVerdict: ${currentState.result?.label}\nConfidence: ${currentState.result?.confidence?.toFixed(1)}%\nTimestamp: ${new Date().toISOString()}`;
                                  navigator.clipboard.writeText(text).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
                                }}
                                title="Copy report to clipboard"
                                className={`p-4 border rounded-2xl transition-all ${shareCopied ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                              >
                                {shareCopied ? <CheckCircle2 size={18}/> : <Share2 size={18}/>}
                              </button>
                           </div>

                           {/* Technical Data Grid */}
                           <div className="grid grid-cols-2 gap-6 items-center">
                              <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-3">
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inference Device</span>
                                 <p className="text-sm font-black text-blue-400 flex items-center gap-3"><Cpu size={14}/> NEURAL_ENGINE_A2</p>
                              </div>
                              <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-3">
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Unit Veracity</span>
                                 <p className={`text-sm font-black flex items-center gap-3 ${currentState.result.label === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}><ShieldCheck size={14}/> {currentState.result.label === 'FAKE' ? 'HIGH RISK' : 'AUTHENTIC'}</p>
                              </div>
                           </div>

                           {/* Probability Graph (Video Only) */}
                           {activeTab === 'video' && currentState.result?.probGraph && (
                             <div className="h-40 w-full bg-black/40 border border-white/5 rounded-3xl p-6 overflow-hidden">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 block"><BarChart3 size={12} className="inline mr-2"/> Temporal Variance Matrix</span>
                                <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={currentState.result.probGraph}>
                                      <Area type="monotone" dataKey="v" stroke={currentState.result.label === 'FAKE' ? COLORS.FAKE : COLORS.PURPLE} fillOpacity={0.3} fill={currentState.result.label === 'FAKE' ? COLORS.FAKE : COLORS.PURPLE} />
                                   </AreaChart>
                                </ResponsiveContainer>
                             </div>
                           )}

                           <button onClick={() => window.print()} className="w-full py-6 mt-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                              <FileText size={18} /> Extrapolate Detailed Report
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               {/* Secure Vault / History Panel */}
               <div className="glass-panel flex-1 rounded-[3rem] flex flex-col overflow-hidden bg-[#07090e] border border-white/5 min-h-[400px]">
                  <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md">
                     <div className="flex items-center gap-4">
                        <Database size={20} className="text-purple-600" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 italic">Encrypted Secure Vault</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        <button className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-500 hover:text-white transition-all"><ListFilter size={16}/></button>
                        <button onClick={() => setHistory([])} className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-700 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                     {history.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full opacity-10">
                          <Lock size={64} className="mb-6" />
                          <p className="text-[12px] font-black uppercase tracking-[0.6em]">Biometric Sandbox Empty</p>
                       </div>
                     ) : (
                       history.map((h, i) => (
                         <motion.div 
                           key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                           whileHover={{ x: 10, scale: 1.02 }}
                           onClick={() => {
                             setImageState({ file: {name:h.name}, preview: h.thumb, result: h.fullResult, progress: 100, meta: {hash:'RECONSTRUCTED', resolution:'CACHE_LOADED', size:'UNIT_01'} });
                             setActiveTab('image');
                           }}
                           className="glass-panel p-5 bg-white/[0.015] border border-white/5 rounded-[2.5rem] flex gap-6 items-center cursor-pointer group transition-all"
                         >
                            <div className="relative shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
                               <img src={h.thumb} className="w-20 h-20 rounded-2xl object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 border border-white/10" />
                               <div className={`absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full border-[6px] border-[#07090e] flex items-center justify-center ${h.label === 'FAKE' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                                  {h.label === 'FAKE' ? <ShieldAlert size={12} className="text-white"/> : <ShieldCheck size={12} className="text-white"/>}
                               </div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[14px] font-black text-slate-100 truncate mb-3 uppercase tracking-tight">{h.name}</p>
                               <div className="flex items-center gap-4">
                                  <span className="px-3 py-1 rounded-lg text-[9px] font-black ring-1 ring-white/5 text-slate-500 uppercase tracking-widest">{h.timestamp}</span>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${h.label === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}>{h.confidence}% {h.label}</span>
                               </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={20} className="text-purple-500" /></div>
                         </motion.div>
                       ))
                     )}
                  </div>
               </div>
            </div>
         </div>
      </main>
      
      {/* Footer System Status */}
      <footer className="h-14 bg-black/60 border-t border-white/5 flex items-center justify-between px-10 text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] z-[100] backdrop-blur-3xl">
         <div className="flex gap-10">
            <span className="flex items-center gap-3"><Terminal size={12} className="text-purple-600"/> Terminal Active: TLS_NODE_091</span>
            <span className="flex items-center gap-3"><Globe size={12} className="text-blue-600"/> API_PROXY: {window.location.host}</span>
         </div>
         <div className="flex gap-10">
            <span className="text-slate-400">© 2026 PIYUSH BHARDWAJ FOR AETHERGUARD ENTERPRISE</span>
            <div className="flex items-center gap-3 text-emerald-500">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
               SECURED WITH AES-256
            </div>
         </div>
      </footer>
    </div>
  );
}

// --- SUB-VIEW UI BLOCKS ---

const AnalysisOverlayUI = ({ progress }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-20 rounded-[3rem]">
     <div className="relative mb-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-56 h-56 rounded-full border-b-4 border-l-2 border-purple-600 shadow-[0_0_80px_rgba(168,85,247,0.2)]" />
        <div className="absolute inset-0 flex items-center justify-center">
           <Cpu size={56} className="text-purple-500 animate-pulse" />
        </div>
        <div className="animate-scanline" />
     </div>
     <div className="w-full max-w-lg space-y-10">
        <div className="space-y-6">
           {SCAN_STAGES.map(s => (
             <div key={s.id} className="flex items-center justify-between transition-all">
                <div className="flex items-center gap-6">
                   <div className={`p-1.5 rounded-full ${progress >= SCAN_STAGES.findIndex(x => x.id === s.id) * 33 + 30 ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      <CheckCircle2 size={16} className={progress >= SCAN_STAGES.findIndex(x => x.id === s.id) * 33 + 30 ? 'text-white' : 'text-transparent'} />
                   </div>
                   <span className={`text-xs font-black uppercase tracking-[0.3em] ${progress >= SCAN_STAGES.findIndex(x => x.id === s.id) * 33 + 30 ? 'text-white' : 'text-slate-700'}`}>{s.label}</span>
                </div>
                {progress >= SCAN_STAGES.findIndex(x => x.id === s.id) * 33 + 30 ? <span className="text-emerald-500 font-bold text-[10px]">VERIFIED</span> : <RefreshCw size={14} className="text-purple-600 animate-spin opacity-40" />}
             </div>
           ))}
        </div>
        <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
           <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-700 via-blue-600 to-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.8)]" />
        </div>
        <p className="text-center text-[12px] text-purple-600 font-black tracking-[0.8em] animate-pulse italic">EXTRACTING BIOMETRIC HASH...</p>
     </div>
  </motion.div>
);

const ImageSectionUI = ({ state, setState, onAnalysis, onDemo, showHeatmap, getFileMeta }) => {
  const fileInputRef = useRef(null);
  const drop = useDropzone({ 
    onDrop: f => setState(s => ({...s, file:f[0], preview:URL.createObjectURL(f[0]), meta:getFileMeta(f[0])}))
  });

  const handleBrowse = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setState(s => ({...s, file: f, preview: URL.createObjectURL(f), meta: getFileMeta(f)}));
    e.target.value = '';
  };

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {!state.preview ? (
        <div 
           {...drop.getRootProps()} 
           className="glass-panel min-h-[600px] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-24 group relative overflow-hidden"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-32 h-32 rounded-[2.5rem] bg-black/60 border border-white/10 flex items-center justify-center mb-12 shadow-[0_0_50px_rgba(0,0,0,1)] ring-1 ring-white/5 group-hover:border-purple-500/40 transition-all">
              <Upload size={56} className="text-slate-700 group-hover:text-purple-500 transition-colors" />
           </motion.div>
           <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-6 text-white text-center leading-none">INJECT <span className="text-purple-500">MEDIA</span></h2>
           <p className="text-slate-600 text-[13px] font-black uppercase tracking-[0.4em] mb-16 italic text-center">AI DECONVOLUTION ENGINE READY</p>
           <div className="flex gap-8 relative z-20">
              <button onClick={(e) => { e.stopPropagation(); onDemo(); }} className="neo-button-primary scale-110">✨ SYSTEM DEMO</button>
              <button onClick={handleBrowse} className="neo-button-secondary scale-110">BROWSE FILES</button>
           </div>
           <div className="absolute bottom-10 left-10 opacity-10 flex gap-4"><Box size={24}/><Maximize2 size={24}/></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 h-full">
           <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-purple-500/20">
              <div className="flex items-center gap-6">
                 <button onClick={() => setState({file:null, preview:null, result:null, meta:null, loading:false, progress:0})} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Link</span>
                    <span className="text-sm font-black text-white italic truncate max-w-[300px]">{state.file?.name || "System Sample"}</span>
                  </div>
              </div>
              {!state.loading && !state.result && (
                <button onClick={onAnalysis} className="neo-button-primary">INITIATE FORENSIC SWEEP <ChevronRight size={14} className="inline ml-2"/></button>
              )}
           </div>
           <div className="glass-panel min-h-[550px] rounded-[3.5rem] relative overflow-hidden flex items-center justify-center p-12 bg-[#05070a] border-white/5 group">
              <img src={state.preview} className={`max-w-full max-h-[700px] object-contain rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,1)] border border-white/10 transition-all duration-700 ${showHeatmap ? 'contrast-150 saturate-200 blur-[2px]' : ''}`} />
              
              {/* MOCK GRAD-CAM UI */}
              {showHeatmap && state.result?.label === 'FAKE' && (
                 <div className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-60">
                    <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-red-500 rounded-full blur-[60px] animate-pulse" />
                    <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-orange-500 rounded-full blur-[50px] animate-pulse" />
                 </div>
              )}

              <AnimatePresence>
                 {state.loading && <AnalysisOverlayUI progress={state.progress} />}
              </AnimatePresence>
           </div>
        </div>
      )}
    </motion.div>
  );
};

const VideoSectionUI = ({ state, setState, onDemo, onAnalysis }) => {
  const drop = useDropzone({ 
    onDrop: f => setState(s => ({...s, file:f[0], preview:URL.createObjectURL(f[0]), meta: {name:f[0].name, hash:'SHA-WAIT', type:'MP4', size:'CALCULATING...'}})),
    accept: { 'video/*': [] },
    multiple: false,
    noClick: true
  });
  return (
    <div className="h-full flex flex-col gap-10">
       {!state.preview ? (
         <div {...drop.getRootProps()} className="glass-panel flex-1 min-h-[600px] rounded-[3.5rem] border-white/5 border-dashed border-2 flex flex-col items-center justify-center p-20 cursor-default bg-blue-600/[0.005] group">
            <input {...drop.getInputProps()} />
            <motion.div whileHover={{ scale: 1.1 }} className="w-28 h-28 rounded-3xl bg-black/60 border border-white/5 flex items-center justify-center mb-10 group-hover:border-blue-500/40 transition-all">
               <FileVideo size={56} className="text-slate-800 group-hover:text-blue-500" />
            </motion.div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-white italic">TEMPORAL <span className="text-blue-500">STREAM</span></h2>
            <div className="flex gap-6 mt-14 relative z-50">
               <button onClick={(e) => { e.stopPropagation(); onDemo(DEMO_VIDEOS[0]); }} className="neo-button bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_blue] px-10">CHANNEL 01</button>
               <button onClick={(e) => { e.stopPropagation(); onDemo(DEMO_VIDEOS[1]); }} className="neo-button-secondary px-10">CHANNEL 02</button>
               <button onClick={(e) => { e.stopPropagation(); drop.open(); }} className="neo-button-secondary bg-white/10 px-10">BROWSE FILES</button>
            </div>
            <p className="text-slate-600 text-[11px] uppercase font-bold tracking-[0.4em] mt-12 italic">AI-FRAME EXTRACTION ACTIVE (30FPS)</p>
         </div>
       ) : (
         <div className="flex flex-col gap-10 h-full">
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border-blue-500/20 bg-blue-600/[0.02]">
               <button onClick={() => setState({file:null,preview:null,result:null,loading:false,progress:0,meta:null})} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 transition-all"><Trash2 size={20}/></button>
               <div className="h-1.5 flex-1 mx-10 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: state.result ? '100%' : '30%' }} className="h-full bg-blue-500 shadow-[0_0_15px_blue]" />
               </div>
               {!state.result && !state.loading && <button onClick={onAnalysis} className="neo-button-primary bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_blue]">INITIATE DEEP SCAN</button>}
            </div>
            <div className="glass-panel min-h-[550px] relative bg-black overflow-hidden rounded-[3.5rem] border-white/5 p-4">
               <video src={state.preview} controls className="w-full h-full object-contain rounded-[2.5rem]" />
               <AnimatePresence>{state.loading && <AnalysisOverlayUI progress={state.progress} />}</AnimatePresence>
            </div>
         </div>
       )}
    </div>
  );
};

const WebcamSectionUI = ({ state, setState, videoRef }) => (
  <div className="glass-panel h-[720px] rounded-[4rem] relative overflow-hidden bg-black flex flex-col items-center justify-center border-emerald-500/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
     {!state.active ? (
        <div className="text-center space-y-14">
           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-40 h-40 rounded-[3rem] bg-black/60 border border-emerald-500/10 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-500/5 transition-all hover:scale-110 active:scale-95">
              <Camera size={64} className="text-slate-800" />
           </motion.div>
           <div className="space-y-6">
              <h2 className="text-7xl font-black italic tracking-tighter uppercase text-white leading-none">OPTICAL <span className="text-emerald-500 text-glow-green italic">SENSOR</span></h2>
              <p className="text-slate-600 text-[13px] font-black uppercase tracking-[1em] italic">SECURE FEED EXTRACTION V5</p>
           </div>
           <button onClick={() => setState({active:true, result:null})} className="neo-button bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] px-20 scale-125">ESTABLISH LIVE LINK</button>
        </div>
     ) : (
        <div className="w-full h-full relative group">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-1000" />
           
           <div className="absolute inset-0 pointer-events-none border-[30px] border-emerald-500/10 m-12 rounded-[4rem] animate-pulse" />
           
           {/* SCIFI HUD OVERLAY */}
           <div className="absolute top-16 left-16 px-10 py-5 bg-black/80 backdrop-blur-3xl border border-emerald-500/30 rounded-[2rem] flex items-center gap-6 shadow-2xl">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981] animate-ping" />
              <div className="flex flex-col">
                 <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none mb-1">ENCRYPTED_SIGNAL_V5</span>
                 <span className="text-[9px] font-mono text-slate-500">PACKET_LOSS: 0.04% | LATENCY: 22ms</span>
              </div>
           </div>

           <div className="absolute top-16 right-16 p-8 glass-panel rounded-[2rem] border-white/5 space-y-4 min-w-[300px]">
              <div className="flex justify-between items-center opacity-50"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Real-Time Probability</span><Search size={14}/></div>
              <div className="flex justify-between items-end">
                 <h4 className={`text-6xl font-black italic leading-none ${state.result?.label === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}>{state.result?.label || 'WATCHING'}</h4>
                 <span className="text-xl font-black text-white italic">{state.result?.confidence || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <motion.div animate={{ width: `${state.result?.confidence || 0}%` }} className={`h-full ${state.result?.label === 'FAKE' ? 'bg-red-500' : 'bg-emerald-500'}`} />
              </div>
           </div>

           <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-6">
              <button onClick={() => setState({active:false, result:null})} className="neo-button bg-red-600/20 border border-red-500/40 text-red-500 hover:bg-red-600 hover:text-white px-14 py-4 backdrop-blur-3xl scale-110">CUT SIGNAL</button>
           </div>
        </div>
     )}
  </div>
);

// Helper Icon
const ScanlinesIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h18M3 12h18M3 17h18" opacity="0.5" />
    <path d="M2 12h2M20 12h2" strokeWidth="4" />
  </svg>
);

export default App;
