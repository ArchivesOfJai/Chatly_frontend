import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Avatar, 
  IconButton, 
  InputBase, 
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { 
  MoreVertRounded as MoreVert, 
  AddCircleOutlineRounded as AttachFile, 
  SentimentSatisfiedAltRounded as Emoji, 
  MicRounded as Mic, 
  SendRounded as Send,
  ArrowBackRounded as ArrowBack,
  PhoneRounded as Phone,
  VideocamRounded as Video,
  ImageRounded as ImageIcon
} from '@mui/icons-material';
import API from '../services/api';
import { getSocket } from '../services/socket';
import { CONFIG } from '../config';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ChatWindow = ({ user, socket, chat, setSelectedChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    setMessages([]);
    setIsTyping(false);
    fetchMessages();
    if (socket) {
      socket.emit('join_chat', chat._id);
      
      const handleReceiveMessage = (message) => {
        if (message.chat._id === chat._id && message.sender._id !== user._id) {
          setMessages((prev) => [...prev, message]);
        }
      };

      const handleTyping = (room) => {
        if (room === chat._id) setIsTyping(true);
      };

      const handleStopTyping = (room) => {
        if (room === chat._id) setIsTyping(false);
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('user_typing', handleTyping);
      socket.on('user_stopped_typing', handleStopTyping);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('user_typing', handleTyping);
        socket.off('user_stopped_typing', handleStopTyping);
      };
    }
  }, [chat._id, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/messages/${chat._id}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (!newMessage.trim()) return;

      socket.emit('stop_typing', chat._id);
      setTyping(false);

      try {
        const { data } = await API.post('/messages', {
          content: newMessage,
          chatId: chat._id
        });
        setNewMessage('');
        setMessages([...messages, data]);
        socket.emit('send_message', data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file); 
      const { data: uploadData } = await API.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const isImage = file.type.startsWith('image/');
      
      const messagePayload = {
        chatId: chat._id,
      };

      if (isImage) {
        messagePayload.image = uploadData.url;
      } else {
        messagePayload.fileUrl = uploadData.url;
        messagePayload.fileName = uploadData.fileName;
        messagePayload.fileType = uploadData.fileType;
        messagePayload.fileSize = uploadData.fileSize;
      }

      const { data } = await API.post('/messages', messagePayload);

      setMessages([...messages, data]);
      socket.emit('send_message', data);
    } catch (err) {
      console.error(err);
      alert('Failed to send file');
    } finally {
      setIsUploading(false);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', chat._id);
    }

    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit('stop_typing', chat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const getOtherParticipant = (participants) => {
    return participants.find((p) => p._id !== user?._id);
  };

  const otherUser = getOtherParticipant(chat.participants);

  return (
    <Box className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <Box className="bg-white p-3 md:p-4 flex items-center justify-between border-b border-slate-100 z-10 shadow-sm">
        <Box className="flex items-center gap-3">
          <IconButton 
            className="md:hidden" 
            onClick={() => setSelectedChat(null)}
            size="small"
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box className="relative">
            <Avatar src={otherUser?.avatar ? `${CONFIG.SOCKET_ENDPOINT}${otherUser.avatar}` : ''} className="w-10 h-10 border border-slate-100" />
            {otherUser?.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" className="font-bold text-slate-800 leading-none">
              {otherUser?.username}
            </Typography>
            <Typography variant="caption" className={`font-medium ${isTyping ? 'text-primary' : 'text-slate-400'}`}>
              {isTyping ? 'Typing...' : (otherUser?.status || 'offline')}
            </Typography>
          </Box>
        </Box>
        <Box className="flex items-center gap-1">
          <Tooltip title="Start Voice Call"><IconButton size="small"><Phone fontSize="small" className="text-slate-400" /></IconButton></Tooltip>
          <Tooltip title="Start Video Call"><IconButton size="small"><Video fontSize="small" className="text-slate-400" /></IconButton></Tooltip>
          <IconButton size="small"><MoreVert fontSize="small" className="text-slate-400" /></IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box className="flex-1 overflow-y-auto px-4 py-6 md:px-8 flex flex-col gap-4">
        {loading ? (
          <Box className="flex justify-center items-center h-40">
            <CircularProgress size={24} className="text-primary" />
          </Box>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMe = msg.sender._id === user?._id;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  key={msg._id || index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <Box className={`max-w-[85%] md:max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <Box 
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                      }`}
                    >
                      {msg.image && (
                        <Box className="mb-2 overflow-hidden rounded-lg max-w-full sm:max-w-[300px] md:max-w-[400px]">
                          <img 
                            src={`${CONFIG.SOCKET_ENDPOINT}${msg.image}`} 
                            alt="Sent" 
                            className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(`${CONFIG.SOCKET_ENDPOINT}${msg.image}`, '_blank')}
                          />
                        </Box>
                      )}
                      {msg.fileUrl && (
                        <Box 
                          className={`mb-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-black/5 transition-colors ${
                            isMe ? 'bg-white/10' : 'bg-slate-50'
                          }`}
                          onClick={() => window.open(`${CONFIG.SOCKET_ENDPOINT}${msg.fileUrl}`, '_blank')}
                        >
                          <AttachFile className={isMe ? 'text-white' : 'text-primary'} />
                          <Box className="overflow-hidden">
                            <Typography variant="body2" className={`font-bold truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>
                              {msg.fileName || 'Attachment'}
                            </Typography>
                            <Typography variant="caption" className={isMe ? 'text-indigo-100' : 'text-slate-400'}>
                              {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : 'File'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {msg.text}
                    </Box>
                    <Typography className="text-[10px] text-slate-400 mt-1 font-medium">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex justify-start"
              >
                <Box className="bg-slate-100 px-3 py-1.5 rounded-full rounded-tl-none">
                  <Box className="flex gap-1">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-slate-400 rounded-full"></motion.span>
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-slate-400 rounded-full"></motion.span>
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-slate-400 rounded-full"></motion.span>
                  </Box>
                </Box>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </>
        )}
      </Box>

      {/* Footer / Input */}
      <Box className="px-4 py-4 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="file"
          id="file-send"
          className="hidden"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-send">
          <Tooltip title="Attach File">
            <IconButton 
              component="span" 
              size="small" 
              className="text-slate-400 hover:text-primary"
              disabled={isUploading}
            >
              {isUploading ? <CircularProgress size={20} /> : <AttachFile />}
            </IconButton>
          </Tooltip>
        </label>
        <Box className="flex-1 bg-slate-100 rounded-2xl px-4 py-2 flex items-center transition-all focus-within:bg-slate-50 border border-transparent focus-within:border-primary/20">
          <IconButton size="small" className="text-slate-400 mr-1"><Emoji fontSize="small" /></IconButton>
          <InputBase
            placeholder="Write a message..."
            className="w-full text-sm font-medium text-slate-700"
            multiline
            maxRows={4}
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
          />
        </Box>
        <Box className="flex items-center">
          {newMessage.trim() ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <IconButton 
                className="bg-primary hover:bg-secondary text-white shadow-lg shadow-primary/20" 
                onClick={handleSendMessage}
                size="medium"
              >
                <Send fontSize="small" />
              </IconButton>
            </motion.div>
          ) : (
            <IconButton className="text-slate-400 hover:text-primary"><Mic /></IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow;
