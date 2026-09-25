// Colour + label per kind of step, shared by the step list and the instruction panel
export const ACTION_COLORS: Record<string, string> = {
  cut:     'bg-[#FDE8E6] text-[#C5574A]',
  sew:     'bg-primary-soft text-primary-deep',
  fold:    'bg-surface-2 text-ink-2',
  pin:     'bg-[#E3EEE3] text-[#4E7D4F]',
  press:   'bg-warn-soft text-warn',
  mark:    'bg-surface-2 text-ink-2',
  prepare: 'bg-surface-2 text-ink-2',
  attach:  'bg-primary-soft text-primary-deep',
}

export const ACTION_LABELS: Record<string, string> = {
  cut: 'Cut', sew: 'Sew', fold: 'Fold', pin: 'Pin',
  press: 'Press', mark: 'Mark', prepare: 'Prepare', attach: 'Attach',
}
