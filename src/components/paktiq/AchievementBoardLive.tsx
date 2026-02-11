import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trophy, Star, Flame, Target, TrendingUp, Award, Lock, Share2, X } from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements';
import type { Achievement } from '../../types';

type AchievementWithStatus = {
  type: string;
  title: string;
  requirement: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  description: string;
};

type AchievementBoardLiveProps = {
  onBack: () => void;
  isDarkMode: boolean;
};

export default function AchievementBoardLive({ onBack, isDarkMode }: AchievementBoardLiveProps) {
  const { achievements, loading } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const bgGradient = isDarkMode 
    ? 'bg-gradient-to-br from-[#1a1625] via-[#2a1f3d] to-[#1a1625]'
    : 'bg-gradient-to-br from-[#9163F2] to-[#3C2B63]';
  
  const cardBg = isDarkMode ? 'bg-[#2a1f3d]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#3C2B63]';
  const textSecondary = isDarkMode ? 'text-white/70' : 'text-[#3C2B63]/70';

  // All available achievements (mix of earned and locked)
  const allAchievements = [
    { type: 'first_pakt', title: 'First Step', requirement: 'Complete 1 Resolve', icon: '🎯' },
    { type: 'first_milestone', title: 'Getting Started', requirement: 'Complete 1 milestone', icon: '⭐' },
    { type: 'milestone_10', title: 'On a Roll', requirement: 'Complete 10 milestones', icon: '🔥' },
    { type: 'milestone_25', title: 'Half Century', requirement: 'Complete 25 milestones', icon: '💯' },
    { type: 'milestone_50', title: 'Century', requirement: 'Complete 50 milestones', icon: '💪' },
    { type: 'milestone_100', title: 'Legend', requirement: 'Complete 100 milestones', icon: '👑' },
    { type: 'pakt_5', title: 'Dedicated', requirement: 'Complete 5 Resolves', icon: '🌟' },
    { type: 'pakt_10', title: 'Champion', requirement: 'Complete 10 Resolves', icon: '🏆' },
    { type: 'streak_7', title: 'Week Warrior', requirement: '7-day streak', icon: '⚡' },
    { type: 'streak_30', title: 'Month Master', requirement: '30-day streak', icon: '🔥' },
  ];

  // Merge with earned achievements
  const achievementsWithStatus: AchievementWithStatus[] = allAchievements.map(preset => {
    const earned = achievements.find(a => a.type === preset.type);
    return {
      ...preset,
      earned: !!earned,
      earnedDate: earned?.earned_at,
      description: earned?.description || preset.requirement,
    };
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${bgGradient} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const earnedCount = achievements.length;
  const totalCount = allAchievements.length;

  return (
    <div className={`min-h-screen ${bgGradient} transition-colors`}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="p-3 bg-white/10 backdrop-blur-lg rounded-full mb-6 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <Trophy className="w-20 h-20 mx-auto mb-4 text-[#FFD88A]" />
          <h1 className="text-4xl text-white mb-2">Achievements</h1>
          <p className="text-lg text-white/70">
            {earnedCount} of {totalCount} unlocked
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-full h-3 overflow-hidden mb-6"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#FFD88A] to-[#96E6B3]"
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </motion.div>
      </div>

      {/* Achievements Grid */}
      <div className="px-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {achievementsWithStatus.map((achievement, index) => (
            <motion.div
              key={achievement.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => setSelectedAchievement(achievement as any)}
              className={`${cardBg} rounded-3xl p-6 text-center cursor-pointer hover:scale-105 transition-transform ${
                !achievement.earned ? 'opacity-50' : ''
              }`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${
                achievement.earned ? 'bg-gradient-to-br from-[#FFD88A] to-[#96E6B3]' : 'bg-gray-200'
              }`}>
                {achievement.earned ? achievement.icon : '🔒'}
              </div>

              {/* Title */}
              <h3 className={`text-base ${textPrimary} mb-1`}>{achievement.title}</h3>

              {/* Requirement */}
              <p className={`text-xs ${textSecondary}`}>{achievement.requirement}</p>

              {/* Earned Date */}
              {achievement.earned && achievement.earnedDate && (
                <p className="text-xs text-[#96E6B3] mt-2">
                  {new Date(achievement.earnedDate).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`${cardBg} rounded-3xl p-8 max-w-md w-full`}
            >
              <div className="text-center">
                {/* Icon */}
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-6xl ${
                  selectedAchievement.earned ? 'bg-gradient-to-br from-[#FFD88A] to-[#96E6B3]' : 'bg-gray-200'
                }`}>
                  {selectedAchievement.earned ? selectedAchievement.icon : '🔒'}
                </div>

                {/* Title */}
                <h2 className={`text-2xl ${textPrimary} mb-2`}>{selectedAchievement.title}</h2>

                {/* Description */}
                <p className={`text-base ${textSecondary} mb-4`}>{selectedAchievement.description}</p>

                {/* Status */}
                {selectedAchievement.earned ? (
                  <div className="bg-[#96E6B3]/20 text-[#96E6B3] py-2 px-4 rounded-full inline-block mb-4">
                    Unlocked!
                  </div>
                ) : (
                  <div className="bg-gray-200 text-gray-600 py-2 px-4 rounded-full inline-block mb-4">
                    Locked
                  </div>
                )}

                {/* Earned Date */}
                {selectedAchievement.earned && selectedAchievement.earnedDate && (
                  <p className="text-sm text-gray-500 mb-6">
                    Earned on {new Date(selectedAchievement.earnedDate).toLocaleDateString()}
                  </p>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="w-full bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white py-3 rounded-2xl hover:scale-105 transition-transform"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

