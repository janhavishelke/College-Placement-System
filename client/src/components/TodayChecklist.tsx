import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  concept: string;
  completed: boolean;
}

const INITIAL_TASKS: ChecklistItem[] = [
  { id: '1', label: 'Read Page 2: Recursion definition', concept: 'Recursion', completed: true },
  { id: '2', label: 'Ask 1 question with source citations', concept: 'Q&A', completed: true },
  { id: '3', label: 'Test voice tutor & barge-in interruption', concept: 'Voice Tutor', completed: false },
  { id: '4', label: 'Trace factorial(3) on interactive stack', concept: 'Call Stack', completed: false },
  { id: '5', label: 'Pass Understanding Verification active recall', concept: 'Verification', completed: false }
];

export const TodayChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<ChecklistItem[]>(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#F2ECE4] p-4 shadow-sm text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <h4 className="font-bold text-xs text-[#27211E]">
            Today's Study Checklist
          </h4>
        </div>
        <span className="font-semibold text-[11px] text-[#065F46] bg-[#E9F7F0] px-2 py-0.5 rounded-full">
          {completedCount} of {tasks.length} Done
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#FAF7F2] h-2 rounded-full overflow-hidden border border-[#F2ECE4] mb-3">
        <div
          className="bg-gradient-to-r from-[#10B981] to-[#3B82F6] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {tasks.map(task => (
          <label
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer border transition-all ${
              task.completed
                ? 'bg-[#E9F7F0]/40 border-[#A7F3D0] text-[#065F46]'
                : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#27211E] hover:border-[#D8CEBE]'
            }`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => {}}
              className="mt-0.5 rounded text-[#10B981] focus:ring-0 cursor-pointer"
            />
            <div className="flex-1">
              <span className={`block font-medium ${task.completed ? 'line-through text-[#6B7280]' : ''}`}>
                {task.label}
              </span>
              <span className="text-[10px] text-[#8C827A] font-mono">
                {task.concept}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
