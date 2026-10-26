import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import './MatchesPage.css';
import {
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  UserPlus,
  Star,
  ExternalLink,
  Users,
  RotateCcw,
  MessageSquare,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const MatchesPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const fetchMatches = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (skillFilter) queryParams.append('skill', skillFilter);
      if (levelFilter) queryParams.append('level', levelFilter);

      const [matchesRes, pendingRes] = await Promise.all([
        API.get(`/matches?${queryParams.toString()}`),
        API.get('/matches/pending'),
      ]);

      setMatches(matchesRes.data.matches || []);
      setPendingRequests(pendingRes.data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [searchTerm, skillFilter, levelFilter]);

  // Real-time socket updates for connection events
  useEffect(() => {
    if (!socket) return;

    const handleConnectionEvent = () => {
      fetchMatches();
    };

    socket.on('connection:incoming_request', handleConnectionEvent);
    socket.on('connection:status_updated', handleConnectionEvent);
    socket.on('notification:new', handleConnectionEvent);

    return () => {
      socket.off('connection:incoming_request', handleConnectionEvent);
      socket.off('connection:status_updated', handleConnectionEvent);
      socket.off('notification:new', handleConnectionEvent);
    };
  }, [socket]);

  const handleSendRequest = async (recipientId, score, reason) => {
    try {
      await API.post('/matches/request', {
        recipientId,
        matchScore: score,
        aiReason: reason,
      });
      toast.success('Connection request sent!');
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request');
    }
  };

  const handleRespond = async (connectionId, status) => {
    try {
      const res = await API.post('/matches/respond', { connectionId, status });
      toast.success(status === 'accepted' ? 'Connection accepted! You can now chat.' : 'Request declined');
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSkillFilter('');
    setLevelFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || skillFilter || levelFilter);

  return (
    <>
      <Helmet>
        <title>Peer Matches | Connect Skill</title>
      </Helmet>

      <div className="matches-page-outer">
        <div className="matches-container">

          {/* 1. Header Section */}
          <div className="matches-header-box">
            <h1 className="matches-title">
              Peer Compatibility <span className="matches-title-grad">Matches</span>
            </h1>
            <p className="matches-sub">
              Discover verified members whose teaching skills complement your learning goals.
            </p>
          </div>

          {/* 2. Pending Match Requests (if any) */}
          {pendingRequests.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Match Requests Awaiting Your Response ({pendingRequests.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Avatar src={req.requester?.avatar} name={req.requester?.name} size="md" />
                      <div className="truncate">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {req.requester?.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          Teaches: {req.requester?.skillsTeaching?.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleRespond(req._id, 'accepted')}
                        className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-transform hover:scale-105"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, 'rejected')}
                        className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 shadow-sm transition-transform hover:scale-105"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Search and Functional Filters Card */}
          <div className="matches-filter-card">
            <div className="matches-search-wrap">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by peer name, skill, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="matches-search-input"
              />
            </div>

            <div className="matches-select-group">
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="matches-dropdown"
              >
                <option value="">All Skills</option>
                <option value="React">React &amp; Next.js</option>
                <option value="Python">Python &amp; AI</option>
                <option value="Design">UI/UX Design</option>
                <option value="Guitar">Acoustic Guitar</option>
                <option value="Spanish">Spanish</option>
                <option value="Baking">Sourdough &amp; Baking</option>
                <option value="Calisthenics">Calisthenics</option>
                <option value="Marketing">Growth Marketing</option>
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="matches-dropdown"
              >
                <option value="">All Experience Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Matches Grid */}
          {loading ? (
            <div className="matches-grid">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No matching peers found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search criteria or resetting filters to discover more peers.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-all shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map(({ user: peer, matchScore, aiReason, connectionStatus, connectionId }) => (
                <div key={peer._id} className="match-card">
                  <div className="space-y-3.5">
                    {/* Top Row: Compatibility Badge & Connection Status / Rating */}
                    <div className="match-card-top">
                      <div className="flex items-center gap-2">
                        <span className="match-score-pill">
                          <Sparkles className="w-3 h-3" />
                          <span>{matchScore}% Match</span>
                        </span>
                        {connectionStatus === 'accepted' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{peer.rating ? peer.rating.toFixed(1) : '5.0'}</span>
                        <span className="text-slate-400 text-[10px]">({peer.reviewCount || 10})</span>
                      </div>
                    </div>

                    {/* Peer Avatar & Identity */}
                    <div className="match-peer-info">
                      <Avatar src={peer.avatar} name={peer.name} size="lg" />
                      <div>
                        <h3 className="match-peer-name">{peer.name || 'Connect Skill Learner'}</h3>
                        <p className="match-peer-tier">
                          {peer.experienceLevel || 'Beginner'} Tier &bull; Lvl {peer.level || 1}
                        </p>
                      </div>
                    </div>

                    {/* AI Match Explanation */}
                    <div className="match-ai-reason">
                      &ldquo;{aiReason}&rdquo;
                    </div>

                    {/* Skills Teaching & Learning */}
                    <div className="match-skills-section">
                      <div>
                        <span className="match-skills-heading text-emerald-700 dark:text-emerald-400 block">
                          Can Teach You:
                        </span>
                        <div className="match-skills-tags">
                          {peer.skillsTeaching && peer.skillsTeaching.length > 0 ? (
                            peer.skillsTeaching.map((s) => (
                              <span key={s} className="match-tag-teach">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">None listed yet</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="match-skills-heading text-indigo-700 dark:text-indigo-400 block">
                          Wants to Learn:
                        </span>
                        <div className="match-skills-tags">
                          {peer.skillsLearning && peer.skillsLearning.length > 0 ? (
                            peer.skillsLearning.map((s) => (
                              <span key={s} className="match-tag-learn">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">None listed yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="match-actions-row">
                    <Link to={`/profile/${peer._id}`} className="btn-profile-secondary">
                      View Profile
                    </Link>

                    {connectionStatus === 'accepted' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/chat?userId=${peer._id}`)}
                        className="btn-connect-primary !bg-emerald-600 hover:!bg-emerald-700"
                        title="Send message to connected peer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    ) : connectionStatus === 'pending_sent' ? (
                      <button
                        type="button"
                        disabled
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 cursor-default"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Request Sent</span>
                      </button>
                    ) : connectionStatus === 'pending_received' ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRespond(connectionId, 'accepted')}
                          className="flex-1 py-1.5 px-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-105"
                          title="Accept connection"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(connectionId, 'rejected')}
                          className="py-1.5 px-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 text-xs font-bold transition-transform hover:scale-105"
                          title="Decline request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(peer._id, matchScore, aiReason)}
                        className="btn-connect-primary"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default MatchesPage;
