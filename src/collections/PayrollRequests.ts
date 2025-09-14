import type { CollectionConfig } from 'payload'

export const PayrollRequests: CollectionConfig = {
  slug: 'payroll-requests',
  labels: {
    singular: 'Payroll Request',
    plural: 'Payroll Requests'
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['company', 'payrollPeriod', 'employeesCount', 'totalAmount', 'status', 'createdAt'],
    listSearchableFields: ['company', 'payrollPeriod'],
    group: 'Finance',
  },
  versions: {
    drafts: false
  },
  timestamps: true,
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer' && user.company) {
        return {
          company: {
            equals: user.company?.id || user.company,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'employer' || user.role === 'super admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer' && user.company) {
        return {
          company: {
            equals: user.company?.id
          },
          status: {
            in: ['new', 'rejected']
          }
        }
      }
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Set submitted by for new requests
        if (operation === 'create') {
          data.submittedBy = req.user?.id
          if (req.user?.role === 'employer' && req.user.company) {
            data.company = req.user?.company?.id || req.user?.company
          }
        }

        // Calculate totals for all company employees
        if (data.company && (operation === 'create' || (operation === 'update' && !originalDoc))) {
          const payload = req.payload
          const companyId = typeof data.company === 'object' ? data.company.id : data.company

          // Fetch all active employees for this company
          const employees = await payload.find({
            collection: 'employees',
            where: {
              company: {
                equals: companyId,
              },
              status: {
                equals: 'active',
              },
            },
            limit: 1000,
          })

          data.employeesCount = employees.docs.length

          let totalBasic = 0
          let totalAllowances = 0
          let totalDeductions = 0
          let totalGross = 0
          let totalNet = 0

          // Calculate totals from all employees
          for (const employee of employees.docs) {
            if (employee.payrollInfo) {
              totalBasic += employee.payrollInfo.basicSalary || 0
              totalAllowances += employee.payrollInfo.allowances || 0
              totalDeductions += employee.payrollInfo.deductions || 0
              totalGross += employee.payrollInfo.grossPay || 0
              totalNet += employee.payrollInfo.netSalary || 0
            }
          }

          data.payrollSummary = {
            totalBasicSalary: totalBasic,
            totalAllowances: totalAllowances,
            totalDeductions: totalDeductions,
            totalGrossPay: totalGross,
            totalNetPay: totalNet,
          }

          data.totalAmount = totalNet
        }

        // Set review information when status changes
        if (operation === 'update' && originalDoc && data.status !== originalDoc.status) {
          if (['approved', 'rejected', 'invoice_generated', 'processed'].includes(data.status)) {
            data.reviewedBy = req.user.id
            data.reviewedAt = new Date().toISOString()
          }

          // Generate invoice number when approved
          if (data.status === 'invoice_generated' && !data.invoiceNumber) {
            const timestamp = Date.now()
            const companyCode = typeof data.company === 'object' ? data.company.id.slice(-4) : data.company.slice(-4)
            data.invoiceNumber = `INV-${companyCode}-${timestamp}`
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        // Log payroll request actions
        if (operation === 'create') {
          console.log(`New payroll request created for ${doc.company} - ${doc.payrollPeriod}`)
        }

        if (operation === 'update' && previousDoc && doc.status !== previousDoc.status) {
          console.log(`Payroll request ${doc.id} status changed from ${previousDoc.status} to ${doc.status}`)

          // When approved, create individual payslips
          if (doc.status === 'approved') {
            const payload = req.payload

            try {
              const companyId = typeof doc.company === 'object' ? doc.company.id : doc.company

              // Fetch all active employees for this company
              const employees = await payload.find({
                collection: 'employees',
                where: {
                  company: {
                    equals: companyId,
                  },
                  status: {
                    equals: 'active',
                  },
                },
                limit: 1000,
              })

              // Create payslips for each employee
              for (const employee of employees.docs) {
                if (employee.payrollInfo) {
                  await payload.create({
                    collection: 'payslips',
                    data: {
                      payrollRequest: doc.id,
                      employee: employee.id,
                      company: doc.company,
                      payrollPeriod: doc.payrollPeriod,
                      payrollDetails: {
                        basicSalary: employee.payrollInfo.basicSalary || 0,
                        allowances: employee.payrollInfo.allowances || 0,
                        deductions: employee.payrollInfo.deductions || 0,
                        grossPay: employee.payrollInfo.grossPay || 0,
                        netPay: employee.payrollInfo.netSalary || 0,
                        iban: employee.payrollInfo.iban,
                      },
                      status: 'generated',
                    },
                  })
                }
              }

              console.log(`Created ${employees.docs.length} payslips for payroll request ${doc.id}`)
            } catch (error) {
              console.error(`Error creating payslips for payroll request ${doc.id}:`, error)
            }
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            if (data.company && data.payrollPeriod) {
              const companyName = typeof data.company === 'object' ? data.company.companyLegalName : 'Company'
              const date = new Date(data.payrollPeriod)
              const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              return `${companyName} - ${monthYear}`
            }
            return 'Payroll Request'
          },
        ],
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Company requesting payroll processing',
      },
      filterOptions: {
        status: {
          equals: 'active',
        },
      },
      access: {
        create: ({ req: { user } }) => {
          if (user?.role === 'employer') return false
          return true
        },
        update: ({ req: { user } }) => {
          if (user?.role === 'employer') return false
          return true
        }
      },
      defaultValue: ({ user }) => {
        if (user?.role === 'employer' && user?.company) {
          return user.company?.id || user.company
        }
        return undefined
      },
    },
    {
      name: 'payrollPeriod',
      type: 'date',
      required: true,
      admin: {
        description: 'Payroll period month/year',
        date: {
          displayFormat: 'MMMM yyyy',
          pickerAppearance: "monthOnly",
        },
      },
    },
    {
      name: 'employeesCount',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Number of employees in this payroll (auto-calculated)',
      },
    },
    {
      name: 'payrollSummary',
      type: 'group',
      admin: {
        description: 'Payroll totals and summary',
      },
      fields: [
        {
          name: 'totalBasicSalary',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total basic salary for all employees',
            step: 0.01,
          },
        },
        {
          name: 'totalAllowances',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total allowances for all employees',
            step: 0.01,
          },
        },
        {
          name: 'totalDeductions',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total deductions for all employees',
            step: 0.01,
          },
        },
        {
          name: 'totalGrossPay',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total gross pay for all employees',
            step: 0.01,
          },
        },
        {
          name: 'totalNetPay',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Total net pay for all employees',
            step: 0.01,
          },
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Total amount for this payroll request (same as total net pay)',
        step: 0.01,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'Under Review',
          value: 'under_review',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Invoice Generated',
          value: 'invoice_generated',
        },
        {
          label: 'Processed',
          value: 'processed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current status of the payroll request',
      },
      access: {
        create: ({ req: { user } }) => {

          if (user?.role === 'employer') return false

          return true
        }
      }
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'User who submitted this payroll request',
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['approved', 'rejected', 'invoice_generated', 'processed'].includes(data?.status),
        description: 'Admin who reviewed this payroll request',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['approved', 'rejected', 'invoice_generated', 'processed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: 'Date when payroll request was reviewed',
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        condition: (data) => data?.status === 'rejected',
        description: 'Reason for rejecting this payroll request',
        rows: 3,
      },
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => ['invoice_generated', 'processed'].includes(data?.status),
        description: 'Generated invoice number',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this payroll request',
        position: 'sidebar',
        rows: 4,
      },
    },
  ]
}