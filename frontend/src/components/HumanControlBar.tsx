import React from 'react';
import { 
  Pause, 
  Play, 
  Square, 
  Check, 
  Video, 
  User, 
  Radio
} from 'lucide-react';
import { LearningSession, UserProfile } from '../types';

interface HumanControlBarProps {
  activeSession: LearningSession | null;
  user?: UserProfile | null;
  onOpenProfile?: () => void;
  onNavigateHome?: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSendCommand?: (cmd: string) => void;
  onOpenAutoPilot?: () => void;
  visualEnabled: boolean;
  setVisualEnabled: (val: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
}

export const HumanControlBar: React.FC<HumanControlBarProps> = ({
  activeSession,
  user,
  onOpenProfile,
  onNavigateHome,
  onPause,
  onResume,
  onStop,
  visualEnabled,
  audioEnabled,
}) => {
  const isPaused = activeSession?.status === 'PAUSED';
  const isPro = user?.subscription_tier === 'PRO_MONTHLY' || user?.subscription_tier === 'ANNUAL_PASS';
  const balance = user?.credits_balance ?? 10;

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 px-5 flex items-center justify-between z-20 shrink-0 shadow-2xl select-none">
      
      {/* LEFT: BRAND LOGO & TAGLINE MATCHING REFERENCE - CLICKABLE HOME REDIRECT */}
      <div className="flex items-center gap-6">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-all cursor-pointer p-1 -m-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          title="Return to LearnLens AI Home & Learning Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-slate-700 flex items-center justify-center shadow-metallic-subtle text-white border border-slate-600 group-hover:border-sky-400 group-hover:scale-105 transition-all">
            <Video className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-slate-100 tracking-tight group-hover:text-sky-300 transition-colors">
                LearnLens AI
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                Home
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Watch • Listen • Learn • Grow
            </p>
          </div>
        </button>

        {/* Vertical divider */}
        <div className="h-7 w-[1px] bg-white/10 hidden md:block" />

        {/* CENTER-LEFT: ACTIVE SESSION TITLE & SOURCE PILL */}
        <div className="hidden md:flex flex-col">
          <h2 className="text-xs font-bold text-slate-100 truncate max-w-sm">
            {activeSession ? activeSession.title : 'Advanced Network Security (TLS 1.3)'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <svg className="w-3.5 h-3.5 fill-red-500" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YouTube • Chrome Tab</span>
            </span>
          </div>
        </div>
      </div>

      {/* CENTER-RIGHT & RIGHT CONTROLS */}
      <div className="flex items-center gap-5">
        
        {/* Observational Status Indicator & Telemetry Checks */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-sky-400'} animate-pulse shadow-metallic-subtle`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPaused ? 'text-amber-400' : 'text-sky-400'}`}>
              {isPaused ? 'PAUSED' : 'OBSERVING'}
            </span>
            <span className="text-[11px] font-mono text-slate-400 ml-0.5">
              04:18
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <span>Audio</span>
              <Check className="w-3 h-3 text-sky-400 stroke-[2.5]" />
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <span>Vision</span>
              <Check className="w-3 h-3 text-sky-400 stroke-[2.5]" />
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <span>RAG</span>
              <Check className="w-3 h-3 text-sky-400 stroke-[2.5]" />
            </span>
          </div>
        </div>

        {/* Action Buttons: Pause & Stop */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-500 text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-sky-400" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-500 text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Pause className="w-3 h-3 text-slate-300" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 border border-rose-400/40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>

        {/* User Profile & Credit Pass Badge matching student model */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <button
            onClick={onOpenProfile}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border border-blue-400/40 hover:brightness-125 transition-all cursor-pointer shadow-xs"
            title="View Free Study Passes & Upgrade"
          >
            <span>⭐</span>
            <span>{isPro ? 'Unlimited Pro' : `${balance}/10 Passes`}</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
            title="Edit Academic Profile & Niche Stream"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-metallic-subtle border border-emerald-400/50 overflow-hidden">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors leading-none">
                {user?.name || 'Alex Kumar'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {user?.degree_major || 'B.Tech CSE'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
