import { api } from '../lib/api'
import type { LandingConfig } from '../types/api'
import { useApiMutation, useGet } from './query'

export const useLanding = () => useGet<LandingConfig>(['site', 'landing'], '/site/landing')

export type LandingInput = Partial<Omit<LandingConfig, 'navigation'>>

export const useUpdateLanding = () =>
  useApiMutation((body: LandingInput) => api.put<LandingConfig>('/site/landing', body), [['site']])
