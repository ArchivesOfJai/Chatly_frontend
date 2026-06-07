import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  CloseRounded as Close,
  PhotoCameraRounded as Camera
} from '@mui/icons-material';
import API from '../services/api';
import { CONFIG } from '../config';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 },
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

const EditProfileModal = ({ open, onClose, user, setUser }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [selectedFile, setSelectedFile] = useState(null);

  React.useEffect(() => {
    if (open) {
      setUsername(user?.username || '');
      setAvatarPreview(user?.avatar || '');
      setSelectedFile(null);
    }
  }, [open, user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;

      // 1. Upload new avatar if selected using generic upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const { data } = await API.post('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = data.url;
      }

      // 2. Update user profile in database
      const { data: updatedUser } = await API.put('/auth/profile', {
        username,
        avatar: avatarUrl
      });

      // 3. Update local state and storage
      localStorage.setItem(CONFIG.TOKEN_KEY, updatedUser.token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box className="flex justify-between items-center mb-6">
          <Typography variant="h6" className="font-bold">Edit Profile</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>

        <Box className="flex flex-col items-center gap-6">
          <Box className="relative">
            <Avatar
              src={avatarPreview ? (avatarPreview.startsWith('blob') ? avatarPreview : `${CONFIG.SOCKET_ENDPOINT}${avatarPreview}`) : ''}
              className="w-24 h-24 border-2 border-slate-100"
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar-upload"
              onChange={handleFileChange}
            />
            <label htmlFor="avatar-upload">
              <IconButton
                component="span"
                className="absolute bottom-0 right-0 bg-primary text-white hover:bg-secondary border-2 border-white shadow-sm"
                size="small"
              >
                <Camera fontSize="small" />
              </IconButton>
            </label>
          </Box>

          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />

          <Box className="flex w-full gap-3 mt-2">
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              className="rounded-xl normal-case font-semibold"
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-xl normal-case font-semibold bg-primary"
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditProfileModal;
