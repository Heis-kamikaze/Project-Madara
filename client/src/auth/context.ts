import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { AuthMe, Permission } from '../types/api'

export interface AuthState {
  /** `loading` until Firebase has told us whether someone is signed in. */
  status: 'loading' | 'signedOut' | 'signedIn'
  firebaseUser: User | null
  /** Role, permissions and profile from GET /auth/me. Null while signed out (or if the API is unreachable). */
  me: AuthMe | null
  /** Set when the user is signed in with Firebase but the API could not be reached. */
  bootError: string | null
  isStaff: boolean
  can: (permission: Permission) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  /** Force a fresh token and reload /auth/me (call after a role change or profile update). */
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
