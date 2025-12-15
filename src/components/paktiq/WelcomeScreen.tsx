import React from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, Award, ArrowRight, Sparkles } from 'lucide-react';

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onExplore: () => void;
};

export default function WelcomeScreen({ onGetStarted, onExplore }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3C2B63] via-[#9163F2] to-[#3C2B63] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-[#FFD88A]/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-10 w-40 h-40 bg-[#96E6B3]/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-[#FFD88A] blur-xl opacity-50"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Target className="w-16 h-16 relative z-10" />
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl mb-4">resolviq</h1>
          <h2 className="text-2xl mb-4 text-[#FFD88A]">Smart Commitment Tracking</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Make commitments. Track progress. Achieve your goals with intelligence.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl mb-1">10K+</div>
            <div className="text-xs opacity-80">Waitlist Members</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl mb-1">98%</div>
            <div className="text-xs opacity-80">Satisfaction Rate</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center border border-white/20">
            <div className="text-2xl mb-1">2025</div>
            <div className="text-xs opacity-80">Launch Year</div>
          </div>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12 flex justify-center"
        >
          <div className="relative w-64 h-64">
            {/* Progress Arc */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                stroke="#FFD88A"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="502"
                strokeDashoffset="125"
                initial={{ strokeDashoffset: 502 }}
                animate={{ strokeDashoffset: 125 }}
                transition={{ duration: 2, delay: 0.8 }}
              />
              <motion.circle
                cx="100"
                cy="100"
                r="60"
                stroke="#96E6B3"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="377"
                strokeDashoffset="94"
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 94 }}
                transition={{ duration: 2, delay: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-[#FFD88A]" />
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <button
            onClick={onGetStarted}
            className="w-full bg-gradient-to-r from-[#FFD88A] to-[#96E6B3] text-[#3C2B63] py-4 rounded-2xl flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-105 transition-all"
          >
            <span className="text-lg">Start My First Resolve</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={onExplore}
            className="w-full bg-white/10 backdrop-blur-lg border-2 border-white/30 text-white py-4 rounded-2xl hover:bg-white/20 transition-all"
          >
            <span className="text-lg">Explore Features</span>
          </button>
        </motion.div>

        {/* Features Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 grid grid-cols-3 gap-4 text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#96E6B3]" />
            <span className="text-xs opacity-80">Track Progress</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Award className="w-6 h-6 text-[#FFD88A]" />
            <span className="text-xs opacity-80">Earn Badges</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Target className="w-6 h-6 text-[#FF6A6A]" />
            <span className="text-xs opacity-80">Hit Goals</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
