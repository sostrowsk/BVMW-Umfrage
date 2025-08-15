import React from "react";
interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  id: string;
  label?: string;
  type?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}
const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type = "text",
  error,
  helperText,
  rows,
  className = "",
  required,
  ...props
}) => {
  const inputClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
    error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
  } ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {type === "textarea" ? (
        <textarea
          id={id}
          rows={rows || 3}
          className={inputClasses}
          required={required}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          type={type}
          id={id}
          className={inputClasses}
          required={required}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-500 text-sm mt-1">{helperText}</p>
      )}
    </div>
  );
};
export default InputField;
