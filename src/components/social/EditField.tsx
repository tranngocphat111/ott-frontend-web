import React from "react";

interface EditFieldProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}

const EditField: React.FC<EditFieldProps> = ({
  icon,
  placeholder,
  value,
  editing,
  onChange,
}) => (
  <div className="flex items-center gap-2 text-gray-700">
    <span className="text-gray-500 shrink-0">{icon}</span>
    {editing ?
      <input
        className="flex-1 border-b border-primary-400 outline-none text-sm bg-transparent py-0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    : <span className={`text-sm ${!value ? "text-gray-400 italic" : ""}`}>
        {value || placeholder}
      </span>
    }
  </div>
);

export default EditField;
