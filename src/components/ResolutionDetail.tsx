import { useState } from 'react';
// Legacy web component - Resolution type not used in React Native app
// import type { Resolve } from '../types';
import { ArrowLeft, Plus, Trophy, TrendingUp } from 'lucide-react';
import { MilestoneItem } from './MilestoneItem';
import { AddMilestoneModal } from './AddMilestoneModal';
import { MilestoneSuggestionsPanel } from './MilestoneSuggestionsPanel';
import { MilestoneInfoBanner } from './MilestoneInfoBanner';
import { MilestoneTimeline } from './MilestoneTimeline';
import { TimelineStats } from './TimelineStats';

interface ResolutionDetailProps {
  resolution: Resolution;
  onBack: () => void;
  onUpdate: (resolution: Resolution) => void;
}

export function ResolutionDetail({ resolution, onBack, onUpdate }: ResolutionDetailProps) {
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const categoryEmoji: Record<string, string> = {
    health: '💪',
    finance: '💰',
    career: '🎯',
    personal: '🌟',
    education: '📚',
    relationships: '❤️',
    other: '✨'
  };

  const totalMilestones = resolution.milestones.length;
  const completedMilestones = resolution.milestones.filter(m => m.completed).length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  const isComplete = totalMilestones > 0 && completedMilestones === totalMilestones;

  const addMilestone = (milestone: Omit<Resolution['milestones'][0], 'id' | 'completed'>) => {
    const newMilestone = {
      ...milestone,
      id: Date.now().toString(),
      completed: false
    };
    onUpdate({
      ...resolution,
      milestones: [...resolution.milestones, newMilestone]
    });
    setShowAddMilestone(false);
  };

  const addMultipleMilestones = (milestones: Omit<Resolution['milestones'][0], 'id' | 'completed'>[]) => {
    const newMilestones = milestones.map((milestone, index) => ({
      ...milestone,
      id: (Date.now() + index).toString(),
      completed: false
    }));
    
    onUpdate({
      ...resolution,
      milestones: [...resolution.milestones, ...newMilestones]
    });
    setShowAddMilestone(false);
  };

  const handleQuickAddFromSuggestion = (title: string, description: string, reminderDate?: string) => {
    addMilestone({
      title,
      description,
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : undefined
    });
  };

  const handleQuickAddMultipleSuggestions = (suggestions: Array<{ title: string; description: string; reminderDate?: string }>) => {
    const milestones = suggestions.map(s => ({
      title: s.title,
      description: s.description,
      reminderDate: s.reminderDate ? new Date(s.reminderDate).toISOString() : undefined
    }));
    addMultipleMilestones(milestones);
  };

  const toggleMilestone = (milestoneId: string) => {
    const updatedMilestones = resolution.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
        : m
    );
    onUpdate({
      ...resolution,
      milestones: updatedMilestones
    });
  };

  const deleteMilestone = (milestoneId: string) => {
    onUpdate({
      ...resolution,
      milestones: resolution.milestones.filter(m => m.id !== milestoneId)
    });
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Resolution['milestones'][0]>) => {
    const updatedMilestones = resolution.milestones.map(m =>
      m.id === milestoneId ? { ...m, ...updates } : m
    );
    onUpdate({
      ...resolution,
      milestones: updatedMilestones
    });
  };

  const targetDate = new Date(resolution.targetDate);
  const daysLeft = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-6 rounded-b-3xl shadow-lg">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-full transition-colors mb-4 -ml-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="text-5xl">{categoryEmoji[resolution.category] || '✨'}</div>
          <div className="flex-1">
            <h1 className="mb-2">{resolution.title}</h1>
            {resolution.description && (
              <p className="text-sm opacity-90">{resolution.description}</p>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Progress</span>
            </div>
            <span className="text-2xl">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{completedMilestones} of {totalMilestones} milestones completed</span>
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>
          </div>
        </div>

        {isComplete && (
          <div className="bg-yellow-400/90 text-yellow-900 rounded-2xl p-4 mt-4 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <div className="font-bold">Congratulations! 🎉</div>
              <div className="text-sm">You've completed all milestones!</div>
            </div>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="px-4 mt-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-800">Milestones</h2>
          <button
            onClick={() => setShowAddMilestone(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-md transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>

        {/* Timeline Stats */}
        {resolution.milestones.length > 0 && (
          <TimelineStats
            milestones={resolution.milestones}
            targetDate={resolution.targetDate}
          />
        )}

        {resolution.milestones.length === 0 && <MilestoneInfoBanner />}

        {resolution.milestones.length === 0 ? (
          <div>
            <div className="text-center py-8 bg-white rounded-2xl mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-gray-600 mb-2">No Milestones Yet</p>
              <p className="text-sm text-gray-500 px-6 mb-4">
                Break down your resolution into smaller, achievable milestones
              </p>
              <button
                onClick={() => setShowAddMilestone(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-md transition-all text-sm"
              >
                Create Custom Milestone
              </button>
            </div>

            {/* Show suggestions for empty state */}
            <MilestoneSuggestionsPanel
              resolutionCategory={resolution.category}
              resolutionCreatedAt={resolution.createdAt}
              resolutionTargetDate={resolution.targetDate}
              onSelectSuggestion={handleQuickAddFromSuggestion}
              onSelectMultiple={handleQuickAddMultipleSuggestions}
            />
          </div>
        ) : (
          <>
            {/* Timeline View */}
            <MilestoneTimeline
              milestones={resolution.milestones}
              targetDate={resolution.targetDate}
            />

            {/* List View */}
            <div className="space-y-3">
              {resolution.milestones.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  onToggle={() => toggleMilestone(milestone.id)}
                  onDelete={() => deleteMilestone(milestone.id)}
                  onUpdate={(updates) => updateMilestone(milestone.id, updates)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <AddMilestoneModal
          onClose={() => setShowAddMilestone(false)}
          onAdd={addMilestone}
          onAddMultiple={addMultipleMilestones}
          resolutionCategory={resolution.category}
          resolutionCreatedAt={resolution.createdAt}
          resolutionTargetDate={resolution.targetDate}
        />
      )}
    </div>
  );
}
