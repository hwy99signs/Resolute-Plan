// Legacy web component - Resolution type not used in React Native app
// import type { Resolve } from '../types';
import { ChevronRight, Trash2, Target, Calendar, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ResolutionCardProps {
  resolution: Resolution;
  onClick: () => void;
  onDelete: () => void;
}

export function ResolutionCard({ resolution, onClick, onDelete }: ResolutionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const totalMilestones = resolution.milestones.length;
  const completedMilestones = resolution.milestones.filter(m => m.completed).length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const categoryEmoji: Record<string, string> = {
    health: '💪',
    finance: '💰',
    career: '🎯',
    personal: '🌟',
    education: '📚',
    relationships: '❤️',
    other: '✨'
  };

  const categoryGradients: Record<string, string> = {
    health: 'from-green-500 to-emerald-500',
    finance: 'from-yellow-500 to-orange-500',
    career: 'from-blue-500 to-indigo-500',
    personal: 'from-purple-500 to-pink-500',
    education: 'from-cyan-500 to-blue-500',
    relationships: 'from-red-500 to-pink-500',
    other: 'from-violet-500 to-purple-500'
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const targetDate = new Date(resolution.targetDate);
  const daysLeft = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden border border-purple-100 hover:border-purple-300 hover:-translate-y-1"
    >
      {/* Decorative gradient overlay */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${categoryGradients[resolution.category] || categoryGradients.other} opacity-5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`text-4xl bg-gradient-to-br ${categoryGradients[resolution.category] || categoryGradients.other} p-3 rounded-2xl shadow-md group-hover:scale-110 transition-transform`}>
              {categoryEmoji[resolution.category] || '✨'}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{resolution.title}</h3>
              {resolution.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{resolution.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleDelete}
            className={`p-2 rounded-xl transition-all ${
              showDeleteConfirm 
                ? 'bg-red-500 text-white scale-110' 
                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Section */}
        {totalMilestones > 0 ? (
          <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-purple-900">{completedMilestones} of {totalMilestones} milestones</span>
              </span>
              <span className="px-2 py-1 bg-white rounded-full text-purple-700">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${categoryGradients[resolution.category] || categoryGradients.other} transition-all duration-500 relative`}
                style={{ width: `${progress}%` }}
              >
                {progress > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-3 border border-dashed border-gray-300">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>No milestones yet - tap to add!</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
            daysLeft < 7 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : daysLeft < 30 
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <Calendar className="w-4 h-4" />
            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
          </div>
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl group-hover:shadow-lg transition-all">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
