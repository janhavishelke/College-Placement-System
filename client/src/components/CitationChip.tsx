import React from 'react';
import { CitationItem } from '../types';

interface CitationChipProps {
  citation: CitationItem;
  onSelect: (citation: CitationItem) => void;
  isActive?: boolean;
}

export const CitationChip: React.FC<CitationChipProps> = ({
  citation,
  onSelect,
  isActive = false
}) => {
  return (
    <button
      onClick={() => onSelect(citation)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(citation);
        }
      }}
      tabIndex={0}
      aria-label={`Jump to page ${citation.pageNo}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 mx-1 my-0.5 rounded-md text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-[#FF5E4D] text-white shadow-sm ring-2 ring-[#FF5E4D]/30'
          : 'bg-[#FCF4E3] text-[#B45309] hover:bg-[#FDE68A] hover:text-[#92400E] border border-[#FDE68A]'
      }`}
    >
      <span>[p.{citation.pageNo}]</span>
    </button>
  );
};
