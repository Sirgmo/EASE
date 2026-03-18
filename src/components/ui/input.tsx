import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-secondary-700"
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400">
              {leftIcon}
            </div>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input-field',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon ? (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-2 text-sm text-error-600">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-2 text-sm text-secondary-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
