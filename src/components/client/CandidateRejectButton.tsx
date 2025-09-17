"use client"

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { useAuth, useTranslation, useDocumentInfo } from '@payloadcms/ui'
import { updateCandidateStatus } from '@/lib/actions'

interface CandidateRejectButtonProps {
  candidateId?: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function CandidateRejectButton({
  candidateId,
  onSuccess,
  onError,
  disabled = false,
  size = 'medium',
  className
}: CandidateRejectButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const { id: docId } = useDocumentInfo()

  // Only show button for employer role
  if (user?.role !== 'employer') {
    return null
  }

  // Use candidateId prop if provided, otherwise get from document context
  const actualCandidateId = candidateId || docId

  const handleReject = async () => {
    if (!actualCandidateId || loading) return

    setLoading(true)
    try {
      const result = await updateCandidateStatus(actualCandidateId, 'rejected', user)
      console.log("success", result)
      if (result.success) {
        onSuccess?.(result.data)
      } else {
        onError?.(result.error || 'Failed to reject candidate')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleReject}
      disabled={disabled || loading}
      size={size}
      className={className}
      buttonStyle="pill"
    >
      {loading
        ? (i18n.language === 'ar' ? 'جاري الرفض...' : 'Rejecting...')
        : (i18n.language === 'ar' ? 'رفض المرشح' : 'Reject Candidate')
      }
    </Button>
  )
}