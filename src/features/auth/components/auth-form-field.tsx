"use client";

import type { ComponentPropsWithoutRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormFieldProps extends ComponentPropsWithoutRef<typeof Input> {
  label?: string;
  name: string;
}

export function AuthFormField({ label, name, id = name, ...props }: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Input id={id} name={name} {...props} />
    </div>
  );
}
