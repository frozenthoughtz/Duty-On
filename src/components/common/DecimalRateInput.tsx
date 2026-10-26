import React, { useState, useEffect } from 'react';

export interface DecimalRateInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * DecimalRateInput
 * Bulletproof decimal input that permits typing cents (e.g., 36.45, 43.50, 0.75)
 * without premature rounding or losing the decimal point during typing.
 */
export const DecimalRateInput: React.FC<DecimalRateInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  prefix = 'R',
  placeholder = '0.00',
  className = '',
  inputClassName = '',
  disabled = false,
  autoFocus = false
}) => {
  // Maintain raw string representation so typing '43.' or '43.0' does not get wiped
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null || isNaN(value)) return '';
    return value.toString();
  });

  // Keep internal text in sync with external value prop, but only when numerical value differs
  useEffect(() => {
    const parsed = parseFloat(text);
    if (isNaN(parsed) || Math.abs(parsed - value) > 0.0001) {
      if (value === undefined || value === null || isNaN(value)) {
        setText('');
      } else {
        setText(value.toString());
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string, leading dot, or valid floating point characters (optional negative, digits, single dot)
    if (raw === '' || /^\d*(\.?\d*)?$/.test(raw)) {
      setText(raw);

      if (raw === '' || raw === '.') {
        onChange(0);
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          if (max !== undefined && num > max) {
            onChange(max);
          } else if (min !== undefined && num < min) {
            onChange(min);
          } else {
            onChange(num);
          }
        }
      }
    }
  };

  const handleBlur = () => {
    if (text === '' || text === '.') {
      setText('0.00');
      onChange(0);
      return;
    }
    const num = parseFloat(text);
    if (isNaN(num)) {
      setText('0.00');
      onChange(0);
    } else {
      let clamped = num;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      setText(clamped.toFixed(2));
      onChange(clamped);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {prefix && (
        <span className="text-white/40 text-xs font-bold select-none">{prefix}</span>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full bg-transparent focus:outline-none ${inputClassName}`}
      />
    </div>
  );
};
