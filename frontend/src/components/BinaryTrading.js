import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Clock, Target, Zap, AlertTriangle } from 'lucide-react';

const BinaryTrading = ({ user, setUser }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [direction, setDirection] = useState('UP');
  const [timeframe, setTimeframe] = useState('5m');
  const [stakeAmount, setStakeAmount] = useState(1);
  const [cryptoData, setCryptoData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    fetchPredictions();
    fetchCryptoData();
  }, []);

  useEffect(() => {
    updateCurrentPrice();
  }, [selectedCrypto, cryptoData]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/binary-predictions');
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get(`/api/crypto/prices?currency=${user.preferred_currency || 'USD'}&limit=25`);
      setCryptoData(response.data);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    }
  };

  const updateCurrentPrice = () => {
    const crypto = cryptoData.find(c => c.symbol === selectedCrypto);
    if (crypto) {
      setCurrentPrice(crypto.current_price);
    }
  };

  const handleCreatePrediction = async (e) => {
    e.preventDefault();
    
    if (user.free_predictions < stakeAmount) {
      alert('Недостаточно бесплатных прогнозов!');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post('/api/binary-predictions', {
        symbol: selectedCrypto,
        direction: direction,
        timeframe: timeframe,
        stake_amount: stakeAmount
      });
      
      setPredictions([response.data, ...predictions]);
      setUser({ ...user, free_predictions: user.free_predictions - stakeAmount });
      
      alert(`Прогноз создан! Цена пойдет ${direction === 'UP' ? 'ВВЕРХ' : 'ВНИЗ'} за ${timeframe}`);
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Ошибка при создании прогноза');
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString('ru-RU');
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

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$', 'RUB': '₽', 'EUR': '€', 'GBP': '£',
      'JPY': '¥', 'CNY': '¥', 'KRW': '₩', 'INR': '₹'
    };
    return symbols[currency] || '$';
  };

  const timeframes = [
    { value: '1m', label: '1 минута' },
    { value: '5m', label: '5 минут' },
    { value: '15m', label: '15 минут' },
    { value: '30m', label: '30 минут' },
    { value: '1h', label: '1 час' },
    { value: '4h', label: '4 часа' },
    { value: '1d', label: '1 день' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Target className="w-8 h-8 text-cyan-400" />
              <span>Бинарные Опционы</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Прогнозируйте направление цены - ВВЕРХ или ВНИЗ за определенное время
            </p>
          </div>
          
          <div className="stat-card">
            <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold gradient-text crypto-font">{user.free_predictions}</div>
            <div className="text-sm text-slate-400">Прогнозов</div>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Prediction Form */}
        <div className="glass-card p-6 slide-in-right">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <span>Создать прогноз</span>
          </h2>
          
          <form onSubmit={handleCreatePrediction} className="space-y-6">
            {/* Crypto Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Криптовалюта
              </label>
              <select
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="form-select"
              >
                {cryptoData.map((crypto) => (
                  <option key={crypto.symbol} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Price Display */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/20">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white crypto-font">{selectedCrypto}</h3>
                <div className="text-3xl font-bold gradient-text crypto-font">
                  {getCurrencySymbol(user.preferred_currency || 'USD')}{currentPrice.toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm">Текущая цена</p>
              </div>
            </div>

            {/* Direction Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Направление прогноза
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDirection('UP')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    direction === 'UP'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-green-500/50'
                  }`}
                >
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">ВВЕРХ</div>
                  <div className="text-xs">Цена вырастет</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDirection('DOWN')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    direction === 'DOWN'
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-red-500/50'
                  }`}
                >
                  <TrendingDown className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-semibold">ВНИЗ</div>
                  <div className="text-xs">Цена упадет</div>
                </button>
              </div>
            </div>

            {/* Timeframe Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Время экспирации
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="form-select"
              >
                {timeframes.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stake Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Ставка (количество прогнозов)
              </label>
              <select
                value={stakeAmount}
                onChange={(e) => setStakeAmount(parseInt(e.target.value))}
                className="form-select"
              >
                <option value={1}>1 прогноз (обычная ставка)</option>
                <option value={2}>2 прогноза (удвоенная ставка)</option>
                <option value={3}>3 прогноза (тройная ставка)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Большая ставка = больший выигрыш, но больший риск
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                direction === 'UP'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              }`}
              disabled={creating || user.free_predictions < stakeAmount}
            >
              {creating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Создаем прогноз...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {direction === 'UP' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>Прогноз {direction === 'UP' ? 'ВВЕРХ' : 'ВНИЗ'}</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Active Predictions */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Активные прогнозы</span>
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : predictions.filter(p => p.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-4">
              {predictions.filter(p => p.status === 'ACTIVE').map((prediction, index) => (
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
                        <h3 className="text-lg font-semibold text-white crypto-font">
                          {prediction.symbol}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {prediction.timeframe} • Ставка: {prediction.stake_amount}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-cyan-400 font-semibold">
                        {getTimeLeft(prediction.expiry_time)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Осталось времени
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Входная цена: </span>
                        <span className="text-white font-semibold crypto-font">
                          {getCurrencySymbol(user.preferred_currency || 'USD')}{prediction.entry_price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Уверенность: </span>
                        <span className="text-cyan-400 font-semibold">
                          {prediction.confidence_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Нет активных прогнозов</h3>
              <p className="text-slate-500">Создайте свой первый бинарный прогноз</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <span>Как работают бинарные опционы</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-cyan-400 font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold text-white">Выберите направление</h3>
            <p className="text-slate-400 text-sm">
              Прогнозируйте, пойдет ли цена ВВЕРХ или ВНИЗ за выбранное время
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-cyan-400 font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold text-white">Дождитесь результата</h3>
            <p className="text-slate-400 text-sm">
              Следите за ценой в реальном времени до истечения времени прогноза
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-cyan-400 font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold text-white">Получите награду</h3>
            <p className="text-slate-400 text-sm">
              Если прогноз верный, получите бонусные прогнозы за выигрыш
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinaryTrading;