"use client";

import { useId } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  description?: React.ReactNode;
  labelAside?: React.ReactNode;
  multiline?: boolean;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  step?: string;
  min?: number;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  description,
  labelAside,
  multiline,
  disabled,
  inputMode,
  step,
  min,
}: TextFieldProps<T>) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {labelAside}
          </div>
          {multiline ? (
            <Textarea
              id={id}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              disabled={disabled}
              {...field}
              value={field.value ?? ""}
            />
          ) : (
            <Input
              id={id}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
              disabled={disabled}
              inputMode={inputMode}
              step={step}
              min={min}
              {...field}
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value,
                )
              }
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
