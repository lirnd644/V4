import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Target, TrendingUp, Calendar, Award, Settings } from 'lucide-react';

const Profile = ({ user, setUser }) => {
  const [stats, setStats] = useState({
    totalPredictions: user.total_predictions_used || 0,
    successRate: 75.5,
    totalProfit: 0,
    winStreak: 5
  });

  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [predictionsResponse] = await Promise.all([
        axios.get('/api/predictions')
      ]);
      
      setRecentPredictions(predictionsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          <div className="flex items-center space-x-6">
            <img
              src={user.picture || '/api/placeholder/80/80'}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-cyan-400/50"
            />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-slate-400 mb-1">{user.email}</p>
              <p className="text-sm text-slate-500">
                Участник с {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text crypto-font">{user.free_predictions}</div>
                <div className="text-sm text-slate-400">Остаток прогнозов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text crypto-font">{stats.totalPredictions}</div>
                <div className="text-sm text-slate-400">Всего использовано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text crypto-font">{user.referral_count}</div>
                <div className="text-sm text-slate-400">Рефералов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text crypto-font">{user.referral_earnings}</div>
                <div className="text-sm text-slate-400">Бонусов получено</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-in-right">
        <div className="stat-card">
          <Target className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
          <div className="text-3xl font-bold gradient-text crypto-font mb-2">{stats.successRate}%</div>
          <div className="text-slate-400 font-medium">Точность прогнозов</div>
          <div className="text-xs text-slate-500 mt-1">За последние 30 дней</div>
        </div>

        <div className="stat-card">
          <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-green-400 crypto-font mb-2">+{stats.totalProfit}%</div>
          <div className="text-slate-400 font-medium">Общий профит</div>
          <div className="text-xs text-slate-500 mt-1">Условный расчет</div>
        </div>

        <div className="stat-card">
          <Award className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-yellow-400 crypto-font mb-2">{stats.winStreak}</div>
          <div className="text-slate-400 font-medium">Текущая серия</div>
          <div className="text-xs text-slate-500 mt-1">Успешные прогнозы подряд</div>
        </div>

        <div className="stat-card">
          <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-purple-400 crypto-font mb-2">
            {Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-slate-400 font-medium">Дней с нами</div>
          <div className="text-xs text-slate-500 mt-1">Стаж трейдера</div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Target className="w-6 h-6 text-cyan-400" />
          <span>Последние прогнозы</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : recentPredictions.length > 0 ? (
          <div className="space-y-4">
            {recentPredictions.map((prediction, index) => (
              <div key={index} className="prediction-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      prediction.prediction_type === 'bullish' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {prediction.prediction_type === 'bullish' ? 
                        <TrendingUp className="w-5 h-5" /> : 
                        <TrendingDown className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white crypto-font">
                        {prediction.symbol}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {prediction.timeframe} • ${prediction.entry_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-cyan-400 font-semibold">
                      {prediction.confidence}% точность
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(prediction.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Цель: </span>
                      <span className="text-white font-semibold">
                        ${prediction.target_price.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Стоп: </span>
                      <span className="text-white font-semibold">
                        ${prediction.stop_loss.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Нет прогнозов</h3>
            <p className="text-slate-500">Создайте свой первый прогноз на странице "Прогнозы"</p>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Настройки аккаунта</span>
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
            <div>
              <h3 className="text-lg font-semibold text-white">Уведомления</h3>
              <p className="text-slate-400 text-sm">Получать уведомления о новых прогнозах</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
            <div>
              <h3 className="text-lg font-semibold text-white">Email рассылка</h3>
              <p className="text-slate-400 text-sm">Ежедневные сводки и аналитика</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Приватность</h3>
              <p className="text-slate-400 text-sm">Скрыть статистику от других пользователей</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;