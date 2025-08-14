import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Target, Shield, Zap, Star, AlertTriangle } from 'lucide-react';

const Investments = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  useEffect(() => {
    fetchRecommendations();
    fetchCryptoData();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`/api/investment-recommendations?currency=${user.preferred_currency || 'USD'}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get(`/api/crypto/prices?currency=${user.preferred_currency || 'USD'}&limit=50`);
      setCryptoData(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'RUB': '₽', 'EUR': '€', 'GBP': '£',
      'JPY': '¥', 'CNY': '¥', 'KRW': '₩', 'INR': '₹'
    };
    return symbols[currency] || '$';
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'BUY': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'SELL': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'HOLD': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'BUY': return <TrendingUp className="w-6 h-6" />;
      case 'SELL': return <TrendingDown className="w-6 h-6" />;
      case 'HOLD': return <Target className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 80) return { level: 'Высокая', color: 'text-green-400' };
    if (confidence >= 70) return { level: 'Средняя', color: 'text-yellow-400' };
    return { level: 'Низкая', color: 'text-red-400' };
  };

  const topPerformers = cryptoData
    .filter(crypto => crypto.price_change_percentage_24h > 0)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 5);

  const topLosers = cryptoData
    .filter(crypto => crypto.price_change_percentage_24h < 0)
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span>Инвестиционные рекомендации</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Профессиональный анализ и рекомендации для долгосрочных инвестиций
            </p>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span>Лидеры роста (24ч)</span>
          </h2>
          
          <div className="space-y-3">
            {topPerformers.map((crypto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{crypto.symbol}</h3>
                    <p className="text-slate-400 text-sm">{crypto.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    +{crypto.price_change_percentage_24h.toFixed(2)}%
                  </p>
                  <p className="text-slate-400 text-sm crypto-font">
                    {getCurrencySymbol(user.preferred_currency || 'USD')}{crypto.current_price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <span>Крупнейшие падения (24ч)</span>
          </h2>
          
          <div className="space-y-3">
            {topLosers.map((crypto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{crypto.symbol}</h3>
                    <p className="text-slate-400 text-sm">{crypto.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </p>
                  <p className="text-slate-400 text-sm crypto-font">
                    {getCurrencySymbol(user.preferred_currency || 'USD')}{crypto.current_price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Recommendations */}
      <div className="glass-card p-6 slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Star className="w-6 h-6 text-cyan-400" />
            <span>Рекомендации экспертов</span>
          </h2>
          <div className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
            Обновлено сейчас
          </div>
        </div>

        <div className="grid gap-6">
          {recommendations.map((rec, index) => {
            const confidenceLevel = getConfidenceLevel(rec.confidence);
            
            return (
              <div key={index} className="prediction-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getRecommendationColor(rec.recommendation_type)}`}>
                      {getRecommendationIcon(rec.recommendation_type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white crypto-font">
                        {rec.symbol}
                      </h3>
                      <p className="text-slate-400 text-sm">{rec.timeframe}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getRecommendationColor(rec.recommendation_type)}`}>
                      {rec.recommendation_type}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Уверенность: <span className={confidenceLevel.color}>{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {rec.reason}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Цель: </span>
                    <span className="text-green-400 font-semibold crypto-font">
                      {getCurrencySymbol(user.preferred_currency || 'USD')}{rec.target_price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Стоп-лосс: </span>
                    <span className="text-red-400 font-semibold crypto-font">
                      {getCurrencySymbol(user.preferred_currency || 'USD')}{rec.stop_loss.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Точность: </span>
                    <span className="text-cyan-400 font-semibold">
                      {rec.accuracy_rating}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-slate-400">
                        Уровень уверенности: <span className={confidenceLevel.color}>{confidenceLevel.level}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Историческая точность: {rec.accuracy_rating}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investment Tips */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <span>Советы по инвестированию</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-white">Диверсификация</h3>
            <p className="text-slate-400 text-sm">
              Не вкладывайте все средства в одну криптовалюту. Распределите риски между разными активами.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">Долгосрочность</h3>
            <p className="text-slate-400 text-sm">
              Крипторынок волатилен. Лучшие результаты показывают долгосрочные инвестиции от 6 месяцев.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white">Управление рисками</h3>
            <p className="text-slate-400 text-sm">
              Всегда используйте стоп-лоссы и не инвестируйте больше, чем можете позволить себе потерять.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="glass-card p-6 border border-yellow-500/30">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">Важное предупреждение</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Данные рекомендации носят информационный характер и не являются финансовыми советами. 
              Инвестиции в криптовалюты связаны с высокими рисками. Всегда проводите собственный анализ 
              и консультируйтесь с финансовыми консультантами перед принятием инвестиционных решений.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Investments;