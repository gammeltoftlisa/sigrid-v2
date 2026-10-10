import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX, type Icon } from "@tabler/icons-react"
import { cn } from "cn"

type Status = "success" | "error" | "warning" | "info"

const icons: Record<Status, Icon> = {
  success: IconCircleCheck,
  error: IconX,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
}

/**
 * A status message: what happened, and what it means for you.
 * Bright tint with a soft sheen, a glossy icon chip, deep readable text.
 * Errors and warnings are announced to screen readers (role="alert"); success and info are polite.
 */
function StatusMessage({
  status,
  title,
  children,
  action,
  className,
}: {
  status: Status
  title: string
  children?: React.ReactNode
  /** Optional button or link on the right */
  action?: React.ReactNode
  className?: string
}) {
  const StatusIcon = icons[status]
  return (
    <div
      data-status={status}
      role={status === "error" || status === "warning" ? "alert" : "status"}
      className={cn("status-message flex items-start gap-3 rounded-(--radius) px-4 py-3.5", className)}
    >
      <span aria-hidden className="status-chip flex size-7 shrink-0 items-center justify-center rounded-(--radius)">
        <StatusIcon className="size-4" stroke={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p className="text-sm font-medium text-(--status)">{title}</p>
        {children && <div className="text-sm text-foreground/80">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

export { StatusMessage, type Status as StatusMessageStatus }
