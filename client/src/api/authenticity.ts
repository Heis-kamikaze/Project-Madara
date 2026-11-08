import { api } from '../lib/api'
import type { AuthenticityCode, ClaimResult, MapRegion, VerifyResult } from '../types/api'
import { useApiMutation, useGet, useGetEnvelope } from './query'

export const useVerifyCode = (code: string | undefined) =>
  useGet<VerifyResult>(['authenticity', 'verify', code], `/authenticity/verify/${encodeURIComponent(code ?? '')}`, undefined, {
    enabled: !!code,
  })

export type ClaimInput = { code: string; shareLocation: boolean; country?: string; state?: string }

export const useClaimPiece = () =>
  useApiMutation((body: ClaimInput) => api.post<ClaimResult>('/authenticity/claim', body), [['authenticity'], ['closet'], ['map']])

export const useMapRegions = () => useGetEnvelope<MapRegion[]>(['map'], '/map/regions')

// ── Staff ──
export const useAuthenticityCodes = () => useGet<AuthenticityCode[]>(['authenticity', 'codes'], '/authenticity/codes', { limit: 100 })

export const useGenerateCodes = () =>
  useApiMutation(
    (body: { productId: string; quantity: number }) => api.post<AuthenticityCode[]>('/authenticity/codes', body),
    [['authenticity', 'codes']],
  )
