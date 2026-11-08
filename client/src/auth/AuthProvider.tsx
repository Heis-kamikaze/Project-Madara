import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { api, errorMessage } from '../lib/api'
import { auth } from '../lib/firebase'
import type { AuthMe, Permission } from '../types/api'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthState['status']>('loading')
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [me, setMe] = useState<AuthMe | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  // While sign-up is running it registers the profile itself (with the chosen name),
  // so the auth listener must not race it.
  const signingUp = useRef(false)

  const loadMe = useCallback(async (displayName?: string | null): Promise<void> => {
    let res = await api.get<AuthMe>('/auth/me')
    if (!res.data.profile) {
      // First sign-in: create the customer profile on the server (safe to repeat).
      await api.post('/auth/register', displayName ? { displayName } : {})
      res = await api.get<AuthMe>('/auth/me')
    }
    setMe(res.data)
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (signingUp.current) return
      setFirebaseUser(user)
      if (!user) {
        setMe(null)
        setBootError(null)
        queryClient.clear()
        setStatus('signedOut')
        return
      }
      try {
        await loadMe(user.displayName)
        setBootError(null)
      } catch (err) {
        setMe(null)
        setBootError(errorMessage(err))
      }
      setStatus('signedIn')
    })
  }, [loadMe, queryClient])

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback<AuthState['signUp']>(
    async ({ email, password, displayName }) => {
      signingUp.current = true
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })
        await cred.user.getIdToken(true)
        setFirebaseUser(cred.user)
        await loadMe(displayName)
        setBootError(null)
        setStatus('signedIn')
      } finally {
        signingUp.current = false
      }
    },
    [loadMe],
  )

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider())
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return
    await auth.currentUser.getIdToken(true)
    await loadMe(auth.currentUser.displayName)
  }, [loadMe])

  const can = useCallback((permission: Permission) => me?.permissions.includes(permission) ?? false, [me])

  const value = useMemo<AuthState>(
    () => ({
      status,
      firebaseUser,
      me,
      bootError,
      isStaff: !!me && me.role !== 'customer',
      can,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
      refresh,
    }),
    [status, firebaseUser, me, bootError, can, signIn, signUp, signInWithGoogle, resetPassword, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
