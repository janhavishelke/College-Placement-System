import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  onSelectDate?: (date: number) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onSelectDate }) => {
  const [currentMonth] = useState('October 2026');
  const [selectedDay, setSelectedDay] = useState(17);

  // October 2026 calendar days
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const revisionDays = [6, 12, 17, 21, 28];
  const paddingDays = [27, 28, 29, 30]; // September
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-4 space-y-3 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white">{currentMonth}</h4>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500">
        {daysOfWeek.map(d => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 text-center text-xs gap-y-1">
        {/* Previous month padding */}
        {paddingDays.map(d => (
          <span key={`prev-${d}`} className="py-1 text-slate-600 text-[11px]">{d}</span>
        ))}

        {/* Current month days */}
        {daysInMonth.map(day => {
          const isToday = day === 17;
          const isSelected = selectedDay === day;
          const hasRevision = revisionDays.includes(day);

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                if (onSelectDate) onSelectDate(day);
              }}
              className={`relative py-1 text-[11px] font-semibold rounded-lg transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md'
                  : isToday
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <span>{day}</span>
              {hasRevision && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>Scheduled Recall</span>
        </span>
        <span className="text-violet-400 font-bold">17 Oct • Today</span>
      </div>
    </div>
  );
};
