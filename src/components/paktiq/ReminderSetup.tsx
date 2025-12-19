import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Bell, Calendar, Clock } from 'lucide-react';
// Legacy web component - types not used in React Native app
// PaktData is defined in PaktCreationContext

type ReminderSetupProps = {
  currentPakt: Partial<PaktData>;
  onUpdate: (data: Partial<PaktData>) => void;
  onComplete: () => void;
  onBack: () => void;
};

export default function ReminderSetup({ currentPakt, onUpdate, onComplete, onBack }: ReminderSetupProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(
    currentPakt.reminders?.frequency || 'daily'
  );
  const [time, setTime] = useState(currentPakt.reminders?.time || '09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    currentPakt.reminders?.days || []
  );

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleComplete = () => {
    const reminders: ReminderSettings = {
      frequency,
      time,
      days: frequency === 'custom' ? selectedDays : undefined,
    };
    onUpdate({ reminders });
    onComplete();
  };

  const isValid = frequency === 'custom' ? selectedDays.length > 0 : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F6] to-[#E8E8EA] py-12 px-6">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl text-[#3C2B63] mb-3">Set Reminders</h1>
          <p className="text-lg text-[#3C2B63]/70">Stay on track with smart notifications</p>
        </motion.div>

        {/* Resolve Name Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white rounded-2xl p-4 mb-8"
        >
          <div className="text-sm opacity-80 mb-1">Your Resolve:</div>
          <div className="text-xl">{currentPakt.name}</div>
          <div className="text-sm opacity-80 mt-2">
            {currentPakt.milestones?.length || 0} milestones
          </div>
        </motion.div>

        {/* Frequency Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <label className="block text-sm text-[#3C2B63]/70 mb-3">Reminder Frequency</label>
          <div className="grid grid-cols-3 gap-3">
            {['daily', 'weekly', 'custom'].map((freq) => (
              <button
                key={freq}
                onClick={() => setFrequency(freq as any)}
                className={`py-4 rounded-2xl transition-all ${
                  frequency === freq
                    ? 'bg-gradient-to-r from-[#9163F2] to-[#3C2B63] text-white shadow-lg'
                    : 'bg-white text-[#3C2B63] hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {freq === 'daily' && <Calendar className="w-5 h-5" />}
                  {freq === 'weekly' && <Bell className="w-5 h-5" />}
                  {freq === 'custom' && <Clock className="w-5 h-5" />}
                  <span className="text-sm capitalize">{freq}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Custom Days Selection */}
        {frequency === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <label className="block text-sm text-[#3C2B63]/70 mb-3">Select Days</label>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`aspect-square rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#96E6B3] to-[#FFD88A] text-white shadow-lg'
                        : 'bg-white text-[#3C2B63] hover:shadow-md'
                    }`}
                  >
                    <div className="text-xs">{day}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Time Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <label className="block text-sm text-[#3C2B63]/70 mb-3">Reminder Time</label>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#9163F2]" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 text-xl text-[#3C2B63] outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-[#9163F2]/10 to-[#3C2B63]/10 rounded-2xl p-4 mb-8 border border-[#9163F2]/20"
        >
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#9163F2] mt-1" />
            <div>
              <div className="text-sm text-[#3C2B63]/70 mb-1">Preview</div>
              <div className="text-[#3C2B63]">
                {frequency === 'daily' && `Daily at ${time}`}
                {frequency === 'weekly' && `Weekly at ${time}`}
                {frequency === 'custom' && selectedDays.length > 0 && (
                  <span>
                    Every {selectedDays.join(', ')} at {time}
                  </span>
                )}
                {frequency === 'custom' && selectedDays.length === 0 && (
                  <span className="text-[#FF6A6A]">Please select at least one day</span>
                )}
              </div>
            </div>
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
            onClick={handleComplete}
            disabled={!isValid}
            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-[#96E6B3] to-[#FFD88A] text-[#3C2B63] hover:shadow-2xl hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Finish Resolve</span>
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
