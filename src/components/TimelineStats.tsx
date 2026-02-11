import { Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { Milestone } from '../types';

interface TimelineStatsProps {
  milestones: Milestone[];
  targetDate: string;
}

export function TimelineStats({ milestones, targetDate }: TimelineStatsProps) {
  const now = new Date();
  const target = new Date(targetDate);
  const daysUntilTarget = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const milestonesWithDates = milestones.filter(m => m.reminderDate);
  const completedMilestones = milestones.filter(m => m.completed).length;
  const upcomingMilestones = milestonesWithDates.filter(m => {
    const reminderDate = new Date(m.reminderDate!);
    const daysUntil = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30 && !m.completed;
  }).length;

  const overdueMilestones = milestonesWithDates.filter(m => {
    const reminderDate = new Date(m.reminderDate!);
    return reminderDate < now && !m.completed;
  }).length;

  const nextMilestone = milestonesWithDates
    .filter(m => {
      const reminderDate = new Date(m.reminderDate!);
      return reminderDate > now && !m.completed;
    })
    .sort((a, b) => {
      const dateA = new Date(a.reminderDate!).getTime();
      const dateB = new Date(b.reminderDate!).getTime();
      return dateA - dateB;
    })[0];

  const formatDaysUntil = (days: number) => {
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.ceil(days / 7)} weeks`;
    if (days < 365) return `${Math.ceil(days / 30)} months`;
    return `${Math.ceil(days / 365)} years`;
  };

  const getNextMilestoneDays = () => {
    if (!nextMilestone) return null;
    const nextDate = new Date(nextMilestone.reminderDate!);
    return Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextMilestoneDays = getNextMilestoneDays();

  if (milestonesWithDates.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-100 p-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-purple-700">Next Milestone</span>
          </div>
          <div className="text-2xl text-purple-700 mb-1">
            {nextMilestoneDays !== null && formatDaysUntil(nextMilestoneDays)}
          </div>
          <p className="text-xs text-gray-600 line-clamp-1">{nextMilestone.title}</p>
        </div>
      )}

      {/* Target Date */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-blue-100 p-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xs text-blue-700">Target Date</span>
        </div>
        <div className="text-2xl text-blue-700 mb-1">
          {formatDaysUntil(daysUntilTarget)}
        </div>
        <p className="text-xs text-gray-600">
          {target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Upcoming (This Month) */}
      {upcomingMilestones > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-orange-700">Upcoming</span>
          </div>
          <div className="text-2xl text-orange-700 mb-1">
            {upcomingMilestones}
          </div>
          <p className="text-xs text-gray-600">in next 30 days</p>
        </div>
      )}

      {/* Overdue */}
      {overdueMilestones > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-red-100 p-1.5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs text-red-700">Overdue</span>
          </div>
          <div className="text-2xl text-red-700 mb-1">
            {overdueMilestones}
          </div>
          <p className="text-xs text-gray-600">needs attention</p>
        </div>
      )}

      {/* Progress */}
      {completedMilestones > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-100 p-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-green-700">Completed</span>
          </div>
          <div className="text-2xl text-green-700 mb-1">
            {completedMilestones}/{milestones.length}
          </div>
          <p className="text-xs text-gray-600">
            {Math.round((completedMilestones / milestones.length) * 100)}% done
          </p>
        </div>
      )}
    </div>
  );
}
