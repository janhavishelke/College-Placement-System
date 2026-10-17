import React from 'react';

export const SparkleDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = "w-6 h-6",
  color = "#FF5E4D"
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill={color}
    />
  </svg>
);

export const StarDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = "w-5 h-5",
  color = "#F59E0B"
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
    />
  </svg>
);

export const PencilDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = "w-6 h-6",
  color = "#3B82F6"
}) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
      fill={color}
    />
  </svg>
);

export const SunDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = "w-8 h-8",
  color = "#FBBF24"
}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" fill={color} />
    <path d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64" />
  </svg>
);

export const RainbowArcDoodle: React.FC<{ className?: string }> = ({
  className = "w-10 h-8"
}) => (
  <svg viewBox="0 0 48 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 28C4 14.7452 14.7452 4 28 4" stroke="#FF5E4D" strokeWidth="3" strokeLinecap="round" />
    <path d="M10 28C10 18.0589 18.0589 10 28 10" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 28C16 21.3726 21.3726 16 28 16" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const NoteDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = "w-6 h-6",
  color = "#8B5CF6"
}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#F8EDFB" />
    <path d="M14 2V8H20" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);
