import React, { useState, useEffect } from 'react';

interface FrameState {
  id: string;
  name: string;
  arg: number;
  status: 'active' | 'waiting' | 'base_case' | 'returning' | 'popped';
  returnValue?: number;
  note: string;
}

interface StepData {
  step: number;
  action: 'idle' | 'push' | 'base_case' | 'pop';
  title: string;
  description: string;
  frames: FrameState[];
  currentCall: string;
}

const STEPS: StepData[] = [
  {
    step: 0,
    action: 'idle',
    title: 'Ready to Trace factorial(3)',
    description: 'The call stack starts empty. Press Next or Play to observe function invocations.',
    currentCall: 'factorial(3)',
    frames: []
  },
  {
    step: 1,
    action: 'push',
    title: 'Push Frame 1: factorial(3)',
    description: 'n = 3. Guard condition (3 <= 1) is false. Invokes 3 * factorial(2). Pauses waiting for factorial(2).',
    currentCall: 'factorial(3) calls factorial(2)',
    frames: [
      { id: 'f3', name: 'factorial(3)', arg: 3, status: 'waiting', note: 'waiting for factorial(2)' }
    ]
  },
  {
    step: 2,
    action: 'push',
    title: 'Push Frame 2: factorial(2)',
    description: 'n = 2. Guard condition (2 <= 1) is false. Invokes 2 * factorial(1). Pauses waiting for factorial(1).',
    currentCall: 'factorial(2) calls factorial(1)',
    frames: [
      { id: 'f2', name: 'factorial(2)', arg: 2, status: 'waiting', note: 'waiting for factorial(1)' },
      { id: 'f3', name: 'factorial(3)', arg: 3, status: 'waiting', note: 'waiting on frame 2' }
    ]
  },
  {
    step: 3,
    action: 'base_case',
    title: 'Push Frame 3: factorial(1) - Base Case Hit!',
    description: 'n = 1. Base case condition (1 <= 1) is true! Emergency brake fires: returns 1 immediately.',
    currentCall: 'factorial(1) -> returns 1',
    frames: [
      { id: 'f1', name: 'factorial(1)', arg: 1, status: 'base_case', returnValue: 1, note: 'base case met! return 1' },
      { id: 'f2', name: 'factorial(2)', arg: 2, status: 'waiting', note: 'waiting on frame 1' },
      { id: 'f3', name: 'factorial(3)', arg: 3, status: 'waiting', note: 'waiting on frame 2' }
    ]
  },
  {
    step: 4,
    action: 'pop',
    title: 'Pop Frame 3: factorial(1) Returns 1',
    description: 'Frame 1 pops off the stack. Frame 2 resumes: calculates 2 * 1 = 2 and prepares to return 2.',
    currentCall: 'factorial(2) resumes with 2 * 1',
    frames: [
      { id: 'f2', name: 'factorial(2)', arg: 2, status: 'returning', returnValue: 2, note: 'completes 2 * 1 = 2' },
      { id: 'f3', name: 'factorial(3)', arg: 3, status: 'waiting', note: 'waiting on frame 2' }
    ]
  },
  {
    step: 5,
    action: 'pop',
    title: 'Pop Frame 2: factorial(2) Returns 2',
    description: 'Frame 2 pops off the stack. Frame 3 resumes: calculates 3 * 2 = 6 and prepares to return 6.',
    currentCall: 'factorial(3) resumes with 3 * 2',
    frames: [
      { id: 'f3', name: 'factorial(3)', arg: 3, status: 'returning', returnValue: 6, note: 'completes 3 * 2 = 6' }
    ]
  },
  {
    step: 6,
    action: 'pop',
    title: 'Pop Frame 1: Stack Unwound Completely!',
    description: 'All stack frames have finished. Final evaluated return value is 6.',
    currentCall: 'Result: 6',
    frames: []
  }
];

export const StackVisualizer: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= STEPS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const step = STEPS[currentStepIndex];

  return (
    <div className={`w-full bg-[#FAF7F2] rounded-2xl border border-[#EADBFC] p-4 text-[#27211E] ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F2ECE4]">
        <div>
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#EAF3FB] text-[#1E3A8A] mr-2">
            Step {step.step} of 6
          </span>
          <span className="font-bold text-[#27211E]">{step.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.max(0, currentStepIndex - 1)); }}
            disabled={currentStepIndex === 0}
            className="px-2.5 py-1 text-xs rounded-full border border-[#D8CEBE] hover:bg-[#F2ECE4] disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 text-xs rounded-full bg-[#FF5E4D] text-white font-medium hover:bg-[#E84D3C] transition-colors"
          >
            {isPlaying ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.min(STEPS.length - 1, currentStepIndex + 1)); }}
            disabled={currentStepIndex === STEPS.length - 1}
            className="px-2.5 py-1 text-xs rounded-full border border-[#D8CEBE] hover:bg-[#F2ECE4] disabled:opacity-40 transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStepIndex(0); }}
            className="px-2 py-1 text-xs text-[#6B625E] hover:text-[#27211E] transition-colors ml-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-[#6B625E] text-xs leading-relaxed mb-4">
        {step.description}
      </p>

      {/* Stack Diagram Area */}
      <div className="bg-[#FFFFFF] rounded-xl p-3 border border-[#F2ECE4] min-h-[160px] flex flex-col justify-end relative shadow-inner">
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-semibold text-[#8C827A]">
          LIFO Call Stack (Top to Bottom)
        </div>

        {step.frames.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-[#8C827A] text-xs">
            {step.step === 0 ? (
              <span>Call stack is currently empty. Click Next to push factorial(3).</span>
            ) : (
              <div className="text-center">
                <span className="text-[#10B981] font-bold text-sm block mb-1">Stack Execution Finished</span>
                <span className="font-mono bg-[#E9F7F0] text-[#065F46] px-2.5 py-1 rounded-full">
                  Return Value = 6
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {step.frames.map((frame, idx) => {
              const isTop = idx === 0;
              const isBase = frame.status === 'base_case';
              const isReturning = frame.status === 'returning';

              return (
                <div
                  key={frame.id}
                  className={`w-full p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-between ${
                    isBase
                      ? 'bg-[#E9F7F0] border-[#A7F3D0] stack-frame-push'
                      : isReturning
                      ? 'bg-[#FCF4E3] border-[#FDE68A] stack-frame-pop'
                      : isTop
                      ? 'bg-[#EAF3FB] border-[#BAE6FD] stack-frame-push'
                      : 'bg-[#F9FAFB] border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-[#27211E] font-bold border border-[#E5E7EB]">
                      Frame {3 - frame.arg + 1}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-xs text-[#1F2937]">
                        {frame.name}
                      </span>
                      <span className="text-[11px] text-[#6B7280] ml-2">
                        n = {frame.arg}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isBase 
                        ? 'bg-[#10B981] text-white' 
                        : isReturning 
                        ? 'bg-[#F59E0B] text-white' 
                        : 'bg-[#E0E7FF] text-[#3730A3]'
                    }`}>
                      {frame.note}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setIsPlaying(false); setCurrentStepIndex(i); }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentStepIndex ? 'bg-[#FF5E4D] w-6' : 'bg-[#D8CEBE] hover:bg-[#BFB29F]'
            }`}
            title={`Step ${i}: ${s.title}`}
          />
        ))}
      </div>
    </div>
  );
};
