import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Send, 
  Mail, 
  ShieldCheck, 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Zap,
  GraduationCap,
  Key
} from 'lucide-react';
import { UserProfile, AdminStatsResponse, AdminUserActionResponse } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  currentUser?: UserProfile | null;
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onBackToApp,
}) => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FREE_TRIAL'>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastDispatchedEmail, setLastDispatchedEmail] = useState<Record<string, any> | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load admin dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (user: UserProfile) => {
    setProcessingUserId(user.id);
    setActionMessage(null);
    try {
      const res: AdminUserActionResponse = await api.adminApproveUser({
        user_id: user.id,
        tier: user.subscription_tier === 'ANNUAL_PASS' ? 'ANNUAL_PASS' : 'PRO_MONTHLY',
        send_email: true,
        temp_password: 'ActivePass@2026'
      });

      setActionMessage(res.message);
      if (res.dispatched_details) {
        setLastDispatchedEmail(res.dispatched_details);
      }
      await fetchStats();
    } catch (e: any) {
      alert('Approval failed: ' + e.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleTopup = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const res = await api.adminTopupUser({
        user_id: userId,
        credits_to_add: 10,
        reason: 'ADMIN_MANUAL_BONUS'
      });
      setActionMessage(res.message);
      await fetchStats();
    } catch (e: any) {
      alert('Top-up failed: ' + e.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  const users = stats?.users_list || [];

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.branch || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.payment_reference || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return u.payment_status === 'PENDING_APPROVAL';
    if (statusFilter === 'APPROVED') return u.payment_status === 'PAID_APPROVED' || u.subscription_tier === 'PRO_MONTHLY';
    if (statusFilter === 'FREE_TRIAL') return u.subscription_tier === 'FREE_TRIAL';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8 select-none">
      
      {/* Top Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  LearnLens AI Admin Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  STAFF ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage student registrations, verify payment references, approve subscriptions & dispatch credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={onBackToApp}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Back to App
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-white">
              ₹{(stats?.total_revenue_inr ?? 8970).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">From Pro & Annual passes</p>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-amber-300">
              {stats?.pending_approvals ?? 1}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting payment verification</p>
          </div>
        </div>

        {/* Card 3: Active Pro Subscribers */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-sky-950/40 border border-sky-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Active Pro Students</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-white">
              {stats?.active_pro_subscribers ?? 2}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Unlimited study access</p>
          </div>
        </div>

        {/* Card 4: Total Registered Students */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-white">
              {stats?.total_students ?? 4}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active registered learners</p>
          </div>
        </div>

      </div>

      {/* Success / Action Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionMessage}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dispatched Credentials Modal / Banner */}
      {lastDispatchedEmail && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Welcome Email & Credentials Dispatched
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              STATUS: DELIVERED TO INBOX
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
            <div>
              <span className="text-slate-400 block text-[10px]">Recipient Email:</span>
              <strong className="text-slate-100 font-mono">{lastDispatchedEmail.recipient_email}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Temporary Password Sent:</span>
              <strong className="text-amber-300 font-mono flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-400" /> {lastDispatchedEmail.temporary_password}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Invoice / Tier:</span>
              <strong className="text-sky-300">{lastDispatchedEmail.tier_activated} ({lastDispatchedEmail.invoice_id})</strong>
            </div>
          </div>
        </div>
      )}

      {/* Students Management Table Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, email, UTR / ref..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-slate-950 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto">
            {(['ALL', 'PENDING', 'APPROVED', 'FREE_TRIAL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab === 'ALL' && 'All Students'}
                {tab === 'PENDING' && 'Pending Verification'}
                {tab === 'APPROVED' && 'Approved Pro'}
                {tab === 'FREE_TRIAL' && 'Free Trials'}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Branch & Year</th>
                <th className="py-3 px-4">Plan & Payment Reference</th>
                <th className="py-3 px-4">Pass Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPending = u.payment_status === 'PENDING_APPROVAL';
                  const isPro = u.subscription_tier === 'PRO_MONTHLY' || u.subscription_tier === 'ANNUAL_PASS';
                  const isBusy = processingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{u.name || 'Unnamed Student'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{u.branch || u.degree_major || 'Computer Science'}</div>
                        <div className="text-[10px] text-slate-400">{u.current_year || u.standard_class || '3rd Year'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {u.subscription_tier === 'PRO_MONTHLY' ? 'Pro Monthly (₹299)' :
                           u.subscription_tier === 'ANNUAL_PASS' ? 'Annual Pass (₹1,999)' : '10 Free Passes'}
                        </div>
                        {u.payment_reference ? (
                          <div className="text-[10px] text-amber-300 font-mono flex items-center gap-1 mt-0.5">
                            <span>Ref: {u.payment_reference}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">Free registration</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-200">
                          {isPro ? 'Unlimited' : `${u.credits_balance} passes`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> PENDING VERIFICATION
                          </span>
                        ) : isPro ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> PAID & APPROVED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit">
                            FREE TRIAL ACTIVE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Verify payment and dispatch credentials email"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isBusy ? 'Approving...' : 'Approve & Send Email'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTopup(u.id)}
                              disabled={isBusy}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Add 10 passes"
                            >
                              <PlusCircle className="w-3 h-3 text-sky-400" />
                              <span>+10 Passes</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
