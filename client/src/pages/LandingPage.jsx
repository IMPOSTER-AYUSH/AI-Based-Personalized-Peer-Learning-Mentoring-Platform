import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import toast from 'react-hot-toast';
import MicroSlats from '../components/MicroSlats';
import {
  Sparkles,
  ArrowRight,
  Video,
  Award,
  CheckCircle2,
  ChevronDown,
  Star,
  Send,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';

export const LandingPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await API.get('/contact/blogs');
        setBlogs(res.data.blogs || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBlogs();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await API.post('/contact', contactForm);
      toast.success('Message received! Our team will get back to you shortly.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const features = [
    {
      image: '/Groq AI Matching Engine.png',
      title: 'Groq AI Matching Engine',
      desc: 'Deep semantic compatibility scoring based on complementary learning goals, mastery level, and scheduling availability.',
      badge: 'AI Model',
    },
    {
      image: '/Real-Time WebRTC Video Learning.png',
      title: 'Real-Time WebRTC Video Learning',
      desc: 'Ultra-low latency in-browser video rooms with screen sharing, collaborative whiteboarding, and audio controls.',
      badge: 'Zero Latency',
    },
    {
      image: '/Smart Scheduling & 1-Click Sync.png',
      title: 'Smart Scheduling & 1-Click Sync',
      desc: 'Seamless recurring availability management with automatic timezone resolution, Google Calendar links, and .ics export.',
      badge: 'CalSync',
    },
    {
      image: '/Real-Time Peer Chat & Voice Notes.png',
      title: 'Real-Time Peer Chat & Voice Notes',
      desc: 'Integrated Socket.io chat with rich media uploads, voice memos, live typing presence, and an embedded Groq study assistant.',
      badge: 'Live Sync',
    },
    {
      image: '/XP, Levels & Skill Points (SP).png',
      title: 'XP, Levels & Skill Points (SP)',
      desc: 'Earn Skill Points and XP by mentoring peers, completing sessions, and participating in weekly guild challenges.',
      badge: 'Gamified',
    },
    {
      image: '/Vibrant Global Skill Communities.png',
      title: 'Vibrant Global Skill Communities',
      desc: 'Join guilds across coding, music, languages, baking, and fitness. Engage in discussions, attend live workshops, and compete on leaderboards.',
      badge: 'Communities',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Define Your Skill Exchange Profile',
      desc: 'Tell us what crafts you excel at and what skills you yearn to master. Set your weekly availability slots.',
    },
    {
      step: '02',
      title: 'AI Matches Complementary Peers',
      desc: 'Our AI model analyzes bilateral synergies, calculating compatibility scores with clear explanations.',
    },
    {
      step: '03',
      title: 'Schedule & Connect in HD Video',
      desc: 'Book reciprocal 1-on-1 sessions. Meet directly in your browser with crystal-clear WebRTC video and chat.',
    },
    {
      step: '04',
      title: 'Level Up & Build Genuine Mastery',
      desc: 'Earn XP, unlock verified achievement badges, track learning hours, and trade Skill Points seamlessly.',
    },
  ];

  const testimonials = [
    {
      name: 'Ananya Iyer',
      role: 'Linguist & Polyglot',
      avatar: 'https://images.unsplash.com/photo-1706943262459-3ef6ce03305c?w=200&auto=format&fit=crop&q=80',
      text: 'I traded Spanish conversation sessions for React mentorship. Within 3 months, I built my own multilingual vocabulary web app!',
      rating: 5,
      skill: 'Spanish ⇄ React',
    },
    {
      name: 'Rohan Malhotra',
      role: 'Touring Guitarist',
      avatar: 'https://images.unsplash.com/photo-1622461828279-f028ae93a63b?w=200&auto=format&fit=crop&q=80',
      text: 'Connect Skill revolutionized how I teach acoustic fingerstyle. I get to mentor passionate students while learning UI design for my band’s merchandise platform.',
      rating: 5,
      skill: 'Guitar ⇄ Figma',
    },
    {
      name: 'Priya Sundaram',
      role: 'Staff Product Designer',
      avatar: 'https://images.unsplash.com/photo-1745482036066-5d215ed6b910?w=200&auto=format&fit=crop&q=80',
      text: 'The AI match engine paired me with engineers whose code quality feedback gave my design systems an engineering-grade edge.',
      rating: 5,
      skill: 'Design Systems ⇄ Python',
    },
    {
      name: 'Kabir Mehta',
      role: 'Artisan Baker',
      avatar: 'https://images.unsplash.com/photo-1667655699558-8f1b362a67a8?w=200&auto=format&fit=crop&q=80',
      text: 'Teaching sourdough fermentation to tech professionals while they optimized my micro-bakery SEO was the best trade I’ve ever made.',
      rating: 5,
      skill: 'Sourdough ⇄ Growth SEO',
    },
    {
      name: 'Diya Patel',
      role: 'AI Researcher',
      avatar: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&auto=format&fit=crop&q=80',
      text: 'Teaching machine learning concepts grounded my own fundamentals. Learning guitar in exchange was the mental relaxation I needed.',
      rating: 5,
      skill: 'Data Science ⇄ Guitar',
    },
    {
      name: 'Arjun Kapoor',
      role: 'Mobility Coach',
      avatar: 'https://images.unsplash.com/photo-1605367177286-f3d4789c47a0?w=200&auto=format&fit=crop&q=80',
      text: 'Desk-bound engineers are my favorite clients. In exchange, I got deep masterclasses on index fund portfolio rebalancing!',
      rating: 5,
      skill: 'Calisthenics ⇄ Investing',
    },
    {
      name: 'Neha Chawla',
      role: 'Editorial Photographer',
      avatar: 'https://images.unsplash.com/photo-1669555203413-b18e860b6e4e?w=200&auto=format&fit=crop&q=80',
      text: 'The in-browser video quality is crisp and screen sharing high-res RAW files in Lightroom is buttery smooth.',
      rating: 5,
      skill: 'Lightroom ⇄ Design',
    },
    {
      name: 'Vikram Singhania',
      role: 'Financial Analyst',
      avatar: 'https://images.unsplash.com/photo-1521870749737-92928aafcc21?w=200&auto=format&fit=crop&q=80',
      text: 'Connect Skill turns human expertise into a liquid currency. No expensive bootcamps needed—just authentic peer synergy.',
      rating: 5,
      skill: 'Finance ⇄ Fullstack',
    },
  ];

  const faqs = [
    {
      q: 'How does Connect Skill work without paying cash?',
      a: 'Connect Skill operates on reciprocal learning and Skill Points (SP). Every session you teach awards you SP and XP, which you can spend to book sessions with other skilled peers. Every new user receives a 100 SP welcome bonus!',
    },
    {
      q: 'How does the AI matching algorithm pair users?',
      a: 'We leverage Groq’s Llama-3.3 70B model to compare skills you teach with skills other members want to learn, factoring in experience tiers, overlapping availability windows, and specific learning objectives.',
    },
    {
      q: 'Do I need any third-party software for video sessions?',
      a: 'None! Our video calling runs entirely in-browser using WebRTC peer-to-peer technology. Just allow camera and mic permissions when your session begins.',
    },
    {
      q: 'Can I export sessions to my personal calendar?',
      a: 'Yes! Every confirmed session has a 1-click "Add to Google Calendar" link as well as a universal .ics file download compatible with Apple Calendar, Outlook, and others.',
    },
    {
      q: 'What if I am a beginner with no skills to teach?',
      a: 'Everyone has lived expertise! Whether it’s your native language, basic cooking, time management, gaming strategies, or photography basics, there are always curious learners looking for accessible 101 guidance.',
    },
    {
      q: 'How are mentors rated and verified?',
      a: 'After every completed session, participants provide bilateral ratings and qualitative feedback. Profiles show verified review histories and gamified achievement badges.',
    },
    {
      q: 'Can I send voice notes and files during chat?',
      a: 'Yes! Our chat room features direct microphone voice note recording, file and image uploads powered by Cloudinary, read receipts, and an AI study assistant.',
    },
    {
      q: 'Is my personal data and email secure?',
      a: 'We use industry-standard bcrypt password hashing, JWT authentication, helmet security headers, and rate limiting. We never sell your personal data.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Connect Skill</title>
        <meta
          name="description"
          content="Exchange skills instead of money through AI-powered matching, live video mentoring, real-time chat, and community gamification."
        />
        <meta property="og:title" content="Connect Skill | Peer Learning Platform" />
        <meta
          property="og:description"
          content="Learn anything, teach what you love. Reciprocal peer skill exchange."
        />
      </Helmet>

      <div className="overflow-hidden bg-[#0c0a13] text-white">
        {/* ============================================================ */}
        {/* HERO + MICROSLATS ANIMATED BACKGROUND                        */}
        {/* Background stops exactly at the "Our Mission" section border */}
        {/* ============================================================ */}
        <div className="relative" style={{ background: '#120f17' }}>
          {/* MicroSlats canvas - fills entire hero zone */}
          <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <MicroSlats
              preset="swell"
              color="#A855F7"
              glintColor="#ffffff"
              backgroundColor="#120f17"
              slatWidth={10}
              slatHeight={25}
              gap={3}
              roundness={0.75}
              interactive
              cursorStrength={1}
              cursorSize={40}
              swirl={0}
              trail={1.4}
              lean={0}
              intro
              scale={1.5}
              speed={0.6}
              direction={250}
              chop={0.55}
              stretch={0}
              glint={0.7}
              contrast={1.25}
              perspective={0.55}
              fog={0.55}
              introDuration={1.5}
              paused={false}
            />
          </div>

          {/* HERO SECTION */}
          <section className="relative z-10 pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Subtle background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-purple-600/25 via-purple-500/20 to-fuchsia-500/15 blur-[140px] rounded-full -z-10 pointer-events-none" />

            <div className="text-center max-w-4xl mx-auto space-y-6">

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
              >
                Learn Anything.{' '}
                <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  Teach What You Love.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
              >
                Exchange skills instead of money through AI-powered matching. Connect 1-on-1 with passionate peers over HD video, chat in real time, and level up together.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <Link
                  to="/auth?tab=signup"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-pill bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xl shadow-purple-950/50 hover:shadow-glow flex items-center justify-center space-x-2 transition-all group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-pill bg-white/15 dark:glass-card hover:bg-white/15 text-white border border-white/20 backdrop-blur-md font-semibold text-sm shadow-sm transition-all"
                >
                  Explore Skills & Features
                </a>
              </motion.div>

              {/* Micro stats banner */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>100 SP Welcome Bonus</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Zero Subscription Fees</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Browser WebRTC Video</span>
                </span>
              </div>
            </div>

            {/* Animated Product Preview Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-14 max-w-5xl mx-auto rounded-3xl p-3 md:p-4 bg-gradient-to-b from-purple-900/30 via-slate-900/40 to-slate-950/70 border border-purple-500/30 shadow-2xl backdrop-blur-xl"
            >
              <div className="rounded-2xl overflow-hidden bg-slate-950/90 border border-purple-500/20 shadow-inner">
                <div className="h-10 bg-slate-900/90 px-4 flex items-center space-x-2 border-b border-purple-500/20">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono text-purple-300/80 ml-4">
                    Connect Skill.app/dashboard • AI Match Engine
                  </span>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mock Card 1 */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-full">
                        94% Match
                      </span>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://images.unsplash.com/photo-1706943262459-3ef6ce03305c?w=100&auto=format&fit=crop&q=80"
                        alt="Ananya"
                        className="w-12 h-12 rounded-full object-cover border border-purple-400/30"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-white">Ananya Iyer</h4>
                        <p className="text-xs text-slate-400">Native Spanish Teacher</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      "Ananya teaches Conversational Spanish which you want, while you teach React & Next.js!"
                    </p>
                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">10 SP / hr</span>
                      <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-bold">Connect</span>
                    </div>
                  </div>

                  {/* Mock Card 2 */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-purple-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-full">
                        Upcoming Session
                      </span>
                      <Video className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="font-bold text-sm text-white">Acoustic Fingerstyle Masterclass</h4>
                    <p className="text-xs text-slate-400">Tomorrow at 6:00 PM • 60 mins</p>
                    <div className="flex items-center space-x-2 pt-2">
                      <img
                        src="https://images.unsplash.com/photo-1622461828279-f028ae93a63b?w=100&auto=format&fit=crop&q=80"
                        alt="Rohan"
                        className="w-8 h-8 rounded-full object-cover border border-purple-400/30"
                      />
                      <span className="text-xs font-medium text-slate-300">with Rohan Malhotra</span>
                    </div>
                    <button className="w-full py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs mt-2 transition-colors">
                      Join Room
                    </button>
                  </div>

                  {/* Mock Card 3 */}
                  <div className="bg-slate-900/80 rounded-2xl p-5 border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2.5 py-1 rounded-full">
                        Gamification
                      </span>
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-white">Level 3</span>
                      <span className="text-xs text-slate-400">1,450 / 2,000 XP</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full w-3/4" />
                    </div>
                    <div className="pt-2 flex justify-between text-xs text-slate-300">
                      <span>18 hrs Learned</span>
                      <span>24 hrs Taught</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Sleek horizontal boundary line dividing hero from Our Mission & Philosophy */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/35 to-transparent relative z-20" />
        </div>

        {/* ABOUT US SECTION */}
        <section id="about" className="py-24 bg-[#0e0c1a] border-b border-purple-900/30 text-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                  Our Mission & Philosophy
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Democratizing Knowledge Through Reciprocal Peer Mentorship
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Traditional education is broken: bloated prices, passive video lectures with 5% completion rates, and zero personal accountability. Connect Skill reintroduces the ancient tradition of apprenticeship and reciprocal guild learning.
                </p>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  By matching two minds where each possesses what the other seeks, learning transforms into an active, energized conversation. Our AI compatibility engine handles the discovery; our WebRTC video platform empowers the live interaction.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-900/30">
                  <div>
                    <h3 className="font-extrabold text-2xl sm:text-3xl text-white">20k+</h3>
                    <p className="text-xs text-slate-400">Skills Exchanged</p>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl sm:text-3xl text-purple-400">98%</h3>
                    <p className="text-xs text-slate-400">Match Satisfaction</p>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl sm:text-3xl text-white">₹0</h3>
                    <p className="text-xs text-slate-400">Cost to Exchange</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80"
                  alt="Team peer learning session"
                  className="rounded-3xl shadow-2xl object-cover w-full h-[440px] border border-purple-500/20"
                />
                <div className="absolute -bottom-6 -left-6 bg-[#161226]/95 p-5 rounded-2xl shadow-xl border border-purple-500/30 max-w-xs hidden sm:block backdrop-blur-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-950/90 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Feynman Technique</p>
                      <p className="text-xs text-slate-400">Teaching cements 90% retention.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-[#0c0a13] relative text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                Full-Stack Platform
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
                Engineered for Seamless Knowledge Transfer
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Every tool you need to discover peers, schedule sessions, mentor in HD video, track goals, and earn rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, idx) => {
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="bg-[#141022]/70 hover:bg-[#1a142c]/90 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-7 hover:shadow-glow-purple hover:-translate-y-1 transition-all space-y-4 group backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                        <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/20 text-purple-300">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{f.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-[#0e0c1a] border-y border-purple-900/30 text-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                Simple 4-Step Journey
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white">How Connect Skill Works</h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Go from registration to your first collaborative peer session in under 5 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((s, idx) => (
                <div key={s.step} className="relative p-6 rounded-2xl bg-[#141022]/80 border border-purple-500/20 hover:border-purple-500/40 space-y-3 transition-colors">
                  <span className="text-3xl font-extrabold text-purple-400 font-mono">{s.step}</span>
                  <h3 className="font-bold text-lg text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BLOG SECTION */}
        <section id="blog" className="py-24 bg-[#0c0a13] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                  Articles & Pedagogy
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                  Latest from the Peer Learning Blog
                </h2>
              </div>
              <p className="text-sm text-slate-400 mt-2 md:mt-0">Insights on cognitive mastery, language hacks, and design</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogs.slice(0, 6).map((blog) => (
                <div
                  key={blog._id}
                  className="bg-[#141022]/70 hover:bg-[#1a142c]/90 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl overflow-hidden hover:shadow-glow-purple transition-all flex flex-col group backdrop-blur-md"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-3 left-3 bg-[#0c0a13]/90 border border-purple-500/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-purple-200 uppercase">
                      {blog.category}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-purple-500/15 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <img src={blog.authorAvatar} alt={blog.author} className="w-6 h-6 rounded-full object-cover border border-purple-400/30" />
                        <span className="text-slate-300">{blog.author}</span>
                      </div>
                      <span className="text-purple-300/80">{blog.readTime} min read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="py-24 bg-[#0e0c1a] border-y border-purple-900/30 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                Real Stories
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
                Loved by Curious Learners Worldwide
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-[#141022]/70 border border-purple-500/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-purple-500/15 flex items-center space-x-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-purple-400/30" />
                    <div>
                      <h4 className="font-bold text-xs text-white">{t.name}</h4>
                      <p className="text-[10px] text-purple-400 font-medium">{t.skill}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="text-center space-y-4 mb-14">
            <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-purple-500/20 bg-[#141022]/70 overflow-hidden shadow-sm transition-colors hover:border-purple-500/40"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-purple-300 focus:outline-none transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-purple-400 transition-transform ${
                        isOpen ? 'rotate-180 text-purple-400' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-purple-500/15 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-24 bg-[#0e0c1a] border-t border-purple-900/30 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1 rounded-full inline-block">
                  We're Here to Help
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Get in Touch With the Connect Skill Community Team
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Have an institutional partnership inquiry, feedback on our AI match accuracy, or need technical help? Send us a note and we will reply within 24 hours.
                </p>
                <div className="space-y-3 text-xs text-slate-400 pt-2">
                  <p>📍 Sector 67, Mohali, Punjab, India & Global Remote Guilds</p>
                  <p>✉️ support@Connect Skill.app</p>
                  <p>⏱️ Average Response Time: 4 Hours</p>
                </div>
              </div>

              {/* Form */}
              <div className="bg-[#141022]/85 p-8 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-md">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a13] border border-purple-500/30 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder=""
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a13] border border-purple-500/30 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a13] border border-purple-500/30 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder=""
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0c0a13] border border-purple-500/30 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-950/50 hover:shadow-glow flex items-center justify-center space-x-2 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
export default LandingPage;
