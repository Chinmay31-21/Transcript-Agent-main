import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  School, 
  BookOpen, 
  Sparkles, 
  Check, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { UserProfile, CreditStatus } from '../types';
import { api } from '../services/api';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onProfileUpdated: (user: UserProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');
  const [credits, setCredits] = useState<CreditStatus | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [currentYear, setCurrentYear] = useState('3rd Year');
  const [institution, setInstitution] = useState('Indian Institute of Technology');
  const [degreeMajor, setDegreeMajor] = useState('Computer Science & Engineering');
  const [areaOfInterestInput, setAreaOfInterestInput] = useState('Data Structures & Algorithms, System Design, Operating Systems');
  const [ultimateAim, setUltimateAim] = useState('Crack Google SDE-1 / Top Product Companies');
  const [focusTopicsInput, setFocusTopicsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setEducationLevel(user.education_level || 'Undergraduate');
      setBranch(user.branch || user.degree_major || 'Computer Science & Engineering');
      setCurrentYear(user.current_year || user.standard_class || '3rd Year');
      setInstitution(user.institution || 'Indian Institute of Technology');
      setDegreeMajor(user.degree_major || user.branch || 'Computer Science & Engineering');
      const interests = user.area_of_interest && user.area_of_interest.length > 0
        ? user.area_of_interest
        : user.focus_topics || ['Data Structures & Algorithms', 'System Design'];
      setAreaOfInterestInput(interests.join(', '));
      setUltimateAim(user.ultimate_aim || 'Crack Google SDE-1 / Top Product Companies');
      setFocusTopicsInput((user.focus_topics || interests).join(', '));
    }
    loadCredits();
  }, [user, isOpen]);

  const loadCredits = async () => {
    try {
      const data = await api.getUserCredits(user?.id);
      setCredits(data);
    } catch (_) {}
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const topics = areaOfInterestInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const updated = await api.updateUserProfile({
        name,
        phone,
        education_level: educationLevel,
        standard_class: currentYear,
        branch,
        current_year: currentYear,
        institution,
        degree_major: branch,
        area_of_interest: topics,
        ultimate_aim: ultimateAim,
        focus_topics: topics,
      }, user?.id);

      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = (tier: string) => {
    alert(`Redirecting to secure Razorpay UPI AutoPay checkout for ${tier}. All UPI apps supported (PhonePe, GPay, Paytm).`);
  };

  const balance = credits?.credits_balance ?? (user?.credits_balance ?? 10);
  const totalUsed = credits?.total_credits_used ?? (user?.total_credits_used ?? 0);
  const isPro = user?.subscription_tier === 'PRO_MONTHLY' || user?.subscription_tier === 'ANNUAL_PASS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/20">
              {name ? name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">{name || 'Student Profile'}</h3>
                {isPro ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-300" /> PRO SUBSCRIBER
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ⭐ FREE TRIAL ({balance}/10 PASSES)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {institution || 'University'} • {degreeMajor || 'General Education'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Academic Profile & Niche Focus
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'subscription'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credits & Plan Upgrade
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Alex Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-500 text-xs cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp / Phone (For Study Reminders)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Education Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="School (Classes 9-10)">School (Classes 9-10)</option>
                    <option value="High School (Classes 11-12)">High School (Classes 11-12)</option>
                    <option value="Undergraduate">Undergraduate (B.Tech, B.Sc, MBBS, etc.)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech, MBA, MS, etc.)</option>
                    <option value="Competitive Exam">Competitive Exam (JEE, NEET, GATE, UPSC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Branch of Study
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Computer Science & Engineering, IT, AI-ML"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Current Year of Study
                  </label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="1st Year">1st Year (Fresher)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Pre-Final)</option>
                    <option value="4th Year">4th Year (Final Year)</option>
                    <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                    <option value="Self Learner / Placement Prep">Self Learner / Placement Prep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-slate-400" /> School / College / University
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. IIT Bombay / Stanford"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ultimate Aim (Optional Goal)
                  </label>
                  <input
                    type="text"
                    value={ultimateAim}
                    onChange={(e) => setUltimateAim(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Crack Google SDE-1 / GATE Rank < 100 / Master System Design"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Area of Interest (Comma separated topics for AI video recommendations)
                </label>
                <input
                  type="text"
                  value={areaOfInterestInput}
                  onChange={(e) => setAreaOfInterestInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Data Structures & Algorithms, System Design, Operating Systems, Machine Learning"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Our recommendation engine pairs top YouTube channels (e.g. take U forward, NeetCode, Gate Smashers) matching your branch, year, and aim.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Profile Updated Successfully!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Academic Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Credit Status Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Your Study Pass Meter</p>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {isPro ? 'Unlimited Pro Access' : `${balance} of 10 Free Passes Left`}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {totalUsed} full lectures analyzed with Notes, PPT, & Anki Flashcards.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex flex-col items-center justify-center font-mono">
                  <span className="text-2xl font-black text-blue-500">{isPro ? '∞' : balance}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Passes</span>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Monthly Plan */}
                <div className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-all shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-bold text-slate-900 dark:text-white text-base">Student Pro Monthly</h5>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        MOST FLEXIBLE
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹299</span>
                      <span className="text-xs text-slate-500">/ month</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 my-4">
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Infinite Full-Lecture Transcripts
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Auto-Screenshots & Diagram Crops
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> 1-Click PPTX Slide Deck Generator
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Printable Vector PDF Notes with KaTeX
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sub-second AI Socratic Tutor
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgrade('Student Pro Monthly (₹299/mo)')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" /> Subscribe via UPI AutoPay
                  </button>
                </div>

                {/* Annual Plan */}
                <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                      SAVE 45%
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-base">Annual Exam Pass</h5>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹1,999</span>
                      <span className="text-xs text-slate-500">/ year (₹166/mo)</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 my-4">
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Everything in Student Pro Monthly
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Priority Processing & Cloud Sync
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Unlimited Anki Flashcard Sync
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> 1-Click Notion & Obsidian Export
                      </li>
                      <li className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> WhatsApp Exam Review Alerts
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgrade('Annual Exam Pass (₹1,999/yr)')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" /> Get Annual Access
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Supported with instant <strong>UPI AutoPay</strong> (Google Pay, PhonePe, Paytm, BHIM) and Credit/Debit Cards via Razorpay & Stripe. Cancel anytime with 1-click.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
