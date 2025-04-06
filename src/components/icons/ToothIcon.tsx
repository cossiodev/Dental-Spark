
import React from 'react';

interface ToothIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const ToothIcon: React.FC<ToothIconProps> = ({ className, size = 24, color = "currentColor" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 5.5c-1.5-2-3-2.5-4.5-2.5-3 0-4.5 1.5-4.5 4.5 0 3.5 3 8.5 9 14 6-5.5 9-10.5 9-14 0-3-1.5-4.5-4.5-4.5-1.5 0-3 .5-4.5 2.5z" />
    </svg>
  );
};

export default ToothIcon;
