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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = { equals: status }
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.greater_than_equal = startDate
      }
      if (endDate) {
        where.createdAt.less_than_equal = endDate
      }
    }

    // Fetch contact us entries
    const contactEntries = await payload.find({
      collection: 'contact-us',
      where,
      limit: 1000, // Adjust as needed
      sort: '-createdAt',
    })

    // Generate CSV content
    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'Job Title',
      'Company Size',
      'Contact Method',
      'Message',
      'Status',
      'Created At',
      'Closed At',
      'Closed By',
    ]

    const csvRows = [headers.join(',')]

    for (const entry of contactEntries.docs) {
      const row = [
        `"${(entry.companyName || '').replace(/"/g, '""')}"`,
        `"${(entry.contactPersonName || '').replace(/"/g, '""')}"`,
        `"${(entry.email || '').replace(/"/g, '""')}"`,
        `"${(entry.jobTitle || '').replace(/"/g, '""')}"`,
        `"${entry.companySize || ''}"`,
        `"${entry.contactMethod || ''}"`,
        `"${(entry.message || '').replace(/"/g, '""')}"`,
        `"${entry.status || ''}"`,
        `"${new Date(entry.createdAt).toLocaleString('en-US')}"`,
        `"${entry.closedAt ? new Date(entry.closedAt).toLocaleString('en-US') : ''}"`,
        `"${entry.closedBy && typeof entry.closedBy === 'object' ? entry.closedBy.email : ''}"`,
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')
    const fileName = `contact-us-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Error exporting contact us data:', error)
    return NextResponse.json(
      { error: 'Failed to export contact us data' },
      { status: 500 }
    )
  }
}