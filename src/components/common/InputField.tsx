import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  icon: LucideIcon;
  type?: 'text' | 'email' | 'tel' | 'password';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  icon: Icon, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600 ml-1">{error}</p>}
    </div>
  );
};