import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path or default to dashboard
  const from = location.state?.from?.pathname || '/';

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Left Pane: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-[480px] bg-white dark:bg-slate-900 z-10 relative">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom duration-700">
             <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20">
               <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
             </div>
             <h2 className="text-3xl font-extrabold tracking-tight">
               Welcome Back
             </h2>
             <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sign in to access your intelligence dashboard.
             </p>
          </div>

          <div className="mt-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
            <LoginForm onSuccess={handleLoginSuccess} />
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                By signing in, you agree to our 
                <a href="/terms" className="text-blue-600 hover:text-blue-500 mx-1">Terms of Service</a> 
                and 
                <a href="/privacy" className="text-blue-600 hover:text-blue-500 mx-1">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Brand/Visual */}
      <div className="hidden lg:block relative flex-1 bg-slate-900 overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black opacity-90 z-0"></div>
          <svg className="absolute inset-0 h-full w-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 L0 50 Q50 0 100 50 L100 100 Z" fill="url(#gradient)" />
             <defs>
               <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#3b82f6" /> 
                 <stop offset="100%" stopColor="#8b5cf6" />
               </linearGradient>
             </defs>
          </svg>
          
          {/* Animated decorative circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
           <div className="flex justify-end">
              <div className="text-xs font-mono opacity-50 border border-white/20 px-3 py-1 rounded-full">
                SYSTEM_STATUS: ONLINE
              </div>
           </div>
           
           <div className="max-w-xl mb-20">
             <div className="h-1 w-20 bg-blue-500 mb-8 rounded-full"></div>
             <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
               Advanced Fraud Detection & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Network Intelligence</span>
             </h1>
             <p className="text-xl text-slate-300 font-light leading-relaxed">
               Uncover hidden connections, detect complex patterns, and protect your platform with our next-generation investigation suite.
             </p>
           </div>

           <div className="flex gap-4 text-xs font-mono text-slate-400">
             <div>v2.4.0-RC1</div>
             <div>•</div>
             <div>SECURE_CONNECTION</div>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default Login;

