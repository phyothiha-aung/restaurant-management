import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface FieldFrameProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FieldFrame({ id, label, error, hint, children }: FieldFrameProps) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, id: providedId, className = "", ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <FieldFrame id={id} label={label} error={error} hint={hint}>
        <input
          ref={ref}
          id={id}
          className={`min-h-11 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </FieldFrame>
    );
  },
);

InputField.displayName = "InputField";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, id: providedId, className = "", ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <FieldFrame id={id} label={label} error={error} hint={hint}>
        <textarea
          ref={ref}
          id={id}
          className={`min-h-24 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </FieldFrame>
    );
  },
);

TextareaField.displayName = "TextareaField";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, id: providedId, className = "", children, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <FieldFrame id={id} label={label} error={error} hint={hint}>
        <select
          ref={ref}
          id={id}
          className={`min-h-11 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-red focus:ring-4 focus:ring-brand-red-soft disabled:cursor-not-allowed disabled:bg-line-soft disabled:text-muted ${className}`}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
      </FieldFrame>
    );
  },
);

SelectField.displayName = "SelectField";
