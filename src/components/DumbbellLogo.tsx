import React from 'react';

interface DumbbellLogoProps {
  className?: string;
}

export const DumbbellLogo: React.FC<DumbbellLogoProps> = ({ className = 'h-6 w-6' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central bar */}
      <rect x="25" y="42" width="50" height="16" rx="3" fill="#A1A1AA" />
      
      {/* Knurling Dots Pattern */}
      <circle cx="43" cy="46" r="1.5" fill="#FFFFFF" />
      <circle cx="49" cy="46" r="1.5" fill="#FFFFFF" />
      <circle cx="55" cy="46" r="1.5" fill="#FFFFFF" />
      <circle cx="46" cy="50" r="1.5" fill="#FFFFFF" />
      <circle cx="52" cy="50" r="1.5" fill="#FFFFFF" />
      <circle cx="43" cy="54" r="1.5" fill="#FFFFFF" />
      <circle cx="49" cy="54" r="1.5" fill="#FFFFFF" />
      <circle cx="55" cy="54" r="1.5" fill="#FFFFFF" />

      {/* Left Inner Plate */}
      <rect x="20" y="24" width="11" height="52" rx="4" fill="#52525B" />
      {/* Left Middle Plate */}
      <rect x="10" y="29" width="11" height="42" rx="4" fill="#3F3F46" />
      {/* Left Outer Cap */}
      <rect x="2" y="34" width="9" height="32" rx="3" fill="#C2410C" />

      {/* Right Inner Plate */}
      <rect x="69" y="24" width="11" height="52" rx="4" fill="#52525B" />
      {/* Right Middle Plate */}
      <rect x="79" y="29" width="11" height="42" rx="4" fill="#3F3F46" />
      {/* Right Outer Cap */}
      <rect x="89" y="34" width="9" height="32" rx="3" fill="#C2410C" />
    </svg>
  );
};
