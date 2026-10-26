import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';
import './ChatPage.css';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  CheckCheck,
  FileText,
  Search,
  X,
  ArrowLeft,
  UserPlus,
  Users,
  MessageSquare,
  BookOpen,
  Trash2,
} from 'lucide-react';

export const ChatPage = () => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const queryConversationId = searchParams.get('conversationId');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected chat ID:
  // - null: Nothing selected -> Show Connect Skill logo and name in center panel
  // - 'ai': AI Assistant selected
  // - string ID: Real conversation ID selected
  const [selectedChatId, setSelectedChatId] = useState(queryConversationId || null);

  // Real conversations & messages from MongoDB
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Delete chat confirmation modal state
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // New Chat / Member Search Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Active peer chat input
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [peerIsTyping, setPeerIsTyping] = useState(false);

  // Right sidebar panel visibility
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Voice note recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // AI Assistant state (Groq integration preserved)
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your Connect Skill AI Study Assistant. Ask me to break down complex concepts, draft learning roadmaps, or generate interactive quizzes for your peer sessions!',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Quick Schedule Modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    skill: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:00',
  });

  const messagesEndRef = useRef(null);
  const aiMessagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch real backend conversations from MongoDB
  const fetchConversations = async () => {
    try {
      const res = await API.get('/chat/conversations');
      const loadedConvs = res.data.conversations || [];
      setConversations(loadedConvs);
      return loadedConvs;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      const convs = await fetchConversations();

      if (queryConversationId) {
        setSelectedChatId(queryConversationId);
      } else if (queryUserId && user?._id && queryUserId !== user?._id) {
        try {
          const res = await API.post('/chat/conversations', { userId: queryUserId });
          if (res.data?.conversation) {
            const newConv = res.data.conversation;
            setConversations((prev) => {
              if (prev.some((c) => c._id === newConv._id)) return prev;
              return [newConv, ...prev];
            });
            setSelectedChatId(newConv._id);
          }
        } catch (err) {
          console.error('Failed to create or open conversation for URL user:', err);
        }
      }
    };

    initChat();
  }, [queryUserId, queryConversationId, user?._id]);

  // Determine active conversation & peer
  const isAiSelected = selectedChatId === 'ai';

  const activeConversation = useMemo(() => {
    if (!selectedChatId || isAiSelected) return null;
    return conversations.find((c) => c._id === selectedChatId) || null;
  }, [selectedChatId, isAiSelected, conversations]);

  const activePeer = useMemo(() => {
    if (!activeConversation) return null;
    return activeConversation.participants?.find((p) => p._id !== user?._id) || null;
  }, [activeConversation, user]);

  // Fetch real messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await API.get(`/chat/messages/${activeConversation._id}`);
        setMessages(res.data.messages || []);
        await API.put(`/chat/read/${activeConversation._id}`).catch(() => {});
        // Clear unread count locally
        setConversations((prev) =>
          prev.map((c) => (c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        toast.error('Could not load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit('chat:join', activeConversation._id);
    }

    return () => {
      if (socket) {
        socket.emit('chat:leave', activeConversation._id);
      }
    };
  }, [activeConversation?._id, socket]);

  // Socket listeners for real-time messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (!msg) return;

      // Update message list if current conversation
      if (activeConversation && msg.conversation === activeConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();

        // Mark as read if from peer
        if (msg.sender?._id !== user?._id) {
          API.put(`/chat/read/${activeConversation._id}`).catch(() => {});
        }
      }

      // Update conversation in sidebar list
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === msg.conversation);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        const updated = prev.map((c) => {
          if (c._id === msg.conversation) {
            return {
              ...c,
              lastMessage: msg,
              lastMessageAt: msg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        // Re-sort with latest message first
        return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    };

    const handleConversationUpdated = ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        const updated = prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    };

    const handleTyping = ({ userId, isTyping: typingState }) => {
      if (activePeer && activePeer._id === userId) {
        setPeerIsTyping(typingState);
      }
    };

    const handleConversationDeleted = ({ conversationId }) => {
      if (!conversationId) return;
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (selectedChatId === conversationId) {
        setSelectedChatId(null);
      }
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:conversation_updated', handleConversationUpdated);
    socket.on('chat:conversation_deleted', handleConversationDeleted);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:conversation_updated', handleConversationUpdated);
      socket.off('chat:conversation_deleted', handleConversationDeleted);
      socket.off('chat:typing', handleTyping);
    };
  }, [socket, activeConversation, activePeer, user, selectedChatId]);

  // Delete / Remove Conversation Handler
  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    setIsDeletingChat(true);
    const convId = conversationToDelete._id;

    try {
      await API.delete(`/chat/conversations/${convId}`);
      toast.success('Conversation removed from your chat list');
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (selectedChatId === convId) {
        setSelectedChatId(null);
      }
      setConversationToDelete(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error(err.response?.data?.message || 'Failed to remove conversation');
    } finally {
      setIsDeletingChat(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollAiToBottom = () => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerIsTyping]);

  useEffect(() => {
    if (isAiSelected) {
      scrollAiToBottom();
    }
  }, [aiChatMessages, isAiSelected]);

  // Handle typing debounce
  const handleTypingChange = (e) => {
    setMessageInput(e.target.value);
    if (!socket || !activeConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', {
        conversationId: activeConversation._id,
        userId: user?._id,
        isTyping: true,
      });
    }

    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:typing', {
        conversationId: activeConversation._id,
        userId: user?._id,
        isTyping: false,
      });
    }, 1500);
  };

  // Send message in active conversation
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const res = await API.post('/chat/messages', {
        conversationId: activeConversation._id,
        content,
        type: 'text',
      });

      const newMsg = res.data.message;

      // Add to messages list
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      // Emit to socket room for peer
      if (socket) {
        socket.emit('chat:message', newMsg);
      }

      // Update sidebar conversation preview
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: newMsg, lastMessageAt: newMsg.createdAt }
            : c
        );
        return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Upload file / photo in peer chat
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    const isImg = file.type.startsWith('image/');
    const toastId = toast.loading('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = uploadRes.data?.url;

      const res = await API.post('/chat/messages', {
        conversationId: activeConversation._id,
        content: isImg ? 'Shared an image' : file.name,
        type: isImg ? 'image' : 'file',
        fileUrl,
        fileName: file.name,
      });

      const newMsg = res.data.message;
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      if (socket) {
        socket.emit('chat:message', newMsg);
      }

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: newMsg, lastMessageAt: newMsg.createdAt }
            : c
        );
        return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });

      toast.success('Uploaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Upload failed', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  // Voice note recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voicenote-${Date.now()}.webm`, {
          type: 'audio/webm',
        });

        const formData = new FormData();
        formData.append('file', audioFile);
        const toastId = toast.loading('Sending voice note...');

        try {
          const uploadRes = await API.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const fileUrl = uploadRes.data?.url;

          if (activeConversation) {
            const res = await API.post('/chat/messages', {
              conversationId: activeConversation._id,
              content: 'Voice Note',
              type: 'voice',
              fileUrl,
            });

            const newMsg = res.data.message;
            setMessages((prev) => {
              if (prev.some((m) => m._id === newMsg._id)) return prev;
              return [...prev, newMsg];
            });

            if (socket) socket.emit('chat:message', newMsg);

            setConversations((prev) => {
              const updated = prev.map((c) =>
                c._id === activeConversation._id
                  ? { ...c, lastMessage: newMsg, lastMessageAt: newMsg.createdAt }
                  : c
              );
              return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            });

            toast.success('Voice note sent!', { id: toastId });
          }
        } catch (err) {
          toast.error('Failed to send voice note', { id: toastId });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast('Recording voice note... click mic again to send');
    } catch (err) {
      toast.error('Microphone permission denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // AI Assistant Query (Groq integration preserved)
  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { role: 'user', content: aiInput.trim() };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await API.post('/ai/chat', {
        messages: [...aiChatMessages, userMsg],
      });
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.response },
      ]);
    } catch (err) {
      setAiChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I hit an unexpected error. Please try again!' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Session Booking
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!activePeer || !activeConversation) return;

    try {
      await API.post('/sessions', {
        participantId: activePeer._id,
        skill: scheduleData.skill || activePeer.skillsTeaching?.[0] || 'General Skill',
        title: scheduleData.title || `Learning Session with ${activePeer.name}`,
        date: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        duration: 60,
        spCost: 10,
      });

      const inviteMsg = await API.post('/chat/messages', {
        conversationId: activeConversation._id,
        content: `📅 Scheduled a session: "${scheduleData.title || '1-on-1 Peer Session'}" on ${scheduleData.date} at ${scheduleData.startTime}.`,
        type: 'session-invite',
      });

      const newMsg = inviteMsg.data.message;
      setMessages((prev) => [...prev, newMsg]);
      if (socket) socket.emit('chat:message', newMsg);

      toast.success('Session booked and invitation sent!');
      setShowScheduleModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book session');
    }
  };

  // Search members to start a new chat
  const searchMembers = async (q = '') => {
    setLoadingMembers(true);
    try {
      const res = await API.get(`/profile/search?q=${encodeURIComponent(q)}`);
      setMemberResults(res.data.users || []);
    } catch (err) {
      console.error('Failed to search members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Start or open a conversation with a registered user
  const handleStartConversationWithUser = async (targetUserId) => {
    try {
      const res = await API.post('/chat/conversations', { userId: targetUserId });
      const conv = res.data.conversation;

      // Add to conversation list if not present
      setConversations((prev) => {
        if (prev.some((c) => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });

      setSelectedChatId(conv._id);
      setShowNewChatModal(false);
      setSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation');
    }
  };

  // Open member search modal
  const openMemberSearch = () => {
    setShowNewChatModal(true);
    searchMembers('');
  };

  // Filtered conversation list based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const peer = c.participants?.find((p) => p._id !== user?._id);
      return (
        peer?.name?.toLowerCase().includes(q) ||
        peer?.skillsTeaching?.some((s) => s.toLowerCase().includes(q)) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, user]);

  // Format message preview timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>Chat & AI Study Assistant | Connect Skill</title>
      </Helmet>

      <div className="chat-page-outer">
        <div className="chat-outer-shell">
          {/* Main 3-Column Container */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 rounded-[2rem] bg-white dark:bg-[#131424] border border-[#e8e6f3] dark:border-white/10 shadow-2xl overflow-hidden">
          {/* ========================================================= */}
          {/* COLUMN 1: LEFT SIDEBAR (CONVERSATIONS LIST & AI BOT PIN) */}
          {/* ========================================================= */}
          <div
            className={`md:col-span-4 lg:col-span-3 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-0 bg-slate-50/60 dark:bg-slate-900/60 ${
              selectedChatId !== null ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Sidebar Header & Search */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Messages</span>
                </h2>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={openMemberSearch}
                    className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/80 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-300 transition-colors flex items-center space-x-1 text-xs font-semibold"
                    title="Find members to chat"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </button>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {conversations.length}
                  </span>
                </div>
              </div>

              {/* Chat Search Functionality */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search chats or members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* ITEM 1: PERMANENT PINNED AI ASSISTANT (AT TOP OF SIDEBAR) */}
              <div className="p-2 bg-gradient-to-r from-purple-500/5 via-brand-500/10 to-indigo-500/5 border-b border-purple-200/60 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setSelectedChatId('ai')}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl flex items-center space-x-3 text-left transition-all relative overflow-hidden group ${
                    isAiSelected
                      ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-md ring-2 ring-brand-400/50'
                      : 'bg-white dark:bg-slate-800/80 hover:bg-purple-50/70 dark:hover:bg-slate-800 border border-purple-200/70 dark:border-purple-800/60 shadow-xs'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm ${
                        isAiSelected ? 'ring-2 ring-white/40' : ''
                      }`}
                    >
                      <img
                        src="/AI Assistant.png"
                        alt="AI Assistant"
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-extrabold text-xs tracking-tight truncate ${
                            isAiSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          AI Assistant
                        </span>
                        <Sparkles
                          className={`w-3 h-3 ${
                            isAiSelected ? 'text-amber-300' : 'text-brand-500'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isAiSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-purple-100 dark:bg-purple-950 text-brand-700 dark:text-brand-300'
                        }`}
                      >
                        Groq AI
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate ${
                        isAiSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Study roadmaps, instant quizzes & guidance
                    </p>
                  </div>
                </button>
              </div>

              {/* SECTION HEADER: DIRECT MESSAGES */}
              <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-800/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Direct Peer Messages</span>
                <span>{filteredConversations.length}</span>
              </div>

              {/* LIST OF REAL USER CONVERSATIONS FROM MONGODB */}
              {loadingConversations ? (
                <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const peer = conv.participants?.find((p) => p._id !== user?._id);
                  const isSelected = selectedChatId === conv._id;
                  const online = isUserOnline(peer?._id);
                  const peerAvatar = peer?.avatar || peer?.profilePicture;

                  return (
                    <div
                      key={conv._id}
                      className={`w-full flex items-center transition-colors relative group ${
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/40 border-l-4 border-brand-500'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedChatId(conv._id)}
                        className="flex-1 p-3 flex items-center space-x-3 text-left min-w-0"
                      >
                        <Avatar
                          src={peerAvatar}
                          name={peer?.name || 'Peer'}
                          size="md"
                          online={online}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {peer?.name || 'Connect Skill Member'}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                              {formatTime(conv.lastMessageAt || conv.updatedAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {conv.lastMessage?.content || 'Start learning together!'}
                          </p>
                          {peer?.skillsTeaching?.length > 0 && (
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                {peer.skillsTeaching[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Delete Chat Button (Visible on hover on desktop, accessible on touch) */}
                      <div className="pr-2.5 pl-1 shrink-0 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConversationToDelete(conv);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete chat"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* CLEAN EMPTY STATE */
                <div className="p-6 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {searchQuery ? `No chats matching "${searchQuery}"` : 'No conversations yet'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? 'Try searching registered members to start a new chat.'
                        : 'Connect with registered peers to exchange skills!'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openMemberSearch}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm inline-flex items-center space-x-1.5 transition-transform hover:scale-105"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Find Members</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 2: CENTER PANEL (EMPTY STATE / CHAT / AI BOT) */}
          {/* ========================================================= */}
          <div
            className={`flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 ${
              selectedChatId === null ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-8 lg:col-span-6'
            } ${selectedChatId === null ? 'hidden md:flex' : 'flex'}`}
          >
            {/* -------------------------------------------------------- */}
            {/* SCENARIO A: NO USER SELECTED -> CONNECT SKILL LOGO & NAME */}
            {/* -------------------------------------------------------- */}
            {selectedChatId === null ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 select-none">
                <div className="max-w-md space-y-4 flex flex-col items-center">
                  <div className="inline-flex items-center justify-center space-x-3 mb-2 group">
                    <img
                      src="/logo.png"
                      alt="Connect Skill Logo"
                      className="w-12 h-12 object-contain transition-transform group-hover:scale-105"
                    />
                    <span className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-white">
                      Connect <span className="text-brand-600 dark:text-brand-400">Skill</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Your Peer Learning & AI Study Workspace
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select a peer conversation from the left to exchange skills, or open the{' '}
                    <span className="text-brand-600 dark:text-brand-400 font-semibold">
                      AI Assistant
                    </span>{' '}
                    for instant conceptual guidance, syllabi, and practice quizzes.
                  </p>

                  <div className="pt-3 flex flex-wrap gap-2.5 justify-center">
                    <button
                      type="button"
                      onClick={() => setSelectedChatId('ai')}
                      className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md hover:shadow-glow flex items-center space-x-2 transition-all hover:scale-105"
                    >
                      <img
                        src="/AI Assistant.png"
                        alt="AI Assistant"
                        className="w-4 h-4 object-cover rounded-full"
                      />
                      <span>Chat with AI Assistant</span>
                    </button>

                    <button
                      type="button"
                      onClick={openMemberSearch}
                      className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-brand-500" />
                      <span>Start New Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : isAiSelected ? (
              /* ------------------------------------------------------ */
              /* SCENARIO B: AI ASSISTANT SELECTED (GROQ INTEGRATION)    */
              /* ------------------------------------------------------ */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* AI Header */}
                <div className="p-3.5 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(null)}
                      className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm">
                      <img
                        src="/AI Assistant.png"
                        alt="AI Assistant"
                        className="w-9 h-9 object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <span>AI Assistant</span>
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setAiChatMessages([
                        {
                          role: 'assistant',
                          content:
                            'Hello! I am your Connect Skill AI Study Assistant. What concept or topic would you like to explore today?',
                        },
                      ])
                    }
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Clear Chat
                  </button>
                </div>

                {/* AI Messages Thread */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20"
                  style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
                >
                  {aiChatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const userAvatar = user?.avatar || user?.profilePicture;

                    return (
                      <div
                        key={idx}
                        className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        {isUser ? (
                          <Avatar
                            src={userAvatar}
                            name={user?.name || 'Me'}
                            size="xs"
                          />
                        ) : (
                          <img
                            src="/AI Assistant.png"
                            alt="AI Assistant"
                            className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm"
                          />
                        )}
                        <div
                          className={`max-w-xs sm:max-w-md md:max-w-lg rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-brand-500 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}

                  {aiLoading && (
                    <div className="flex items-center space-x-2 text-xs text-brand-600 dark:text-brand-400 italic p-3 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 max-w-xs border border-brand-200 dark:border-brand-800/40">
                      <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin shrink-0" />
                      <span>AI Assistant is generating insights...</span>
                    </div>
                  )}

                  <div ref={aiMessagesEndRef} />
                </div>

                {/* Suggested Prompt Chips */}
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="shrink-0 font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Ideas:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAiInput(
                        'Generate a 4-week study syllabus for mastering Next.js 14 and React Server Components'
                      )
                    }
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    Next.js Syllabus
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiInput('Quiz me on binary search trees and time complexities')}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    DSA Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAiInput('Explain WebRTC peer connection and STUN/TURN servers simply')
                    }
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    Explain WebRTC
                  </button>
                </div>

                {/* AI Input Form */}
                <form
                  onSubmit={handleAiSubmit}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Ask study concept, code question, or quiz..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="p-2.5 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white shadow-sm transition-transform hover:scale-105"
                    title="Send to AI Bot"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              /* ------------------------------------------------------ */
              /* SCENARIO C: REAL USER CHAT SELECTED                    */
              /* ------------------------------------------------------ */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Chat Header */}
                <div className="p-3.5 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedChatId(null)}
                      className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <Avatar
                      src={activePeer?.avatar || activePeer?.profilePicture}
                      name={activePeer?.name || 'Peer'}
                      size="sm"
                      online={isUserOnline(activePeer?._id)}
                    />

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {activePeer?.name || 'Connect Skill Member'}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {isUserOnline(activePeer?._id) ? (
                          <span className="text-emerald-500 font-bold">Online now</span>
                        ) : (
                          'Active recently'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(true)}
                      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Schedule Session"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Thread */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20"
                  style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
                >
                  {loadingMessages ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                      <span>Loading conversation history...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                      <p className="font-medium text-slate-500 dark:text-slate-400">
                        No messages yet in this conversation.
                      </p>
                      <p className="text-[11px]">Say hello and start sharing your skills!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        msg.sender?._id === user?._id ||
                        msg.sender === user?._id ||
                        msg.senderId === 'me';
                      const myAvatar = user?.avatar || user?.profilePicture;
                      const peerAvatar = activePeer?.avatar || activePeer?.profilePicture;

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar */}
                          {isMe ? (
                            <Avatar
                              src={myAvatar}
                              name={user?.name || 'Me'}
                              size="xs"
                            />
                          ) : (
                            <Avatar
                              src={peerAvatar}
                              name={activePeer?.name || 'Peer'}
                              size="xs"
                            />
                          )}

                          <div className="flex flex-col">
                            <div
                              className={`max-w-xs sm:max-w-sm rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                                isMe
                                  ? 'bg-brand-500 text-white rounded-br-none'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                              }`}
                            >
                              {/* Text message */}
                              {(!msg.type || msg.type === 'text') && <p>{msg.content}</p>}

                              {/* Image message */}
                              {msg.type === 'image' && (
                                <div className="space-y-1">
                                  <img
                                    src={msg.fileUrl}
                                    alt="Attachment"
                                    className="rounded-xl max-h-48 object-cover cursor-pointer"
                                    onClick={() => window.open(msg.fileUrl, '_blank')}
                                  />
                                  {msg.content && msg.content !== 'Shared an image' && (
                                    <p className="text-[11px] mt-1">{msg.content}</p>
                                  )}
                                </div>
                              )}

                              {/* File message */}
                              {msg.type === 'file' && (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center space-x-2 underline text-[11px]"
                                >
                                  <FileText className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{msg.fileName || 'Download File'}</span>
                                </a>
                              )}

                              {/* Voice note */}
                              {msg.type === 'voice' && (
                                <div className="space-y-1 min-w-[200px]">
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1">
                                    🎙️ Voice Note
                                  </p>
                                  <audio controls src={msg.fileUrl} className="w-full h-8" />
                                </div>
                              )}

                              {/* Session invite */}
                              {msg.type === 'session-invite' && (
                                <div className="p-2.5 rounded-xl bg-white/20 dark:bg-slate-900/40 border border-white/30 space-y-2">
                                  <p className="font-bold">{msg.content}</p>
                                  <Link
                                    to="/calendar"
                                    className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-[10px]"
                                  >
                                    View in Calendar
                                  </Link>
                                </div>
                              )}
                            </div>

                            <span
                              className={`text-[10px] text-slate-400 mt-1 flex items-center space-x-1 ${
                                isMe ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {peerIsTyping && (
                    <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      <span>{activePeer?.name || 'Peer'} is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Upload File or Photo"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Voice Note Button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isRecording ? 'Stop & Send Recording' : 'Record Voice Note'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    placeholder={`Message ${activePeer?.name || 'peer'}...`}
                    value={messageInput}
                    onChange={handleTypingChange}
                    className="flex-1 px-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                  />

                  <button
                    type="submit"
                    className="p-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-transform hover:scale-105"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* COLUMN 3: RIGHT PANEL (PEER PROFILE / STUDY TOOLS)        */}
          {/* ========================================================= */}
          {selectedChatId !== null && showRightPanel && (
            <div className="hidden lg:flex lg:col-span-3 border-l border-slate-200 dark:border-slate-800 flex-col h-full min-h-0 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto">
              {isAiSelected ? (
                /* AI Study Info Panel */
                <div className="p-4 space-y-5 text-xs">
                  <div className="text-center space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 mx-auto rounded-full overflow-hidden shadow-md">
                      <img
                        src="/AI Assistant.png"
                        alt="AI Assistant"
                        className="w-14 h-14 object-cover"
                      />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      AI Assistant
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                      Capabilities
                    </h5>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-brand-600 dark:text-brand-400">
                          Syllabus Generator
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Creates weekly reciprocal milestones for peer learning.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          Knowledge Quizzer
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tests your conceptual understanding with real-time feedback.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-indigo-600 dark:text-indigo-400">
                          Code & Math Explainer
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Breaks down algorithms, queries, and logic problems.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activePeer ? (
                /* Peer Profile Details */
                <div className="p-4 space-y-4 text-xs">
                  <div className="text-center space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <Avatar
                      src={activePeer.avatar || activePeer.profilePicture}
                      name={activePeer.name}
                      size="xl"
                      className="mx-auto"
                    />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {activePeer.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {activePeer.bio || 'Connect Skill Peer Member'}
                    </p>
                    {activePeer._id && (
                      <Link
                        to={`/profile/${activePeer._id}`}
                        className="inline-block text-brand-600 dark:text-brand-400 text-[11px] font-bold hover:underline"
                      >
                        View Full Profile
                      </Link>
                    )}
                  </div>

                  {/* Skills Teaching */}
                  {activePeer.skillsTeaching?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        Skills Teaching
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {activePeer.skillsTeaching.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Learning */}
                  {activePeer.skillsLearning?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        Skills Learning
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {activePeer.skillsLearning.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full bg-purple-50 text-brand-800 dark:bg-purple-950/80 dark:text-brand-300 text-[10px] font-semibold border border-purple-200 dark:border-purple-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Book Session Action */}
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md hover:shadow-glow transition-all mt-4 flex items-center justify-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book 1-on-1 Session</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* NEW CHAT / FIND MEMBERS MODAL                             */}
        {/* ========================================================= */}
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-brand-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Start a New Conversation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search bar inside modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search registered members by name or skill..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    searchMembers(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
                  autoFocus
                />
              </div>

              {/* Results list */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
                {loadingMembers ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                    <span>Searching members...</span>
                  </div>
                ) : memberResults.length > 0 ? (
                  memberResults.map((member) => (
                    <div
                      key={member._id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar
                          src={member.avatar || member.profilePicture}
                          name={member.name}
                          size="md"
                          online={isUserOnline(member._id)}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {member.bio || member.skillsTeaching?.join(', ') || 'Connect Skill Member'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartConversationWithUser(member._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-transform hover:scale-105 shrink-0"
                      >
                        Message
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No members found. Try a different search term!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Schedule Session with {activePeer?.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleScheduleSession} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Session Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js App Router Architecture"
                    value={scheduleData.title}
                    onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Skill Topic
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React & TypeScript"
                    value={scheduleData.skill}
                    onChange={(e) => setScheduleData({ ...scheduleData, skill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                      value={scheduleData.date}
                      onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
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
                      value={scheduleData.startTime}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, startTime: e.target.value })
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
                      value={scheduleData.endTime}
                      onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md hover:shadow-glow transition-all"
                  >
                    Confirm Booking (10 SP)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Chat Confirmation Modal */}
        {conversationToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Delete Chat</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Remove this conversation from your chat list?
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                This will remove the chat from your conversation list. The other participant’s history and messages will not be erased.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConversationToDelete(null)}
                  disabled={isDeletingChat}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteConversation}
                  disabled={isDeletingChat}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isDeletingChat ? <span>Deleting...</span> : <span>Delete</span>}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;
