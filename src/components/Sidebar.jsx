import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Avatar, 
  IconButton, 
  InputBase, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider, 
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  AddCommentRounded as ChatIcon, 
  MoreVertRounded as MoreVert, 
  SearchRounded as Search, 
  ArrowBackRounded as ArrowBack,
  NotificationsNoneRounded as Notifications
} from '@mui/icons-material';
import API from '../services/api';
import { getSocket } from '../services/socket';
import { CONFIG } from '../config';
import EditProfileModal from './EditProfileModal';
import { format } from 'date-fns';

const Sidebar = ({ user, socket, setSelectedChat, selectedChat, setUser }) => {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage) => {
      setChats((prevChats) => {
        const chatExists = prevChats.find(c => c._id === newMessage.chat._id);
        
        if (chatExists) {
          const updatedChats = prevChats.map((chat) => {
            if (chat._id === newMessage.chat._id) {
              return { ...chat, lastMessage: newMessage };
            }
            return chat;
          });
          
          const chatIndex = updatedChats.findIndex(c => c._id === newMessage.chat._id);
          const [activeChat] = updatedChats.splice(chatIndex, 1);
          return [activeChat, ...updatedChats];
        } else {
          const newChat = {
            ...newMessage.chat,
            lastMessage: newMessage
          };
          return [newChat, ...prevChats];
        }
      });
    };

    const handleNewChat = (newChat) => {
      setChats((prev) => [newChat, ...prev]);
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('new_chat_created', handleNewChat);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('new_chat_created', handleNewChat);
    };
  }, [socket]); // Re-run when user (and thus socket) might be ready

  const fetchChats = async () => {
    try {
      const { data } = await API.get('/chats');
      setChats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await API.get('/contacts/search?q=');
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleContacts = () => {
    if (!showContacts) {
      fetchAllUsers();
    } else {
      setSearchResults([]);
      setSearch('');
    }
    setShowContacts(!showContacts);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    if (!query) {
      setSearchResults(showContacts ? [] : []); // If in contacts mode, maybe show all users again?
      if (showContacts) fetchAllUsers();
      return;
    }
    try {
      const { data } = await API.get(`/contacts/search?q=${query}`);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const accessChat = async (userId) => {
    try {
      const { data } = await API.post('/chats', { userId });
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      setSearch('');
      setSearchResults([]);
      setShowContacts(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.reload();
  };

  const getOtherParticipant = (participants) => {
    return participants.find((p) => p._id !== user?._id);
  };

  return (
    <Box className="flex flex-col h-full bg-white">
      {/* Header */}
      <Box className="p-4 flex justify-between items-center border-b border-slate-100">
        {showContacts ? (
          <Box className="flex items-center gap-3">
            <IconButton onClick={toggleContacts} size="small" className="bg-slate-50">
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" className="font-bold text-slate-800">New Message</Typography>
          </Box>
        ) : (
          <>
            <Box className="flex items-center gap-3">
              <Avatar 
                src={user?.avatar ? `${CONFIG.SOCKET_ENDPOINT}${user.avatar}` : ''} 
                className="w-10 h-10 border-2 border-primary/10"
              />
              <Box>
                <Typography variant="subtitle2" className="font-bold text-slate-800 leading-tight">
                  {user?.username}
                </Typography>
                <Typography variant="caption" className="text-emerald-500 font-medium">
                  Online
                </Typography>
              </Box>
            </Box>
            <Box className="flex items-center gap-1">
              <Tooltip title="Notifications">
                <IconButton size="small"><Notifications fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="New Chat">
                <IconButton onClick={toggleContacts} size="small" className="text-primary">
                  <ChatIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                elevation={2}
                PaperProps={{
                  className: "rounded-xl border border-border mt-1 shadow-lg"
                }}
              >
                <MenuItem onClick={() => { setIsProfileOpen(true); setAnchorEl(null); }} className="text-sm font-medium">Profile</MenuItem>
                <MenuItem onClick={handleLogout} className="text-sm font-medium text-rose-500">Logout</MenuItem>
              </Menu>
            </Box>
          </>
        )}
      </Box>

      <EditProfileModal 
        open={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
        setUser={setUser}
      />

      {/* Search Bar */}
      <Box className="px-4 py-3">
        <Box className="bg-slate-100 rounded-xl flex items-center px-3 py-1.5 focus-within:bg-slate-50 transition-colors border border-transparent focus-within:border-primary/20">
          <Search className="text-slate-400 mr-2" fontSize="small" />
          <InputBase
            placeholder={showContacts ? "Search contacts..." : "Search conversations..."}
            className="w-full text-sm font-medium text-slate-600"
            value={search}
            onChange={handleSearch}
          />
        </Box>
      </Box>

      {/* Chat List */}
      <Box className="flex-1 overflow-y-auto px-2">
        {showContacts || search ? (
          <List className="py-0">
            <Typography variant="caption" className="px-3 py-2 text-slate-400 font-bold uppercase tracking-wider block">
              {search ? 'Search Results' : 'Suggested Contacts'}
            </Typography>
            {searchResults.map((result) => (
              <ListItem 
                button 
                key={result._id} 
                onClick={() => accessChat(result._id)}
                className="rounded-xl mb-1 hover:bg-slate-50 px-3"
              >
                <ListItemAvatar>
                  <Avatar src={result.avatar ? `${CONFIG.SOCKET_ENDPOINT}${result.avatar}` : ''} className="w-11 h-11" />
                </ListItemAvatar>
                <ListItemText 
                  primary={<Typography className="font-bold text-slate-800 text-sm">{result.username}</Typography>} 
                  secondary={<Typography className="text-xs text-slate-500 truncate">{result.email}</Typography>} 
                />
              </ListItem>
            ))}
            {searchResults.length === 0 && (
              <Box className="p-8 text-center">
                <Typography className="text-sm text-slate-400">
                  {search ? 'No users found matching your search.' : 'No users available.'}
                </Typography>
              </Box>
            )}
          </List>
        ) : (
          <List className="py-0">
            {chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const isActive = selectedChat?._id === chat._id;
              return (
                <ListItem 
                  button 
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`rounded-xl mb-1 px-3 transition-all duration-200 ${
                    isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "hover:bg-slate-50"
                  }`}
                >
                  <ListItemAvatar>
                    <Badge 
                      overlap="circular" 
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{ 
                        '& .MuiBadge-badge': { 
                          backgroundColor: otherUser?.status === 'online' ? '#44b700' : '#bdbdbd',
                          boxShadow: `0 0 0 2px ${isActive ? '#6366f1' : 'white'}`,
                        } 
                      }}
                    >
                      <Avatar src={otherUser?.avatar ? `${CONFIG.SOCKET_ENDPOINT}${otherUser.avatar}` : ''} className="w-11 h-11" />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Typography className={`font-bold text-sm ${isActive ? "text-white" : "text-slate-800"}`}>
                        {otherUser?.username || "Unknown"}
                      </Typography>
                    } 
                    secondary={
                      <Typography className={`text-xs truncate ${isActive ? "text-indigo-100" : "text-slate-500"}`}>
                        {chat.lastMessage?.text || (chat.lastMessage?.image ? "📷 Photo" : (chat.lastMessage?.fileUrl ? "📄 File" : "No messages yet"))}
                      </Typography>
                    }
                  />
                  <Box className="flex flex-col items-end gap-1">
                    {chat.lastMessage && (
                      <Typography className={`text-[10px] ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                        {format(new Date(chat.lastMessage.createdAt), 'h:mm a')}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              );
            })}
            {chats.length === 0 && (
              <Box className="p-8 text-center flex flex-col items-center gap-3">
                <Box className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                  <ChatIcon className="text-slate-200" fontSize="small" />
                </Box>
                <Typography className="text-sm text-slate-400 max-w-[180px]">
                  No conversations yet. Start a new chat!
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
