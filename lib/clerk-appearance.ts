/** Clerk's wording, so its screens don't show the name of the Clerk project */
export const clerkLocalization = {
  signIn: { start: { title: 'Log in to Sigrid', subtitle: 'Welcome back. Your patterns are waiting.', actionLink: 'Create account' } },
  signUp: { start: { title: 'Create your account', subtitle: 'Buy patterns and keep them on your account.', actionLink: 'Log in' } },
}

/** Clerk's sign-in, sign-up and account screens, in Sigrid's tokens. The glass itself is in the global CSS. */
export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--foreground)',
    colorPrimaryForeground: 'var(--background)',
    colorForeground: 'var(--foreground)',
    colorMutedForeground: 'var(--muted-foreground)',
    colorBackground: 'var(--app-panel)',
    colorInput: 'var(--app-elev)',
    colorInputForeground: 'var(--foreground)',
    colorBorder: 'var(--app-border-strong)',
    colorDanger: 'var(--destructive)',
    colorSuccess: 'var(--success)',
    fontFamily: 'var(--font-body-face)',
    fontFamilyButtons: 'var(--font-body-face)',
    borderRadius: 'var(--control-radius)',
  },
}
