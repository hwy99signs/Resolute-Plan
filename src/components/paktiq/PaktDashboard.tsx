import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Target, Flame, Trophy, TrendingUp, CheckCircle2, Circle, Edit, Settings, Award, BarChart3, Library } from 'lucide-react';
// Legacy web component - types not used in React Native app
// PaktData is defined in PaktCreationContext

type PaktDashboardProps = {
  Resolves: PaktData[];
  onNavigate: (screen: Screen) => void;
  isDarkMode: boolean;
};

export default function PaktDashboard({ Resolves, onNavigate, isDarkMode }: PaktDashboardProps) {
  const [selectedPakt, setSelectedPakt] = useState(Resolves[0] || null);
  const [showConfetti, setShowConfetti] = useState(false);

  const completeMilestone = (paktIndex: number, milestoneId: string) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const currentStreak = 7; // Mock data
  const totalPakts = Resolves.length;
  const completedMilestones = Resolves.reduce((acc, Resolve) => 
    acc + (Resolve.milestones?.filter(m => m.completed).length || 0), 0
  );
  const totalMilestones = Resolves.reduce((acc, Resolve) => 
    acc + (Resolve.milestones?.length || 0), 0
  );
  const progressPercentage = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const bgColor = isDarkMode ? 'bg-[#1a1625]' : 'bg-[#F4F4F6]';
  const cardBg = isDarkMode ? 'bg-[#2a1f3d]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-[#3C2B63]';
  const textSecondary = isDarkMode ? 'text-white/70' : 'text-[#3C2B63]/70';

  return (
    <div className={`min-h-screen ${bgColor} transition-colors`}>
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  backgroundColor: ['#FFD88A', '#96E6B3', '#9163F2', '#FF6A6A'][Math.floor(Math.random() * 4)],
                }}
                initial={{ y: 0, opacity: 1, rotate: 0 }}
                animate={{ 
                  y: window.innerHeight + 100,
                  opacity: 0,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
                }}
                transition={{ duration: 2 + Math.random() * 2, ease: 'linear' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#3C2B63] to-[#9163F2] text-white p-6">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-1">Resolute Plan pro</h1>
              <p className="text-sm opacity-80">Your Commitment Hub</p>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="p-3 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20"
            >
              <Flame className="w-6 h-6 mx-auto mb-2 text-[#FF6A6A]" />
              <div className="text-2xl mb-1">{currentStreak}</div>
              <div className="text-xs opacity-80">Day Streak</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20"
            >
              <Target className="w-6 h-6 mx-auto mb-2 text-[#FFD88A]" />
              <div className="text-2xl mb-1">{totalPakts}</div>
              <div className="text-xs opacity-80">Active Resolves</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20"
            >
              <Trophy className="w-6 h-6 mx-auto mb-2 text-[#96E6B3]" />
              <div className="text-2xl mb-1">{progressPercentage}%</div>
              <div className="text-xs opacity-80">Progress</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-md px-6 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => onNavigate('categorySelection')}
            className={`${cardBg} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2`}
          >
            <div className="bg-gradient-to-br from-[#9163F2] to-[#3C2B63] p-3 rounded-xl">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xs ${textPrimary}`}>New Resolve</span>
          </button>
          <button
            onClick={() => onNavigate('achievements')}
            className={`${cardBg} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2`}
          >
            <div className="bg-gradient-to-br from-[#FFD88A] to-[#FF6A6A] p-3 rounded-xl">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xs ${textPrimary}`}>Badges</span>
          </button>
          <button
            onClick={() => onNavigate('insights')}
            className={`${cardBg} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2`}
          >
            <div className="bg-gradient-to-br from-[#96E6B3] to-[#9163F2] p-3 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xs ${textPrimary}`}>Insights</span>
          </button>
          <button
            onClick={() => onNavigate('templates')}
            className={`${cardBg} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-2`}
          >
            <div className="bg-gradient-to-br from-[#FF6A6A] to-[#FFD88A] p-3 rounded-xl">
              <Library className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xs ${textPrimary}`}>Templates</span>
          </button>
        </div>

        {/* Active Resolves */}
        {Resolves.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardBg} rounded-3xl p-12 text-center shadow-lg`}
          >
            <Target className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
            <h3 className={`text-xl ${textPrimary} mb-2`}>No Resolves Yet</h3>
            <p className={`${textSecondary} mb-6`}>Create your first commitment to get started</p>
            <button
              onClick={() => onNavigate('categorySelection')}
              className="bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white px-6 py-3 rounded-2xl hover:shadow-xl transition-all"
            >
              Create Your First Resolve
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <h2 className={`text-xl ${textPrimary} mb-4`}>Your Active Resolves</h2>
            {Resolves.map((Resolve, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${cardBg} rounded-3xl p-6 shadow-lg`}
              >
                {/* Resolve Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs mb-2 capitalize`}
                      style={{ 
                        backgroundColor: `${['#FF6A6A', '#96E6B3', '#9163F2', '#FFD88A'][index % 4]}20`,
                        color: ['#FF6A6A', '#96E6B3', '#9163F2', '#FFD88A'][index % 4]
                      }}
                    >
                      {Resolve.category}
                    </div>
                    <h3 className={`text-xl ${textPrimary} mb-2`}>{Resolve.name}</h3>
                    <p className={`text-sm ${textSecondary}`}>{Resolve.targetOutcome}</p>
                  </div>
                  <button className={`p-2 ${textSecondary} hover:${textPrimary} transition-colors`}>
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Ring */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={isDarkMode ? '#ffffff20' : '#3C2B6320'}
                        strokeWidth="8"
                        fill="none"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#9163F2"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (Resolve.milestones?.filter(m => m.completed).length || 0) / (Resolve.milestones?.length || 1))}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (Resolve.milestones?.filter(m => m.completed).length || 0) / (Resolve.milestones?.length || 1)) }}
                        transition={{ duration: 1 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm ${textPrimary}`}>
                        {Math.round(((Resolve.milestones?.filter(m => m.completed).length || 0) / (Resolve.milestones?.length || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${textSecondary} mb-1`}>Progress</div>
                    <div className={`text-lg ${textPrimary}`}>
                      {Resolve.milestones?.filter(m => m.completed).length || 0} of {Resolve.milestones?.length || 0} milestones
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  {Resolve.milestones?.slice(0, 3).map((milestone, mIndex) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl ${isDarkMode ? 'bg-[#3a2f4d]' : 'bg-[#F4F4F6]'}`}
                    >
                      <button
                        onClick={() => completeMilestone(index, milestone.id)}
                        className="flex-shrink-0"
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#96E6B3]" />
                        ) : (
                          <Circle className={`w-5 h-5 ${textSecondary}`} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`text-sm ${milestone.completed ? textSecondary + ' line-through' : textPrimary}`}>
                          {milestone.name}
                        </div>
                        <div className={`text-xs ${textSecondary}`}>
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(Resolve.milestones?.length || 0) > 3 && (
                    <button className={`text-sm ${textSecondary} hover:${textPrimary} transition-colors`}>
                      +{(Resolve.milestones?.length || 0) - 3} more milestones
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
