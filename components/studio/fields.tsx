'use client'

import { useId, useState } from 'react'

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'

/** Small form building blocks for the studio, so every form reads the same */

export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  long,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  long?: boolean
}) {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {long ? (
        <Textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

/**
 * A number with its unit shown in the field. Keeps what you type (so "1," or an
 * empty field don't jump), and reports a number, or null when empty.
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  hint,
}: {
  label: string
  value: number | null
  onChange: (n: number | null) => void
  unit: string
  placeholder?: string
  hint?: string
}) {
  const id = useId()
  const [text, setText] = useState(value ? String(value) : '')
  // Follow changes made elsewhere (undo, another field) without fighting the typing
  const [last, setLast] = useState(value)
  if (value !== last) {
    setLast(value)
    if (parse(text) !== value) setText(value ? String(value) : '')
  }
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          className="tabular-nums"
          onChange={(e) => {
            setText(e.target.value)
            const n = parse(e.target.value)
            setLast(n)
            onChange(n)
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{unit}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

function parse(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}
