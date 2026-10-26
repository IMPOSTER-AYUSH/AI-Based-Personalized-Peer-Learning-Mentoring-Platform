import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';

export const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await API.get('/wallet');
        setWallet(res.data.wallet);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  const balance = wallet?.balance ?? user?.skillPoints ?? 100;
  const totalEarned = wallet?.totalEarned || 90;
  const totalSpent = wallet?.totalSpent || 10;
  const transactions = wallet?.transactions || [];

  return (
    <>
      <Helmet>
        <title>Wallet & Skill Points (SP) | Connect Skill</title>
      </Helmet>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Liquid Peer Learning Economy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Skill Points (SP) Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Skill Points power reciprocity on Connect Skill. Teach to earn SP, spend SP to book sessions.
          </p>
        </div>

        {/* Balance Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-850 to-brand-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Current Available Balance
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">{balance}</span>
              <span className="text-xl font-bold text-slate-400">SP</span>
            </div>
            <p className="text-xs text-slate-300">
              Equivalent to ~{Math.floor(balance / 10)} hours of 1-on-1 peer mentoring sessions.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <span className="text-xs text-emerald-300 block font-medium">Total Earned</span>
              <span className="text-xl font-bold text-white">+{totalEarned} SP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
              <span className="text-xs text-rose-300 block font-medium">Total Spent</span>
              <span className="text-xl font-bold text-white">-{totalSpent} SP</span>
            </div>
          </div>
        </div>

        {/* Ways to Earn SP Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Teach a Peer Session</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn 10-50 SP for every completed mentoring session you host.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Community Challenges</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete weekly guild sprints and challenges to claim up to 75 SP rewards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Welcome & Referrals</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every new learner receives 100 SP on registration to start trading immediately.
            </p>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Transaction Activity Ledger
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No transaction records yet.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx._id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        tx.type === 'earned' || tx.type === 'bonus'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : tx.type === 'refund'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'earned' || tx.type === 'bonus' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : tx.type === 'refund' ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'refund'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'refund' ? '+' : '-'}
                      {tx.amount} SP
                    </span>
                    <span className="text-[10px] text-slate-400 block">Balance: {tx.balance} SP</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default WalletPage;
