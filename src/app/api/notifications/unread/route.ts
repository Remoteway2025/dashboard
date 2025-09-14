import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    
    // Get user from session/token (you'll need to implement proper auth)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract company ID from URL params or user session
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    // Get unread notifications for this company
    const unreadNotifications = await payload.find({
      collection: 'notification-recipients',
      where: {
        and: [
          {
            company: {
              equals: companyId,
            },
          },
          {
            isRead: {
              equals: false,
            },
          },
        ],
      },
      populate: {
        notification: true,
      },
      sort: '-deliveredAt',
    })

    // Get count of unread notifications
    const unreadCount = unreadNotifications.totalDocs

    return NextResponse.json({
      success: true,
      notifications: unreadNotifications.docs,
      unreadCount,
    })

  } catch (error) {
    console.error('Error fetching unread notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}