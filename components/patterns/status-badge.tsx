import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

type Status = "success" | "error" | "warning" | "info" | "neutral"

const statusClasses: Record<Status, string> = {
  // Colours come from the brand layer via data-status (tint, deep text, glowing dot)
  success: "",
  error: "",
  warning: "",
  info: "",
  neutral: "bg-muted text-muted-foreground",
}

/**
 * Small label for system state: saved, finished, needs attention, failed.
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
