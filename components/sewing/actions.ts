// Tag style + label per kind of step, shared by the step list and the instruction panel.
// Tags are neutral on purpose: the label carries the meaning, colour is reserved for state.
export const ACTION_COLORS: Record<string, string> = {
  cut:     'bg-secondary text-secondary-foreground',
  sew:     'bg-secondary text-secondary-foreground',
  fold:    'bg-secondary text-secondary-foreground',
  pin:     'bg-secondary text-secondary-foreground',
  press:   'bg-secondary text-secondary-foreground',
  mark:    'bg-secondary text-secondary-foreground',
  prepare: 'bg-secondary text-secondary-foreground',
  attach:  'bg-secondary text-secondary-foreground',
}

export const ACTION_LABELS: Record<string, string> = {
  cut: 'Cut', sew: 'Sew', fold: 'Fold', pin: 'Pin',
  press: 'Press', mark: 'Mark', prepare: 'Prepare', attach: 'Attach',
}
