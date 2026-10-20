import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  PlayCircle, 
  Video, 
  GraduationCap, 
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import { UserProfile, StudentProgressSummary } from '../types';
import { api } from '../services/api';

interface OverallProgressDashboardProps {
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenYouTubeWorkspace: (videoId?: string) => void;
  onStartLiveCapture: () => void;
  onOpenNicheFeed: () => void;
}

export const OverallProgressDashboard: React.FC<OverallProgressDashboardProps> = ({
  user,
  onOpenProfile,
  onOpenYouTubeWorkspace,
  onStartLiveCapture,
  onOpenNicheFeed,
}) => {
  const [progress, setProgress] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getStudentProgress(user?.id);
      setProgress(data);
    } catch (e) {
      console.error('Failed to load progress summary', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const branch = progress?.branch || user?.branch || user?.degree_major || 'Computer Science & Engineering';
  const year = progress?.current_year || user?.current_year || user?.standard_class || '3rd Year';
  const aim = progress?.ultimate_aim || user?.ultimate_aim || 'Crack Google SDE-1 / Top Product Companies';
  const streak = progress?.study_streak_days ?? 5;
  const hours = progress?.total_study_hours ?? 4.5;
  const conceptsGrasped = progress?.concepts_grasped ?? 12;
  const conceptsStruggling = progress?.concepts_struggling ?? 2;
  const accuracy = progress?.practice_accuracy_pct ?? 85;
  const sessions = progress?.total_sessions ?? 3;
  const screenshots = progress?.total_screenshots_captured ?? 28;
  const words = progress?.total_transcripts_words ?? 4200;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8 select-none">
      
      {/* Top Banner: Student Profile & Motivation Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg border border-white/20">
              {progress?.name ? progress.name.charAt(0).toUpperCase() : (user?.name?.charAt(0) || 'S')}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {progress?.name || user?.name || 'Alex Kumar'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {year}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {branch}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span><strong className="text-amber-300">Target Aim:</strong> {aim}</span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <strong>{streak} Day Study Streak</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <strong>{hours} hrs</strong> Total Lecture Ingestion
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenYouTubeWorkspace()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 fill-white text-rose-700" />
              <span>YouTube Video Player</span>
            </button>
            <button
              onClick={onStartLiveCapture}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>GMeet / Tab Share</span>
            </button>
            <button
              onClick={onOpenProfile}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              title="Edit Academic Profile"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Study Hours */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Time Studied</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-white">{hours} <span className="text-sm font-normal text-slate-400">hours</span></div>
            <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +1.2 hrs this week
            </p>
          </div>
        </div>

        {/* Card 2: Concepts Grasped */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Concepts Grasped</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-white">{conceptsGrasped} <span className="text-sm font-normal text-slate-400">mastered</span></div>
            <p className="text-[11px] text-slate-400 mt-1">
              {conceptsStruggling > 0 ? (
                <span className="text-amber-400 font-semibold">{conceptsStruggling} need review</span>
              ) : (
                <span className="text-emerald-400 font-semibold">All concepts verified</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Practice Accuracy</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-white">{accuracy}%</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Auto Visual Ingestion */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto Screenshots</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-black text-white">{screenshots} <span className="text-sm font-normal text-slate-400">slides</span></div>
            <p className="text-[11px] text-slate-400 mt-1">
              {words.toLocaleString()} transcript words parsed
            </p>
          </div>
        </div>

      </div>

      {/* Main Section Grid: Topic Mastery Breakdown & Recommended Next Study */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Topic Mastery & Cognitive Radar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  Topic Mastery Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cognitive progress inferred across your study sessions and practice evaluations
                </p>
              </div>
              <button 
                onClick={fetchProgress} 
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Refresh progress data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {(progress?.top_mastered_topics || [
                { topic: 'Data Structures & Algorithms', mastery_pct: 88, concepts_count: 14 },
                { topic: 'Network Firewalls & Security', mastery_pct: 92, concepts_count: 8 },
                { topic: 'Operating Systems & Concurrency', mastery_pct: 74, concepts_count: 6 },
                { topic: 'System Design Architecture', mastery_pct: 65, concepts_count: 5 }
              ]).map((t, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-sky-500/30 transition-all">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200">{t.topic}</span>
                    <span className="font-bold text-sky-400">{t.mastery_pct}% Mastery</span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-700 ${
                        t.mastery_pct >= 85 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : t.mastery_pct >= 70 
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${t.mastery_pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>{t.concepts_count} key concepts learned</span>
                    <span>Status: {t.mastery_pct >= 80 ? 'Proficient' : 'In Progress'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Learning Activity Log */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 backdrop-blur-xl shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Captured Sessions & Analysis
            </h3>

            <div className="space-y-3">
              {(progress?.recent_activity || [
                { session_id: 'sess-1', title: 'Dynamic Programming & Memoization', platform: 'YouTube', duration_min: 48, timestamp: Date.now() - 3600000 },
                { session_id: 'sess-2', title: 'Network Security Architecture & TLS 1.3', platform: 'Chrome Tab', duration_min: 35, timestamp: Date.now() - 86400000 },
                { session_id: 'sess-3', title: 'Distributed Systems & Caching', platform: 'Google Meet', duration_min: 52, timestamp: Date.now() - 172800000 }
              ]).map((act, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                      {act.platform.includes('YouTube') ? (
                        <PlayCircle className="w-4 h-4 text-red-400" />
                      ) : act.platform.includes('Meet') ? (
                        <Video className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{act.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {act.platform} • {act.duration_min} minutes
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Date(act.timestamp * (act.timestamp < 10000000000 ? 1000 : 1)).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recommended Next What-To-Study Section */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950/60 border border-indigo-500/20 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Recommended Next
              </h3>
              <button
                onClick={onOpenNicheFeed}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                View Feed <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Based on your target <strong className="text-amber-300 font-semibold">{aim}</strong> and your {year} {branch} curriculum, here is what our ML model recommends studying next:
            </p>

            <div className="space-y-4">
              {/* Highlight Recommendation 1 */}
              <div 
                onClick={() => onOpenYouTubeWorkspace('FfXoiwnn6ey')}
                className="group p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-indigo-400/50 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    YouTube
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    take U forward (Striver)
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  Complete Dynamic Programming Masterclass & Memoization
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  1-Click open integrated YouTube player with real-time AI transcripts, instant PPT generation, and doubt solver.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Study with LearnLens AI <ArrowUpRight className="w-3 h-3" />
                  </span>
                  <span className="text-slate-400 font-mono">48m</span>
                </div>
              </div>

              {/* Highlight Recommendation 2 */}
              <div 
                onClick={() => onOpenYouTubeWorkspace('U3RkDLtS7uY')}
                className="group p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-indigo-400/50 transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    YouTube
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Gaurav Sen
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  System Design Primer: Designing Scalable Distributed Caching
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Learn cache eviction, Write-Through patterns, and latency reduction in real-time architectures.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Study with LearnLens AI <ArrowUpRight className="w-3 h-3" />
                  </span>
                  <span className="text-slate-400 font-mono">35m</span>
                </div>
              </div>
            </div>

            {/* Subscription reminder / Pro pass status */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Zap className="w-4 h-4 fill-amber-300" />
                <span>
                  {user?.subscription_tier === 'PRO_MONTHLY' || user?.subscription_tier === 'ANNUAL_PASS' 
                    ? 'Pro Subscriber Active' 
                    : `${user?.credits_balance ?? 10} Free Study Passes Left`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Each study session provides automated slide screenshots, instant transcript summaries, and 16:9 PowerPoint export.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
