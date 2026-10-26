import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Twitter, Github, Linkedin, Heart, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const Footer = () => {
  const location = useLocation();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Pages where global footer is hidden:
  // Dashboard, Matches, Chat, Calendar, Progress, Community, My Profile, Wallet & SP, Settings, Sign Up, Sign In, Profile Customization
  const hiddenRoutes = [
    '/dashboard',
    '/matches',
    '/chat',
    '/calendar',
    '/progress',
    '/community',
    '/profile',
    '/wallet',
    '/settings',
    '/auth',
    '/signin',
    '/signup',
    '/profile-setup',
  ];

  const shouldHide = hiddenRoutes.some(
    (route) =>
      location.pathname === route ||
      (route !== '/' && location.pathname.startsWith(`${route}/`))
  );

  if (shouldHide) {
    return null;
  }

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success('Thanks for subscribing to our learning newsletter!');
    setNewsletterEmail('');
  };

  return (
    <footer className="border-t border-purple-900/30 bg-[#08060c] pt-16 pb-24 md:pb-12 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-purple-900/25">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Connect Skill Logo" className="w-8 h-8 object-contain" />
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                Connect Skill
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              The AI-powered reciprocal peer learning network. Exchange lived expertise, build genuine connections, and master new crafts without financial barriers.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-purple-950/60 border border-transparent hover:border-purple-500/30 text-slate-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-purple-950/60 border border-transparent hover:border-purple-500/30 text-slate-400 hover:text-purple-400 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-purple-950/60 border border-transparent hover:border-purple-500/30 text-slate-400 hover:text-purple-400 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/matches" className="text-slate-400 hover:text-purple-300 transition-colors">Find Matches</Link></li>
              <li><Link to="/community" className="text-slate-400 hover:text-purple-300 transition-colors">Skill Guilds</Link></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-purple-300 transition-colors">How It Works</a></li>
              <li><a href="#faq" className="text-slate-400 hover:text-purple-300 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/progress" className="text-slate-400 hover:text-purple-300 transition-colors">Gamification & XP</Link></li>
              <li><Link to="/wallet" className="text-slate-400 hover:text-purple-300 transition-colors">Skill Points (SP)</Link></li>
              <li><a href="#blog" className="text-slate-400 hover:text-purple-300 transition-colors">Pedagogy Blog</a></li>
              <li><a href="#contact" className="text-slate-400 hover:text-purple-300 transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">
              Weekly Insight
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Curated peer mentoring strategies, AI matching updates, and community spotlights.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-2">
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#130f20] border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm hover:shadow-glow transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Connect Skill Inc. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Built with passion & AI for global peer learning</span>
            <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
