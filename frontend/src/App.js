import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import BinaryTrading from './components/BinaryTrading';
import Investments from './components/Investments';
import Referrals from './components/Referrals';
import Bonus from './components/Bonus';
import Settings from './components/Settings';
import Login from './components/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
  axios.defaults.withCredentials = true;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for session ID in URL fragment first
      const fragment = window.location.hash;
      if (fragment.includes('session_id=')) {
        const sessionId = fragment.split('session_id=')[1].split('&')[0];
        await handleSessionAuth(sessionId);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Check existing session
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAuth = async (sessionId) => {
    try {
      const response = await axios.post('/api/auth/session', { session_id: sessionId });
      setUser(response.data.user);
    } catch (error) {
      console.error('Session authentication failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-xl font-semibold text-white">Загрузка CripteX...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/trading" element={<BinaryTrading user={user} setUser={setUser} />} />
            <Route path="/investments" element={<Investments user={user} />} />
            <Route path="/referrals" element={<Referrals user={user} />} />
            <Route path="/bonus" element={<Bonus user={user} setUser={setUser} />} />
            <Route path="/settings" element={<Settings user={user} setUser={setUser} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;