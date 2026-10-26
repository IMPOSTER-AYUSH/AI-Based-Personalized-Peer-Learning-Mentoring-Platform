import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import './ProgressPage.css';
import {
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Target,
  Zap,
  BookOpen,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid,
} from 'recharts';

export const ProgressPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalSkill, setNewGoalSkill] = useState('');
  const [newGoalTasks, setNewGoalTasks] = useState('');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const [goalsRes, summaryRes] = await Promise.allSettled([
          API.get('/goals'),
          API.get('/ai/summary'),
        ]);

        if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.data.goals || []);
        if (summaryRes.status === 'fulfilled') setWeeklySummary(summaryRes.value.data.summary || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  const handleToggleTask = async (goalId, taskIndex) => {
    const goal = goals.find((g) => g._id === goalId);
    if (!goal) return;

    const updatedTasks = [...goal.tasks];
    updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

    try {
      const res = await API.put(`/goals/${goalId}`, { tasks: updatedTasks });
      setGoals(goals.map((g) => (g._id === goalId ? res.data.goal : g)));
      toast.success('Task progress updated!');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalSkill) return;

    const tasksArray = newGoalTasks
      .split('\n')
      .filter((t) => t.trim().length > 0)
      .map((title) => ({ title: title.trim(), completed: false }));

    try {
      const res = await API.post('/goals', {
        title: newGoalTitle,
        skill: newGoalSkill,
        tasks: tasksArray.length > 0 ? tasksArray : [{ title: 'Initial milestone', completed: false }],
        xpReward: 150,
      });
      setGoals([res.data.goal, ...goals]);
      toast.success('New learning goal created!');
      setShowGoalModal(false);
      setNewGoalTitle('');
      setNewGoalSkill('');
      setNewGoalTasks('');
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  // Gamification master tiers
  const tiers = [
    { name: 'Beginner', minXp: 0, icon: '🌱' },
    { name: 'Explorer', minXp: 500, icon: '🧭' },
    { name: 'Mentor', minXp: 1500, icon: '💡' },
    { name: 'Expert', minXp: 3000, icon: '🏆' },
    { name: 'Master', minXp: 5000, icon: '👑' },
  ];

  const currentXp = user?.xp || 0;
  const currentTier = tiers.slice().reverse().find((t) => currentXp >= t.minXp) || tiers[0];

  const monthlyActivity = [
    { week: 'W1', learning: 4, teaching: 6 },
    { week: 'W2', learning: 6, teaching: 5 },
    { week: 'W3', learning: 8, teaching: 7 },
    { week: 'W4', learning: 5, teaching: 9 },
  ];

  const skillRadarData = [
    { skill: 'React', score: 90 },
    { skill: 'Spanish', score: 65 },
    { skill: 'Guitar', score: 45 },
    { skill: 'UI/UX', score: 70 },
    { skill: 'Mentoring', score: 85 },
  ];

  const allBadgesList = [
    { name: 'First Swap', desc: 'Completed 1 peer session', icon: '🎯', unlocked: true },
    { name: 'Knowledge Sharer', desc: 'Taught 5 peer sessions', icon: '💡', unlocked: true },
    { name: 'Curious Mind', desc: 'Learned 3 distinct skills', icon: '🧠', unlocked: true },
    { name: 'Master Mentor', desc: 'Maintained 4.9+ rating across 10 sessions', icon: '🏆', unlocked: currentXp > 2000 },
    { name: 'Community Pillar', desc: 'Helped 20+ members in forum', icon: '🌟', unlocked: currentXp > 3000 },
    { name: 'Polymath', desc: 'Reached Level 10 and exchanged 100 SP', icon: '👑', unlocked: currentXp > 4500 },
  ];

  return (
    <>
      <Helmet>
        <title>Progress & Gamification | Connect Skill</title>
      </Helmet>

      <div className="prog-page-outer">
        <div className="prog-container">

          {/* 1. Tier Banner - Deep Navy Surface with XP Progression */}
          <div className="prog-tier-banner">
            <div className="space-y-2">
              <div className="prog-tier-badge">
                <span>{currentTier.icon}</span>
                <span>{currentTier.name} Tier</span>
              </div>
              <h1 className="prog-tier-title">
                Level {user?.level || 1} Polymath Journey
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                Earn XP by hosting peer sessions and achieving learning milestones. Progress unlocks higher skill tiers and exclusive community mentor privileges.
              </p>
            </div>

            <div className="prog-xp-widget">
              <span className="text-3xl font-extrabold text-white">{currentXp}</span>
              <span className="text-xs text-slate-400 block font-medium mt-0.5">Total Lifetime XP</span>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((currentXp % 500) / 5, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-purple-300 mt-1.5 block font-semibold">
                {500 - (currentXp % 500)} XP to Level {(user?.level || 1) + 1}
              </span>
            </div>
          </div>

          {/* 2. Groq AI Weekly Learning Summary (Featured Card) */}
          {weeklySummary && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    AI Weekly Growth Summary
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    Llama-3.3 70B
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{weeklySummary}</p>
              </div>
            </div>
          )}

          {/* 3. Four Gamified Metric Cards (Matching Finnova White Cards) */}
          <div className="prog-quad-grid">
            <div className="prog-metric-card">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Learning Hours</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="font-['Outfit'] text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.learningHours || 18} hrs
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                {user?.sessionsCompleted || 12} sessions completed
              </p>
            </div>

            <div className="prog-metric-card">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Teaching Hours</span>
                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="font-['Outfit'] text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.teachingHours || 24} hrs
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                {user?.sessionsHosted || 15} sessions hosted
              </p>
            </div>

            <div className="prog-metric-card">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Verified Rating</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <p className="font-['Outfit'] text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.rating || 4.9} ★
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                From {user?.reviewCount || 14} peer reviews
              </p>
            </div>

            <div className="prog-metric-card">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">Skill Points</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="font-['Outfit'] text-2xl font-extrabold text-slate-900 dark:text-white">
                {user?.skillPoints || 180} SP
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Liquid peer exchange credit
              </p>
            </div>
          </div>

          {/* 4. Analytics Section: Learning vs Teaching Activity & Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Monthly BarChart */}
            <div className="lg:col-span-7 prog-section-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="prog-section-h2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span>Monthly Activity Volume</span>
                </h2>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>Learning</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Teaching</span>
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        background: '#131424',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="learning" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="teaching" fill="#5b47fb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Competency Radar Chart */}
            <div className="lg:col-span-5 prog-section-card space-y-4">
              <h2 className="prog-section-h2">
                <Zap className="w-5 h-5 text-cyan-500" />
                <span>Skill Mastery Radar</span>
              </h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillRadarData}>
                    <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                    <PolarAngleAxis dataKey="skill" stroke="#94a3b8" fontSize={11} />
                    <Radar name="Proficiency" dataKey="score" stroke="#5b47fb" fill="#5b47fb" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. Active Goals & Micro-Milestones */}
          <div className="prog-section-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="prog-section-h2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <span>Active Learning Goals &amp; Milestones</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check off daily milestones to earn bonus XP rewards
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Target className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No learning goals set yet. Create one to stay on track!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const completedCount = goal.tasks?.filter((t) => t.completed).length || 0;
                  const totalCount = goal.tasks?.length || 1;
                  const pct = Math.round((completedCount / totalCount) * 100);

                  return (
                    <div
                      key={goal._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {goal.skill}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                            {goal.title}
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          {pct}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {goal.tasks?.map((task, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleTask(goal._id, idx)}
                            className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:opacity-80"
                          >
                            <input
                              type="checkbox"
                              readOnly
                              checked={task.completed}
                              className="rounded text-brand-500 focus:ring-brand-500"
                            />
                            <span className={task.completed ? 'line-through text-slate-400' : ''}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Achievement Badges & Milestones Showcase */}
          <div className="prog-section-card space-y-4">
            <h2 className="prog-section-h2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Achievement Badges &amp; Trophy Showcase</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {allBadgesList.map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl text-center space-y-2 border transition-all ${
                    badge.unlocked
                      ? 'bg-amber-500/10 border-amber-500/25 shadow-sm'
                      : 'bg-slate-100/60 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-3xl">{badge.icon}</div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {badge.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {badge.desc}
                  </p>
                  <span
                    className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      badge.unlocked
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Goal Modal */}
          {showGoalModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Add Learning Goal
                </h3>
                <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Goal Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master React Query and Caching"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Skill Domain
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React & Next.js"
                      value={newGoalSkill}
                      onChange={(e) => setNewGoalSkill(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Milestones (One per line)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Read documentation on useQuery&#10;Implement pagination&#10;Refactor API layer"
                      value={newGoalTasks}
                      onChange={(e) => setNewGoalTasks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowGoalModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
                    >
                      Create Goal (+150 XP)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ProgressPage;
