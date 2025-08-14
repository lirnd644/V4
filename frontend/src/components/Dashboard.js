import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Zap, Target, Shield } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePredictions, setActivePredictions] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    fetchCryptoData();
    fetchActivePredictions();
    const interval = setInterval(fetchCryptoData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [user]);

  const fetchCryptoData = async () => {
    try {
      const currency = user.preferred_currency || 'USD';
      const response = await axios.get(`/api/crypto/prices?currency=${currency}&limit=50`);
      setCryptoData(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePredictions = async () => {
    try {
      const response = await axios.get('/api/binary-predictions');
      const active = response.data.filter(p => p.status === 'ACTIVE');
      setActivePredictions(active.slice(0, 3));
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'RUB': '₽', 'EUR': '€', 'GBP': '£',
      'JPY': '¥', 'CNY': '¥', 'KRW': '₩', 'INR': '₹'
    };
    return symbols[currency] || '$';
  };

  const getCryptoIcon = (iconUrl, symbol) => {
    if (iconUrl && iconUrl !== '') {
      return (
        <img 
          src={iconUrl} 
          alt={symbol} 
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {symbol.charAt(0)}
      </div>
    );
  };

  const getTimeLeft = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Завершен';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-slate-400">Загружаем актуальные данные рынка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Добро пожаловать, <span className="gradient-text">{user.name}</span>!
            </h1>
            <p className="text-slate-400 text-lg">
              У вас осталось <span className="text-cyan-400 font-semibold crypto-font">{user.free_predictions}</span> бесплатных прогнозов
            </p>
          </div>
          <div className="flex space-x-4">
            <div className="stat-card">
              <Target className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold gradient-text">{user.total_predictions_used || 0}</div>
              <div className="text-sm text-slate-400">Всего прогнозов</div>
            </div>
            <div className="stat-card">
              <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold gradient-text">75.5%</div>
              <div className="text-sm text-slate-400">Точность</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Predictions */}
      {activePredictions.length > 0 && (
        <div className="glass-card p-6 slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <span>Активные прогнозы</span>
            </h2>
            <a href="/trading" className="text-cyan-400 hover:text-cyan-300 text-sm">
              Все прогнозы →
            </a>
          </div>

          <div className="grid gap-4">
            {activePredictions.map((prediction, index) => (
              <div key={index} className="prediction-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      prediction.direction === 'UP' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {prediction.direction === 'UP' ? 
                        <TrendingUp className="w-6 h-6" /> : 
                        <TrendingDown className="w-6 h-6" />
                      }
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white crypto-font">{prediction.symbol}</h3>
                      <p className="text-slate-400 text-sm">{prediction.timeframe} • Ставка: {prediction.stake_amount}</p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="text-cyan-400 font-semibold">
                      {getTimeLeft(prediction.expiry_time)}
                    </div>
                    <div className="text-sm text-slate-400">
                      Уверенность: <span className="text-cyan-400">{prediction.confidence_score}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crypto Prices Grid */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-cyan-400" />
            <span>Рыночные цены</span>
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">
              Валюта: {user.preferred_currency || 'USD'}
            </span>
            <button
              onClick={() => setDisplayLimit(displayLimit === 12 ? 50 : 12)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {displayLimit === 12 ? 'Показать все' : 'Показать меньше'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cryptoData.slice(0, displayLimit).map((crypto, index) => (
            <div key={index} className="crypto-card glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getCryptoIcon(crypto.icon_url, crypto.symbol)}
                  <div className="hidden w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {crypto.symbol.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white crypto-font">
                      {crypto.symbol}
                    </h3>
                    <p className="text-slate-400 text-xs">{crypto.name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  crypto.price_change_percentage_24h > 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {crypto.price_change_percentage_24h > 0 ? '+' : ''}
                  {crypto.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-xl font-bold text-white crypto-font">
                  {getCurrencySymbol(user.preferred_currency || 'USD')}{crypto.current_price.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Объем: {getCurrencySymbol(user.preferred_currency || 'USD')}{(crypto.volume_24h / 1000000).toFixed(1)}M</span>
                  <a 
                    href="/trading" 
                    className="text-cyan-400 hover:text-cyan-300 text-xs"
                  >
                    Торговать →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/trading" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <Target className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Бинарная торговля</h3>
          <p className="text-slate-400 text-sm">Прогнозируйте направление цены ВВЕРХ или ВНИЗ</p>
        </a>

        <a href="/investments" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <Shield className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Инвестиции</h3>
          <p className="text-slate-400 text-sm">Получите экспертные рекомендации для долгосрочных вложений</p>
        </a>

        <a href="/referrals" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <Zap className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Пригласить друзей</h3>
          <p className="text-slate-400 text-sm">Получайте бонусы за каждого приглашенного друга</p>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;