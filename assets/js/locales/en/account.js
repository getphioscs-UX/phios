const account = Object.freeze({
  accountPublic: {
    metaTitle: 'Account — PHI OS', skip: 'Skip to account', eyebrow: 'M4C Account',
    title: 'One account. Clear control.', lead: 'Manage identity, privacy and account lifecycle without mixing account data with Runtime evidence.',
    preview: 'Account services are not connected in this release. These controls show the intended secure workflow and do not create or change an account.',
    registration: 'Registration', login: 'Login', verification: 'Email verification', reset: 'Password reset',
    profile: 'Profile', privacy: 'Privacy settings', deletion: 'Delete account',
    pending: 'Provider connection required', secure: 'Passwords and verification tokens are never stored by this preview.',
    deletionCopy: 'Deletion requires a verified request and a final confirmation before data is removed.',
    myReality: 'Open My Reality', membership: 'View membership'
  },
  myRealityAccount: {
    metaTitle: 'My Reality — PHI OS', skip: 'Skip to My Reality', eyebrow: 'Account overview',
    title: 'My Reality', lead: 'A single account view of journeys, access, progress and professional activity.',
    unavailable: 'No authorised account projection is loaded. This page does not search browser Runtime data.',
    current: 'Current Journeys', past: 'Past Journeys', reports: 'Reports', books: 'Book Access',
    progress: 'Reading Progress', appointments: 'Appointments', shared: 'Shared Access',
    empty: 'Nothing available yet.', runtimeLink: 'Open on-device Runtime continuity'
  },
  membershipPublic: {
    metaTitle: 'Membership — PHI OS', skip: 'Skip to membership', eyebrow: 'Membership',
    title: 'Four clear ways to use PHI OS.', lead: 'Membership organises access without changing the evidence or conclusions of any Reality Journey.',
    explorer: 'Explorer', reader: 'Reader', navigator: 'Navigator', professional: 'Professional',
    explorerCopy: 'Explore the public knowledge system and begin a limited Journey.',
    readerCopy: 'Continue regular Reading work with standard reports.',
    navigatorCopy: 'Work through Reading and Navigation with broader continuity.',
    professionalCopy: 'Use the governed Professional Workspace within an approved scope.',
    monthly: 'Monthly', annual: 'Annual', lifecycle: 'Subscription lifecycle',
    upgrade: 'Upgrade', downgrade: 'Downgrade', cancel: 'Cancel',
    grace: 'Grace period', failed: 'Failed payment',
    entitlements: 'Entitlements', book: 'Book access', quota: 'Journey quota', reports: 'Report access',
    review: 'Professional review', academy: 'Academy access',
    boundary: 'Displayed access is informational until validated by the account service. Checkout and payment collection are not enabled on this page.'
  }
});
export default account;
