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

  const [imgError, setImgError] = React.useState(false);

  // Reset error when src changes
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  const showFallback = !src || src === "SPECIAL_AVATAR_SELF" || imgError;

  return (
    <div
      className={`
        relative overflow-hidden rounded-full flex items-center justify-center shrink-0
        transition-transform duration-200 hover:scale-105 active:scale-95
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`
      }}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-slate-200 font-semibold text-slate-600">
        {src === "SPECIAL_AVATAR_SELF" ||
          name?.toLowerCase().includes("my documents") ||
          name?.toLowerCase().includes("truyền file") ||
          name?.toLowerCase().includes("cloud của tôi")
          ? (
            <span style={{ fontSize: size * 0.5 }}>
              📁
            </span>
          ) : name ? (
            <span style={{ fontSize: size * 0.4 }}>
              {getInitials(name)}
            </span>
          ) : (
            <User className="text-slate-500" style={{ width: size * 0.5, height: size * 0.5 }} />
          )}
      </div>

      {!showFallback && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {/* Subtle border overlay */}
      <div className="absolute inset-0 rounded-full ring-1 ring-white/10 pointer-events-none" />
    </div>
  );
};

export default Avatar;
