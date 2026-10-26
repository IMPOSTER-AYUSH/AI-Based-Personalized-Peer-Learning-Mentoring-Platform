import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';
import './CalendarPage.css';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  Plus,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CalendarPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    skill: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:00',
    participantId: '',
  });

  const [peers, setPeers] = useState([]);

  const fetchSessions = async () => {
    try {
      const res = await API.get('/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Fetch peers for scheduling
    const fetchPeers = async () => {
      try {
        const res = await API.get('/matches/connections');
        const acceptedPeers = (res.data.connections || [])
          .filter((c) => c.status === 'accepted')
          .map((c) => (c.requester._id === user._id ? c.recipient : c.requester));
        setPeers(acceptedPeers);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPeers();
  }, [user._id]);

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await API.put(`/sessions/${sessionId}`, { status });
      toast.success(`Session ${status}!`);
      fetchSessions();
    } catch (err) {
      toast.error('Failed to update session');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionData.participantId) {
      toast.error('Please select a learning partner');
      return;
    }

    try {
      await API.post('/sessions', {
        ...newSessionData,
        duration: 60,
        spCost: 10,
      });
      toast.success('Session scheduled successfully!');
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error booking session');
    }
  };

  // Google Calendar Link generator
  const getGoogleCalendarUrl = (session) => {
    const title = encodeURIComponent(`Connect Skill: ${session.title} (${session.skill})`);
    const details = encodeURIComponent(
      `Join live video room: ${window.location.origin}/video-room/${session.roomId}\nSkill: ${session.skill}\nConnect Skill Peer Mentoring Session`
    );
    const dateStr = new Date(session.date).toISOString().split('T')[0].replace(/-/g, '');
    const startStr = session.startTime.replace(':', '') + '00';
    const endStr = session.endTime.replace(':', '') + '00';
    const dates = `${dateStr}T${startStr}/${dateStr}T${endStr}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  // .ics Download generator
  const downloadIcs = (session) => {
    const title = `Connect Skill: ${session.title}`;
    const dateStr = new Date(session.date).toISOString().split('T')[0].replace(/-/g, '');
    const start = `${dateStr}T${session.startTime.replace(':', '')}00`;
    const end = `${dateStr}T${session.endTime.replace(':', '')}00`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Connect Skill Inc//Peer Learning//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:Connect Skill Live Video Session: ${session.skill}. Room: ${window.location.origin}/video-room/${session.roomId}
DTSTART:${start}
DTEND:${end}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Connect Skill-${session._id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  return (
    <>
      <Helmet>
        <title>Calendar & Schedule | Connect Skill</title>
      </Helmet>

      <div className="cal-page-outer">
        <div className="cal-container">

          {/* 1. Top Header Bar */}
          <div className="cal-top-bar">
            <div>
              <h1 className="cal-heading-h1">
                <CalendarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <span>Session Calendar &amp; <span className="cal-title-grad">Availability</span></span>
              </h1>
              <p className="cal-subtext">
                Manage upcoming peer exchanges, sync with Google Calendar, and host live sessions.
              </p>
            </div>

            <div className="cal-actions-right">
              {/* View Mode Switcher */}
              <div className="cal-pill-mode-group">
                {['monthly', 'weekly', 'daily'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`cal-mode-btn ${viewMode === mode ? 'active' : ''}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="cal-btn-book"
              >
                <Plus className="w-4 h-4" />
                <span>+ Book Session</span>
              </button>
            </div>
          </div>

          {/* 2. Status Filter Pill Bar */}
          <div className="cal-filter-bar">
            {[
              { label: 'All Sessions', value: 'all' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Cancelled', value: 'cancelled' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`cal-status-pill ${statusFilter === tab.value ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 3. Sessions Grid / Cards */}
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 bg-white/70 dark:bg-slate-900/60 rounded-3xl animate-pulse" />
              <div className="h-32 bg-white/70 dark:bg-slate-900/60 rounded-3xl animate-pulse" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No sessions found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Book a peer mentoring session with a connected partner or explore other filter tabs.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule a Session</span>
              </button>
            </div>
          ) : (
            <div className="cal-grid">
              {filteredSessions.map((session) => {
                const isHost = session.host?._id === user?._id;
                const peer = isHost ? session.participant : session.host;
                const sessionDate = new Date(session.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={session._id} className="cal-session-card">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            session.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : session.status === 'completed'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : session.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {session.spCost || 10} SP
                        </span>
                      </div>

                      <div className="flex items-start space-x-3.5">
                        <Avatar src={peer?.avatar} name={peer?.name} size="md" />
                        <div className="flex-1 truncate">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                            {session.title}
                          </h3>
                          <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                            Skill: {session.skill}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isHost ? 'You mentoring ' : 'Learning from '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {peer?.name}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <span className="flex items-center space-x-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
                          <span>{sessionDate}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-500" />
                          <span>
                            {session.startTime} - {session.endTime} ({session.duration} mins)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Actions & Calendar Links */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {session.status === 'confirmed' && (
                          <Link
                            to={`/video-room/${session.roomId || session._id}`}
                            className="cal-join-btn-prominent"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Call</span>
                          </Link>
                        )}

                        {session.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(session._id, 'completed')}
                            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1"
                            title="Mark Completed"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Complete</span>
                          </button>
                        )}

                        {session.status !== 'cancelled' && session.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(session._id, 'cancelled')}
                            className="px-3 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-bold text-xs"
                            title="Cancel session"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Cal Sync icons */}
                      <div className="flex items-center space-x-1.5 text-xs">
                        <a
                          href={getGoogleCalendarUrl(session)}
                          target="_blank"
                          rel="noreferrer"
                          className="cal-sync-pill"
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Google Cal</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadIcs(session)}
                          className="cal-sync-pill"
                          title="Download .ics Calendar File"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>.ICS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Session Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Schedule a Peer Session
                </h3>
                <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Connected Peer
                    </label>
                    <select
                      required
                      value={newSessionData.participantId}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, participantId: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="">Choose a connected partner</option>
                      {peers.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.skillsTeaching?.slice(0, 2).join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Session Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Next.js Routing Architecture"
                      value={newSessionData.title}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Skill Topic
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React & Next.js"
                      value={newSessionData.skill}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, skill: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newSessionData.date}
                        onChange={(e) =>
                          setNewSessionData({ ...newSessionData, date: e.target.value })
                        }
                        className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Start
                      </label>
                      <input
                        type="time"
                        required
                        value={newSessionData.startTime}
                        onChange={(e) =>
                          setNewSessionData({ ...newSessionData, startTime: e.target.value })
                        }
                        className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        End
                      </label>
                      <input
                        type="time"
                        required
                        value={newSessionData.endTime}
                        onChange={(e) =>
                          setNewSessionData({ ...newSessionData, endTime: e.target.value })
                        }
                        className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
                    >
                      Book Session (10 SP)
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

export default CalendarPage;
