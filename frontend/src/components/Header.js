import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, User, Target, Users, Gift, LogOut, Shield } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Дашборд', icon: TrendingUp },
    { path: '/trading', label: 'Торговля', icon: Target },
    { path: '/investments', label: 'Инвестиции', icon: Shield },
    { path: '/referrals', label: 'Рефералы', icon: Users },
    { path: '/bonus', label: 'Бонусы', icon: Gift },
    { path: '/settings', label: 'Настройки', icon: User },
  ];

  return (
    <header className="glass sticky top-0 z-50 border-b border-cyan-500/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold crypto-font gradient-text">CripteX</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'nav-active'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <img
                src={user.picture || '/api/placeholder/32/32'}
                alt={user.name}
                className="w-8 h-8 rounded-full border-2 border-cyan-400/50"
              />
              <div className="text-sm">
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-cyan-400 crypto-font">{user.free_predictions} прогнозов</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-300"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex overflow-x-auto space-x-2 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'nav-active'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;