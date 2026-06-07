import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import { CONFIG } from './config';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) {
    return <Navigate to="/auth" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
