import React from "react";
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}
const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = "",
}) => {
  return (
    <label className={`flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`block w-14 h-8 rounded-full transition-colors duration-200 ${
            checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};
export default Toggle;