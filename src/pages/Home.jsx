import React, { useState, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { initSocket, disconnectSocket } from '../services/socket';
import { CONFIG } from '../config';

const Home = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);

    const loggedUser = JSON.parse(localStorage.getItem(CONFIG.USER_KEY));
    setUser(loggedUser);

    if (loggedUser) {
      const s = initSocket(loggedUser);
      setSocket(s);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      disconnectSocket();
    };
  }, []);

  return (
    <Box className="h-screen w-full bg-slate-100 flex items-center justify-center p-0 md:p-4 lg:p-6">
      <Paper 
        elevation={0} 
        className=" h-full max-w-[1600px] flex overflow-hidden rounded-none md:rounded-2xl border border-border shadow-2xl shadow-slate-200/40"
      >
        <Box className="flex w-full h-full relative">
          {/* Sidebar - Hidden on mobile if chat is selected */}
          <Box 
            className={`h-full border-r border-border transition-all duration-300 ease-in-out ${
              isMobile 
                ? (selectedChat ? 'hidden' : 'w-full') 
                : 'w-[350px] lg:w-[400px]'
            }`}
          >
            <Sidebar 
              user={user} 
              setUser={setUser}
              socket={socket}
              setSelectedChat={setSelectedChat} 
              selectedChat={selectedChat} 
            />
          </Box>

          {/* ChatWindow - Hidden on mobile if no chat is selected */}
          <Box 
            className={`h-full bg-white transition-all duration-300 ease-in-out flex-1 ${
              isMobile 
                ? (!selectedChat ? 'hidden' : 'w-full') 
                : 'flex'
            }`}
          >
            {selectedChat ? (
              <ChatWindow 
                user={user} 
                socket={socket}
                chat={selectedChat} 
                setSelectedChat={setSelectedChat} 
              />
            ) : (
              <Box className="h-full w-full flex flex-col items-center justify-center bg-white">
                <Box className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/5968/5968841.png" 
                    alt="Chatly" 
                    className="w-12 h-12 grayscale opacity-20"
                  />
                </Box>
                <h2 className="text-2xl font-bold text-slate-800">Chatly Desktop</h2>
                <p className="text-slate-400 mt-2 max-w-xs text-center">
                  Select a conversation from the sidebar to start messaging with your friends.
                </p>
                <Box className="mt-8 flex items-center gap-2 text-slate-300 text-sm">
                  <span className="w-4 h-[1px] bg-slate-200"></span>
                  Encrypted Messaging
                  <span className="w-4 h-[1px] bg-slate-200"></span>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
