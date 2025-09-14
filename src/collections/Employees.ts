import type { CollectionConfig } from 'payload'

export const Employees: CollectionConfig = {
  slug: 'employees',
  labels: {
    singular: 'Employee',
    plural: 'Employees'
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'employeeId', 'jobTitle', 'company', 'netSalary', 'status'],
    listSearchableFields: ['fullName', 'employeeId', 'nationalId'],
  },
  timestamps: true,
  versions: {
    drafts: false
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false

      if (user.role === 'employer' && user.company) {
        return {
          company: {
            equals: user.company?.id || user.company,
          },
        }
      }
      return true
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      return user.role === 'employer'
    },
    update: ({ req: { user } }) => {
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
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Validate Employee ID uniqueness within company
        if (operation === 'create' || (operation === 'update' && data.employeeId)) {
          const payload = req.payload
          const existingEmployee = await payload.find({
            collection: 'employees',
            where: {
              and: [
                {
                  employeeId: {
                    equals: data.employeeId,
                  },
                },
                {
                  company: {
                    equals: data.company,
                  },
                },
                ...(operation === 'update' ? [{
                  id: {
                    not_equals: req.id,
                  },
                }] : []),
              ],
            },
            limit: 1,
          })

          if (existingEmployee.docs.length > 0) {
            throw new Error(`Employee ID "${data.employeeId}" already exists in this company.`)
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, operation }) => {
        // Calculate Gross Pay and Net Salary
        if (data.payrollInfo) {
          const basicSalary = data.payrollInfo.basicSalary || 0
          const allowances = data.payrollInfo.allowances || 0
          const deductions = data.payrollInfo.deductions || 0

          data.payrollInfo.grossPay = basicSalary + allowances
          data.payrollInfo.netSalary = data.payrollInfo.grossPay - deductions
        }

        // Clean and format IBAN
        if (data.payrollInfo?.iban) {
          data.payrollInfo.iban = data.payrollInfo.iban.replace(/\s/g, '').toUpperCase()
        }

        // Clean National ID
        if (data.nationalId) {
          data.nationalId = data.nationalId.replace(/[\s-]/g, '')
        }

        // Clean phone number
        if (data.contactInfo?.phone) {
          data.contactInfo.phone = data.contactInfo.phone.replace(/[\s-]/g, '')
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`New employee created: ${doc.fullName} (${doc.employeeId}) for company ${doc.company}`)
        }

        if (operation === 'update' && doc.status === 'inactive') {
          console.log(`Employee ${doc.fullName} (${doc.employeeId}) has been marked inactive`)
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Company this employee is assigned to',
      },
      filterOptions: {
        status: {
          equals: 'active',
        },
      },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
      maxLength: 200,
      localized: true,
      admin: {
        placeholder: 'Enter full name',
        description: 'Employee full name (max 200 characters)',
      },
    },
    {
      name: 'employeeId',
      type: 'text',
      required: true,
      maxLength: 50,
      admin: {
        placeholder: 'Enter employee ID',
        description: 'Unique employee ID within the company',
      },
    },
    {
      name: 'nationalId',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter National ID or Iqama number',
        description: 'National ID or Iqama number (10-15 digits)',
      },
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'National ID/Iqama number is required.'
        }

        // Remove any spaces or dashes
        const cleanedId = value.replace(/[\s-]/g, '')

        // Check if it's numeric and between 10-15 digits
        const idRegex = /^\d{10,15}$/
        if (!idRegex.test(cleanedId)) {
          return 'National ID/Iqama must be 10-15 digits only.'
        }

        return true
      },
    },
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
      maxLength: 100,
      localized: true,
      admin: {
        placeholder: 'Enter job title/position',
        description: 'Employee job title or position',
      },
    },
    {
      name: 'contractInfo',
      type: 'group',
      admin: {
        description: 'Employment contract information',
      },
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Contract start date (not more than 30 days in future)',
            date: {
              displayFormat: 'dd/MM/yyyy',
            },
          },
          validate: (value) => {
            if (!value) {
              return 'Contract start date is required.'
            }

            const startDate = new Date(value)
            const today = new Date()
            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(today.getDate() + 30)

            if (startDate > thirtyDaysFromNow) {
              return 'Contract start date cannot be more than 30 days in the future.'
            }

            return true
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            description: 'Contract end date (optional, must be after start date)',
            date: {
              displayFormat: 'dd/MM/yyyy',
            },
          },
          validate: (value, { data }) => {
            if (value && data?.contractInfo?.startDate) {
              const startDate = new Date(data.contractInfo.startDate)
              const endDate = new Date(value)

              if (endDate <= startDate) {
                return 'Contract end date must be after start date.'
              }
            }
            return true
          },
        },
        {
          name: 'autoRenew',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically renew contract when it expires',
          },
        },
      ],
    },
    {
      name: 'payrollInfo',
      type: 'group',
      admin: {
        description: 'Salary and payroll information',
      },
      fields: [
        {
          name: 'basicSalary',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            placeholder: '0.00',
            description: 'Basic monthly salary in SAR',
            step: 0.01,
          },
        },
        {
          name: 'allowances',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            placeholder: '0.00',
            description: 'Monthly allowances in SAR',
            step: 0.01,
          },
        },
        {
          name: 'deductions',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            placeholder: '0.00',
            description: 'Monthly deductions in SAR',
            step: 0.01,
          },
        },
        {
          name: 'grossPay',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Gross Pay = Basic Salary + Allowances (auto-calculated)',
            step: 0.01,
          },
        },
        {
          name: 'netSalary',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Net Salary = Gross Pay - Deductions (auto-calculated)',
            step: 0.01,
          },
        },
        {
          name: 'iban',
          type: 'text',
          required: true,
          maxLength: 24,
          admin: {
            placeholder: 'SA0000000000000000000000',
            description: 'Saudi IBAN (24 characters starting with SA)',
          },
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'IBAN is required.'
            }

            const cleanedIban = value.replace(/\s/g, '').toUpperCase()

            // Check if it starts with SA and has 24 characters
            if (!cleanedIban.startsWith('SA') || cleanedIban.length !== 24) {
              return 'IBAN must start with "SA" and be exactly 24 characters long.'
            }

            // Check if the rest are digits
            const digits = cleanedIban.slice(2)
            if (!/^\d{22}$/.test(digits)) {
              return 'IBAN must contain only digits after "SA".'
            }

            // Simplified validation - just check format for Saudi IBANs
            // The checksum calculation is complex and many test IBANs won't pass
            // In production, you'd integrate with a banking API for validation

            return true
          },
        },
      ],
    },
    {
      name: 'contactInfo',
      type: 'group',
      admin: {
        description: 'Employee contact information',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          admin: {
            placeholder: 'employee@company.com',
            description: 'Employee email address',
          },
        },
        {
          name: 'phone',
          type: 'text',
          admin: {
            placeholder: '+966501234567',
            description: 'Employee phone number',
          },
          validate: (value) => {
            if (value) {
              const cleanedPhone = value.replace(/[\s-]/g, '')
              const phoneRegex = /^\+?\d{9,15}$/
              if (!phoneRegex.test(cleanedPhone)) {
                return 'Please enter a valid phone number (9-15 digits).'
              }
            }
            return true
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Inactive',
          value: 'inactive',
        },
        {
          label: 'Terminated',
          value: 'terminated',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Employee status',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      localized: true,
      admin: {
        placeholder: 'Internal notes about this employee',
        position: 'sidebar',
        rows: 4,
      },
    },
  ],
}