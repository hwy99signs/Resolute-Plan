import { X, TrendingUp, Target, Award, Calendar, Zap } from 'lucide-react';
import type { Resolve, Achievement } from '../types';

interface StatsDrawerProps {
  resolutions: Resolution[];
  achievements: Achievement[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    totalMilestones: number;
    completedMilestones: number;
  };
  onClose: () => void;
}

export function StatsDrawer({ resolutions, achievements, stats, onClose }: StatsDrawerProps) {
  // Category breakdown
  const categoryStats = resolutions.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryEmoji: Record<string, string> = {
    health: '💪',
    finance: '💰',
    career: '🎯',
    personal: '🌟',
    education: '📚',
    relationships: '❤️',
    other: '✨'
  };

  // Success rate
  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const milestoneSuccessRate = stats.totalMilestones > 0 
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) 
    : 0;

  // Upcoming deadlines
  const upcomingDeadlines = resolutions
    .filter(r => !r.milestones.every(m => m.completed))
    .map(r => ({
      ...r,
      daysUntil: Math.ceil((new Date(r.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 3);

  // Current streak (days with activity)
  const recentActivity = [...resolutions]
    .flatMap(r => r.milestones.filter(m => m.completedAt).map(m => m.completedAt!))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  if (recentActivity.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    const activityDates = new Set(
      recentActivity.map(date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    while (activityDates.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2>Statistics & Insights</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                <div className="text-2xl mb-1">{successRate}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                <div className="text-2xl mb-1">{milestoneSuccessRate}%</div>
                <div className="text-xs text-gray-600">Milestone Rate</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <div className="text-2xl mb-1">{stats.completedMilestones}</div>
                <div className="text-xs text-gray-600">Completed Tasks</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
                <div className="text-2xl mb-1">{currentStreak}</div>
                <div className="text-xs text-gray-600">Day Streak</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-gray-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              By Category
            </h3>
            <div className="space-y-2">
              {Object.entries(categoryStats).map(([category, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={category} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">
                        {categoryEmoji[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div>
              <h3 className="text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-2">
                {upcomingDeadlines.map(r => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{categoryEmoji[r.category]}</span>
                      <span className="text-sm text-gray-800 truncate">{r.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                      r.daysUntil < 7 
                        ? 'bg-red-100 text-red-700' 
                        : r.daysUntil < 30 
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {r.daysUntil > 0 ? `${r.daysUntil}d left` : 'Overdue'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <h3 className="text-gray-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Achievements ({achievements.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-3 text-center"
                  >
                    <div className="text-3xl mb-1">{achievement.icon}</div>
                    <div className="text-xs text-gray-800">{achievement.title.replace(/[🎯🚀✅💪🏆🌟🌅📋]/g, '').trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivation */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-5 text-white text-center">
            <Zap className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm mb-1">Keep pushing forward!</p>
            <p className="text-xs opacity-90">
              You're making great progress on your Resolves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
