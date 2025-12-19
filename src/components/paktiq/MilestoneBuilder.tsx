import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Plus, Trash2, Calendar, Sliders } from 'lucide-react';
import type { Milestone } from '../../types';
// PaktData is defined in PaktCreationContext

type MilestoneBuilderProps = {
  currentPakt: Partial<PaktData>;
  onUpdate: (data: Partial<PaktData>) => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function MilestoneBuilder({ currentPakt, onUpdate, onContinue, onBack }: MilestoneBuilderProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    currentPakt.milestones || [
      { id: '1', name: '', dueDate: '', notes: '', importance: 3, completed: false }
    ]
  );

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { id: Date.now().toString(), name: '', dueDate: '', notes: '', importance: 3, completed: false }
    ]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleContinue = () => {
    onUpdate({ milestones });
    onContinue();
  };

  const isValid = milestones.every(m => m.name.trim() && m.dueDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F6] to-[#E8E8EA] py-12 px-6">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl text-[#3C2B63] mb-3">Build Milestones</h1>
          <p className="text-lg text-[#3C2B63]/70">Break your Resolve into achievable steps</p>
        </motion.div>

        {/* Resolve Name Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white rounded-2xl p-4 mb-8"
        >
          <div className="text-sm opacity-80 mb-1">Your Resolve:</div>
          <div className="text-xl">{currentPakt.name}</div>
        </motion.div>

        {/* Milestones List */}
        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-lg"
              >
                {/* Milestone Number & Delete */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#9163F2] to-[#3C2B63] text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm text-[#3C2B63]/70">Milestone {index + 1}</span>
                  </div>
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(milestone.id)}
                      className="text-[#FF6A6A] hover:bg-[#FF6A6A]/10 p-2 rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Milestone Name */}
                <input
                  type="text"
                  value={milestone.name}
                  onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                  placeholder="Milestone name"
                  className="w-full text-lg text-[#3C2B63] outline-none placeholder:text-[#3C2B63]/30 mb-4"
                />

                {/* Due Date */}
                <div className="flex items-center gap-3 mb-4 bg-[#F4F4F6] rounded-2xl p-3">
                  <Calendar className="w-5 h-5 text-[#9163F2]" />
                  <input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                    className="flex-1 text-[#3C2B63] outline-none bg-transparent"
                  />
                </div>

                {/* Notes */}
                <textarea
                  value={milestone.notes}
                  onChange={(e) => updateMilestone(milestone.id, 'notes', e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full text-sm text-[#3C2B63] outline-none placeholder:text-[#3C2B63]/30 bg-[#F4F4F6] rounded-2xl p-3 resize-none mb-3"
                />

                {/* Importance Slider */}
                <div className="bg-[#F4F4F6] rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-[#3C2B63]/70">
                      <Sliders className="w-4 h-4" />
                      <span>Importance</span>
                    </div>
                    <span className="text-sm text-[#9163F2]">{milestone.importance}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={milestone.importance}
                    onChange={(e) => updateMilestone(milestone.id, 'importance', parseInt(e.target.value))}
                    className="w-full accent-[#9163F2]"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add More Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={addMilestone}
          className="w-full bg-white border-2 border-dashed border-[#9163F2] text-[#9163F2] py-4 rounded-2xl hover:bg-[#9163F2]/5 transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus className="w-5 h-5" />
          <span>Add More Milestones</span>
        </motion.button>

        {/* Suggestion Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-[#96E6B3]/20 to-[#FFD88A]/20 rounded-2xl p-4 mb-8 border border-[#96E6B3]/30"
        >
          <div className="text-sm text-[#3C2B63]/70 mb-2">✨ Suggested: 3-5 milestones</div>
          <div className="text-sm text-[#3C2B63]">
            Each milestone should be a clear, measurable step toward your goal
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
