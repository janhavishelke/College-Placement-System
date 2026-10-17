import React from 'react';

export const Rotating3DLogo: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '600px'
      }}
    >
      {/* 3D Rotating Gyroscope Rings */}
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'rotate3dLogo 8s linear infinite'
        }}
      >
        {/* Ring 1 - Coral Outer Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[#FF5E4D]"
          style={{
            transform: 'rotateX(60deg) rotateY(20deg)',
            boxShadow: '0 0 12px rgba(255, 94, 77, 0.4)'
          }}
        />

        {/* Ring 2 - Amber Middle Ring */}
        <div
          className="absolute inset-1.5 rounded-full border-2 border-[#F59E0B]"
          style={{
            transform: 'rotateX(-45deg) rotateY(45deg)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.35)'
          }}
        />

        {/* Ring 3 - Violet Inner Ring */}
        <div
          className="absolute inset-3 rounded-full border border-[#8B5CF6]"
          style={{
            transform: 'rotateX(25deg) rotateY(-60deg)'
          }}
        />

        {/* Glowing Center Core Cube / Node */}
        <div
          className="absolute inset-0 m-auto w-4 h-4 rounded-lg bg-gradient-to-tr from-[#FF5E4D] to-[#FBBF24] shadow-lg"
          style={{
            transform: 'translateZ(10px)',
            boxShadow: '0 0 16px rgba(255, 94, 77, 0.8)'
          }}
        />
      </div>

      <style>{`
        @keyframes rotate3dLogo {
          0% {
            transform: rotateX(15deg) rotateY(0deg) rotateZ(0deg);
          }
          50% {
            transform: rotateX(35deg) rotateY(180deg) rotateZ(20deg);
          }
          100% {
            transform: rotateX(15deg) rotateY(360deg) rotateZ(0deg);
          }
        }
      `}</style>
    </div>
  );
};
