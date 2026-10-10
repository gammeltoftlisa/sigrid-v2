import type { Icon } from "@tabler/icons-react"
import { cn } from "cn"

import { Checkbox } from "@/components/ui/checkbox"

/**
 * One row in a materials or tools list. Quantity is right-aligned
 * and tabular so amounts line up. Optional checkbox for "I have this".
 */
function MaterialItem({
  id,
  icon: ItemIcon,
  name,
  detail,
  quantity,
  checkable,
  checked,
  onCheckedChange,
  className,
}: {
  id: string
  icon: Icon
  name: string
  detail?: string
  quantity?: string
  checkable?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <ItemIcon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
          {name}
        </span>
        {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
      </span>
      {quantity && <span className="text-sm tabular-nums text-muted-foreground">{quantity}</span>}
    </>
  )

  if (!checkable) {
    return <div className={cn("flex items-center gap-3 py-2", className)}>{content}</div>
  }

  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-center gap-3 py-2", className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange?.(Boolean(v))} />
      {content}
    </label>
  )
}

export { MaterialItem }
