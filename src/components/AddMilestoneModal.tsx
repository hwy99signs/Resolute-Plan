import { useState } from 'react';
import { X, Bell, Lightbulb, Calendar, ChevronRight, Check, Plus } from 'lucide-react';
import type { Milestone } from '../types';
import { getMilestoneSuggestions, calculateMilestoneDate, MilestoneSuggestion } from '../utils/milestoneSuggestions';

interface AddMilestoneModalProps {
  onClose: () => void;
  onAdd: (milestone: Omit<Milestone, 'id' | 'completed'>) => void;
  onAddMultiple?: (milestones: Omit<Milestone, 'id' | 'completed'>[]) => void;
  resolutionCategory: string;
  resolutionCreatedAt: string;
  resolutionTargetDate: string;
}

export function AddMilestoneModal({ 
  onClose, 
  onAdd,
  onAddMultiple, 
  resolutionCategory,
  resolutionCreatedAt,
  resolutionTargetDate 
}: AddMilestoneModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const suggestions = getMilestoneSuggestions(resolutionCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd({
        title: title.trim(),
        description: description.trim(),
        reminderDate: reminderDate ? new Date(reminderDate).toISOString() : undefined
      });
      onClose();
    }
  };

  const handleSelectSuggestion = (suggestion: MilestoneSuggestion) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    
    // Calculate suggested date based on timeline
    const suggestedDate = calculateMilestoneDate(
      resolutionCreatedAt,
      resolutionTargetDate,
      suggestion.suggestedWeek
    );
    
    // Set reminder date to the calculated date at 9 AM
    const reminderDateTime = new Date(suggestedDate);
    reminderDateTime.setHours(9, 0, 0, 0);
    setReminderDate(reminderDateTime.toISOString().slice(0, 16));
    
    setShowSuggestions(false);
  };

  const toggleSuggestionSelection = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelectedMilestones = () => {
    if (selectedSuggestions.size === 0) return;

    const milestonesToAdd: Omit<Milestone, 'id' | 'completed'>[] = [];
    
    selectedSuggestions.forEach(index => {
      const suggestion = suggestions[index];
      const suggestedDate = calculateMilestoneDate(
        resolutionCreatedAt,
        resolutionTargetDate,
        suggestion.suggestedWeek
      );
      
      const reminderDateTime = new Date(suggestedDate);
      reminderDateTime.setHours(9, 0, 0, 0);
      
      milestonesToAdd.push({
        title: suggestion.title,
        description: suggestion.description,
        reminderDate: reminderDateTime.toISOString()
      });
    });

    if (onAddMultiple) {
      onAddMultiple(milestonesToAdd);
    } else {
      // Fallback: add one by one
      milestonesToAdd.forEach(milestone => onAdd(milestone));
    }
    
    onClose();
  };

  const getWeeksFromNow = (weekNumber: number) => {
    const now = new Date();
    const target = new Date(resolutionTargetDate);
    const totalWeeks = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    if (weekNumber > totalWeeks) {
      return `Week ${Math.min(weekNumber, Math.floor(totalWeeks))}`;
    }
    return `Week ${weekNumber}`;
  };

  const formatMilestoneDate = (weekNumber: number) => {
    const suggestedDate = calculateMilestoneDate(
      resolutionCreatedAt,
      resolutionTargetDate,
      weekNumber
    );
    const date = new Date(suggestedDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getTimeFromNow = (weekNumber: number) => {
    const suggestedDate = calculateMilestoneDate(
      resolutionCreatedAt,
      resolutionTargetDate,
      weekNumber
    );
    const date = new Date(suggestedDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past due';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    if (diffDays < 30) return `in ${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays < 365) return `in ${Math.ceil(diffDays / 30)} months`;
    return `in ${Math.ceil(diffDays / 365)} years`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2>New Milestone</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Suggestions Section */}
          {showSuggestions && (
            <div className="p-6 border-b bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800">Suggested Milestones</h3>
                    <p className="text-xs text-gray-600">
                      {selectedSuggestions.size > 0 
                        ? `${selectedSuggestions.size} selected`
                        : 'Select multiple or click to edit one'
                      }
                    </p>
                  </div>
                </div>
                
                {selectedSuggestions.size > 0 && (
                  <button
                    onClick={handleAddSelectedMilestones}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add {selectedSuggestions.size} {selectedSuggestions.size === 1 ? 'Milestone' : 'Milestones'}
                  </button>
                )}
              </div>

              <div className="grid gap-2 max-h-80 overflow-y-auto pr-2">
                {suggestions.slice(0, 8).map((suggestion, index) => {
                  const isSelected = selectedSuggestions.has(index);
                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-2xl p-4 border transition-all ${
                        isSelected 
                          ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' 
                          : 'border-purple-100 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSuggestionSelection(index)}
                          className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-purple-600'
                              : 'border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm transition-colors ${
                              isSelected ? 'text-purple-700' : 'text-gray-800'
                            }`}>
                              {suggestion.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-purple-600" />
                              <span className="text-purple-700">
                                {formatMilestoneDate(suggestion.suggestedWeek)}
                              </span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {getTimeFromNow(suggestion.suggestedWeek)}
                            </span>
                            <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                              {getWeeksFromNow(suggestion.suggestedWeek)}
                            </span>
                          </div>
                        </div>

                        {/* Edit Single Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="flex-shrink-0 p-2 hover:bg-purple-100 rounded-xl transition-colors group"
                          title="Edit this milestone"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="mt-4 w-full text-sm text-purple-600 hover:text-purple-700 transition-colors"
              >
                Or create your own milestone →
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {!showSuggestions && (
              <button
                type="button"
                onClick={() => setShowSuggestions(true)}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors mb-2"
              >
                <Lightbulb className="w-4 h-4" />
                View suggestions
              </button>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Milestone Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Run 5km without stopping"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                autoFocus={!showSuggestions}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this milestone..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                <Bell className="w-4 h-4 inline mr-1" />
                Set Reminder (Optional)
              </label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get notified to work on this milestone
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all"
              >
                Add Milestone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
