import { FirebaseError } from 'firebase/app'

/** Turns Firebase Auth errors into messages a customer can act on. Returns null for "user cancelled". */
export function authErrorMessage(err: unknown): string | null {
  if (!(err instanceof FirebaseError)) return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  switch (err.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/invalid-email':
      return 'That email address does not look right.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 6 characters).'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    default:
      return err.message
  }
}
