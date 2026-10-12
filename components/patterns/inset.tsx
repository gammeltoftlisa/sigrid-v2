import { cn } from 'cn'

/**
 * A white block inside a glass panel: stat tiles, charts, tables, lists of details.
 * Glass holds things, white is what you read and touch; never put glass inside an Inset.
 */
export function Inset({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="inset" className={cn('rounded-(--control-radius) bg-card', className)} {...props} />
}
