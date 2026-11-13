import React from 'react';

interface LabourAvatarProps {
  name?: string;
  photoUrl?: string;
  className?: string;
  fallbackClassName?: string;
}

export const LabourAvatar: React.FC<LabourAvatarProps> = ({
  name,
  photoUrl,
  className = 'w-11 h-11 rounded-2xl',
  fallbackClassName = 'bg-gradient-to-br from-[#5C2D91] to-[#7B3FB7] text-white font-black text-sm',
}) => {
  const initial = name?.trim() ? name.trim().slice(0, 1).toUpperCase() : 'W';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ? `${name} photo` : 'Worker photo'}
        className={`${className} object-cover shrink-0 border border-purple-200/80 shadow-2xs bg-purple-50`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${className} ${fallbackClassName} flex items-center justify-center shrink-0 shadow-2xs`}
    >
      {initial}
    </div>
  );
};
