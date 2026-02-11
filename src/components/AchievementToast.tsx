import type { Achievement } from '../types';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

interface AchievementToastProps {
  achievement: Achievement;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4"
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-2xl shadow-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/30 backdrop-blur-sm rounded-full p-3">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{achievement.icon}</span>
              <span className="text-sm">Achievement Unlocked!</span>
            </div>
            <h3 className="text-sm mb-1">{achievement.title}</h3>
            <p className="text-xs opacity-90">{achievement.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
