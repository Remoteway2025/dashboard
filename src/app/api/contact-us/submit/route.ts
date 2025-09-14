import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    
    const {
      companyName,
      contactPersonName,
      email,
      jobTitle,
      companySize,
      contactMethod,
      message,
    } = body

    // Validate required fields
    if (!companyName || !contactPersonName || !email || !jobTitle || !companySize || !contactMethod) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Create contact us entry
    const contactEntry = await payload.create({
      collection: 'contact-us',
      data: {
        companyName: companyName.trim(),
        contactPersonName: contactPersonName.trim(),
        email: email.trim().toLowerCase(),
        jobTitle: jobTitle.trim(),
        companySize,
        contactMethod,
        message: message ? message.trim() : undefined,
        status: 'open',
      },
    })

    console.log(`New contact inquiry received from ${companyName} (${contactPersonName})`)

    return NextResponse.json({
      success: true,
      message: 'Contact inquiry submitted successfully',
      id: contactEntry.id,
    })

  } catch (error) {
    console.error('Error submitting contact inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact inquiry' },
      { status: 500 }
    )
  }
}