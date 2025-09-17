"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast, useTranslation } from '@payloadcms/ui'
import CandidateSelectButton from './CandidateSelectButton'
import CandidateRejectButton from './CandidateRejectButton'

interface CandidateActionButtonsProps {
  candidateId: string
  onStatusChange?: () => void
}

export default function CandidateActionButtons({ candidateId, onStatusChange }: CandidateActionButtonsProps) {

  const router = useRouter()
  const { i18n } = useTranslation()
  const handleSelectSuccess = () => {
    toast.success('Candidate selected successfully', { position: i18n.language == "ar" ? "bottom-left" : "bottom-right" })
    onStatusChange?.()

    // Redirect to candidates list after a short delay
    router.push('/admin/collections/candidates')
  }

  const handleRejectSuccess = () => {
    toast.success('Candidate rejected successfully', { position: i18n.language == "ar" ? "bottom-left" : "bottom-right" })
    onStatusChange?.()

    // Redirect to candidates list after a short delay
    router.push('/admin/collections/candidates')

  }

  const handleError = (error: string) => {
    console.error('Status update error:', error)
    toast.error(`Error: ${error}`, { position: i18n.language == "ar" ? "bottom-left" : "bottom-right" })
  }

  return (
    <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
      <CandidateSelectButton
        candidateId={candidateId}
        onSuccess={handleSelectSuccess}
        onError={handleError}
        size="medium"
      />
      <CandidateRejectButton
        candidateId={candidateId}
        onSuccess={handleRejectSuccess}
        onError={handleError}
        size="medium"
      />
    </div>
  )
}