require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Session = require('../models/Session');
const Goal = require('../models/Goal');
const Badge = require('../models/Badge');
const Transaction = require('../models/Transaction');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Challenge = require('../models/Challenge');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Skill = require('../models/Skill');
const Blog = require('../models/Blog');

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB for seeding');
    }

    console.log('🧹 Clearing old data and indexes...');
    try {
      await mongoose.connection.db.collection('connections').drop().catch(() => {});
      await mongoose.connection.db.collection('users').drop().catch(() => {});
      await mongoose.connection.db.collection('conversations').drop().catch(() => {});
      await mongoose.connection.db.collection('messages').drop().catch(() => {});
      await mongoose.connection.db.collection('sessions').drop().catch(() => {});
      await mongoose.connection.db.collection('goals').drop().catch(() => {});
      await mongoose.connection.db.collection('badges').drop().catch(() => {});
      await mongoose.connection.db.collection('transactions').drop().catch(() => {});
      await mongoose.connection.db.collection('communities').drop().catch(() => {});
      await mongoose.connection.db.collection('posts').drop().catch(() => {});
      await mongoose.connection.db.collection('comments').drop().catch(() => {});
      await mongoose.connection.db.collection('events').drop().catch(() => {});
      await mongoose.connection.db.collection('challenges').drop().catch(() => {});
      await mongoose.connection.db.collection('reviews').drop().catch(() => {});
      await mongoose.connection.db.collection('notifications').drop().catch(() => {});
      await mongoose.connection.db.collection('skills').drop().catch(() => {});
      await mongoose.connection.db.collection('blogs').drop().catch(() => {});
    } catch (e) {
      console.log('Collections drop note:', e.message);
    }

    console.log('🎖️ Seeding Badges...');
    const badgesData = [
      { name: 'First Swap', description: 'Completed your very first skill exchange session.', icon: '🎯', category: 'achievement', criteria: 'Complete 1 session', xpReward: 50, rarity: 'common' },
      { name: 'Knowledge Sharer', description: 'Taught 5 learning sessions to community peers.', icon: '💡', category: 'teaching', criteria: 'Host 5 sessions', xpReward: 150, rarity: 'uncommon' },
      { name: 'Master Mentor', description: 'Maintained a 4.9+ rating across 10 teaching sessions.', icon: '🏆', category: 'teaching', criteria: '10 sessions with 4.9+ rating', xpReward: 300, rarity: 'rare' },
      { name: 'Curious Mind', description: 'Learned 3 distinct new skills on SkillSwap.', icon: '🧠', category: 'learning', criteria: 'Complete sessions in 3 different skills', xpReward: 100, rarity: 'common' },
      { name: 'Community Pillar', description: 'Actively contributed to discussions and helped 20+ members.', icon: '🌟', category: 'community', criteria: 'Create 10 posts or comments', xpReward: 200, rarity: 'rare' },
      { name: 'Polymath', description: 'Reached level 10 and exchanged over 100 Skill Points.', icon: '👑', category: 'special', criteria: 'Level 10 & 100 SP spent', xpReward: 500, rarity: 'legendary' },
    ];
    const badges = await Badge.insertMany(badgesData);
    const badgeMap = {};
    badges.forEach((b) => (badgeMap[b.name] = b._id));

    console.log('📚 Seeding Skills...');
    const skillsData = [
      { name: 'React & Next.js', category: 'Programming', icon: '⚛️', description: 'Modern web UI development with component architecture.' },
      { name: 'Python & Data Science', category: 'Programming', icon: '🐍', description: 'Data analysis, pandas, numpy, and machine learning.' },
      { name: 'Node.js & Express', category: 'Programming', icon: '🟢', description: 'Backend APIs, microservices, and server-side JS.' },
      { name: 'UI/UX Design in Figma', category: 'Design', icon: '🎨', description: 'User-centered design, prototyping, and wireframing.' },
      { name: 'Acoustic Guitar', category: 'Music', icon: '🎸', description: 'Chords, fingerstyle, rhythm, and song accompaniment.' },
      { name: 'Conversational Spanish', category: 'Languages', icon: '🇪🇸', description: 'Grammar, vocabulary, and fluent speaking practice.' },
      { name: 'Artisan Sourdough & Baking', category: 'Cooking', icon: '🥖', description: 'Fermentation, scoring, hydration, and oven baking.' },
      { name: 'Calisthenics & Strength', category: 'Fitness', icon: '💪', description: 'Bodyweight training, pull-ups, push-ups, and mobility.' },
      { name: 'Digital Growth Marketing', category: 'Marketing', icon: '📈', description: 'SEO, performance marketing, and conversion funnels.' },
      { name: 'Portrait Photography & Lightroom', category: 'Photography', icon: '📸', description: 'Lighting setups, composition, and RAW post-processing.' },
      { name: 'Personal Finance & Investing', category: 'Finance', icon: '💰', description: 'Budgeting, index funds, and wealth management.' },
      { name: 'Creative Fiction & Storytelling', category: 'Writing', icon: '✍️', description: 'Worldbuilding, character arcs, and dialogue craft.' },
    ];
    await Skill.insertMany(skillsData);

    console.log('👥 Seeding Users...');
    const hashedUserPass = await bcrypt.hash('Demo@1234', 12);
    const hashedAdminPass = await bcrypt.hash('Admin@1234', 12);

    const demoUser = await User.create({
      name: 'Aarav Sharma',
      email: 'demo@skillswap.com',
      password: hashedUserPass,
      avatar: 'https://images.unsplash.com/photo-1622461828279-f028ae93a63b?w=400&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      bio: 'Full-stack software developer passionate about building intuitive products. Learning conversational Spanish and acoustic guitar, happy to teach React, TypeScript, and Node.js!',
      skillsTeaching: ['React & Next.js', 'Node.js & Express'],
      skillsLearning: ['Conversational Spanish', 'Acoustic Guitar', 'UI/UX Design in Figma'],
      experienceLevel: 'advanced',
      availability: [
        { day: 'Mon', startTime: '18:00', endTime: '21:00' },
        { day: 'Wed', startTime: '18:00', endTime: '21:00' },
        { day: 'Sat', startTime: '10:00', endTime: '15:00' },
      ],
      socialLinks: {
        github: 'https://github.com/alexrivera',
        linkedin: 'https://linkedin.com/in/alexrivera',
        twitter: 'https://twitter.com/alexrivera_dev',
      },
      skillPoints: 180,
      xp: 1450,
      level: 3,
      learningHours: 18,
      teachingHours: 24,
      sessionsCompleted: 12,
      sessionsHosted: 15,
      rating: 4.9,
      reviewCount: 14,
      profileCompleted: true,
      isEmailVerified: true,
      role: 'user',
      badges: [badgeMap['First Swap'], badgeMap['Knowledge Sharer'], badgeMap['Curious Mind']],
    });

    const adminUser = await User.create({
      name: 'Pooja Verma (Admin)',
      email: 'admin@skillswap.com',
      password: hashedAdminPass,
      avatar: 'https://images.unsplash.com/photo-1706943262459-3ef6ce03305c?w=400&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
      bio: 'SkillSwap Platform Director & Head of Community. Helping curious minds connect and share knowledge across borders.',
      skillsTeaching: ['UI/UX Design in Figma', 'Digital Growth Marketing'],
      skillsLearning: ['Python & Data Science'],
      experienceLevel: 'expert',
      availability: [
        { day: 'Tue', startTime: '17:00', endTime: '20:00' },
        { day: 'Thu', startTime: '17:00', endTime: '20:00' },
      ],
      skillPoints: 500,
      xp: 4200,
      level: 9,
      learningHours: 35,
      teachingHours: 60,
      sessionsCompleted: 28,
      sessionsHosted: 45,
      rating: 5.0,
      reviewCount: 38,
      profileCompleted: true,
      isEmailVerified: true,
      role: 'admin',
      badges: [badgeMap['First Swap'], badgeMap['Knowledge Sharer'], badgeMap['Master Mentor'], badgeMap['Community Pillar']],
    });

    // 20+ realistic peers
    const samplePeers = [
      {
        name: 'Ananya Iyer',
        email: 'sofia.chen@example.com',
        avatar: 'https://images.unsplash.com/photo-1706943262459-3ef6ce03305c?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Native Spanish speaker and linguist from Barcelona. Love sharing my mother tongue and learning modern web development!',
        skillsTeaching: ['Conversational Spanish'],
        skillsLearning: ['React & Next.js', 'Python & Data Science'],
        experienceLevel: 'expert',
        skillPoints: 120,
        xp: 850,
        level: 2,
        rating: 4.9,
        reviewCount: 11,
      },
      {
        name: 'Rohan Malhotra',
        email: 'marcus.v@example.com',
        avatar: 'https://images.unsplash.com/photo-1622461828279-f028ae93a63b?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
        bio: 'Professional guitarist and music instructor with 12 years of live tour experience. Keen on learning digital product design.',
        skillsTeaching: ['Acoustic Guitar'],
        skillsLearning: ['UI/UX Design in Figma'],
        experienceLevel: 'expert',
        skillPoints: 140,
        xp: 1200,
        level: 3,
        rating: 5.0,
        reviewCount: 16,
      },
      {
        name: 'Aisha Al-Mansoor',
        email: 'aisha.m@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
        bio: 'Senior UX Architect at fintech startup. Figma wizard, design systems nerd. Looking to get better at Python data scraping.',
        skillsTeaching: ['UI/UX Design in Figma'],
        skillsLearning: ['Python & Data Science', 'React & Next.js'],
        experienceLevel: 'advanced',
        skillPoints: 210,
        xp: 2200,
        level: 5,
        rating: 4.8,
        reviewCount: 22,
      },
      {
        name: 'Liam O’Connor',
        email: 'liam.oc@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
        bio: 'Artisan baker and culinary enthusiast. Flour, water, salt, time. Looking to master digital marketing for my micro-bakery.',
        skillsTeaching: ['Artisan Sourdough & Baking'],
        skillsLearning: ['Digital Growth Marketing'],
        experienceLevel: 'expert',
        skillPoints: 90,
        xp: 600,
        level: 2,
        rating: 4.9,
        reviewCount: 8,
      },
      {
        name: 'Maya Patel',
        email: 'maya.p@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        bio: 'Data Scientist & AI Researcher. Math graduate who loves teaching Python, Pandas, and Neural Nets. Want to learn guitar!',
        skillsTeaching: ['Python & Data Science'],
        skillsLearning: ['Acoustic Guitar', 'Conversational Spanish'],
        experienceLevel: 'advanced',
        skillPoints: 175,
        xp: 1800,
        level: 4,
        rating: 5.0,
        reviewCount: 19,
      },
      {
        name: 'David Kim',
        email: 'david.kim@example.com',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
        bio: 'Certified strength and mobility coach. Helping desk-bound developers stay pain-free. Want to learn personal finance & investing.',
        skillsTeaching: ['Calisthenics & Strength'],
        skillsLearning: ['Personal Finance & Investing'],
        experienceLevel: 'advanced',
        skillPoints: 130,
        xp: 950,
        level: 2,
        rating: 4.7,
        reviewCount: 10,
      },
      {
        name: 'Chloe Bennett',
        email: 'chloe.b@example.com',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Editorial & portrait photographer. Published in Vogue & Dwell. Ready to teach studio lighting and Lightroom.',
        skillsTeaching: ['Portrait Photography & Lightroom'],
        skillsLearning: ['UI/UX Design in Figma'],
        experienceLevel: 'expert',
        skillPoints: 160,
        xp: 1350,
        level: 3,
        rating: 4.9,
        reviewCount: 15,
      },
      {
        name: 'Julian Thorne',
        email: 'julian.t@example.com',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
        bio: 'Ex-hedge fund analyst and financial educator. Passionate about compound interest and index investing.',
        skillsTeaching: ['Personal Finance & Investing'],
        skillsLearning: ['React & Next.js'],
        experienceLevel: 'expert',
        skillPoints: 230,
        xp: 2500,
        level: 5,
        rating: 4.9,
        reviewCount: 26,
      },
      {
        name: 'Amara Okafor',
        email: 'amara.o@example.com',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
        bio: 'Novelist and creative writing teacher. MFA graduate. I teach storytelling, narrative arc, and dialogue mastery.',
        skillsTeaching: ['Creative Fiction & Storytelling'],
        skillsLearning: ['Conversational Spanish'],
        experienceLevel: 'advanced',
        skillPoints: 110,
        xp: 750,
        level: 2,
        rating: 5.0,
        reviewCount: 9,
      },
      {
        name: 'Tariq Hassan',
        email: 'tariq.h@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
        bio: 'Growth lead at series-B SaaS. Scaled from 0 to $5M ARR. Teaching SEO, email automations, and viral loops.',
        skillsTeaching: ['Digital Growth Marketing'],
        skillsLearning: ['Node.js & Express'],
        experienceLevel: 'advanced',
        skillPoints: 190,
        xp: 1600,
        level: 4,
        rating: 4.8,
        reviewCount: 14,
      },
      {
        name: 'Zoe Martinez',
        email: 'zoe.m@example.com',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
        bio: 'Frontend engineer & React core contributor wannabe. Teaching CSS architecture, tailwind, and animations.',
        skillsTeaching: ['React & Next.js'],
        skillsLearning: ['Portrait Photography & Lightroom'],
        experienceLevel: 'intermediate',
        skillPoints: 95,
        xp: 650,
        level: 2,
        rating: 4.6,
        reviewCount: 7,
      },
      {
        name: 'Kenji Takahashi',
        email: 'kenji.t@example.com',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
        bio: 'Backend systems engineer specializing in Node, Go, and Redis. Passionate about sourdough baking!',
        skillsTeaching: ['Node.js & Express'],
        skillsLearning: ['Artisan Sourdough & Baking'],
        experienceLevel: 'advanced',
        skillPoints: 140,
        xp: 1100,
        level: 3,
        rating: 4.9,
        reviewCount: 13,
      },
      {
        name: 'Freja Lind',
        email: 'freja.l@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Swedish designer with a love for brutalist web design and Scandinavian minimalist typography.',
        skillsTeaching: ['UI/UX Design in Figma'],
        skillsLearning: ['Calisthenics & Strength'],
        experienceLevel: 'expert',
        skillPoints: 170,
        xp: 1500,
        level: 4,
        rating: 5.0,
        reviewCount: 18,
      },
      {
        name: 'Gabriel Santos',
        email: 'gabriel.s@example.com',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        bio: 'Bossa nova and classical guitar enthusiast from Rio. Can teach fingerstyle tabs and ear training.',
        skillsTeaching: ['Acoustic Guitar'],
        skillsLearning: ['React & Next.js'],
        experienceLevel: 'intermediate',
        skillPoints: 85,
        xp: 500,
        level: 2,
        rating: 4.8,
        reviewCount: 6,
      },
      {
        name: 'Isabella Rossi',
        email: 'isabella.r@example.com',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop&q=80',
        bio: 'Italian home chef and culinary historian. Teaching authentic pasta from scratch and sourdough.',
        skillsTeaching: ['Artisan Sourdough & Baking'],
        skillsLearning: ['Conversational Spanish'],
        experienceLevel: 'advanced',
        skillPoints: 155,
        xp: 1250,
        level: 3,
        rating: 5.0,
        reviewCount: 15,
      },
      {
        name: 'Nikhil Sharma',
        email: 'nikhil.s@example.com',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        bio: 'Machine learning engineer at cloud provider. LLMs, PyTorch, LangChain. Learning calisthenics.',
        skillsTeaching: ['Python & Data Science'],
        skillsLearning: ['Calisthenics & Strength'],
        experienceLevel: 'expert',
        skillPoints: 200,
        xp: 2100,
        level: 5,
        rating: 4.9,
        reviewCount: 20,
      },
      {
        name: 'Hannah Abbott',
        email: 'hannah.a@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop&q=80',
        bio: 'Screenwriter & copywriter. Master of dialogue and narrative hooks. Want to learn digital marketing.',
        skillsTeaching: ['Creative Fiction & Storytelling'],
        skillsLearning: ['Digital Growth Marketing'],
        experienceLevel: 'intermediate',
        skillPoints: 105,
        xp: 700,
        level: 2,
        rating: 4.8,
        reviewCount: 8,
      },
      {
        name: 'Victor Vance',
        email: 'victor.v@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Travel photographer and drone videographer. Teaching composition, color grading, and speed-lighting.',
        skillsTeaching: ['Portrait Photography & Lightroom'],
        skillsLearning: ['Personal Finance & Investing'],
        experienceLevel: 'advanced',
        skillPoints: 135,
        xp: 1000,
        level: 3,
        rating: 4.9,
        reviewCount: 11,
      },
      {
        name: 'Rachel Green',
        email: 'rachel.g@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
        bio: 'Certified financial planner. Believer in low-cost index investing, FIRE movement, and stress-free retirement.',
        skillsTeaching: ['Personal Finance & Investing'],
        skillsLearning: ['Creative Fiction & Storytelling'],
        experienceLevel: 'advanced',
        skillPoints: 165,
        xp: 1400,
        level: 3,
        rating: 5.0,
        reviewCount: 17,
      },
      {
        name: 'Lucas Bernard',
        email: 'lucas.b@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
        bio: 'Gymnastic coach and movement specialist. Handstands, muscle-ups, and active flexibility.',
        skillsTeaching: ['Calisthenics & Strength'],
        skillsLearning: ['Acoustic Guitar'],
        experienceLevel: 'expert',
        skillPoints: 180,
        xp: 1700,
        level: 4,
        rating: 4.9,
        reviewCount: 19,
      },
    ];

    const createdPeers = [];
    for (const peer of samplePeers) {
      const u = await User.create({
        ...peer,
        password: hashedUserPass,
        profileCompleted: true,
        isEmailVerified: true,
        role: 'user',
        availability: [
          { day: 'Tue', startTime: '16:00', endTime: '19:00' },
          { day: 'Thu', startTime: '16:00', endTime: '19:00' },
          { day: 'Sun', startTime: '11:00', endTime: '16:00' },
        ],
        badges: [badgeMap['First Swap'], badgeMap['Knowledge Sharer']],
      });
      createdPeers.push(u);
    }

    console.log('🤝 Seeding Connections...');
    // Connect demo user with Sofia (accepted)
    await Connection.create({
      requester: demoUser._id,
      recipient: createdPeers[0]._id, // Sofia Chen
      status: 'accepted',
      matchScore: 94,
      aiReason: 'Alex teaches React which Sofia wants, while Sofia teaches Spanish which Alex is eager to master!',
      skillsToExchange: {
        requesterTeaches: ['React & Next.js'],
        recipientTeaches: ['Conversational Spanish'],
      },
    });

    // Connect demo user with Marcus (accepted)
    await Connection.create({
      requester: createdPeers[1]._id, // Marcus
      recipient: demoUser._id,
      status: 'accepted',
      matchScore: 88,
      aiReason: 'Marcus is an acoustic guitar pro, and Alex has guitar in his active learning wishlist.',
      skillsToExchange: {
        requesterTeaches: ['Acoustic Guitar'],
        recipientTeaches: ['React & Next.js'],
      },
    });

    // Pending request from Aisha to Demo User
    await Connection.create({
      requester: createdPeers[2]._id, // Aisha
      recipient: demoUser._id,
      status: 'pending',
      matchScore: 91,
      aiReason: 'Aisha can mentor Alex in Figma UI/UX in exchange for Next.js fullstack architectural mentoring.',
      skillsToExchange: {
        requesterTeaches: ['UI/UX Design in Figma'],
        recipientTeaches: ['React & Next.js'],
      },
    });

    console.log('💬 Seeding Conversations & Messages...');
    // Conversation 1: Alex & Sofia
    const conv1 = await Conversation.create({
      participants: [demoUser._id, createdPeers[0]._id],
      lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    const m1 = await Message.create({
      conversation: conv1._id,
      sender: createdPeers[0]._id,
      content: '¡Hola Alex! Great connecting with you. Ready for our Spanish exchange this week?',
      type: 'text',
      readBy: [createdPeers[0]._id, demoUser._id],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    const m2 = await Message.create({
      conversation: conv1._id,
      sender: demoUser._id,
      content: 'Hola Sofia! Absolutely. I prepared a mini syllabus on React component state for you too!',
      type: 'text',
      readBy: [createdPeers[0]._id, demoUser._id],
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
    });

    const m3 = await Message.create({
      conversation: conv1._id,
      sender: createdPeers[0]._id,
      content: 'Perfect! Shall we book a 60-min session on Wednesday evening at 6 PM?',
      type: 'text',
      readBy: [createdPeers[0]._id, demoUser._id],
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    });
    conv1.lastMessage = m3._id;
    await conv1.save();

    // Conversation 2: Alex & Marcus
    const conv2 = await Conversation.create({
      participants: [demoUser._id, createdPeers[1]._id],
      lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    });

    const m4 = await Message.create({
      conversation: conv2._id,
      sender: createdPeers[1]._id,
      content: 'Hey Alex, don’t forget to tune your strings before our acoustic fingerpicking drill!',
      type: 'text',
      readBy: [createdPeers[1]._id, demoUser._id],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    });
    conv2.lastMessage = m4._id;
    await conv2.save();

    console.log('📅 Seeding Sessions...');
    // Upcoming session
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(19, 0, 0, 0);

    await Session.create({
      host: createdPeers[0]._id, // Sofia
      participant: demoUser._id,
      skill: 'Conversational Spanish',
      title: 'Spanish Basics & Conversational Practice #1',
      description: 'Covering essential greetings, cafe ordering, and pronunciation drills.',
      date: tomorrow,
      startTime: '18:00',
      endTime: '19:00',
      duration: 60,
      status: 'confirmed',
      spCost: 10,
      roomId: 'room-spanish-101',
    });

    // Upcoming session 2
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(15, 0, 0, 0);

    await Session.create({
      host: demoUser._id,
      participant: createdPeers[0]._id,
      skill: 'React & Next.js',
      title: 'Next.js App Router & Server Components',
      description: 'Hands-on project structuring and responsive layouts.',
      date: in3Days,
      startTime: '15:00',
      endTime: '16:00',
      duration: 60,
      status: 'confirmed',
      spCost: 10,
      roomId: 'room-nextjs-201',
    });

    // Completed session
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 5);

    const completedSession = await Session.create({
      host: createdPeers[1]._id, // Marcus
      participant: demoUser._id,
      skill: 'Acoustic Guitar',
      title: 'Fingerstyle Chords & Rhythm Foundation',
      description: 'Mastering the basic G-C-Em progression with fingerpicking.',
      date: lastWeek,
      startTime: '17:00',
      endTime: '18:00',
      duration: 60,
      status: 'completed',
      spCost: 10,
      rating: 5,
      feedback: 'Alex practiced diligently and picked up the fingerpicking pattern super fast!',
      roomId: 'room-guitar-01',
    });

    console.log('⭐ Seeding Reviews...');
    await Review.create({
      reviewer: createdPeers[1]._id,
      reviewee: demoUser._id,
      session: completedSession._id,
      rating: 5,
      comment: 'Alex is an inquisitive learner and brought great energy to our music session.',
      skill: 'Acoustic Guitar',
    });

    await Review.create({
      reviewer: demoUser._id,
      reviewee: createdPeers[1]._id,
      session: completedSession._id,
      rating: 5,
      comment: 'Marcus is a patient maestro! His breakdown of acoustic rhythm made it finally click for me.',
      skill: 'Acoustic Guitar',
    });

    console.log('🎯 Seeding Goals...');
    await Goal.create({
      user: demoUser._id,
      title: 'Master Everyday Conversational Spanish',
      description: 'Hold a confident 15-minute conversation with native speakers without switching to English.',
      skill: 'Conversational Spanish',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: 60,
      status: 'active',
      xpReward: 150,
      tasks: [
        { title: 'Learn 100 high-frequency verbs', completed: true },
        { title: 'Complete 3 peer exchange sessions', completed: true },
        { title: 'Record a 2-minute monologue in Spanish', completed: false },
        { title: 'Watch a Spanish short film without subtitles', completed: false },
      ],
    });

    await Goal.create({
      user: demoUser._id,
      title: 'Acoustic Fingerstyle: Hotel California Intro',
      description: 'Learn and smoothly play the iconic acoustic intro at full tempo.',
      skill: 'Acoustic Guitar',
      targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      progress: 33,
      status: 'active',
      xpReward: 120,
      tasks: [
        { title: 'Memorize the 12-string chord voicings', completed: true },
        { title: 'Practice thumb-finger separation with metronome', completed: false },
        { title: 'Perform complete take without pauses', completed: false },
      ],
    });

    console.log('💰 Seeding Transactions...');
    await Transaction.create({
      user: demoUser._id,
      type: 'bonus',
      amount: 100,
      description: 'Welcome bonus! Start exchanging skills.',
      balance: 100,
    });
    await Transaction.create({
      user: demoUser._id,
      type: 'earned',
      amount: 50,
      description: 'Teaching session: React Component Architecture',
      balance: 150,
    });
    await Transaction.create({
      user: demoUser._id,
      type: 'earned',
      amount: 40,
      description: 'Community challenge completion reward',
      balance: 190,
    });
    await Transaction.create({
      user: demoUser._id,
      type: 'spent',
      amount: 10,
      description: 'Booked session: Spanish Basics & Conversational Practice',
      balance: 180,
    });

    console.log('🌐 Seeding Communities...');
    const communitiesData = [
      {
        name: 'Web Craft & Modern Frontend',
        description: 'React, Next.js, Vue, Tailwind, UI architecture, and modern JavaScript craft.',
        icon: '💻',
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
        category: 'Programming',
        memberCount: 340,
        tags: ['React', 'Next.js', 'Frontend', 'TypeScript'],
        createdBy: adminUser._id,
      },
      {
        name: 'Polyglot Lounge: World Languages',
        description: 'Practice Spanish, French, Japanese, Mandarin, and connect with native speakers daily.',
        icon: '🗣️',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        category: 'Languages',
        memberCount: 520,
        tags: ['Spanish', 'French', 'Japanese', 'Speaking'],
        createdBy: createdPeers[0]._id,
      },
      {
        name: 'Acoustic & String Instruments',
        description: 'Guitarists, ukulele players, bassists sharing tabs, fingerstyle techniques, and chord charts.',
        icon: '🎸',
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
        category: 'Music',
        memberCount: 280,
        tags: ['Guitar', 'Acoustic', 'Music', 'Chords'],
        createdBy: createdPeers[1]._id,
      },
      {
        name: 'UI/UX & Product Design Collective',
        description: 'Critique designs, build design systems, test prototypes, and master Figma workflows.',
        icon: '🎨',
        coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&auto=format&fit=crop&q=80',
        category: 'Design',
        memberCount: 410,
        tags: ['Figma', 'UI/UX', 'Design Systems', 'Prototypes'],
        createdBy: createdPeers[2]._id,
      },
      {
        name: 'Data Science & Applied AI Lab',
        description: 'Python pipelines, PyTorch models, Groq & LLM prompting, and practical dataset explorations.',
        icon: '🧪',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        category: 'Programming',
        memberCount: 395,
        tags: ['Python', 'AI', 'Machine Learning', 'Data'],
        createdBy: createdPeers[4]._id,
      },
      {
        name: 'Mindful Movement & Calisthenics',
        description: 'Bodyweight progressions, handstand balance, joint mobility, and desk fatigue recovery.',
        icon: '🧘',
        coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
        category: 'Fitness',
        memberCount: 230,
        tags: ['Calisthenics', 'Mobility', 'Fitness', 'Strength'],
        createdBy: createdPeers[5]._id,
      },
    ];

    const communities = await Community.insertMany(communitiesData);
    demoUser.communities = [communities[0]._id, communities[1]._id, communities[2]._id];
    await demoUser.save();

    console.log('📝 Seeding Community Posts & Comments...');
    const post1 = await Post.create({
      author: demoUser._id,
      community: communities[0]._id,
      content: 'Just wrapped up a dynamic dashboard build with Tailwind and Framer Motion! What is everyone’s favorite micro-interaction library for subtle spring effects in React?',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      reactions: {
        likes: [createdPeers[0]._id, createdPeers[1]._id],
        hearts: [createdPeers[2]._id],
        fires: [adminUser._id],
      },
      commentCount: 2,
    });

    await Comment.create({
      post: post1._id,
      author: createdPeers[2]._id, // Aisha
      content: 'Framer Motion with layoutId is magic for smooth tab transitions! Love the clean glassmorphic aesthetic in your preview.',
    });

    await Comment.create({
      post: post1._id,
      author: adminUser._id,
      content: 'Great visual hierarchy Alex. Looking forward to your Next.js session this weekend.',
    });

    const post2 = await Post.create({
      author: createdPeers[0]._id, // Sofia
      community: communities[1]._id,
      content: 'Weekly Spanish Challenge: Try describing your breakfast today using only Spanish adjectives! E.g. "Un café caliente y tostadas crujientes con mermelada dulce." Drop yours below!',
      reactions: {
        likes: [demoUser._id, createdPeers[3]._id],
        hearts: [demoUser._id],
        fires: [],
      },
      commentCount: 1,
    });

    await Comment.create({
      post: post2._id,
      author: demoUser._id,
      content: 'Un té verde aromático y pan fresco con aceite de oliva. ¡Mucho delicioso!',
    });

    const post3 = await Post.create({
      author: createdPeers[1]._id, // Marcus
      community: communities[2]._id,
      content: 'Pro tip for acoustic players: if your barre chords buzz, check your thumb placement behind the neck—it should align directly with your middle finger, not wrapped around!',
      reactions: {
        likes: [demoUser._id, createdPeers[6]._id],
        hearts: [demoUser._id],
        fires: [createdPeers[6]._id],
      },
      commentCount: 0,
    });

    console.log('🎪 Seeding Events & Workshops...');
    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 4);

    const eventDate2 = new Date();
    eventDate2.setDate(eventDate2.getDate() + 7);

    await Event.create({
      title: 'Live Workshop: Building Accessible Design Systems in Figma',
      description: 'Join Aisha for a 90-minute practical session on color contrast tokens, semantic components, and variable modes.',
      community: communities[3]._id,
      organizer: createdPeers[2]._id,
      type: 'workshop',
      date: eventDate1,
      startTime: '19:00',
      endTime: '20:30',
      coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&auto=format&fit=crop&q=80',
      attendees: [demoUser._id, createdPeers[0]._id, createdPeers[1]._id],
      maxAttendees: 50,
      tags: ['Design', 'Figma', 'Accessibility'],
    });

    await Event.create({
      title: 'Global Polyglot Speed-Exchange Meetup',
      description: 'Hop into 10-minute 1-on-1 breakout rooms with native speakers of Spanish, French, and Japanese.',
      community: communities[1]._id,
      organizer: createdPeers[0]._id,
      type: 'meetup',
      date: eventDate2,
      startTime: '18:00',
      endTime: '19:30',
      coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
      attendees: [demoUser._id, createdPeers[4]._id],
      maxAttendees: 80,
      tags: ['Languages', 'SpeedExchange', 'Global'],
    });

    console.log('🏆 Seeding Challenges...');
    await Challenge.create({
      title: '30-Day Daily Habit Sprint',
      description: 'Commit to at least 20 minutes of daily practice or peer review in your chosen skill track.',
      community: communities[0]._id,
      skill: 'React & Next.js',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      participants: [demoUser._id, createdPeers[0]._id, createdPeers[1]._id],
      xpReward: 300,
      spReward: 75,
      coverImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&auto=format&fit=crop&q=80',
      status: 'active',
      tasks: [
        { title: 'Week 1: Document daily progress in community feed', order: 1 },
        { title: 'Week 2: Host 1 peer review exchange', order: 2 },
        { title: 'Week 3: Build a mini demo or record a performance', order: 3 },
        { title: 'Week 4: Final showcase & reflection', order: 4 },
      ],
    });

    console.log('📰 Seeding Blogs...');
    const blogsData = [
      {
        title: 'The Power of Reciprocal Peer Learning in the Age of AI',
        excerpt: 'Why exchanging human perspective and lived expertise is more valuable than ever in an automated world.',
        content: 'Peer learning is founded on the Feynman technique: the deepest way to cement knowledge is to explain it to someone else. When we combine AI-driven compatibility matching with bilateral skill swaps, both parties experience accelerated cognitive growth...',
        coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
        author: 'Elena Rostova',
        authorAvatar: adminUser.avatar,
        category: 'Pedagogy',
        tags: ['PeerLearning', 'Education', 'AI'],
        readTime: 6,
      },
      {
        title: 'From Zero to Conversational: A Language Exchange Playbook',
        excerpt: 'How 30-minute structured peer sessions beat passive app tapping every single time.',
        content: 'Passive flashcards build vocabulary recognition, but real speech requires dynamic neuromuscular and emotional recall. By scheduling twice-weekly sessions focused on situational scenarios, learners cut fluency acquisition time in half...',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        author: 'Sofia Chen',
        authorAvatar: createdPeers[0].avatar,
        category: 'Languages',
        tags: ['Spanish', 'Polyglot', 'Speaking'],
        readTime: 5,
      },
      {
        title: 'Designing Without Borders: How Mentorship Unlocks Junior Talent',
        excerpt: 'Breaking into senior design roles through candid 1-on-1 portfolio breakdowns and design system critiques.',
        content: 'Junior portfolios often fall into the trap of generic case studies. In peer sessions with seasoned practitioners, juniors learn to articulate business trade-offs, accessibility dilemmas, and user metrics that hiring managers look for...',
        coverImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&auto=format&fit=crop&q=80',
        author: 'Aisha Al-Mansoor',
        authorAvatar: createdPeers[2].avatar,
        category: 'Design',
        tags: ['UI/UX', 'Mentorship', 'Career'],
        readTime: 4,
      },
      {
        title: 'Mastering the Metronome: Developing Impeccable Musical Timing',
        excerpt: 'Why internal pulse is the secret sauce between good players and unforgettable musicians.',
        content: 'Rhythm is often neglected in favor of speed. Yet a simple quarter-note groove executed with microsecond pocket precision will captivate listeners more than a hundred unmetered arpeggios...',
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
        author: 'Marcus Vance',
        authorAvatar: createdPeers[1].avatar,
        category: 'Music',
        tags: ['Guitar', 'Rhythm', 'Practice'],
        readTime: 5,
      },
      {
        title: 'The Art of Sourdough Hydration: A Baker’s Troubleshooting Guide',
        excerpt: 'Taming sticky doughs and achieving the elusive open crumb through controlled fermentation.',
        content: 'Baking sourdough is equal parts biochemistry and intuition. Temperature dictates fermentation speed far more aggressively than starter ratio. Here is how to adjust your bulk fermentation curve...',
        coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
        author: 'Liam O’Connor',
        authorAvatar: createdPeers[3].avatar,
        category: 'Cooking',
        tags: ['Baking', 'Sourdough', 'Fermentation'],
        readTime: 7,
      },
      {
        title: 'Demystifying Large Language Models for Non-Programmers',
        excerpt: 'How transformers actually work under the hood, explained with simple visual metaphors.',
        content: 'At their heart, LLMs are statistical prediction engines trained on billions of linguistic tokens. Understanding attention weights and temperature parameters empowers anyone to prompt with precision...',
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
        author: 'Maya Patel',
        authorAvatar: createdPeers[4].avatar,
        category: 'Technology',
        tags: ['AI', 'LLM', 'MachineLearning'],
        readTime: 6,
      },
    ];
    await Blog.insertMany(blogsData);

    console.log('🔔 Seeding Notifications...');
    await Notification.create({
      recipient: demoUser._id,
      sender: createdPeers[2]._id,
      type: 'match_request',
      title: 'New Match Request',
      message: 'Aisha Al-Mansoor wants to exchange UI/UX Design for React mentoring!',
      link: '/matches',
    });
    await Notification.create({
      recipient: demoUser._id,
      sender: createdPeers[0]._id,
      type: 'session_confirmed',
      title: 'Session Confirmed',
      message: 'Sofia Chen confirmed your Conversational Spanish session for tomorrow at 6:00 PM.',
      link: '/calendar',
    });

    console.log('\n======================================================');
    console.log('✅ SEEDING COMPLETE!');
    console.log('======================================================');
    console.log('👤 DEMO USER:  demo@skillswap.com  |  Demo@1234');
    console.log('🛡️ ADMIN USER: admin@skillswap.com |  Admin@1234');
    console.log('👥 Total Users Created: 22');
    console.log('💬 Active Conversations, Sessions, Goals, Communities seeded');
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = seedDatabase;
