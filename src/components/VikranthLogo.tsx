import React from 'react';

interface VikranthLogoProps {
  className?: string;
  size?: number | string;
  withContainer?: boolean;
}

export const VikranthLogo: React.FC<VikranthLogoProps> = ({
  className = '',
  size = 32,
  withContainer = false,
}) => {
  const svg = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
    >
      {/* Precision stylized "V" matching the user's uploaded logo */}
      <path
        d="M12 16 H36 L50 66 L64 16 H88 L58 84 C55 90 45 90 42 84 L12 16 Z"
        fill="#D45B38"
      />
    </svg>
  );

  if (withContainer) {
    return (
      <div
        className="rounded-full bg-[#FAF0EB] p-2 flex items-center justify-center shadow-xs border border-[#F2DACF]"
        style={{ width: typeof size === 'number' ? size + 16 : 'auto', height: typeof size === 'number' ? size + 16 : 'auto' }}
      >
        {svg}
      </div>
    );
  }

  return svg;
};
