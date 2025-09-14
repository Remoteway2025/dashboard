import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { notificationId, recipientId } = await request.json()

    // Get user from session/token (you'll need to implement proper auth)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update notification recipient to mark as read
    const updatedRecipient = await payload.update({
      collection: 'notification-recipients',
      id: recipientId,
      data: {
        isRead: true,
        readAt: new Date().toISOString(),
      },
    })

    // Notification marked as read successfully

    return NextResponse.json({ 
      success: true, 
      recipient: updatedRecipient 
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}