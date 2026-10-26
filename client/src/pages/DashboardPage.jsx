import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import { PageSkeleton } from '../components/common/LoadingSkeleton';
import './DashboardPage.css';
import {
  Sparkles,
  Video,
  Award,
  Calendar,
  MessageSquare,
  TrendingUp,
  Coins,
  Lightbulb,
  Clock,
  ChevronRight,
  Target,
  Users,
  BarChart2,
  Trophy,
  Copy,
  Check,
  Flame,
  ArrowUpRight,
  Star,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyTip, setDailyTip] = useState('');
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [aiMatches, setAiMatches] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [progressStats, setProgressStats] = useState(null);
  const [copiedTip, setCopiedTip] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tipRes, sessionsRes, matchesRes, convRes, statsRes] = await Promise.allSettled([
          API.get('/ai/tip'),
          API.get('/sessions?status=confirmed'),
          API.get('/matches'),
          API.get('/chat/conversations'),
          API.get('/goals/overview/stats'),
        ]);

        if (tipRes.status === 'fulfilled') setDailyTip(tipRes.value.data.tip);
        if (sessionsRes.status === 'fulfilled') setUpcomingSessions(sessionsRes.value.data.sessions || []);
        if (matchesRes.status === 'fulfilled') setAiMatches((matchesRes.value.data.matches || []).slice(0, 3));
        if (convRes.status === 'fulfilled') setRecentConversations((convRes.value.data.conversations || []).slice(0, 4));
        if (statsRes.status === 'fulfilled') setProgressStats(statsRes.value.data.progress || null);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCopyTip = () => {
    if (!dailyTip) return;
    navigator.clipboard.writeText(dailyTip);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  const activityData = [
    { day: 'Mon', Learning: 1.5, Teaching: 0.5 },
    { day: 'Tue', Learning: 2.0, Teaching: 1.0 },
    { day: 'Wed', Learning: 0.5, Teaching: 0.0 },
    { day: 'Thu', Learning: 3.0, Teaching: 1.5 },
    { day: 'Fri', Learning: 1.0, Teaching: 0.5 },
    { day: 'Sat', Learning: 2.5, Teaching: 2.0 },
    { day: 'Sun', Learning: 2.0, Teaching: 0.8 },
  ];

  const goals = progressStats?.goals || [];

  if (loading) return <PageSkeleton />;

  // Custom Dark Chart Tooltip inside the Dark Workspace
  const DarkChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="db-dark-chart-tooltip">
        <div className="db-tooltip-head">{label}</div>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="db-tooltip-line">
            <span style={{ color: entry.color, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: entry.color }} />
              {entry.dataKey}:
            </span>
            <strong>{entry.value} hrs</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Connect Skill</title>
      </Helmet>

      {/* Full-width canvas with soft lavender / cool-toned background */}
      <div className="db-outer-page">
        <div className="db-inner-container">

          {/* 1. Header Section */}
          <header className="db-top-bar">
            <div className="db-heading-group">
              <h1 className="db-page-title">
                Welcome back,{' '}
                <span className="db-title-gradient">{user?.name || 'Demo User'}</span>
              </h1>
              <p className="db-page-sub">
                Manage and track all your peer exchanges and learning goals in one place.
              </p>
            </div>

            <div className="db-action-buttons">
              <Link to="/calendar" className="db-pill-btn-secondary">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Schedule Session</span>
              </Link>
              <Link to="/matches" className="db-pill-btn-primary">
                <Sparkles className="w-4 h-4" />
                <span>+ Find Matches</span>
              </Link>
            </div>
          </header>

          {/* 3. Four Premium Metric Cards (Inspired by Reference's 4 White Cards) */}
          <section className="db-metrics-quad" aria-label="Key Performance Metrics">
            {/* Card 1: Skill Points */}
            <div className="db-metric-surface">
              <div>
                <div className="db-metric-top-row">
                  <span className="db-metric-title-label">Skill Points</span>
                  <div className="db-metric-icon-circle db-circle-red">
                    <Coins />
                  </div>
                </div>
                <div className="db-metric-figure-row">
                  <span className="db-metric-huge-number">{user?.skillPoints ?? 100}</span>
                  <span className="db-metric-unit-tag">SP</span>
                </div>
              </div>
              <div className="db-trend-sub">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>&uarr; +40 SP earned this week</span>
              </div>
            </div>

            {/* Card 2: Level & XP with 7 Mini Activity Bars */}
            <div className="db-metric-surface">
              <div>
                <div className="db-metric-top-row">
                  <span className="db-metric-title-label">Level &amp; XP</span>
                  <div className="db-metric-icon-circle db-circle-purple">
                    <Award />
                  </div>
                </div>
                <div className="db-metric-figure-row">
                  <span className="db-metric-huge-number">Lvl {user?.level ?? 1}</span>
                  <span className="db-metric-unit-tag">({user?.xp ?? 0} XP)</span>
                </div>
              </div>

              {/* 7 Vertical Tubes (Matching Reference Card 2) */}
              <div className="db-mini-bars-wrap">
                {activityData.map((d, idx) => (
                  <div key={idx} className="db-bar-column">
                    <div className="db-bar-tube">
                      <div
                        className="db-bar-fill-lvl"
                        style={{ height: `${Math.max(20, Math.min(100, (d.Learning / 3) * 100))}%` }}
                      />
                    </div>
                    <span className="db-bar-weekday">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Learning Hours with Mini Sparkline Curve */}
            <div className="db-metric-surface">
              <div>
                <div className="db-metric-top-row">
                  <span className="db-metric-title-label">Learning Hours</span>
                  <div className="db-metric-icon-circle db-circle-cyan">
                    <Clock />
                  </div>
                </div>
                <div className="db-metric-figure-row">
                  <span className="db-metric-huge-number">{user?.learningHours ?? 0}</span>
                  <span className="db-metric-unit-tag">days</span>
                </div>
              </div>

              {/* Mini Sparkline Line (Matching Reference Card 3) */}
              <div className="db-sparkline-wrap">
                <svg className="db-sparkline-svg" viewBox="0 0 120 32" preserveAspectRatio="none">
                  <path
                    d="M 5 26 Q 25 22 40 18 T 75 14 T 100 8 T 115 4"
                    fill="none"
                    stroke="#5b47fb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="15" cy="24" r="2.5" fill="#5b47fb" />
                  <circle cx="40" cy="18" r="2.5" fill="#5b47fb" />
                  <circle cx="75" cy="14" r="2.5" fill="#5b47fb" />
                  <circle cx="100" cy="8" r="2.5" fill="#5b47fb" />
                  <circle cx="115" cy="4" r="3.5" fill="#5b47fb" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Card 4: Teaching Hours with Sub Status Pills */}
            <div className="db-metric-surface">
              <div>
                <div className="db-metric-top-row">
                  <span className="db-metric-title-label">Teaching Hours</span>
                  <div className="db-metric-icon-circle db-circle-green">
                    <TrendingUp />
                  </div>
                </div>
                <div className="db-metric-figure-row">
                  <span className="db-metric-huge-number">{user?.teachingHours ?? 0}</span>
                  <span className="db-metric-unit-tag">hrs</span>
                </div>
              </div>

              {/* Quick status tags (Matching Reference Card 4) */}
              <div className="db-quick-tags-row">
                <span className="db-mini-tag-pill active">
                  Hosted: {user?.sessionsHosted ?? 0}
                </span>
                <span className="db-mini-tag-pill">
                  Sessions: {user?.sessionsCompleted ?? 0}
                </span>
              </div>
            </div>
          </section>

          {/* 4. THE CENTERPIECE: Large Rounded Deep Navy Workspace (Reference Dark Panel) */}
          <section className="db-dark-workspace" aria-label="Learning Activity & Collaboration Workspace">
            {/* Header bar with pill tabs */}
            <div className="db-workspace-header">
              <div className="db-workspace-title-box">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="db-workspace-main-title">Learning Activity &amp; Live Chats</h2>
              </div>

              <div className="db-workspace-pill-nav">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`db-nav-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
                >
                  All Activity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learning')}
                  className={`db-nav-pill-btn ${activeTab === 'learning' ? 'active' : ''}`}
                >
                  Learning
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('teaching')}
                  className={`db-nav-pill-btn ${activeTab === 'teaching' ? 'active' : ''}`}
                >
                  Teaching
                </button>
              </div>
            </div>

            {/* Two balanced columns inside the dark navy workspace */}
            <div className="db-workspace-grid">

              {/* Left Column: Weekly Learning & Teaching Activity Chart */}
              <div className="db-chart-panel">
                <div className="db-chart-top-meta">
                  <div>
                    <h3 className="text-sm font-bold text-white">Weekly Hours Invested</h3>
                    <p className="db-chart-subhead">Hours dedicated to peer exchange across the last 7 days</p>
                  </div>
                  <div className="db-chart-legend-row">
                    <div className="db-chart-legend-bullet">
                      <span className="db-chart-dot-teal" />
                      <span>Learning</span>
                    </div>
                    <div className="db-chart-legend-bullet">
                      <span className="db-chart-dot-purple" />
                      <span>Teaching</span>
                    </div>
                  </div>
                </div>

                <div className="db-chart-recharts-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activityData}
                      margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="dbTealGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="dbVioletGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<DarkChartTip />} />
                      <Area
                        type="monotone"
                        dataKey="Learning"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#dbTealGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#06b6d4', stroke: '#131424', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Teaching"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#dbVioletGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#131424', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Recent Chats (matching the reference list panel) */}
              <div className="db-chats-panel">
                <div>
                  <div className="db-chats-panel-head">
                    <h3 className="db-chats-panel-title">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>Recent Chats</span>
                    </h3>
                    <Link to="/chat" className="db-chat-open-btn">
                      <span>Open Chat</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {recentConversations.length === 0 ? (
                    <div className="db-dark-empty-box">
                      <div className="db-dark-empty-circle">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h4 className="db-dark-empty-title">No Active Chats</h4>
                      <p className="db-dark-empty-sub">
                        Connect with peers to exchange messages and plan sessions.
                      </p>
                      <Link to="/chat" className="db-dark-empty-btn">
                        <span>Start a Chat</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="db-chats-list">
                      {recentConversations.map((conv, idx) => {
                        const other = conv.participants?.find((p) => p._id !== user?._id);
                        const ts = conv.lastMessage?.createdAt;
                        const fmtTime = ts
                          ? (() => {
                              const d = new Date(ts);
                              const diff = Date.now() - d;
                              if (diff < 60000) return 'Just now';
                              if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
                              if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
                              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            })()
                          : '';

                        return (
                          <Link
                            key={conv._id}
                            to="/chat"
                            className={`db-dark-chat-row ${idx === 0 ? 'highlighted' : ''}`}
                          >
                            <Avatar src={other?.avatar} name={other?.name} size="sm" />
                            <div className="db-chat-info-col">
                              <div className="db-chat-row-top">
                                <span className="db-chat-user-name">{other?.name || 'Peer'}</span>
                                <span className="db-chat-time-tag">{fmtTime}</span>
                              </div>
                              <p className="db-chat-last-msg">
                                {conv.lastMessage?.content || 'Click to send message'}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-slate-400">
                    Encrypted 1-on-1 peer communications
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Lower Section: Two Symmetrical Balanced Columns with Matched Row Alignment */}
          <div className="db-lower-grid">

            {/* Upcoming Learning Sessions Card */}
            <div className="db-card-white db-card-sessions">
              <div className="db-section-header-row">
                <div className="db-section-title-wrap">
                  <div className="db-section-icon-cube bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
                    <Calendar />
                  </div>
                  <div>
                    <h2 className="db-section-h2">Upcoming Learning Sessions</h2>
                    <p className="db-section-desc">Confirmed 1-on-1 scheduled sessions</p>
                  </div>
                </div>
                <Link to="/calendar" className="db-link-pill-action">
                  <span>View Calendar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="db-light-empty-state">
                  <div className="db-light-empty-circle bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <Calendar />
                  </div>
                  <h3 className="db-light-empty-head">No Upcoming Sessions</h3>
                  <p className="db-light-empty-para">
                    Schedule a peer learning session to practice together in real-time.
                  </p>
                  <Link to="/calendar" className="db-light-empty-btn">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Schedule a Session</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingSessions.map((session) => {
                    const peer =
                      session.host?._id === user?._id ? session.participant : session.host;
                    const isHosting = session.host?._id === user?._id;
                    return (
                      <div key={session._id} className="db-session-card-row">
                        <div className="db-session-details-group">
                          <Avatar src={peer?.avatar} name={peer?.name} size="md" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="db-session-item-title">{session.title}</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isHosting
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                }`}
                              >
                                {isHosting ? 'You Teaching' : 'You Learning'}
                              </span>
                            </div>
                            <p className="db-session-item-timing">
                              with {peer?.name} &bull; {session.startTime} &ndash; {session.endTime} ({session.duration}m)
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/video-room/${session.roomId || session._id}`}
                          className="db-session-join-pill"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Call</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top AI Match Suggestions */}
            <div className="db-card-white db-card-matches">
              <div className="db-section-header-row">
                <div className="db-section-title-wrap">
                  <div className="db-section-icon-cube bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                    <Sparkles />
                  </div>
                  <div>
                    <h2 className="db-section-h2">Top AI Match Suggestions</h2>
                    <p className="db-section-desc">Personalized peers based on your skills and targets</p>
                  </div>
                </div>
                <Link to="/matches" className="db-link-pill-action">
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {aiMatches.length === 0 ? (
                <div className="db-light-empty-state">
                  <div className="db-light-empty-circle bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Users />
                  </div>
                  <h3 className="db-light-empty-head">Discovering Best Matches</h3>
                  <p className="db-light-empty-para">
                    Complete your profile skills to unlock high-accuracy peer matches.
                  </p>
                  <Link to="/matches" className="db-light-empty-btn">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Explore Peer Matches</span>
                  </Link>
                </div>
              ) : (
                <div className="db-matches-triple-grid">
                  {aiMatches.map((m) => (
                    <div key={m.user._id} className="db-match-panel-box">
                      <div className="db-match-tag-bar">
                        <span className="db-match-pct-pill">{m.matchScore}% Match</span>
                        <span className="db-match-rating-tag">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{m.user.rating ? m.user.rating.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>

                      <div className="db-match-peer-row">
                        <Avatar src={m.user.avatar} name={m.user.name} size="sm" />
                        <div className="db-match-peer-col">
                          <h4 className="db-match-peer-name">{m.user.name}</h4>
                          <p className="db-match-peer-teaches">
                            Teaches: {m.user.skillsTeaching?.slice(0, 2).join(', ') || 'Skills'}
                          </p>
                        </div>
                      </div>

                      <p className="db-match-ai-quote">&ldquo;{m.aiReason}&rdquo;</p>

                      <Link to="/matches" className="db-match-action-btn">
                        Connect with {m.user.name.split(' ')[0]}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earned Badges Widget */}
            <div className="db-card-white db-card-badges">
              <div className="db-section-header-row">
                <div className="db-section-title-wrap">
                  <div className="db-section-icon-cube bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <Trophy />
                  </div>
                  <div>
                    <h2 className="db-section-h2">Earned Badges</h2>
                    <p className="db-section-desc">Milestones and peer achievements</p>
                  </div>
                </div>
                <Link to="/progress" className="db-link-pill-action">
                  <span>All Badges</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {user?.badges?.length > 0 ? (
                <div className="db-badges-trio">
                  {user.badges.slice(0, 6).map((badge) => (
                    <div key={badge._id || badge.name} className="db-badge-bubble">
                      <span className="text-2xl">{badge.icon || '🏅'}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                        {badge.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div className="db-badge-roadmap-tile">
                      <span className="text-xl">🎯</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">First Session</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">1 session</span>
                    </div>
                    <div className="db-badge-roadmap-tile">
                      <span className="text-xl">🤝</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Skill Sharer</span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Host 1st</span>
                    </div>
                    <div className="db-badge-roadmap-tile">
                      <span className="text-xl">⭐</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Top Peer</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">5.0 Rating</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Complete your first peer session to unlock achievement badges and earn bonus SP!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Active Goals Widget */}
            <div className="db-card-white db-card-goals">
              <div className="db-section-header-row">
                <div className="db-section-title-wrap">
                  <div className="db-section-icon-cube bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <Target />
                  </div>
                  <div>
                    <h2 className="db-section-h2">Active Goals</h2>
                    <p className="db-section-desc">Skill targets &amp; mastery roadmap</p>
                  </div>
                </div>
                <Link to="/progress" className="db-link-pill-action">
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {goals.length === 0 ? (
                <div className="db-light-empty-state">
                  <div className="db-light-empty-circle bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Target />
                  </div>
                  <h3 className="db-light-empty-head">No Active Goals</h3>
                  <p className="db-light-empty-para">
                    Set skill targets to track milestones and measure your growth.
                  </p>
                  <Link to="/progress" className="db-light-empty-btn">
                    <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Set a Goal</span>
                  </Link>
                </div>
              ) : (
                <div className="db-goals-vertical-stack">
                  {goals.slice(0, 5).map((goal, idx) => {
                    const pct = Math.min(
                      Math.round(((goal.progress || 0) / (goal.target || 1)) * 100),
                      100
                    );
                    const barGradients = [
                      'linear-gradient(90deg, #10b981, #34d399)',
                      'linear-gradient(90deg, #6366f1, #818cf8)',
                      'linear-gradient(90deg, #a855f7, #c084fc)',
                      'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                    ];
                    const grad = barGradients[idx % barGradients.length];

                    return (
                      <div key={goal._id || idx}>
                        <div className="db-goal-top-flex">
                          <span className="db-goal-name-text">{goal.title || goal.name}</span>
                          <span className="db-goal-pct-badge">{pct}%</span>
                        </div>
                        <div className="db-goal-rail">
                          <div
                            className="db-goal-bar-filled"
                            style={{ width: `${pct}%`, background: grad }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default DashboardPage;
