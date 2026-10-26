import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import API from '../../services/api';
import {
  Sparkles,
  Bell,
  Coins,
  Sun,
  Moon,
  LogOut,
  User,
  Wallet,
  Settings,
  Shield,
  Menu,
  X,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const isLandingPage = location.pathname === '/';

  // Handle shrink on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifications = async () => {
      try {
        const res = await API.get('/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
  }, [isAuthenticated, notificationsOpen]);

  // Real-time notification updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotif = (e) => {
      const notif = e.detail;
      if (!notif) return;
      setNotifications((prev) => [notif, ...prev.filter((item) => item._id !== notif._id)]);
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener('notification:received', handleNewNotif);
    return () => window.removeEventListener('notification:received', handleNewNotif);
  }, [isAuthenticated]);

  const markAllNotificationsAsRead = async () => {
    try {
      await API.put('/notifications/all/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setNotificationsOpen(false);
    if (!notif.isRead && notif._id) {
      try {
        await API.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const navLinks = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Matches', path: '/matches' },
        { label: 'Chat', path: '/chat' },
        { label: 'Calendar', path: '/calendar' },
        { label: 'Progress', path: '/progress' },
        { label: 'Community', path: '/community' },
      ]
    : [
        { label: 'About Us', path: '#about' },
        { label: 'Features', path: '#features' },
        { label: 'How It Works', path: '#how-it-works' },
        { label: 'Blog', path: '#blog' },
        { label: 'FAQ', path: '#faq' },
        { label: 'Contact', path: '#contact' },
      ];

  const handleLandingScroll = (hash) => {
    if (!isLandingPage) {
      navigate('/' + hash);
      return;
    }
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-300">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`pointer-events-auto rounded-pill transition-all duration-300 flex items-center justify-between border backdrop-blur-xl ${
          isLandingPage
            ? 'navbar-glass'
            : isScrolled
              ? 'py-2 px-4 md:px-5 bg-white/85 dark:bg-slate-900/85 border-slate-200/80 dark:border-slate-800/80 shadow-pill dark:shadow-pill-dark max-w-5xl w-full'
              : 'py-2.5 px-5 md:px-7 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 shadow-pill dark:shadow-pill-dark max-w-6xl w-full'
        } ${
          isLandingPage
            ? isScrolled ? 'py-2 px-4 md:px-5 max-w-5xl w-full' : 'py-2.5 px-5 md:px-7 max-w-6xl w-full'
            : ''
        }`}
      >
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5 shrink-0 group">
          <img src="/logo.png" alt="Connect Skill Logo" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" />
          <span className={`font-display font-extrabold text-lg tracking-tight ${
            isLandingPage
              ? 'text-white'
              : 'bg-gradient-to-r from-slate-900 via-brand-900 to-brand-600 dark:from-white dark:via-purple-300 dark:to-brand-400 bg-clip-text text-transparent'
          }`}>
            Connect Skill
          </span>
        </Link>

        {/* Center Nav Links - Desktop */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = isAuthenticated
              ? location.pathname === link.path
              : false;
            return isLandingPage && link.path.startsWith('#') ? (
              <button
                key={link.label}
                onClick={() => handleLandingScroll(link.path)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isLandingPage
                    ? 'text-white/90 hover:text-white hover:bg-white/15'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                to={link.path}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/60'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-full border border-brand-500/30 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
          {/* Light / Dark Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`p-2 rounded-full transition-colors ${
              isLandingPage
                ? 'text-white/80 hover:text-white hover:bg-white/15'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Skill Points Chip */}
              <Link
                to="/wallet"
                className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 transition-colors"
                title="Skill Points Balance"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{user.skillPoints ?? 100} SP</span>
              </Link>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications"
                  className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-3 px-2 z-50"
                    >
                      <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <Link
                              key={n._id}
                              to={n.link || '/dashboard'}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 rounded-xl block text-left text-xs transition-colors ${
                                n.isRead
                                  ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                                  : 'bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-medium text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              <p className="font-semibold text-xs text-slate-900 dark:text-white">
                                {n.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2">{n.message}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar + Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center focus:outline-none"
                  aria-label="User menu"
                >
                  <Avatar src={user.avatar} name={user.name || user.email} size="sm" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-sm"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300 rounded-full">
                            Lvl {user.level || 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 rounded-full">
                            {user.skillPoints || 100} SP
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/profile/${user._id}`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/wallet"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Wallet & SP</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/auth?tab=signin"
                className={`px-3 py-1.5 text-xs font-semibold ${
                  isLandingPage
                    ? 'text-white/90 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/auth?tab=signup"
                className="px-4 py-1.5 rounded-pill bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-950/40 hover:shadow-glow transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Hamburger button for mobile menu on landing page */}
          {!isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors ${
                isLandingPage
                  ? 'text-white/90 hover:text-white hover:bg-white/15'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </motion.nav>

      {/* Mobile Drawer on Landing Page */}
      <AnimatePresence>
        {!isAuthenticated && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`pointer-events-auto absolute top-16 left-4 right-4 rounded-3xl shadow-2xl p-5 flex flex-col space-y-3 lg:hidden backdrop-blur-2xl border ${
              isLandingPage
                ? 'bg-[#141022]/95 border-white/20 text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white'
            }`}
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLandingScroll(link.path);
                }}
                className={`text-left text-sm font-semibold py-2 px-3 rounded-xl transition-colors ${
                  isLandingPage
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className={`pt-3 border-t flex flex-col space-y-2 ${isLandingPage ? 'border-purple-500/20' : 'border-slate-100 dark:border-slate-800'}`}>
              <Link
                to="/auth?tab=signin"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-center py-2 text-sm font-semibold ${isLandingPage ? 'text-white/90 hover:text-white' : 'text-slate-700 dark:text-slate-300'}`}
              >
                Sign In
              </Link>
              <Link
                to="/auth?tab=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
