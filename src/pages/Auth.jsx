import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Typography, 
  Alert 
} from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import API from '../services/api';
import { CONFIG } from '../config';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const Auth = () => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = tab === 0 ? '/auth/login' : '/auth/register';
    const payload = tab === 0 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const { data } = await API.post(endpoint, payload);
      
      if (tab === 1) {
        setSuccess('Registration successful! Please login.');
        setTab(0);
        setFormData({ ...formData, password: '' });
      } else {
        localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="bg-background min-h-screen flex items-center justify-center p-4">
        <Container maxWidth="xs">
          <Paper elevation={0} className="p-8 w-full border border-border rounded-2xl shadow-sm">
            <Box className="flex flex-col items-center mb-6">
              <Box className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                <ChatIcon className="text-white" />
              </Box>
              <Typography variant="h5" align="center" className="text-slate-900 font-bold">
                Welcome to Chatly
              </Typography>
              <Typography variant="body2" className="text-slate-500 mt-1 text-center">
                {tab === 0 ? 'Sign in to your account' : 'Create your new account'}
              </Typography>
            </Box>

            <Tabs 
              value={tab} 
              onChange={handleTabChange} 
              variant="fullWidth" 
              className="mb-6 bg-slate-100 rounded-lg p-1"
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                '& .MuiTab-root': {
                  borderRadius: '6px',
                  minHeight: '40px',
                  color: '#64748b',
                  '&.Mui-selected': {
                    backgroundColor: 'white',
                    color: '#6366f1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }
                }
              }}
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>

            {error && <Alert severity="error" className="mb-4 rounded-xl border-0 bg-rose-50 text-rose-600">{error}</Alert>}
            {success && <Alert severity="success" className="mb-4 rounded-xl border-0 bg-emerald-50 text-emerald-600">{success}</Alert>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === 1 && (
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  variant="outlined"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              )}
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Button
                fullWidth
                variant="contained"
                disableElevation
                type="submit"
                className="mt-2 py-3 bg-primary hover:bg-secondary normal-case font-semibold text-base rounded-xl"
                disabled={loading}
              >
                {loading ? 'Processing...' : (tab === 0 ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Auth;
