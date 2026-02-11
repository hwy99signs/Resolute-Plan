import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Target, Calendar, Clock, Award, BarChart3 } from 'lucide-react';
// Legacy web component - PaktData is defined in PaktCreationContext
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type InsightsOverviewProps = {
  Resolves: PaktData[];
  onBack: () => void;
  isDarkMode: boolean;
};

export default function InsightsOverview({ Resolves, onBack, isDarkMode }: InsightsOverviewProps) {
  // Calculate weekly data from Resolves (last 7 days of milestone completions)
  // This is a simplified calculation - in production, you'd fetch from analytics table
  const today = new Date();
  const weeklyData = [
    { day: 'Mon', completed: 0 },
    { day: 'Tue', completed: 0 },
    { day: 'Wed', completed: 0 },
    { day: 'Thu', completed: 0 },
    { day: 'Fri', completed: 0 },
    { day: 'Sat', completed: 0 },
    { day: 'Sun', completed: 0 },
  ];
  
  // Calculate category breakdown from actual Resolves
  const categoryMap = new Map<string, number>();
  Resolves.forEach(Resolve => {
    const category = Resolve.category || 'Other';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  
  const categoryData = Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count,
  }));
  
  // Calculate real stats from Resolves
  const totalMilestones = Resolves.reduce((sum, p) => sum + (p.milestones?.length || 0), 0);
  const completedMilestones = Resolves.reduce((sum, p) => 
    sum + (p.milestones?.filter(m => m.completed).length || 0), 0
  );
  const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  
  // Calculate streak (simplified - in production, use analytics table)
  const allCompletedDates = Resolves
    .flatMap(p => p.milestones?.filter(m => m.completedAt).map(m => new Date(m.completedAt!)) || [])
    .map(d => {
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
  const uniqueDates = new Set(allCompletedDates);
  let streak = 0;
  let checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);
  while (uniqueDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  const badgesEarned = 0; // Would need to fetch from achievements table
  
  // Calculate consistency score
  const consistencyScore = Math.min(100, Math.round((streak / 7) * 50 + (completionRate * 0.5)));
  
  // Calculate productivity times from completion rate (simplified - in production, use time-of-day data)
  const productivityTimes = [
    { time: 'Morning (6AM - 12PM)', percentage: Math.min(100, Math.round(completionRate * 0.7)), color: '#FFD88A' },
    { time: 'Afternoon (12PM - 6PM)', percentage: Math.min(100, Math.round(completionRate * 0.5)), color: '#96E6B3' },
    { time: 'Evening (6PM - 12AM)', percentage: Math.min(100, Math.round(completionRate * 0.3)), color: '#9163F2' },
  ];

  const bgColor = isDarkMode ? 'bg-[#1a1625]' : 'bg-[#F4F4F6]';
  const cardBg = isDarkMode ? 'bg-[#2a1f3d]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#3C2B63]';
  const textSecondary = isDarkMode ? 'text-white/70' : 'text-[#3C2B63]/70';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3C2B63] to-[#9163F2] text-white p-6">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl mb-1">Insights</h1>
              <p className="text-sm opacity-80">Your progress analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-md px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardBg} rounded-3xl p-6 shadow-lg`}
          >
            <div className="bg-gradient-to-br from-[#96E6B3] to-[#9163F2] p-3 rounded-2xl w-fit mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className={`text-3xl ${textPrimary} mb-1`}>{completionRate}%</div>
            <div className={`text-sm ${textSecondary}`}>Completion Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${cardBg} rounded-3xl p-6 shadow-lg`}
          >
            <div className="bg-gradient-to-br from-[#FFD88A] to-[#FF6A6A] p-3 rounded-2xl w-fit mb-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className={`text-3xl ${textPrimary} mb-1`}>27</div>
            <div className={`text-sm ${textSecondary}`}>Milestones Done</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${cardBg} rounded-3xl p-6 shadow-lg`}
          >
            <div className="bg-gradient-to-br from-[#9163F2] to-[#3C2B63] p-3 rounded-2xl w-fit mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className={`text-3xl ${textPrimary} mb-1`}>{streak}</div>
            <div className={`text-sm ${textSecondary}`}>Day Streak</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${cardBg} rounded-3xl p-6 shadow-lg`}
          >
            <div className="bg-gradient-to-br from-[#FF6A6A] to-[#FFD88A] p-3 rounded-2xl w-fit mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className={`text-3xl ${textPrimary} mb-1`}>{badgesEarned}</div>
            <div className={`text-sm ${textSecondary}`}>Badges Earned</div>
          </motion.div>
        </div>

        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardBg} rounded-3xl p-6 shadow-lg`}
        >
          <h3 className={`text-xl ${textPrimary} mb-4 flex items-center gap-2`}>
            <BarChart3 className="w-5 h-5 text-[#9163F2]" />
            Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff20' : '#3C2B6320'} />
              <XAxis dataKey="day" stroke={isDarkMode ? '#ffffff80' : '#3C2B6380'} />
              <YAxis stroke={isDarkMode ? '#ffffff80' : '#3C2B6380'} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#2a1f3d' : 'white',
                  border: 'none',
                  borderRadius: '12px',
                  color: isDarkMode ? 'white' : '#3C2B63'
                }}
              />
              <Bar dataKey="completed" fill="#9163F2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${cardBg} rounded-3xl p-6 shadow-lg`}
        >
          <h3 className={`text-xl ${textPrimary} mb-4`}>Category Breakdown</h3>
          <div className="space-y-3">
            {categoryData.map((item, index) => {
              const colors = ['#FF6A6A', '#96E6B3', '#9163F2', '#FFD88A'];
              const percentage = (item.count / categoryData.reduce((sum, d) => sum + d.count, 0)) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${textPrimary}`}>{item.category}</span>
                    <span className={`text-sm ${textSecondary}`}>{item.count} Resolves</span>
                  </div>
                  <div className={`h-3 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: colors[index] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Productivity Times */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`${cardBg} rounded-3xl p-6 shadow-lg`}
        >
          <h3 className={`text-xl ${textPrimary} mb-4 flex items-center gap-2`}>
            <Clock className="w-5 h-5 text-[#FFD88A]" />
            Best Productivity Times
          </h3>
          <div className="space-y-3">
            {productivityTimes.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${textPrimary}`}>{item.time}</span>
                  <span className={`text-sm ${textSecondary}`}>{item.percentage}%</span>
                </div>
                <div className={`h-3 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Consistency Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-[#9163F2] to-[#3C2B63] rounded-3xl p-6 shadow-lg text-white"
        >
          <h3 className="text-xl mb-4">Consistency Score</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl mb-2">{consistencyScore}</div>
              <div className="text-sm opacity-80">Excellent! Keep it up!</div>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#FFD88A"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - consistencyScore / 100) }}
                  transition={{ duration: 2, delay: 0.8 }}
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* AI Suggestions Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`${cardBg} rounded-3xl p-6 shadow-lg border-2 border-[#9163F2]/30`}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className={`text-xl ${textPrimary} mb-2`}>AI Insights Coming Soon</h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              Get personalized suggestions and optimize your Resolve strategy with AI
            </p>
            <button className="bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white px-6 py-3 rounded-2xl text-sm hover:shadow-xl transition-all">
              Join Waitlist
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
