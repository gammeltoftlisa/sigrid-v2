"use client"

import {
  IconAlertCircleFilled,
  IconCircleCheckFilled,
  IconCircleX,
  IconCircleXFilled,
  IconInfoCircleFilled,
  type Icon,
} from "@tabler/icons-react"
import { cn } from "cn"

type Status = "success" | "error" | "warning" | "info" | "neutral"

const icons: Record<Status, Icon> = {
  success: IconCircleCheckFilled,
  error: IconCircleXFilled,
  warning: IconAlertCircleFilled,
  info: IconInfoCircleFilled,
  neutral: IconInfoCircleFilled,
}

/**
 * A status message: what happened, and what it means for you.
 * Pastel fill, a solid accent bar on the left, a filled icon, the title in the
 * status colour and calm body text. Optional action and dismiss on the right.
 * Errors and warnings are announced to screen readers (role="alert"); the rest are polite.
 */
function StatusMessage({
  status,
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  status: Status
  title: string
  children?: React.ReactNode
  /** Optional button or link on the right */
  action?: React.ReactNode
  /** Shows a dismiss button when given */
  onDismiss?: () => void
  className?: string
}) {
  const StatusIcon = icons[status]
  return (
    <div
      data-status={status}
      role={status === "error" || status === "warning" ? "alert" : "status"}
      className={cn(
        "status-message flex gap-3 px-4 py-3",
        children ? "items-start" : "items-center",
        className
      )}
    >
      <StatusIcon aria-hidden className={cn("status-icon size-5 shrink-0", children && "mt-px")} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-(--status)">{title}</p>
        {children && <div className="text-sm text-foreground/80">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="status-dismiss -my-1 -mr-1 flex size-8 shrink-0 items-center justify-center self-center rounded-(--radius) outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <IconCircleX className="size-5" stroke={1.5} />
        </button>
      )}
    </div>
  )
}

export { StatusMessage, type Status as StatusMessageStatus }
