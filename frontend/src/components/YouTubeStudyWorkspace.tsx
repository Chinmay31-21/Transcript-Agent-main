import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  FileText, 
  Presentation, 
  MessageSquare, 
  Download, 
  Sparkles, 
  Clock, 
  ExternalLink, 
  Search, 
  Send, 
  Check, 
  ArrowLeft,
  Share2,
  Bookmark,
  Layers,
  Video,
  FileCheck,
  HelpCircle,
  Copy
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface YouTubeStudyWorkspaceProps {
  initialVideoId?: string;
  initialTitle?: string;
  initialChannel?: string;
  user?: UserProfile | null;
  onBackToDashboard: () => void;
  onSwitchToLiveCapture: () => void;
}

interface TranscriptEntry {
  timestamp: string;
  seconds: number;
  text: string;
}

interface SmartNote {
  title: string;
  summary: string;
  bullets: string[];
  keyFormulaOrCode?: string;
}

export const YouTubeStudyWorkspace: React.FC<YouTubeStudyWorkspaceProps> = ({
  initialVideoId = 'FfXoiwnn6ey',
  initialTitle = 'Complete Dynamic Programming Masterclass & Memoization',
  initialChannel = 'take U forward (Striver)',
  user,
  onBackToDashboard,
  onSwitchToLiveCapture,
}) => {
  const [videoId, setVideoId] = useState(initialVideoId);
  const [videoTitle, setVideoTitle] = useState(initialTitle);
  const [channelName, setChannelName] = useState(initialChannel);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'transcripts' | 'notes' | 'ppt' | 'ask_ai'>('transcripts');
  
  // Transcripts State
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // PPT Generation State
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  const [pptGenerated, setPptGenerated] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I am your AI Socratic Tutor learning alongside you. Ask me any doubt about this lecture on "${initialTitle}", formulas, or edge cases!`,
      time: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Pre-loaded realistic transcript data aligned with the topic
  const transcripts: TranscriptEntry[] = [
    { timestamp: '00:15', seconds: 15, text: 'Welcome everyone. In this session, we will break down Dynamic Programming from absolute scratch.' },
    { timestamp: '01:20', seconds: 80, text: 'Remember the core philosophy: Those who cannot remember the past are condemned to repeat it.' },
    { timestamp: '03:45', seconds: 225, text: 'There are two properties that tell us a problem can be solved via DP: Overlapping Subproblems and Optimal Substructure.' },
    { timestamp: '06:10', seconds: 370, text: 'Let us take the Fibonacci sequence: F(n) = F(n-1) + F(n-2). Notice how the recursive tree computes F(3) multiple times.' },
    { timestamp: '09:30', seconds: 570, text: 'Step 1 of Memoization: Declare a DP array of size n+1 and initialize it with -1.' },
    { timestamp: '13:15', seconds: 795, text: 'Whenever you calculate an answer, store it in dp[n]. If dp[n] != -1, return dp[n] immediately in O(1) time.' },
    { timestamp: '17:40', seconds: 1060, text: 'Notice how the time complexity collapses from O(2^n) exponential down to O(n) linear.' },
    { timestamp: '22:05', seconds: 1325, text: 'Now let us convert Memoization (Top-Down) into Tabulation (Bottom-Up) to eliminate recursion call stack overhead.' },
    { timestamp: '28:30', seconds: 1710, text: 'Finally, space optimization: Observe that we only ever need the previous two states: prev and prev2, cutting space to O(1).' }
  ];

  // Pre-loaded smart structured notes
  const notes: SmartNote[] = [
    {
      title: '1. Identification Criteria for Dynamic Programming',
      summary: 'A problem requires Dynamic Programming if it displays Overlapping Subproblems and Optimal Substructure.',
      bullets: [
        'Overlapping Subproblems: The same sub-calculations are repeated multiple times in recursion.',
        'Optimal Substructure: An optimal solution to the main problem can be constructed from optimal solutions to subproblems.',
        'Key Indicator: Questions asking for "Maximum", "Minimum", "Total number of ways", or "Count of unique paths".'
      ],
      keyFormulaOrCode: 'DP Pattern = Recursion + Memoization (Top-Down) OR Iterative Table (Bottom-Up)'
    },
    {
      title: '2. Top-Down (Memoization) vs Bottom-Up (Tabulation)',
      summary: 'Transitioning from exponential recursion tree to linear state evaluation.',
      bullets: [
        'Top-Down: Solves subproblems on-demand using recursion + caching in dp[]. Time: O(N), Space: O(N) stack + O(N) array.',
        'Bottom-Up: Fills the base cases first (e.g. dp[0]=0, dp[1]=1) and computes forward in an iterative loop.',
        'Space Optimization: If current state only depends on (i-1) and (i-2), reduce array to two scalar variables O(1) space.'
      ],
      keyFormulaOrCode: 'int fib(int n) {\n  int prev2 = 0, prev = 1;\n  for(int i = 2; i <= n; i++) {\n    int cur = prev + prev2;\n    prev2 = prev; prev = cur;\n  }\n  return prev;\n}'
    }
  ];

  // Helper to extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    const id = extractVideoId(customUrlInput.trim());
    if (id) {
      setVideoId(id);
      setVideoTitle('Custom YouTube Lecture');
      setChannelName('YouTube Channel');
      setCustomUrlInput('');
    } else {
      alert('Please enter a valid YouTube video link (e.g., https://www.youtube.com/watch?v=...)');
    }
  };

  const handleGeneratePPT = () => {
    setIsGeneratingPPT(true);
    setTimeout(() => {
      setIsGeneratingPPT(false);
      setPptGenerated(true);
    }, 1500);
  };

  const handleSendAiQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: 'Just now' }]);
    setIsAiResponding(true);

    setTimeout(() => {
      let reply = `Great question! In the context of this lecture: Dynamic Programming optimizes your solution by caching repeated subtrees. For "${userText}", think about the base condition first. What is the state when input size is 0 or 1?`;
      if (userText.toLowerCase().includes('space') || userText.toLowerCase().includes('complexity')) {
        reply = `Regarding complexity: In Memoization, Time is O(N) and Space is O(N) array + O(N) recursive call stack. Tabulation eliminates call stack, and with state compression we achieve O(1) auxiliary space!`;
      } else if (userText.toLowerCase().includes('formula') || userText.toLowerCase().includes('fibonacci')) {
        reply = `The recurrence relation is F(n) = F(n-1) + F(n-2). The base conditions are dp[0] = 0 and dp[1] = 1.`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply, time: 'Just now' }]);
      setIsAiResponding(false);
    }, 1000);
  };

  const filteredTranscripts = transcripts.filter(t => 
    t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
    t.timestamp.includes(transcriptSearch)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Header Bar */}
      <div className="h-14 bg-slate-900/90 border-b border-white/10 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToDashboard}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              YouTube Workspace
            </span>
            <span className="text-xs font-bold text-slate-200 truncate max-w-xs md:max-w-md">
              {videoTitle}
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              ({channelName})
            </span>
          </div>
        </div>

        {/* Right Action: Switch to GMeet / Tab Capture */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToLiveCapture}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Switch to Live Tab / GMeet Capture</span>
            <span className="md:hidden">Live Capture</span>
          </button>
        </div>
      </div>

      {/* Main Study Area: 2-Column Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: YouTube Player & Quick Tools */}
        <div className="w-full lg:w-7/12 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-900/40">
          
          {/* 16:9 Video Embed Container */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden shadow-2xl">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=http://localhost:5173`}
              title="LearnLens YouTube Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Quick Action Bar under video */}
          <div className="p-4 bg-slate-900/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePPT}
                disabled={isGeneratingPPT}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Presentation className="w-4 h-4 text-sky-200" />
                <span>{isGeneratingPPT ? 'Synthesizing Slides...' : '1-Click Generate PPT'}</span>
              </button>

              {pptGenerated && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> 8 Slides Ready!
                </span>
              )}
            </div>

            {/* Custom URL Input */}
            <form onSubmit={handleLoadCustomUrl} className="flex items-center gap-1.5 flex-1 max-w-xs">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Paste YouTube Link..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-white/10 bg-slate-950 text-slate-200 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer shrink-0"
              >
                Load
              </button>
            </form>
          </div>

          {/* Video Metadata & AI Learning Status */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  AI Model Synchronized with Video
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                100% Verified Educational Stream
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              LearnLens AI extracts real-time transcripts, slide diagrams, formula notations, and generates structured notes simultaneously while you watch.
            </p>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Adaptive Learning Active</h4>
                  <p className="text-[10px] text-slate-400">Concepts grasped in this video are logged to your overall progress dashboard.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Tabs (Transcripts, Notes, PPT, Ask AI) */}
        <div className="w-full lg:w-5/12 flex flex-col bg-slate-900/60 overflow-hidden">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 bg-slate-900/80 px-2 shrink-0">
            <button
              onClick={() => setActiveTab('transcripts')}
              className={`py-3 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'transcripts'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transcripts</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Smart Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('ppt')}
              className={`py-3 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ppt'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>PPT Deck</span>
            </button>

            <button
              onClick={() => setActiveTab('ask_ai')}
              className={`py-3 px-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ask_ai'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>
          </div>

          {/* TAB 1: TRANSCRIPTS */}
          {activeTab === 'transcripts' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    placeholder="Search spoken words or timestamp..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-slate-950 text-slate-200 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transcripts.map(t => `[${t.timestamp}] ${t.text}`).join('\n'));
                    setCopiedTranscript(true);
                    setTimeout(() => setCopiedTranscript(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy full transcript"
                >
                  {copiedTranscript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredTranscripts.map((entry, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-sky-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {entry.timestamp}
                      </span>
                      <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to jump
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SMART STRUCTURED NOTES */}
          {activeTab === 'notes' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Auto-Generated Study Notes</span>
                <button
                  onClick={() => alert('Exporting complete Markdown / PDF notes pack...')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download PDF Notes</span>
                </button>
              </div>

              {notes.map((note, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5 shadow-md">
                  <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {note.summary}
                  </p>
                  <ul className="space-y-1.5 pl-3 list-disc text-xs text-slate-300">
                    {note.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  {note.keyFormulaOrCode && (
                    <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre">
                      {note.keyFormulaOrCode}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PPT GENERATION DECK */}
          {activeTab === 'ppt' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Presentation className="w-4 h-4 text-indigo-400" />
                      16:9 PowerPoint Slide Deck
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Engineered for classroom revision and professor-ready presentations
                    </p>
                  </div>
                  <button
                    onClick={handleGeneratePPT}
                    disabled={isGeneratingPPT}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPPT ? 'Generating...' : 'Re-Generate PPT'}
                  </button>
                </div>
              </div>

              {/* Slide Preview Grid */}
              <div className="space-y-3">
                {[
                  { num: 1, title: 'Introduction to Dynamic Programming', sub: 'Course Objectives & Philosophy', type: 'Title Slide' },
                  { num: 2, title: 'Overlapping Subproblems & Optimal Substructure', sub: 'The Two Golden Criteria', type: 'Core Theory' },
                  { num: 3, title: 'Fibonacci Sequence: Recursion Tree Analysis', sub: 'Identifying Exponential Redundancy O(2^N)', type: 'Proof & Visual' },
                  { num: 4, title: 'Memoization (Top-Down Caching)', sub: 'Array Storage & O(N) Linear Reduction', type: 'Algorithm' },
                  { num: 5, title: 'Tabulation (Bottom-Up Table Filling)', sub: 'Eliminating Stack Overhead', type: 'Algorithm' },
                  { num: 6, title: 'Space Optimization to O(1)', sub: 'Two-Pointer State Tracking', type: 'Optimization' },
                  { num: 7, title: 'Summary & Practice Interview Problems', sub: 'Climbing Stairs, Frog Jump, House Robber', type: 'Exercise' }
                ].map((s) => (
                  <div key={s.num} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-indigo-400/30 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {s.num}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">{s.title}</h5>
                        <p className="text-[10px] text-slate-400">{s.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {s.type}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert('Downloading official LearnLens PowerPoint Presentation (.pptx)...')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download .PPTX Presentation
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SOCRATIC AI TUTOR */}
          {activeTab === 'ask_ai' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-tr-sm'
                          : 'bg-slate-950/80 text-slate-200 border border-white/10 rounded-tl-sm shadow-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">
                      {msg.sender === 'user' ? 'You' : 'AI Socratic Tutor'} • {msg.time}
                    </span>
                  </div>
                ))}
                {isAiResponding && (
                  <div className="flex items-center gap-2 text-xs text-sky-400 italic">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Thinking & grounding answer in video...
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendAiQuery} className="mt-3 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask any doubt about this video..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-slate-200 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isAiResponding}
                  className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
