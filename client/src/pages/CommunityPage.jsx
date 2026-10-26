import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';
import './CommunityPage.css';
import {
  Globe,
  MessageSquare,
  Heart,
  Flame,
  ThumbsUp,
  Share2,
  Calendar,
  Trophy,
  Users,
  Image as ImageIcon,
  Send,
  Plus,
  CheckCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const CommunityPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'guilds', 'events', 'challenges', 'leaderboard'
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [postImage, setPostImage] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comment state
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  const fetchData = async () => {
    try {
      const [commRes, postRes, eventRes, chalRes, leadRes] = await Promise.all([
        API.get('/community'),
        API.get('/community/posts'),
        API.get('/community/events'),
        API.get('/community/challenges'),
        API.get('/community/leaderboard'),
      ]);
      setCommunities(commRes.data.communities || []);
      setPosts(postRes.data.posts || []);
      setEvents(eventRes.data.events || []);
      setChallenges(chalRes.data.challenges || []);
      setLeaderboard(leadRes.data.leaderboard || []);
      if (commRes.data.communities?.length > 0 && !selectedCommunity) {
        setSelectedCommunity(commRes.data.communities[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load community content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || !selectedCommunity) return;

    setSubmittingPost(true);
    try {
      const res = await API.post('/community/posts', {
        content: newPostContent,
        communityId: selectedCommunity,
        image: postImage,
      });
      setPosts([res.data.post, ...posts]);
      setNewPostContent('');
      setPostImage('');
      toast.success('Post published! +10 XP earned.');
    } catch (err) {
      toast.error('Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleReact = async (postId, reaction) => {
    try {
      const res = await API.post(`/community/posts/${postId}/react`, { reaction });
      setPosts(posts.map((p) => (p._id === postId ? res.data.post : p)));
    } catch (err) {
      toast.error('Reaction failed');
    }
  };

  const handleOpenComments = async (postId) => {
    if (activeCommentsPost === postId) {
      setActiveCommentsPost(null);
      return;
    }
    setActiveCommentsPost(postId);
    try {
      const res = await API.get(`/community/posts/${postId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await API.post(`/community/posts/${postId}/comments`, {
        content: commentInput,
      });
      setComments([...comments, res.data.comment]);
      setCommentInput('');
      setPosts(
        posts.map((p) => (p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
      );
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handleJoinCommunity = async (commId) => {
    try {
      const res = await API.post(`/community/${commId}/join`);
      setCommunities(communities.map((c) => (c._id === commId ? res.data.community : c)));
      toast.success('Joined community guild!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  const handleRsvp = async (eventId) => {
    try {
      const res = await API.post(`/community/events/${eventId}/rsvp`);
      setEvents(events.map((e) => (e._id === eventId ? res.data.event : e)));
      toast.success('RSVP updated!');
    } catch (err) {
      toast.error('RSVP failed');
    }
  };

  const handleJoinChallenge = async (chalId) => {
    try {
      const res = await API.post(`/community/challenges/${chalId}/join`);
      setChallenges(challenges.map((c) => (c._id === chalId ? res.data.challenge : c)));
      toast.success('Enrolled in Challenge! Good luck!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    }
  };

  return (
    <>
      <Helmet>
        <title>Community Guilds &amp; Discussions | Connect Skill</title>
      </Helmet>

      <div className="comm-page-outer">
        <div className="comm-container">

          {/* 1. Header Section */}
          <div className="comm-header-box">
            <div className="comm-guild-pill">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Knowledge Exchange Guilds</span>
            </div>
            <h1 className="comm-page-title">
              Peer Learning <span className="comm-title-grad">Community</span>
            </h1>
            <p className="comm-page-sub">
              Join guilds, share project breakthroughs, RSVP for live workshops, and compete on the leaderboard.
            </p>
          </div>

          {/* 2. Tab Switcher Bar */}
          <div className="comm-tab-bar">
            {[
              { label: 'Feed & Discussions', id: 'feed', icon: MessageSquare },
              { label: 'Skill Guilds', id: 'guilds', icon: Users },
              { label: 'Workshops & Events', id: 'events', icon: Calendar },
              { label: 'Challenges', id: 'challenges', icon: Trophy },
              { label: 'Leaderboard', id: 'leaderboard', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`comm-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: FEED & DISCUSSIONS */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Create Post + Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Create Post Card */}
                <div className="comm-white-card space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar src={user?.avatar} name={user?.name} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{user?.name}</p>
                      <select
                        value={selectedCommunity}
                        onChange={(e) => setSelectedCommunity(e.target.value)}
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-transparent focus:outline-none cursor-pointer"
                      >
                        {communities.map((c) => (
                          <option key={c._id} value={c._id} className="text-slate-900">
                            Posting in: {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Share a milestone, ask a study question, or post a resource..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter image URL for post:');
                        if (url) setPostImage(url);
                      }}
                      className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <span>{postImage ? 'Image attached' : 'Add Image'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreatePost}
                      disabled={submittingPost || !newPostContent.trim()}
                      className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingPost ? 'Posting...' : 'Publish'}</span>
                    </button>
                  </div>
                </div>

                {/* Feed Posts */}
                <div className="space-y-5">
                  {posts.map((post) => {
                    const likesCount = post.reactions?.likes?.length || 0;
                    const heartsCount = post.reactions?.hearts?.length || 0;
                    const firesCount = post.reactions?.fires?.length || 0;

                    return (
                      <div key={post._id} className="comm-white-card space-y-4">
                        {/* Author Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                {post.author?.name}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                in {post.community?.name || 'Community'} &bull;{' '}
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Attached Image */}
                        {post.image && (
                          <div className="rounded-2xl overflow-hidden max-h-96">
                            <img
                              src={post.image}
                              alt="Post attachment"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* Reactions & Comments Bar */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleReact(post._id, 'likes')}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                              <span>{likesCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReact(post._id, 'hearts')}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              <span>{heartsCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReact(post._id, 'fires')}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{firesCount}</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleOpenComments(post._id)}
                              className="flex items-center space-x-1 text-xs hover:text-brand-500 font-semibold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{post.commentCount || 0} comments</span>
                            </button>
                          </div>
                        </div>

                        {/* Comments Drawer */}
                        {activeCommentsPost === post._id && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {comments.map((c) => (
                                <div
                                  key={c._id}
                                  className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                                >
                                  <Avatar src={c.author?.avatar} name={c.author?.name} size="xs" />
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">
                                      {c.author?.name}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-400">
                                      {c.content}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <form
                              onSubmit={(e) => handleAddComment(e, post._id)}
                              className="flex space-x-2"
                            >
                              <input
                                type="text"
                                placeholder="Write a response..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="px-4 py-1.5 rounded-xl bg-brand-500 text-white font-bold text-xs"
                              >
                                Reply
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Trending Communities & Guilds */}
              <div className="space-y-5">
                <div className="comm-white-card space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Popular Skill Guilds</span>
                  </h3>
                  <div className="space-y-2.5">
                    {communities.slice(0, 5).map((comm) => (
                      <div
                        key={comm._id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="text-xl">{comm.icon}</span>
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {comm.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">{comm.memberCount} members</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinCommunity(comm._id)}
                          className="px-3 py-1 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold shadow-sm transition-all"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUILDS LIST */}
          {activeTab === 'guilds' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {communities.map((comm) => (
                <div
                  key={comm._id}
                  className="comm-white-card p-0 overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-32 overflow-hidden relative">
                    <img
                      src={comm.coverImage}
                      alt={comm.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-sm">
                      <span>{comm.icon}</span>
                      <span>{comm.category}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {comm.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{comm.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {comm.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{comm.memberCount} members</span>
                      <button
                        type="button"
                        onClick={() => handleJoinCommunity(comm._id)}
                        className="px-4 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Join Guild
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WORKSHOPS & EVENTS */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => {
                const isRsvpd = event.attendees?.includes(user?._id);
                return (
                  <div
                    key={event._id}
                    className="comm-white-card p-0 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                        {event.type}
                      </span>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                        <span>
                          ⏰ {event.startTime} - {event.endTime}
                        </span>
                        <span>👥 {event.attendees?.length || 0} Attending</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar
                            src={event.organizer?.avatar}
                            name={event.organizer?.name}
                            size="xs"
                          />
                          <span className="text-xs text-slate-500">
                            by {event.organizer?.name || 'Mentor'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRsvp(event._id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                            isRsvpd
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-brand-500 hover:bg-brand-600 text-white'
                          }`}
                        >
                          {isRsvpd ? '✓ Registered' : 'RSVP Free'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {challenges.map((chal) => (
                <div
                  key={chal._id}
                  className="comm-white-card space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        +{chal.xpReward} XP Reward
                      </span>
                      <span className="text-xs font-bold text-emerald-500">+{chal.spReward} SP</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {chal.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{chal.description}</p>

                    <div className="space-y-1.5 pt-2">
                      {chal.tasks?.map((t, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          <span>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinChallenge(chal._id)}
                    className="w-full py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md mt-4 transition-all"
                  >
                    Enroll in Challenge
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="comm-white-card p-6 sm:p-8 space-y-6">
              <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span>Connect Skill Top Mentors &amp; Polymaths</span>
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((member, idx) => (
                  <div
                    key={member._id}
                    className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className={`font-mono font-extrabold text-base w-6 text-center ${
                          idx === 0
                            ? 'text-amber-500'
                            : idx === 1
                            ? 'text-slate-400'
                            : idx === 2
                            ? 'text-amber-700'
                            : 'text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <Avatar src={member.avatar} name={member.name} size="md" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {member.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {member.sessionsHosted || 0} hosted &bull; {member.sessionsCompleted || 0} learned
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-base text-brand-600 dark:text-brand-400">
                        {member.xp} XP
                      </span>
                      <span className="text-[10px] text-slate-400 block">Level {member.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default CommunityPage;
