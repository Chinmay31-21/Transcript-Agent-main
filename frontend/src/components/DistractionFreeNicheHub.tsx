import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  Play, 
  Clock, 
  BookOpen, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  GraduationCap, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { NicheTopicItem, NicheFeed, UserProfile } from '../types';
import { api } from '../services/api';

interface DistractionFreeNicheHubProps {
  user: UserProfile | null;
  onSelectVideoForStudy: (videoUrl: string, title: string) => void;
  onOpenYouTubeWorkspace?: (videoId?: string, title?: string, channel?: string) => void;
  onOpenProfile: () => void;
}

export const DistractionFreeNicheHub: React.FC<DistractionFreeNicheHubProps> = ({
  user,
  onSelectVideoForStudy,
  onOpenYouTubeWorkspace,
  onOpenProfile,
}) => {
  const [feed, setFeed] = useState<NicheFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  useEffect(() => {
    loadNicheFeed();
  }, [user]);

  const loadNicheFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getNicheFeed(user?.id);
      setFeed(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleCustomIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onSelectVideoForStudy(customUrl.trim(), 'Custom Lecture Import');
    setCustomUrl('');
  };

  const filteredTopics = (feed?.curated_topics || []).filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.topic.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-8">
      
      {/* Top Banner: Distraction-Free Shield */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" /> 100% Distraction-Free Study Studio
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Curated Lectures for {user?.degree_major || 'Computer Science'}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            No algorithmic clickbait, no comment rabbit holes, no ads. Study with zero-prompt auto-notes, synchronized slide screenshots, and instant PPT export.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-400">Target Curriculum:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 font-medium text-slate-200">
              {user?.education_level || 'Undergraduate'} • {user?.standard_class || '3rd Year'}
            </span>
            <button
              onClick={onOpenProfile}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 ml-2"
            >
              Adjust Niche Stream ↗
            </button>
          </div>
        </div>

        {/* Custom URL Input Bar */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800">
          <form onSubmit={handleCustomIngest} className="flex gap-2 max-w-xl">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste any YouTube or Lecture URL to study with AI..."
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 fill-white" /> Start Studying
            </button>
          </form>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500" />
            High-Yield Recommended Modules
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hand-picked lectures aligned with your educational focus areas.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search topics or concepts..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading curated curriculum feed...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={topic.thumbnail_url}
                    alt={topic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-emerald-400 backdrop-blur-md border border-emerald-500/30">
                      {topic.topic}
                    </span>
                    {topic.channel_name && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-600/90 text-white backdrop-blur-md">
                        {topic.channel_name}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/70 text-slate-200 flex items-center gap-1 backdrop-blur-md">
                      <Clock className="w-3 h-3" /> {topic.duration_minutes}m
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/80 text-white backdrop-blur-md">
                      {topic.difficulty}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-2.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>

                  {topic.why_recommended && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                      💡 {topic.why_recommended}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    if (onOpenYouTubeWorkspace && topic.video_id) {
                      onOpenYouTubeWorkspace(topic.video_id, topic.title, topic.channel_name);
                    } else {
                      onSelectVideoForStudy(topic.source_url, topic.title);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600 shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Study with LearnLens AI</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Focus Topics Footer Pill list */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-500" /> Your Active Topics:
        </span>
        {(user?.focus_topics || ['Data Structures', 'Operating Systems', 'System Design']).map((topic, i) => (
          <span 
            key={i}
            className="px-3 py-1 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            #{topic}
          </span>
        ))}
      </div>
    </div>
  );
};
