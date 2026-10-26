import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import API from '../services/api';
import toast from 'react-hot-toast';
import { Camera, Plus, X, ArrowRight } from 'lucide-react';

export const ProfileSetupPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'intermediate');
  
  const [teachInput, setTeachInput] = useState('');
  const [skillsTeaching, setSkillsTeaching] = useState(user?.skillsTeaching || ['React & Next.js']);

  const [learnInput, setLearnInput] = useState('');
  const [skillsLearning, setSkillsLearning] = useState(user?.skillsLearning || ['Conversational Spanish']);

  const [availability, setAvailability] = useState(
    user?.availability?.length > 0
      ? user.availability
      : [
          { day: 'Mon', startTime: '18:00', endTime: '21:00' },
          { day: 'Wed', startTime: '18:00', endTime: '21:00' },
        ]
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);

    // Upload to server/Cloudinary
    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        setAvatar(res.data.url);
        toast.success('Avatar uploaded successfully!');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.response?.data?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addSkillTeaching = () => {
    if (teachInput.trim() && !skillsTeaching.includes(teachInput.trim())) {
      setSkillsTeaching([...skillsTeaching, teachInput.trim()]);
      setTeachInput('');
    }
  };

  const removeSkillTeaching = (skill) => {
    setSkillsTeaching(skillsTeaching.filter((s) => s !== skill));
  };

  const addSkillLearning = () => {
    if (learnInput.trim() && !skillsLearning.includes(learnInput.trim())) {
      setSkillsLearning([...skillsLearning, learnInput.trim()]);
      setLearnInput('');
    }
  };

  const removeSkillLearning = (skill) => {
    setSkillsLearning(skillsLearning.filter((s) => s !== skill));
  };

  const toggleDay = (day) => {
    const exists = availability.find((a) => a.day === day);
    if (exists) {
      setAvailability(availability.filter((a) => a.day !== day));
    } else {
      setAvailability([...availability, { day, startTime: '18:00', endTime: '21:00' }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingImage) {
      toast.error('Please wait for image upload to complete');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (skillsTeaching.length === 0) {
      toast.error('Please add at least one skill you can teach');
      return;
    }
    if (skillsLearning.length === 0) {
      toast.error('Please add at least one skill you want to learn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.put('/profile', {
        name,
        bio,
        avatar,
        experienceLevel,
        skillsTeaching,
        skillsLearning,
        availability,
      });
      updateUser(res.data.user);
      toast.success('Profile created! Welcome to your Connect Skill Dashboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving profile');
    } finally {
      setSubmitting(false);
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <>
      <Helmet>
        <title>Setup Profile | Connect Skill</title>
      </Helmet>

      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center justify-center space-x-2.5 mb-1 group">
              <img src="/logo.png" alt="Connect Skill" className="w-9 h-9 object-contain transition-transform group-hover:scale-105" />
              <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                Connect <span className="text-brand-600 dark:text-brand-400">Skill</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              STEP 2: PROFILE CREATION
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Our AI match engine uses your skills, goals, and availability to find high-compatibility learning partners.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar upload with preview */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">
                      {name ? name.substring(0, 2).toUpperCase() : 'ME'}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white cursor-pointer shadow-lg transition-transform group-hover:scale-110">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <span className="text-[11px] text-slate-400">
                {uploadingImage ? 'Uploading image...' : 'Click camera icon to upload profile picture'}
              </span>
            </div>

            {/* Full Name & Experience Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Overall Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="beginner">Beginner (1-2 years hobby/study)</option>
                  <option value="intermediate">Intermediate (2-4 years practical)</option>
                  <option value="advanced">Advanced (5+ years professional)</option>
                  <option value="expert">Expert / Master Practitioner</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bio / About You
              </label>
              <textarea
                rows={3}
                placeholder="Share your background, passions, and what excites you about peer exchange..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Skills I Can Teach */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Skills I Can Teach * (Press Enter or Add)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. React & Next.js, Acoustic Guitar, Sourdough..."
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillTeaching();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkillTeaching}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-500 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsTeaching.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button type="button" onClick={() => removeSkillTeaching(skill)}>
                      <X className="w-3.5 h-3.5 hover:text-emerald-900" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills I Want to Learn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Skills I Want to Learn * (Press Enter or Add)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Conversational Spanish, UI/UX in Figma, Calisthenics..."
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillLearning();
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkillLearning}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-brand-500 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsLearning.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button type="button" onClick={() => removeSkillLearning(skill)}>
                      <X className="w-3.5 h-3.5 hover:text-indigo-900" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Availability Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Weekly Availability Days
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => {
                  const isSelected = availability.some((a) => a.day === day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-pill bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg hover:shadow-glow flex items-center justify-center space-x-2 transition-all"
              >
                <span>{submitting ? 'Saving Profile...' : 'Complete Profile & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default ProfileSetupPage;
