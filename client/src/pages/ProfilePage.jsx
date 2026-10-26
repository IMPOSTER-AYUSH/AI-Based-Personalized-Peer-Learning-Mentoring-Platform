import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Star,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Edit3,
  Camera,
  Check,
  X,
  MessageSquare,
  Award,
  Clock,
  Coins,
  BookOpen,
  GraduationCap,
  Video,
  ShieldCheck,
  Plus,
} from 'lucide-react';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, updateUser, loading: authLoading } = useAuth();

  const isMe = !id || (currentUser && id === currentUser._id);
  const [profileUser, setProfileUser] = useState(isMe ? currentUser : null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!currentUser && !id);
  const [editMode, setEditMode] = useState(false);

  // Uploading states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Interactive skill tags in edit mode
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newLearnSkill, setNewLearnSkill] = useState('');

  // Edit form state
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    avatar: '',
    coverImage: '',
    experienceLevel: 'intermediate',
    skillsTeaching: [],
    skillsLearning: [],
    socialLinks: { github: '', linkedin: '', twitter: '', website: '' },
  });

  // Sync profile data when currentUser or id changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (isMe) {
        if (currentUser) {
          setProfileUser(currentUser);
          setEditData({
            name: currentUser.name || '',
            bio: currentUser.bio || '',
            avatar: currentUser.avatar || '',
            coverImage: currentUser.coverImage || '',
            experienceLevel: currentUser.experienceLevel || 'intermediate',
            skillsTeaching: currentUser.skillsTeaching || [],
            skillsLearning: currentUser.skillsLearning || [],
            socialLinks: {
              github: currentUser.socialLinks?.github || '',
              linkedin: currentUser.socialLinks?.linkedin || '',
              twitter: currentUser.socialLinks?.twitter || '',
              website: currentUser.socialLinks?.website || '',
            },
          });
          try {
            const revRes = await API.get(`/reviews/user/${currentUser._id}`).catch(() => ({
              data: { reviews: [] },
            }));
            setReviews(revRes.data.reviews || []);
          } catch (err) {
            console.error('Failed to load reviews:', err);
          }
          setLoading(false);
        } else if (!authLoading) {
          setLoading(false);
        }
      } else {
        setLoading(true);
        try {
          const [userRes, revRes] = await Promise.all([
            API.get(`/profile/${id}`),
            API.get(`/reviews/user/${id}`).catch(() => ({ data: { reviews: [] } })),
          ]);
          setProfileUser(userRes.data.user);
          setReviews(revRes.data.reviews || []);
        } catch (err) {
          toast.error('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [id, currentUser, isMe, authLoading]);

  // Upload and persist Profile Picture (Avatar)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile picture...');

    try {
      // 1. Upload to storage endpoint
      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = uploadRes.data?.url;
      if (!avatarUrl) throw new Error('No image URL returned');

      // 2. Persist immediately to the user profile in MongoDB
      const profileRes = await API.put('/profile', { avatar: avatarUrl });
      const updatedUser = profileRes.data.user;

      // 3. Update global AuthContext state (updates Navbar and entire site)
      updateUser(updatedUser);

      // 4. Update local page states
      setProfileUser(updatedUser);
      setEditData((prev) => ({ ...prev, avatar: avatarUrl }));

      toast.success('Profile picture updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to update avatar:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile picture', { id: toastId });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Upload and persist Cover Banner
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingCover(true);
    const toastId = toast.loading('Uploading cover picture...');

    try {
      // 1. Upload to storage endpoint
      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const coverUrl = uploadRes.data?.url;
      if (!coverUrl) throw new Error('No cover URL returned');

      // 2. Persist immediately to user profile in MongoDB
      const profileRes = await API.put('/profile', { coverImage: coverUrl });
      const updatedUser = profileRes.data.user;

      // 3. Update global AuthContext state
      updateUser(updatedUser);

      // 4. Update local page states
      setProfileUser(updatedUser);
      setEditData((prev) => ({ ...prev, coverImage: coverUrl }));

      toast.success('Cover image updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to update cover:', err);
      toast.error(err.response?.data?.message || 'Failed to update cover picture', { id: toastId });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Save general profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await API.put('/profile', editData);
      updateUser(res.data.user);
      setProfileUser(res.data.user);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Helper to add skill teaching chip
  const addTeachingSkill = () => {
    const val = newTeachSkill.trim();
    if (val && !editData.skillsTeaching.includes(val)) {
      setEditData((prev) => ({
        ...prev,
        skillsTeaching: [...prev.skillsTeaching, val],
      }));
      setNewTeachSkill('');
    }
  };

  const removeTeachingSkill = (skillToRemove) => {
    setEditData((prev) => ({
      ...prev,
      skillsTeaching: prev.skillsTeaching.filter((s) => s !== skillToRemove),
    }));
  };

  // Helper to add skill learning chip
  const addLearningSkill = () => {
    const val = newLearnSkill.trim();
    if (val && !editData.skillsLearning.includes(val)) {
      setEditData((prev) => ({
        ...prev,
        skillsLearning: [...prev.skillsLearning, val],
      }));
      setNewLearnSkill('');
    }
  };

  const removeLearningSkill = (skillToRemove) => {
    setEditData((prev) => ({
      ...prev,
      skillsLearning: prev.skillsLearning.filter((s) => s !== skillToRemove),
    }));
  };

  // Helper for initials fallback
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  if (loading || (authLoading && !profileUser)) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading profile...</p>
      </div>
    );
  }

  const userToShow = isMe ? currentUser || profileUser : profileUser;
  if (!userToShow) {
    return (
      <div className="min-h-screen pt-32 pb-20 text-center px-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">User not found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested profile does not exist or has been removed.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block px-5 py-2.5 rounded-full bg-brand-500 text-white font-bold text-xs shadow-md hover:bg-brand-600 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{userToShow.name || 'User Profile'} | Connect Skill</title>
      </Helmet>

      <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* ========================================================= */}
        {/* COVER IMAGE BANNER */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl overflow-hidden h-64 sm:h-72 md:h-80 shadow-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-900 group">
          {userToShow.coverImage ? (
            <img
              src={userToShow.coverImage}
              alt="Profile Cover"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-brand-950 via-purple-900 to-indigo-950 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="flex items-center space-x-2 text-white/40 font-medium text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Connect Skill Peer Network</span>
              </div>
            </div>
          )}

          {/* Vignette overlay for visual depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Uploading Cover Overlay Spinner */}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center space-x-3 text-white text-sm font-semibold z-20">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving cover picture...</span>
            </div>
          )}

          {/* Change Cover Button (Clearly visible for user) */}
          {isMe && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10">
              <label
                htmlFor="profile-cover-input"
                className="inline-flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-slate-950/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/25 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 group/btn"
                title="Change cover photo"
              >
                {uploadingCover ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-purple-300 group-hover/btn:text-white transition-colors" />
                )}
                <span>{uploadingCover ? 'Uploading...' : 'Change Cover'}</span>
                <input
                  id="profile-cover-input"
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MAIN PROFILE CARD */}
        {/* ========================================================= */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl -mt-16 sm:-mt-20 md:-mt-24 space-y-8 backdrop-blur-sm">
          {/* Header Row: Avatar, Identity, and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Left: Avatar + Names */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-5 sm:gap-6">
              {/* Profile Avatar with dedicated upload trigger */}
              <div className="relative shrink-0 -mt-16 sm:-mt-20 md:-mt-24 group">
                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full ring-4 sm:ring-[6px] ring-white dark:ring-slate-900 shadow-2xl overflow-hidden bg-slate-800 relative">
                  {userToShow.avatar ? (
                    <img
                      key={userToShow.avatar}
                      src={userToShow.avatar}
                      alt={userToShow.name || 'User Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-brand-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-3xl sm:text-4xl shadow-inner select-none">
                      {getInitials(userToShow.name || userToShow.email)}
                    </div>
                  )}

                  {/* Loading spinner overlay on avatar */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-3 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Clearly visible Change Profile Picture Camera Button */}
                {isMe && (
                  <label
                    htmlFor="profile-avatar-input"
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2.5 sm:p-3 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white shadow-xl ring-4 ring-white dark:ring-slate-900 cursor-pointer transition-all hover:scale-110 flex items-center justify-center group/avbtn"
                    title="Change profile picture"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span className="sr-only">Change profile picture</span>
                    <input
                      id="profile-avatar-input"
                      type="file"
                      accept="image/*"
                      disabled={uploadingAvatar}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* User Names, Tier, and Summary info */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {userToShow.name || 'Anonymous Learner'}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/90 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-500" />
                    {userToShow.experienceLevel || 'Learner'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
                  <span>Level {userToShow.level || 1} Polymath</span>
                  <span>•</span>
                  <span>{userToShow.skillPoints ?? 100} Skill Points</span>
                  <span>•</span>
                  <span>{userToShow.teachingHours || 0} hrs taught</span>
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-center sm:justify-end shrink-0">
              {isMe ? (
                <button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-all ${
                    editMode
                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-300'
                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-glow hover:scale-105 active:scale-95'
                  }`}
                >
                  {editMode ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Cancel Edit</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  to="/chat"
                  className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-glow flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Peer</span>
                </Link>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* STATS OVERVIEW CARDS (SYMMETRICAL 4-GRID) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {userToShow.rating ? Number(userToShow.rating).toFixed(1) : '5.0'} ★
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {reviews.length} Peer Reviews
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {userToShow.sessionsCompleted || 0}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Sessions Completed</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {(userToShow.teachingHours || 0) + (userToShow.learningHours || 0)} hrs
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Exchanged</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-brand-500 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {userToShow.skillPoints ?? 100} SP
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Wallet Balance</p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* EDIT FORM (WHEN EDIT MODE ACTIVE) OR BIO / OVERVIEW */}
          {/* ========================================================= */}
          {isMe && editMode ? (
            <form
              onSubmit={handleSaveProfile}
              className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-brand-500" />
                  <span>Update Profile Information</span>
                </h3>
                <span className="text-xs text-slate-400">Photos can also be updated directly from the cards</span>
              </div>

              {/* Name & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={editData.experienceLevel}
                    onChange={(e) => setEditData({ ...editData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner (1-2 years)</option>
                    <option value="intermediate">Intermediate (2-4 years)</option>
                    <option value="advanced">Advanced (5+ years)</option>
                    <option value="expert">Expert / Master</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bio / About You
                </label>
                <textarea
                  rows={3}
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="Share a short summary of what you do, what skills you are excited to teach, and what you hope to learn..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Skills Teaching in Edit Mode */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 space-y-3">
                <label className="block font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Skills You Can Teach
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTeachSkill}
                    onChange={(e) => setNewTeachSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTeachingSkill();
                      }
                    }}
                    placeholder="Add a skill you can teach (e.g. React, Spanish, Piano) and press Enter"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTeachingSkill}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {editData.skillsTeaching?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeTeachingSkill(skill)}
                        className="hover:text-emerald-950 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {(!editData.skillsTeaching || editData.skillsTeaching.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No teaching skills added yet.</span>
                  )}
                </div>
              </div>

              {/* Skills Learning in Edit Mode */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/50 space-y-3">
                <label className="block font-bold text-xs uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  Skills You Want to Learn
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newLearnSkill}
                    onChange={(e) => setNewLearnSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLearningSkill();
                      }
                    }}
                    placeholder="Add a skill you want to learn (e.g. UI/UX, Python, French) and press Enter"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addLearningSkill}
                    className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {editData.skillsLearning?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeLearningSkill(skill)}
                        className="hover:text-purple-950 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {(!editData.skillsLearning || editData.skillsLearning.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No learning skills added yet.</span>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website / Portfolio
                  </label>
                  <input
                    type="text"
                    value={editData.socialLinks.website}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, website: e.target.value },
                      })
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="text"
                    value={editData.socialLinks.github}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, github: e.target.value },
                      })
                    }
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={editData.socialLinks.linkedin}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Twitter / X
                  </label>
                  <input
                    type="text"
                    value={editData.socialLinks.twitter}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, twitter: e.target.value },
                      })
                    }
                    placeholder="https://x.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md hover:shadow-glow disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">About</h3>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                {userToShow.bio || 'Passionate peer learner exploring new crafts on Connect Skill.'}
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* SKILLS SECTION (SYMMETRICAL 2-COLUMN GRID) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            {/* Skills Offering / Teaching */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Skills I Teach
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {userToShow.skillsTeaching?.length || 0}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {userToShow.skillsTeaching?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{skill}</span>
                  </span>
                ))}
                {(!userToShow.skillsTeaching || userToShow.skillsTeaching.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No teaching skills listed yet.</p>
                )}
              </div>
            </div>

            {/* Skills Seeking / Learning */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-brand-600 dark:text-brand-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Skills I Want to Learn
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-brand-800 dark:bg-purple-950 dark:text-brand-300">
                  {userToShow.skillsLearning?.length || 0}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {userToShow.skillsLearning?.map((skill) => (
                  <span
                    key={skill}
                    className="px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-brand-800 dark:text-brand-300 text-xs font-semibold border border-purple-200 dark:border-purple-800/80 shadow-xs flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>{skill}</span>
                  </span>
                ))}
                {(!userToShow.skillsLearning || userToShow.skillsLearning.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No learning skills listed yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SOCIAL LINKS ROW */}
          {/* ========================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Connect:</span>
              {userToShow.socialLinks?.website && (
                <a
                  href={userToShow.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors shadow-xs"
                  title="Website / Portfolio"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {userToShow.socialLinks?.github && (
                <a
                  href={userToShow.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
                  title="GitHub Profile"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {userToShow.socialLinks?.linkedin && (
                <a
                  href={userToShow.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors shadow-xs"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {userToShow.socialLinks?.twitter && (
                <a
                  href={userToShow.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-colors shadow-xs"
                  title="Twitter / X Profile"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {!userToShow.socialLinks?.website &&
                !userToShow.socialLinks?.github &&
                !userToShow.socialLinks?.linkedin &&
                !userToShow.socialLinks?.twitter && (
                  <span className="text-xs text-slate-400 italic">No social links added yet.</span>
                )}
            </div>

            <div className="text-xs text-slate-400">
              Member since {new Date(userToShow.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PEER REVIEWS SECTION */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center space-x-2.5">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>Verified Peer Reviews ({reviews.length})</span>
            </h3>
            <span className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              {userToShow.rating ? Number(userToShow.rating).toFixed(1) : '5.0'} ★ Average
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No session reviews yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Completed video sessions and skill exchanges will receive verified reviews from partners here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar src={rev.reviewer?.avatar} name={rev.reviewer?.name} size="sm" />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                          {rev.reviewer?.name || 'Peer Learner'}
                        </span>
                        {rev.skill && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                            Skill: {rev.skill}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-500 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (rev.rating || 5)
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
