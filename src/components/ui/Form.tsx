'use client';

import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  forwardRef,
} from 'react';

// ============== LABEL ==============
interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function Label({
  children,
  htmlFor,
  required,
  className = '',
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs text-gray-500 mb-1 ${className}`}
    >
      {children}
      {required && <span className='text-red-500 ml-0.5'>*</span>}
    </label>
  );
}

// ============== INPUT ==============
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <Label htmlFor={props.id} required={props.required}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm text-gray-800
            focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
        {helperText && !error && (
          <p className='mt-1 text-xs text-gray-400'>{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ============== SELECT ==============
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <Label htmlFor={props.id} required={props.required}>
            {label}
          </Label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white
            focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value=''>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ============== TEXTAREA ==============
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <Label htmlFor={props.id} required={props.required}>
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm text-gray-800 resize-none
            focus:outline-none focus:ring-2 focus:ring-[#E57373]/20 focus:border-[#E57373]
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
        {helperText && !error && (
          <p className='mt-1 text-xs text-gray-400'>{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ============== FORM GROUP ==============
interface FormGroupProps {
  children: ReactNode;
  className?: string;
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div className={`p-4 bg-gray-50 rounded-xl ${className}`}>{children}</div>
  );
}

// ============== FORM SECTION ==============
interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  actions,
}: FormSectionProps) {
  return (
    <div className={className}>
      {(title || actions) && (
        <div className='flex items-center justify-between mb-3'>
          <div>
            {title && (
              <span className='text-sm font-medium text-gray-700'>{title}</span>
            )}
            {description && (
              <p className='text-xs text-gray-400 mt-0.5'>{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

// ============== FORM ROW (for inline fields) ==============
interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  return <div className={`flex gap-3 ${className}`}>{children}</div>;
}
