import React from 'react';
import { User } from 'lucide-react';
import type { AvatarProps } from '../../interfaces';

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 40, 
  className = '',
  onClick 
}) => {
  const getInitials = (name: string = ""): string => {
    if (!name || name.trim().length === 0) {
      return "??";
    }
    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientColor = (name: string = ""): string => {
    const colors = [
      'from-primary-500 to-primary-400',
      'from-primary-400 to-primary-300',
      'from-primary-300 to-primary-200',
      'from-primary-200 to-primary-500',
    ];
    
    if (!name || name.length === 0) {
      return colors[0]; // Default color
    }
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-full flex items-center justify-center
        transition-transform duration-200 hover:scale-105 active:scale-95
        ${onClick ? 'cursor-pointer' : ''}
        ${size === 40 ? 'w-10 h-10' : size === 48 ? 'w-12 h-12' : size === 32 ? 'w-8 h-8' : 'w-10 h-10'}
        ${className}
      `}
      onClick={onClick}
    >
      {src ? (
        <img
          // src={`https://riff-storage-iuh.s3.ap-southeast-1.amazonaws.com/${src}`}
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-semibold bg-gradient-to-br ${getGradientColor(name)}`}
        >
          {name ? (
            <span className={size === 48 ? 'text-lg' : size === 40 ? 'text-base' : 'text-sm'}>
              {getInitials(name)}
            </span>
          ) : (
            <User className={`text-white/70 ${size === 48 ? 'w-6 h-6' : size === 40 ? 'w-5 h-5' : 'w-4 h-4'}`} />
          )}
        </div>
      )}

      {/* Subtle border overlay */}
      <div className="absolute inset-0 rounded-full ring-1 ring-white/10 pointer-events-none" />
    </div>
  );
};

export default Avatar;