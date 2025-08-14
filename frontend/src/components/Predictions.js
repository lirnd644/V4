import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Predictions = ({ user, setUser }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cryptoData, setCryptoData] = useState([]);

  const [formData, setFormData] = useState({
    symbol: 'BITCOIN',
    prediction_type: 'bullish',
    timeframe: '1h',
    target_price: '',
    stop_loss: ''
  });

  useEffect(() => {
    fetchPredictions();
    fetchCryptoData();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/predictions');
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get('/api/crypto/prices');
      setCryptoData(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    }
  };

  const getCurrentPrice = (symbol) => {
    const crypto = cryptoData.find(c => c.symbol === symbol);
    return crypto ? crypto.current_price : 50000;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user.free_predictions <= 0) {
      alert('У вас нет свободных прогнозов!');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post('/api/predictions', formData);
      setPredictions([response.data, ...predictions]);
      setUser({ ...user, free_predictions: user.free_predictions - 1 });
      setShowForm(false);
      setFormData({
        symbol: 'BITCOIN',
        prediction_type: 'bullish',
        timeframe: '1h',
        target_price: '',
        stop_loss: ''
      });
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Ошибка при создании прогноза');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (prediction) => {
    // Mock status logic
    const random = Math.random();
    if (random > 0.7) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (random > 0.4) return <Clock className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusText = (prediction) => {
    const random = Math.random();
    if (random > 0.7) return { text: 'Достигнута цель', color: 'text-green-400' };
    if (random > 0.4) return { text: 'В процессе', color: 'text-yellow-400' };
    return { text: 'Стоп-лосс', color: 'text-red-400' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Target className="w-8 h-8 text-cyan-400" />
              <span>Торговые Прогнозы</span>
            </h1>
            <p className="text-slate-400 text-lg">
              У вас осталось <span className="text-cyan-400 font-semibold crypto-font">{user.free_predictions}</span> бесплатных прогнозов
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className={`btn-primary px-6 py-3 ${user.free_predictions <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={user.free_predictions <= 0}
          >
            Новый прогноз
          </button>
        </div>
      </div>

      {/* Create Prediction Form */}
      {showForm && (
        <div className="glass-card p-6 slide-in-right">
          <h2 className="text-xl font-bold text-white mb-6">Создать новый прогноз</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Криптовалюта
                </label>
                <select
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="BITCOIN">Bitcoin (BTC)</option>
                  <option value="ETHEREUM">Ethereum (ETH)</option>
                  <option value="BINANCECOIN">Binance Coin (BNB)</option>
                  <option value="CARDANO">Cardano (ADA)</option>
                  <option value="SOLANA">Solana (SOL)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Направление
                </label>
                <select
                  value={formData.prediction_type}
                  onChange={(e) => setFormData({ ...formData, prediction_type: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="bullish">Рост (BULLISH)</option>
                  <option value="bearish">Падение (BEARISH)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Таймфрейм
                </label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="5m">5 минут</option>
                  <option value="15m">15 минут</option>
                  <option value="1h">1 час</option>
                  <option value="4h">4 часа</option>
                  <option value="1d">1 день</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Текущая цена
                </label>
                <div className="form-input bg-slate-800/50 text-slate-400">
                  ${getCurrentPrice(formData.symbol).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Целевая цена ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_price}
                  onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                  className="form-input"
                  placeholder="Введите целевую цену"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Стоп-лосс ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({ ...formData, stop_loss: e.target.value })}
                  className="form-input"
                  placeholder="Введите стоп-лосс"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="btn-primary px-8 py-3 flex items-center space-x-2"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Создать прогноз</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary px-8 py-3"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Predictions List */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">История прогнозов</h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((prediction, index) => {
              const status = getStatusText(prediction);
              return (
                <div key={index} className="prediction-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        prediction.prediction_type === 'bullish' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {prediction.prediction_type === 'bullish' ? 
                          <TrendingUp className="w-6 h-6" /> : 
                          <TrendingDown className="w-6 h-6" />
                        }
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white crypto-font">
                          {prediction.symbol}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {prediction.timeframe} • {formatDate(prediction.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(prediction)}
                      <span className={`text-sm font-semibold ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Вход: </span>
                      <span className="text-white font-semibold crypto-font">
                        ${prediction.entry_price.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Цель: </span>
                      <span className="text-white font-semibold crypto-font">
                        ${prediction.target_price.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Стоп: </span>
                      <span className="text-white font-semibold crypto-font">
                        ${prediction.stop_loss.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Точность: </span>
                      <span className="text-cyan-400 font-semibold">
                        {prediction.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Нет прогнозов</h3>
            <p className="text-slate-500 mb-6">Создайте свой первый торговый прогноз</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
              disabled={user.free_predictions <= 0}
            >
              Создать прогноз
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictions;