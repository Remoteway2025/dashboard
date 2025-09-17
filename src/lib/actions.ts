"use server"
import { getPayload, Where } from 'payload'
import config from '@payload-config'
import { User } from '@/payload-types'

export async function searchEmployees(user: User, searchTerm?: string, locale?: string) {
    const payload = await getPayload({ config })

    let where: Where = {}

    if (searchTerm && searchTerm.trim()) {
        where = {
            or: [
                {
                    fullName: {
                        contains: searchTerm
                    }
                },
                {
                    employeeId: {
                        contains: searchTerm
                    }
                }
            ]
        }
    }

    const result = await payload.find({
        collection: 'employees',
        where,
        limit: 50,
        depth: 0,
        user,
        overrideAccess: false,
        locale: locale || 'en'
    })
    console.log("Employee returned")
    return result
}

export async function getPayslipForEmployeeAndMonth(employeeId: string, monthDate: string, locale?: string) {
    if (!employeeId || !monthDate) {
        return null
    }

    const payload = await getPayload({ config })

    // Parse the month date and get start/end of month
    const date = new Date(monthDate)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    const result = await payload.find({
        collection: 'payslips',
        where: {
            and: [
                {
                    employee: {
                        equals: employeeId
                    }
                },
                {
                    payrollPeriod: {
                        greater_than_equal: startOfMonth.toISOString(),
                        less_than_equal: endOfMonth.toISOString()
                    }
                }
            ]
        },
        depth: 2, // To populate employee and company relationships
        limit: 1,
        locale: locale || 'en'
    })

    return result.docs.length > 0 ? result.docs[0] : null
}

export async function updateCandidateStatus(candidateId: string, status: 'available' | 'assigned' | 'selected' | 'rejected', user?: User) {
    if (!candidateId || !status) {
        throw new Error('Candidate ID and status are required')
    }

    // Validate status value
    const validStatuses = ['available', 'assigned', 'selected', 'rejected']
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const payload = await getPayload({ config })

    try {
        // First, fetch the candidate to check if employer has access
        const candidate = await payload.findByID({
            collection: 'candidates',
            id: candidateId,
            depth: 0
        })

        if (!candidate) {
            throw new Error('Candidate not found')
        }

        // Check access for employer role
        if (user?.role === 'employer') {
            // Employer can only update candidates assigned to their company
            const companyId = typeof user.company === 'object' ? user.company.id : user.company
            const candidateCompanyId = typeof candidate.company === 'object' ? candidate.company : candidate.company

            if (candidateCompanyId !== companyId) {
                throw new Error('You can only update candidates assigned to your company')
            }

            // Employers can only change status from 'assigned' to 'selected' or 'rejected'
            if (candidate.status !== 'assigned') {
                throw new Error('You can only update candidates with assigned status')
            }

            if (status !== 'selected' && status !== 'rejected') {
                throw new Error('You can only select or reject candidates')
            }
        }

        // Update the status - using overrideAccess:true since we've done our own validation
        const result = await payload.update({
            collection: 'candidates',
            id: candidateId,
            data: {
                status: status
            },
            user,
            overrideAccess: true // Override field-level access since we validated above
        })

        return {
            success: true,
            data: result
        }
    } catch (error) {
        console.error('Error updating candidate status:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update candidate status'
        }
    }
}