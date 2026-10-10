import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

type Status = "success" | "warning" | "info" | "neutral"

const statusClasses: Record<Status, string> = {
  success: "bg-success/10 text-success dark:bg-success/20",
  warning: "bg-warning/15 text-foreground dark:bg-warning/20",
  info: "bg-info/10 text-info dark:bg-info/20",
  neutral: "bg-muted text-muted-foreground",
}

/**
 * Small label for system state (saved, in progress, needs attention).
 * Status colours are functional only — never use them for decoration.
 */
function StatusBadge({
  status = "neutral",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { status?: Status }) {
  return (
    <Badge
      variant="secondary"
      data-status={status}
      className={cn(statusClasses[status], className)}
      {...props}
    />
  )
}

export { StatusBadge, type Status }
