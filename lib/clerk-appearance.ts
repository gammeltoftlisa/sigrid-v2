/** Clerk's wording, so its screens don't show the name of the Clerk project */
export const clerkLocalization = {
  signIn: { start: { title: 'Log in to Sigrid', subtitle: 'Welcome back. Your patterns are waiting.', actionLink: 'Create account' } },
  signUp: { start: { title: 'Create your account', subtitle: 'Your projects and progress, on all your devices.', actionLink: 'Log in' } },
  // Manage account: two plain tabs. The profile photo isn't here: it lives on Sigrid's own Profile page.
  userProfile: {
    navbar: { title: 'Your account', description: 'Your email, password and devices.', account: 'Login', security: 'Security' },
    start: {
      headerTitle__account: 'Login',
      headerTitle__security: 'Security',
      emailAddressesSection: { title: 'Email', primaryButton: 'Add an email' },
      connectedAccountsSection: { title: 'Connected accounts', primaryButton: 'Connect an account' },
      passwordSection: { title: 'Password', primaryButton__updatePassword: 'Change password', primaryButton__setPassword: 'Set a password' },
      activeDevicesSection: { title: 'Devices', destructiveAction: 'Log out of this device' },
      dangerSection: { title: 'Delete account', deleteAccountButton: 'Delete account' },
    },
  },
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
  layout: { shimmer: false, socialButtonsVariant: 'blockButton', logoPlacement: 'none' },
}
