import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Calendar } from 'lucide-react';
// Legacy web component - PaktData is defined in PaktCreationContext

type PaktNamingProps = {
  currentPakt: Partial<PaktData>;
  onUpdate: (data: Partial<PaktData>) => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function PaktNaming({ currentPakt, onUpdate, onContinue, onBack }: PaktNamingProps) {
  const [name, setName] = useState(currentPakt.name || '');
  const [description, setDescription] = useState(currentPakt.description || '');
  const [targetOutcome, setTargetOutcome] = useState(currentPakt.targetOutcome || '');
  const [deadline, setDeadline] = useState(currentPakt.deadline || '');

  const handleContinue = () => {
    onUpdate({ name, description, targetOutcome, deadline });
    onContinue();
  };

  const isValid = name.trim() && targetOutcome.trim() && deadline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F6] to-[#E8E8EA] py-12 px-6">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl text-[#3C2B63] mb-3">Name Your Resolve</h1>
          <p className="text-lg text-[#3C2B63]/70">Give your commitment a clear identity</p>
        </motion.div>

        {/* Category Badge */}
        {currentPakt.category && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white px-4 py-2 rounded-full mb-8"
          >
            <div className="w-2 h-2 bg-[#FFD88A] rounded-full" />
            <span className="capitalize">{currentPakt.category}</span>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          {/* Resolve Name */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <label className="block text-sm text-[#3C2B63]/70 mb-2">Resolve Name*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Run a Marathon, Save $10,000"
              className="w-full text-xl text-[#3C2B63] outline-none placeholder:text-[#3C2B63]/30"
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <label className="block text-sm text-[#3C2B63]/70 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this important to you?"
              rows={3}
              className="w-full text-[#3C2B63] outline-none placeholder:text-[#3C2B63]/30 resize-none"
            />
          </div>

          {/* Target Outcome */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <label className="block text-sm text-[#3C2B63]/70 mb-2">Target Outcome*</label>
            <input
              type="text"
              value={targetOutcome}
              onChange={(e) => setTargetOutcome(e.target.value)}
              placeholder="What does success look like?"
              className="w-full text-[#3C2B63] outline-none placeholder:text-[#3C2B63]/30"
            />
          </div>

          {/* Deadline */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <label className="block text-sm text-[#3C2B63]/70 mb-2">Deadline*</label>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#9163F2]" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 text-[#3C2B63] outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#FFD88A]/20 to-[#96E6B3]/20 rounded-2xl p-4 mb-8 border border-[#FFD88A]/30"
        >
          <div className="text-sm text-[#3C2B63]/70 mb-2">💡 Pro Tip</div>
          <div className="text-sm text-[#3C2B63]">
            Be specific and measurable. Instead of "Get fit", try "Run 5km in under 30 minutes"
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-white border-2 border-[#3C2B63]/20 text-[#3C2B63] py-4 rounded-2xl hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white hover:shadow-2xl hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
