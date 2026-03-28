import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Mail, User, ShieldCheck, ChevronRight, 
  Fingerprint, Zap, Globe, Github, Terminal, 
  ShieldAlert, Scan, Sparkles, AlertCircle, Phone,
  Clock, RefreshCw, CheckCircle2, ArrowLeft, Shield
} from 'lucide-react';

const OTP_LENGTH = 6;
const OTP_COOLDOWN = 30;

const AuthPage = ({ onLogin, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [step, setStep] = useState('identify'); // 'identify' or 'otp'
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', name: '' });
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!formData.identifier) return;
    
    setIsLoading(true);
    setError(null);
    
    // Mock OTP Send
    setTimeout(() => {
      setStep('otp');
      setTimer(OTP_COOLDOWN);
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyOTP = (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) return;

    setIsLoading(true);
    setError(null);

    // Mock OTP Verification
    setTimeout(() => {
      if (otpValue === '123456') { // Mock valid OTP
        setSuccess(true);
        setTimeout(() => {
          onLogin({ 
            name: isLogin ? (formData.identifier.split('@')[0]) : formData.name, 
            identifier: formData.identifier 
          });
        }, 1500);
      } else {
        setError("INVALID_CIPHER_SEQUENCE: AUTH_FAILURE");
        setIsLoading(false);
        setOtp(new Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      }
    }, 2000);
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 selection:bg-purple-500/40 overflow-hidden">
      
      {/* Background stays consistent with App */}
      <div className="fixed inset-0 bg-[#02040a] -z-50" />
      <div className="fixed inset-0 bg-grid-white opacity-5 pointer-events-none -z-40" />
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/10 blur-[150px] animate-pulse rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 blur-[150px] animate-pulse rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="glass-panel p-10 md:p-14 rounded-[3.5rem] border border-white/5 bg-black/60 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group transition-all duration-700 hover:border-purple-500/20">
           
           {/* Scanline Effect Overlay */}
           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-[0.03]" />

           {/* Brand & Mode Switch */}
           <div className="flex flex-col items-center mb-12">
              <motion.div 
                whileHover={{ rotate: 90 }}
                className="w-20 h-20 bg-purple-600/10 border border-purple-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.2)] transition-all"
              >
                 <Shield className="text-purple-500 w-10 h-10" />
              </motion.div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
                {success ? "AUTHORIZED" : step === 'otp' ? "VERIFICATION" : isLogin ? "AGENT_ACCESS" : "CREATE_IDENTITY"}
              </h1>
              <div className="mt-4 flex items-center gap-3 text-[9px] font-black text-slate-500 tracking-[0.4em] uppercase">
                 <Scan size={12} className="text-purple-600" /> SECURE_HANDSHAKE_ACTIVE
              </div>
           </div>

           <AnimatePresence mode="wait">
             {success ? (
               <motion.div 
                 key="success"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center justify-center py-10"
               >
                 <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                 </div>
                 <p className="text-emerald-500 font-black italic uppercase tracking-widest text-sm animate-pulse">ESTABLISHING_ENCRYPTED_TUNNEL...</p>
               </motion.div>
             ) : (
               <motion.div 
                 key={step}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                 {error && (
                   <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-500 text-[10px] font-black uppercase tracking-widest italic">
                     <ShieldAlert size={16} /> {error}
                   </div>
                 )}

                 {step === 'identify' ? (
                   <form onSubmit={handleSendOTP} className="space-y-6">
                      {!isLogin && (
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors" size={18} />
                           <input 
                             type="text" placeholder="LEGAL_NAME" required
                             value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-sm font-black text-white focus:outline-none focus:border-purple-500/50 transition-all uppercase tracking-widest italic"
                           />
                        </div>
                      )}
                      
                      <div className="relative group">
                         <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-500 transition-colors" size={18} />
                         <input 
                           type="text" placeholder="COMM_LINK (EMAIL/PHONE)" required
                           value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})}
                           className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-sm font-black text-white focus:outline-none focus:border-purple-500/50 transition-all uppercase tracking-widest italic"
                         />
                      </div>

                      <button 
                        type="submit" disabled={isLoading}
                        className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black uppercase text-xs tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_rgba(168,85,247,0.2)] transition-all flex items-center justify-center gap-4 group"
                      >
                         {isLoading ? <Terminal size={18} className="animate-pulse" /> : <>TRANSMIT_OTP_CIPHER <Zap size={16} className="group-hover:scale-125 transition-transform"/></>}
                      </button>
                   </form>
                 ) : (
                   <div className="space-y-10">
                      <div className="flex flex-col items-center">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 text-center leading-relaxed">
                            A 6-DIGIT QUANTUM OTP HAS BEEN TRANSMITTED TO:<br/>
                            <span className="text-purple-400 mt-2 block">{formData.identifier}</span>
                         </p>
                         
                         <div className="flex gap-3 md:gap-4 justify-center">
                            {otp.map((data, index) => (
                              <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={data}
                                ref={el => otpRefs.current[index] = el}
                                onChange={e => handleOtpChange(e.target, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                className="w-12 h-16 md:w-14 md:h-20 bg-white/[0.03] border-2 border-white/10 rounded-2xl text-center text-2xl font-black text-purple-500 focus:outline-none focus:border-purple-500 shadow-xl transition-all"
                              />
                            ))}
                         </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        <button 
                          onClick={handleVerifyOTP} disabled={isLoading || otp.join('').length < OTP_LENGTH}
                          className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black uppercase text-xs tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_rgba(59,130,246,0.2)] transition-all"
                        >
                           {isLoading ? "VALIDATING_SIGNATURE..." : "VERIFY_&_INITIATE"}
                        </button>
                        
                        <div className="flex justify-between items-center px-4">
                           <button 
                             onClick={() => setStep('identify')}
                             className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
                           >
                             <ArrowLeft size={14}/> BACK
                           </button>
                           
                           {timer > 0 ? (
                             <span className="text-[10px] font-black text-slate-600 flex items-center gap-2 uppercase tracking-widest">
                               <Clock size={14}/> RESEND_IN {timer}S
                             </span>
                           ) : (
                             <button 
                               onClick={handleSendOTP}
                               className="text-[10px] font-black text-purple-500 hover:text-purple-400 uppercase tracking-widest flex items-center gap-2 transition-colors animate-pulse"
                             >
                               <RefreshCw size={14}/> RESEND_CIPHER
                             </button>
                           )}
                        </div>
                      </div>
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>

           <div className="mt-14 pt-10 border-t border-white/5 flex flex-col items-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-6 italic">
                {isLogin ? "NEW_RECRUIT_DETECTED?" : "ALREADY_ENLISTED?"}
              </p>
              <button 
                onClick={() => { setIsLogin(!isLogin); setStep('identify'); setError(null); }}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.3em] italic"
              >
                 {isLogin ? "INITIATE_ENROLLMENT" : "GOTO_AUTHORIZATION"}
              </button>
           </div>
        </div>

        {/* Technical Metadata */}
        <div className="mt-10 flex justify-between items-center px-10 opacity-30">
           <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <Fingerprint size={12}/> RSA_4096_ENCRYPTED
           </div>
           <div className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <Globe size={12}/> GLOBE_GW_ONLINE
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
