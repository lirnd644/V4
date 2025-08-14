import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Clock, CheckCircle, Zap, Calendar, Star } from 'lucide-react';

const Bonus = ({ user, setUser }) => {
  const [timeUntilBonus, setTimeUntilBonus] = useState('');
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    calculateTimeUntilBonus();
    const interval = setInterval(calculateTimeUntilBonus, 1000);
    return () => clearInterval(interval);
  }, [user.last_bonus_claim]);

  const calculateTimeUntilBonus = () => {
    if (!user.last_bonus_claim) {
      setCanClaim(true);
      setTimeUntilBonus('');
      return;
    }

    const lastClaim = new Date(user.last_bonus_claim);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    const now = new Date();

    if (now >= nextClaim) {
      setCanClaim(true);
      setTimeUntilBonus('');
    } else {
      setCanClaim(false);
      const diff = nextClaim - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilBonus(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  const claimBonus = async () => {
    setClaiming(true);
    try {
      const response = await axios.post('/api/bonus/claim');
      setUser({ 
        ...user, 
        free_predictions: user.free_predictions + 1,
        last_bonus_claim: new Date().toISOString()
      });
      alert('Ежедневный бонус получен! +1 прогноз добавлен к вашему счету.');
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при получении бонуса');
    } finally {
      setClaiming(false);
    }
  };

  const bonusHistory = [
    { date: '2024-01-15', type: 'Ежедневный бонус', amount: 1 },
    { date: '2024-01-14', type: 'Реферальный бонус', amount: 1 },
    { date: '2024-01-13', type: 'Ежедневный бонус', amount: 1 },
    { date: '2024-01-12', type: 'Ежедневный бонус', amount: 1 },
    { date: '2024-01-11', type: 'Новый пользователь', amount: 5 },
  ];

  const upcomingBonuses = [
    { day: 7, bonus: 2, title: 'Недельный бонус' },
    { day: 30, bonus: 5, title: 'Месячный бонус' },
    { day: 100, bonus: 10, title: 'VIP статус' },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysWithUs = () => {
    const joinDate = new Date(user.created_at);
    const now = new Date();
    return Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card p-8 fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Gift className="w-8 h-8 text-cyan-400" />
              <span>Бонусная система</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Получайте бесплатные прогнозы каждый день и за достижения
            </p>
          </div>
        </div>
      </div>

      {/* Daily Bonus Card */}
      <div className="glass-card p-8 slide-in-right">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Ежедневный бонус</h2>
            <p className="text-slate-400">Получайте +1 бесплатный прогноз каждые 24 часа</p>
          </div>

          <div className="relative">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center border-4 ${
              canClaim 
                ? 'border-cyan-400 bg-cyan-500/20 pulse-glow' 
                : 'border-slate-600 bg-slate-800/50'
            }`}>
              {canClaim ? (
                <Gift className="w-12 h-12 text-cyan-400" />
              ) : (
                <Clock className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            {canClaim && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {canClaim ? (
            <div className="space-y-4">
              <p className="text-green-400 font-semibold text-lg">Бонус доступен!</p>
              <button
                onClick={claimBonus}
                className="btn-primary px-8 py-4 text-lg"
                disabled={claiming}
              >
                {claiming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Получаем...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Получить бонус
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-400">Следующий бонус через:</p>
              <div className="text-3xl font-bold crypto-font gradient-text">
                {timeUntilBonus}
              </div>
              <p className="text-xs text-slate-500">часы:минуты:секунды</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <Calendar className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
          <div className="text-3xl font-bold gradient-text crypto-font mb-2">
            {getDaysWithUs()}
          </div>
          <div className="text-slate-400 font-medium">Дней с нами</div>
          <div className="text-xs text-slate-500 mt-1">Ваш стаж в CripteX</div>
        </div>

        <div className="stat-card">
          <Star className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-yellow-400 crypto-font mb-2">
            {user.referral_earnings || 0}
          </div>
          <div className="text-slate-400 font-medium">Всего бонусов</div>
          <div className="text-xs text-slate-500 mt-1">Полученных прогнозов</div>
        </div>

        <div className="stat-card">
          <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
          <div className="text-3xl font-bold text-purple-400 crypto-font mb-2">
            {user.free_predictions}
          </div>
          <div className="text-slate-400 font-medium">Текущий баланс</div>
          <div className="text-xs text-slate-500 mt-1">Доступных прогнозов</div>
        </div>
      </div>

      {/* Upcoming Bonuses */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Предстоящие награды</h2>
        
        <div className="space-y-4">
          {upcomingBonuses.map((bonus, index) => {
            const daysWithUs = getDaysWithUs();
            const isAchieved = daysWithUs >= bonus.day;
            const daysLeft = Math.max(0, bonus.day - daysWithUs);
            
            return (
              <div
                key={index}
                className={`prediction-card ${isAchieved ? 'border-green-500/50' : 'border-slate-700/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAchieved 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {isAchieved ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Gift className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{bonus.title}</h3>
                      <p className="text-slate-400 text-sm">
                        День {bonus.day} • +{bonus.bonus} прогнозов
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      isAchieved ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {isAchieved ? 'Получено' : `${daysLeft} дней`}
                    </div>
                    {!isAchieved && (
                      <div className="text-xs text-slate-500">
                        До получения
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus History */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">История бонусов</h2>
        
        <div className="space-y-3">
          {bonusHistory.map((bonus, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Gift className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{bonus.type}</p>
                  <p className="text-slate-400 text-sm">{formatDate(bonus.date)}</p>
                </div>
              </div>
              <div className="text-green-400 font-semibold">
                +{bonus.amount} прогноз{bonus.amount > 1 ? 'ов' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Как получить больше бонусов</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Ежедневно заходите</h3>
                <p className="text-slate-400 text-sm">Не забывайте получать ежедневный бонус каждые 24 часа</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Достижения</h3>
                <p className="text-slate-400 text-sm">Получайте крупные бонусы за долгосрочное использование</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Gift className="w-5 h-5 text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Приглашайте друзей</h3>
                <p className="text-slate-400 text-sm">За каждого нового пользователя получайте дополнительные прогнозы</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Активность</h3>
                <p className="text-slate-400 text-sm">Чем больше вы используете платформу, тем больше бонусов получаете</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;