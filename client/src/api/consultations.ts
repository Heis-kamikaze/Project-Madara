import { api } from '../lib/api'
import type { Consultation, ConsultationStatus, ConsultationType } from '../types/api'
import { useApiMutation, useGet, usePaged } from './query'

export type NewConsultation = {
  type: ConsultationType
  requestedSlot: string
  notes?: string
  measurements?: Record<string, number>
  referenceImageUrls: string[]
}

export const useCreateConsultation = () =>
  useApiMutation((body: NewConsultation) => api.post<Consultation>('/consultations', body), [['consultations']])

export const useMyConsultations = (enabled = true) =>
  usePaged<Consultation>(['consultations', 'mine'], '/consultations/mine', { limit: 20 }, enabled)

export const useConsultation = (id: string | undefined) =>
  useGet<Consultation>(['consultations', 'one', id], `/consultations/${id}`, undefined, { enabled: !!id })

export const useCancelConsultation = () =>
  useApiMutation((id: string) => api.post<Consultation>(`/consultations/${id}/cancel`), [['consultations']])

// ── Staff ──
export const useAllConsultations = (status?: ConsultationStatus) =>
  usePaged<Consultation>(['consultations', 'all'], '/consultations', { status, limit: 25 })

export type ConsultationPatch = {
  status?: 'confirmed' | 'completed' | 'cancelled'
  scheduledAt?: string | null
  adminNotes?: string | null
}

export const useUpdateConsultation = () =>
  useApiMutation((v: { id: string; patch: ConsultationPatch }) => api.patch<Consultation>(`/consultations/${v.id}`, v.patch), [
    ['consultations'],
  ])
