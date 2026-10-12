'use client'

import { useState } from 'react'
import { IconWand } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Inset } from '@/components/patterns/inset'
import type { StandardSize } from '@/lib/types'

export interface SizeColumn<K extends string> {
  key: K
  label: string
  unit: string
}

/** A number cell that keeps what you type ("1," or empty) and reports a number or null */
function CellNumber({ value, onChange, label }: { value: number | null | undefined; onChange: (n: number | null) => void; label: string }) {
  const [text, setText] = useState(value ? String(value) : '')
  const [last, setLast] = useState(value ?? null)
  if ((value ?? null) !== last) {
    setLast(value ?? null)
    if (parse(text) !== (value ?? null)) setText(value ? String(value) : '')
  }
  return (
    <Input
      aria-label={label}
      inputMode="decimal"
      value={text}
      aria-invalid={false}
      className="h-9 min-w-16 tabular-nums"
      onChange={(e) => {
        setText(e.target.value)
        const n = parse(e.target.value)
        setLast(n)
        onChange(n)
      }}
    />
  )
}

function parse(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * One row per size, one column per measurement. The maker fills in one size
 * (the base) and can let Sigrid estimate the empty sizes from it, then check them.
 */
export function SizeTable<K extends string>({
  label,
  sizes,
  base,
  columns,
  value,
  onChange,
  onFill,
  canFill,
}: {
  /** What the table holds, for screen readers and the fill button */
  label: string
  sizes: StandardSize[]
  base: StandardSize
  columns: SizeColumn<K>[]
  value: (size: StandardSize, key: K) => number | null | undefined
  onChange: (size: StandardSize, key: K, n: number | null) => void
  /** Fills the empty sizes from the base size */
  onFill?: () => void
  canFill?: boolean
}) {
  const empty = sizes.filter((s) => columns.some((c) => !value(s, c.key))).length

  return (
    <div className="flex flex-col gap-2">
      <Inset className="overflow-x-auto p-1">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Size</TableHead>
              {columns.map((c) => (
                <TableHead key={c.key}>
                  {c.label} <span className="font-normal text-muted-foreground">({c.unit})</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sizes.map((s) => (
              <TableRow key={s}>
                <TableCell className="font-medium">
                  {s}
                  {s === base && sizes.length > 1 && <span className="block text-xs font-normal text-muted-foreground">start here</span>}
                </TableCell>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <CellNumber label={`${c.label}, size ${s} (${c.unit})`} value={value(s, c.key)} onChange={(n) => onChange(s, c.key, n)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Inset>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {empty === 0 ? 'Every size is filled in.' : empty === 1 ? '1 size still needs numbers.' : `${empty} sizes still need numbers.`}
        </p>
        {onFill && sizes.length > 1 && empty > 0 && (
          <Button variant="outline" size="sm" disabled={!canFill} onClick={onFill}>
            <IconWand data-icon="inline-start" />
            {canFill ? `Fill the other sizes from ${base}` : `Fill in ${base} first`}
          </Button>
        )}
      </div>
    </div>
  )
}
