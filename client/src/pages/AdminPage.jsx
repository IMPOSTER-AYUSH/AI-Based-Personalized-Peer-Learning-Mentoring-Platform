import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Users,
  Calendar,
  BookOpen,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'skills', 'sessions', 'reports', 'blogs'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Skill Modal
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Programming');
  const [skillDesc, setSkillDesc] = useState('');

  // New Blog Modal
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogData, setBlogData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Pedagogy',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    author: 'Admin',
  });

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, skillsRes, sessionsRes, reportsRes, blogsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/skills'),
        API.get('/admin/sessions'),
        API.get('/admin/reports'),
        API.get('/admin/blogs'),
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setSkills(skillsRes.data.skills || []);
      setSessions(sessionsRes.data.sessions || []);
      setReports(reportsRes.data.reports || []);
      setBlogs(blogsRes.data.blogs || []);
    } catch (err) {
      toast.error('Failed to load admin management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role changed to ${newRole}`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/ban`);
      toast.success('User has been banned');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to ban user');
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/skills', {
        name: skillName,
        category: skillCategory,
        description: skillDesc,
      });
      toast.success('Skill added to directory!');
      setShowSkillModal(false);
      setSkillName('');
      setSkillDesc('');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to create skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await API.delete(`/admin/skills/${skillId}`);
      toast.success('Skill removed');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to delete skill');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      await API.put(`/admin/reports/${reportId}`, { status });
      toast.success(`Report ${status}`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update report');
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/blogs', blogData);
      toast.success('Blog article published!');
      setShowBlogModal(false);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to publish blog');
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Operations & Moderation | Connect Skill</title>
      </Helmet>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Governance & Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Administrative Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Moderate community discussions, manage skill taxonomies, and monitor peer exchange volume.
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Members</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats?.userCount || users.length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Sessions</span>
              <Calendar className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats?.sessionCount || sessions.length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Guilds</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats?.communityCount || 6}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Open Reports</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats?.reportCount || reports.length}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'users', label: 'User Directory' },
            { id: 'skills', label: 'Skill Taxonomy' },
            { id: 'sessions', label: 'Session Monitor' },
            { id: 'reports', label: 'Moderation Reports' },
            { id: 'blogs', label: 'Blog Publications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-brand-500'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">SP Balance</th>
                  <th className="pb-3">XP</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 flex items-center space-x-3">
                      <Avatar src={u.avatar} name={u.name || u.email} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name || 'Unnamed'}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : u.role === 'banned'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">{u.skillPoints || 100} SP</td>
                    <td className="py-3 font-semibold">{u.xp || 0} XP</td>
                    <td className="py-3 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleUpdateRole(u._id, 'admin')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold hover:underline"
                        >
                          Promote
                        </button>
                      )}
                      {u.role === 'admin' && (
                        <button
                          onClick={() => handleUpdateRole(u._id, 'user')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold hover:underline"
                        >
                          Demote
                        </button>
                      )}
                      {u.role !== 'banned' && (
                        <button
                          onClick={() => handleBanUser(u._id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold hover:underline"
                        >
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Platform Skill Catalog ({skills.length})
              </h3>
              <button
                onClick={() => setShowSkillModal(true)}
                className="px-4 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                      {skill.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {skill.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{skill.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSkill(skill._id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Title & Skill</th>
                  <th className="pb-3">Mentor (Host)</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{s.title}</p>
                      <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">{s.skill}</p>
                    </td>
                    <td className="py-3">{s.host?.name || 'User'}</td>
                    <td className="py-3">{s.participant?.name || 'User'}</td>
                    <td className="py-3 text-slate-500">
                      {new Date(s.date).toLocaleDateString()} {s.startTime}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize bg-slate-100 dark:bg-slate-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Community Moderation Reports ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No open moderation reports! Platform is clean.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div key={rep._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold">Reason: {rep.reason}</p>
                      <p className="text-slate-500">{rep.description}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => handleResolveReport(rep._id, 'resolved')} className="px-3 py-1 bg-emerald-500 text-white rounded-full font-bold">Resolve</button>
                      <button onClick={() => handleResolveReport(rep._id, 'dismissed')} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full font-bold">Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BLOGS TAB */}
        {activeTab === 'blogs' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Educational Blog Management ({blogs.length})
              </h3>
              <button
                onClick={() => setShowBlogModal(true)}
                className="px-4 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {blogs.map((b) => (
                <div key={b._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">{b.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{b.excerpt}</p>
                  <p className="text-[10px] text-slate-400">By {b.author} • {b.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Skill Modal */}
        {showSkillModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Create New Skill Taxonomy</h3>
              <form onSubmit={handleCreateSkill} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">Skill Name</label>
                  <input
                    type="text"
                    required
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g. Rust Systems Programming"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Music">Music</option>
                    <option value="Languages">Languages</option>
                    <option value="Cooking">Cooking</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Writing">Writing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={skillDesc}
                    onChange={(e) => setSkillDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex space-x-2">
                  <button type="button" onClick={() => setShowSkillModal(false)} className="flex-1 py-2 rounded-xl border">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 text-white font-bold">Add Skill</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Blog Modal */}
        {showBlogModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Publish Blog Article</h3>
              <form onSubmit={handleCreateBlog} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={blogData.title}
                    onChange={(e) => setBlogData({ ...blogData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Excerpt</label>
                  <input
                    type="text"
                    required
                    value={blogData.excerpt}
                    onChange={(e) => setBlogData({ ...blogData, excerpt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Content</label>
                  <textarea
                    rows={4}
                    required
                    value={blogData.content}
                    onChange={(e) => setBlogData({ ...blogData, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex space-x-2">
                  <button type="button" onClick={() => setShowBlogModal(false)} className="flex-1 py-2 rounded-xl border">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-500 text-white font-bold">Publish Article</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default AdminPage;
