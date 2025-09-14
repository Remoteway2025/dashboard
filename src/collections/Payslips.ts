import type { CollectionConfig } from 'payload'

export const Payslips: CollectionConfig = {
  slug: 'payslips',
  labels: {
    singular: 'Payslip',
    plural: 'Payslips'
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['employee', 'company', 'payrollPeriod', 'netPay', 'status', 'createdAt'],
    listSearchableFields: ['employee', 'payrollPeriod'],
    description: 'Individual employee payslips',
    group: 'Finance',
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
      // TODO: Add employee access when employee users are implemented
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer' && user.company) {
        // Companies can only update status to mark as sent/viewed
        return {
          company: {
            equals: user.company?.id || user.company,
          },
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
      async ({ data, operation, originalDoc }) => {
        // Set sent/viewed timestamps when status changes
        if (operation === 'update' && originalDoc && data.status !== originalDoc.status) {
          if (data.status === 'sent' && !data.sentAt) {
            data.sentAt = new Date().toISOString()
          }

          if (['downloaded', 'viewed'].includes(data.status) && !data.viewedAt) {
            data.viewedAt = new Date().toISOString()
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, previousDoc }) => {
        // Log payslip status changes
        if (operation === 'create') {
          console.log(`Payslip generated for employee ${doc.employee} - ${doc.payrollPeriod}`)
        }

        if (operation === 'update' && previousDoc && doc.status !== previousDoc.status) {
          console.log(`Payslip ${doc.id} status changed from ${previousDoc.status} to ${doc.status}`)

          // When status changes to sent, could trigger email notification here
          if (doc.status === 'sent') {
            console.log(`Payslip ${doc.id} marked as sent - email notification should be triggered`)
            // TODO: Implement email sending logic
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
            if (data.employee && data.payrollPeriod) {
              const employeeName = typeof data.employee === 'object' ? data.employee.fullName : 'Employee'
              const date = new Date(data.payrollPeriod)
              const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              return `${employeeName} - ${monthYear}`
            }
            return 'Payslip'
          },
        ],
      },
    },
    {
      name: 'payrollRequest',
      type: 'relationship',
      relationTo: 'payroll-requests',
      required: true,
      admin: {
        description: 'Parent payroll request',
        readOnly: true,
      },
    },
    {
      name: 'employee',
      type: 'relationship',
      relationTo: 'employees',
      required: true,
      admin: {
        description: 'Employee for this payslip',
        readOnly: true,
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Company that owns this payslip',
        readOnly: true,
      },
    },
    {
      name: 'payrollPeriod',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
        description: 'Payroll period for this payslip',
        date: {
          displayFormat: 'MMMM yyyy',
        },
      },
    },
    {
      name: 'payrollDetails',
      type: 'group',
      admin: {
        description: 'Detailed payroll breakdown',
      },
      fields: [
        {
          name: 'basicSalary',
          type: 'number',
          required: true,
          admin: {
            readOnly: true,
            description: 'Basic salary amount',
            step: 0.01,
          },
        },
        {
          name: 'allowances',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total allowances',
            step: 0.01,
          },
        },
        {
          name: 'deductions',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total deductions',
            step: 0.01,
          },
        },
        {
          name: 'grossPay',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Gross pay (Basic + Allowances)',
            step: 0.01,
          },
        },
        {
          name: 'netPay',
          type: 'number',
          required: true,
          admin: {
            readOnly: true,
            description: 'Net pay (Gross - Deductions)',
            step: 0.01,
          },
        },
        {
          name: 'iban',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Employee IBAN for payment',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'generated',
      options: [
        {
          label: 'Generated',
          value: 'generated',
        },
        {
          label: 'Sent to Employee',
          value: 'sent',
        },
        {
          label: 'Downloaded by Employee',
          value: 'downloaded',
        },
        {
          label: 'Viewed by Employee',
          value: 'viewed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current status of the payslip',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['sent', 'downloaded', 'viewed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: 'Date when payslip was sent to employee',
      },
    },
    {
      name: 'viewedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['downloaded', 'viewed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: 'Date when employee viewed/downloaded payslip',
      },
    },
    {
      name: 'pdfGenerated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Whether PDF has been generated',
      },
    },
    {
      name: 'pdfUrl',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data?.pdfGenerated,
        description: 'URL/path to generated PDF',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this payslip',
        position: 'sidebar',
        rows: 3,
      },
    },
  ],
}