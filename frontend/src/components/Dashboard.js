import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Zap, Target } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get('/api/crypto/prices');
      setCryptoData(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockPredictions = [
    {
      symbol: 'BTC',
      type: 'BULLISH',
      confidence: 78.5,
      timeframe: '4h',
      target: '+5.2%',
      entry: '$45,230'
    },
    {
      symbol: 'ETH',
      type: 'BEARISH',
      confidence: 82.1,
      timeframe: '1h',
      target: '-3.8%',
      entry: '$2,845'
    },
    {
      symbol: 'BNB',
      type: 'BULLISH',
      confidence: 75.3,
      timeframe: '24h',
      target: '+8.1%',
      entry: '$312'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
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
              <div className="text-2xl font-bold gradient-text">{user.total_predictions_used}</div>
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

      {/* Latest Predictions */}
      <div className="glass-card p-6 slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Активные Прогнозы</span>
          </h2>
          <span className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
            Обновлено сейчас
          </span>
        </div>

        <div className="grid gap-4">
          {mockPredictions.map((prediction, index) => (
            <div key={index} className="prediction-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    prediction.type === 'BULLISH' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {prediction.type === 'BULLISH' ? 
                      <TrendingUp className="w-6 h-6" /> : 
                      <TrendingDown className="w-6 h-6" />
                    }
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white crypto-font">{prediction.symbol}</h3>
                    <p className="text-slate-400 text-sm">{prediction.timeframe} • {prediction.entry}</p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className={`text-lg font-bold ${
                    prediction.type === 'BULLISH' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.target}
                  </div>
                  <div className="text-sm text-slate-400">
                    Точность: <span className="text-cyan-400 font-semibold">{prediction.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto Prices Grid */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-cyan-400" />
          <span>Рыночные Цены</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoData.map((crypto, index) => (
            <div key={index} className="crypto-card glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white crypto-font">
                  {crypto.symbol}
                </h3>
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
                <div className="text-2xl font-bold text-white crypto-font">
                  ${crypto.current_price.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>Объем: ${(crypto.volume_24h / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/predictions" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <Target className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Новый Прогноз</h3>
          <p className="text-slate-400 text-sm">Получите персональный торговый сигнал</p>
        </a>

        <a href="/referrals" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <Zap className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Пригласить Друзей</h3>
          <p className="text-slate-400 text-sm">Получайте бонусы за рефералов</p>
        </a>

        <a href="/bonus" className="glass-card p-6 hover:bg-slate-800/50 transition-all duration-300 group">
          <DollarSign className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-2">Ежедневный Бонус</h3>
          <p className="text-slate-400 text-sm">Получите +1 бесплатный прогноз</p>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;