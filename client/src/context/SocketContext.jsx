import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000');

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    s.on('connect', () => {
      s.emit('user:online', user._id);
    });

    s.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    s.on('notification:new', (notif) => {
      // Dispatch browser custom event for Navbar & other components
      window.dispatchEvent(new CustomEvent('notification:received', { detail: notif }));

      toast(
        (t) => (
          <div className="flex items-start space-x-3 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
            <div className="text-xl">🔔</div>
            <div>
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs text-gray-500">{notif.message}</p>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id, token]);

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
