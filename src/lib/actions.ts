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