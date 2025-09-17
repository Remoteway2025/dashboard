"use client"

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { useAuth, useTranslation, useDocumentInfo } from '@payloadcms/ui'
import { updateCandidateStatus } from '@/lib/actions'

interface CandidateSelectButtonProps {
  candidateId?: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function CandidateSelectButton({
  candidateId,
  onSuccess,
  onError,
  disabled = false,
  size = 'medium',
  className
}: CandidateSelectButtonProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const { id: docId } = useDocumentInfo()

  // Use candidateId prop if provided, otherwise get from document context
  const actualCandidateId = candidateId || docId

  const handleSelect = async () => {
    if (!actualCandidateId || loading) return

    setLoading(true)
    try {
      const result = await updateCandidateStatus(actualCandidateId, 'selected', user)

      if (result.success) {
        onSuccess?.(result.data)
      } else {
        onError?.(result.error || 'Failed to select candidate')
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
      onClick={handleSelect}
      disabled={disabled || loading}
      size={size}
      className={className}
      buttonStyle="primary"

    >
      {loading
        ? (i18n.language === 'ar' ? 'جاري الاختيار...' : 'Selecting...')
        : (i18n.language === 'ar' ? 'اختيار المرشح' : 'Select Candidate')
      }
    </Button>
  )
}