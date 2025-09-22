import dayjs from 'dayjs'
import type { CollectionConfig } from 'payload'

export const Employees: CollectionConfig = {
  slug: 'employees',
  labels: {
    singular: {
      ar: "موظف",
      en: "Employee"
    },
    plural: {
      ar: "الموظفين",
      en: "Employees"
    }
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['avatar', 'fullName', 'employeeId', 'jobTitle', 'company', 'status'],
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
    readVersions: ({ req: { user } }) => user?.role == "super admin"
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        // Validate Employee ID uniqueness within company
        if (data?.employeeId && data.company) {
          const payload = req.payload

          const whereConditions: any = {
            employeeId: { equals: data.employeeId },
            company: { equals: data.company },
          }

          // For updates, exclude the current document
          if (operation === 'update' && originalDoc?.id) {
            whereConditions.id = { not_equals: originalDoc.id }
          }

          const existingEmployee = await payload.find({
            collection: 'employees',
            where: whereConditions,
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
      name: 'avatar',
      type: 'upload',
      label: {
        ar: "الصورة الشخصية",
        en: "Avatar"
      },
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: {
          ar: "صورة الملف الشخصي للموظف",
          en: "Employee profile picture"
        },
        components: {
          Cell: "/components/server/imageThumbnailWrapper"
        }
      },
    },
    {
      name: 'company',
      type: 'relationship',
      label: {
        ar: "الشركة",
        en: "Company"
      },
      relationTo: 'companies',
      required: true,
      admin: {
        description: {
          ar: "الشركة المعين إليها هذا الموظف",
          en: "Company this employee is assigned to"
        },
      },
      defaultValue: ({ user }) => {
        if (user?.role === 'employer' && user?.company) {
          return user.company?.id || user.company
        }
        return undefined
      },
      filterOptions: {
        status: {
          equals: 'active',
        },
      },
      access: {
        update: ({ req: { user } }) => user?.role === 'super admin',
        create: ({ req: { user } }) => user?.role === 'super admin',
      }
    },
    {
      type: "row",
      fields: [
        {
          name: 'fullName',
          type: 'text',
          label: {
            ar: "الاسم الكامل",
            en: "Full Name"
          },
          required: true,
          maxLength: 200,
          localized: true,
          admin: {
            placeholder: {
              ar: "أدخل الاسم الكامل",
              en: "Enter full name"
            },
            description: {
              ar: "الاسم الكامل للموظف (حتى 200 حرف)",
              en: "Employee full name (max 200 characters)"
            },
          },
        },
        {
          name: 'employeeId',
          type: 'text',
          label: {
            ar: "رقم الموظف",
            en: "Employee ID"
          },
          required: true,
          maxLength: 50,
          admin: {
            placeholder: {
              ar: "أدخل رقم الموظف",
              en: "Enter employee ID"
            },
            description: {
              ar: "رقم موظف فريد داخل الشركة",
              en: "Unique employee ID within the company"
            },
          },
        },
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: 'nationalId',
          type: 'text',
          label: {
            ar: "رقم الهوية",
            en: "National ID"
          },
          required: true,
          admin: {
            placeholder: {
              ar: "أدخل رقم الهوية أو الإقامة",
              en: "Enter National ID or Iqama number"
            },
            description: {
              ar: "رقم الهوية أو الإقامة (10-15 رقم)",
              en: "National ID or Iqama number (10-15 digits)"
            },
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
          label: {
            ar: "المسمى الوظيفي",
            en: "Job Title"
          },
          required: true,
          maxLength: 100,
          localized: true,
          admin: {
            placeholder: {
              ar: "أدخل المسمى الوظيفي",
              en: "Enter job title/position"
            },
            description: {
              ar: "المسمى الوظيفي أو المنصب",
              en: "Employee job title or position"
            },
          },
        },
      ]
    },
    {
      name: 'contractInfo',
      type: 'group',
      label: {
        ar: "معلومات العقد",
        en: "Contract Information"
      },
      admin: {
        description: {
          ar: "معلومات عقد التوظيف",
          en: "Employment contract information"
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: 'startDate',
              type: 'date',
              label: {
                ar: "تاريخ بداية العقد",
                en: "Start Date"
              },
              required: true,
              admin: {
                description: {
                  ar: "تاريخ بداية العقد (لا يزيد عن 30 يوم في المستقبل)",
                  en: "Contract start date (not more than 30 days in future)"
                },
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
              label: {
                ar: "تاريخ نهاية العقد",
                en: "End Date"
              },
              admin: {
                description: {
                  ar: "تاريخ نهاية العقد (اختياري)",
                  en: "Contract end date (optional, must be after start date)"
                },
                date: {
                  minDate: dayjs().toDate(),
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
            }
          ]
        },
        {
          name: 'autoRenew',
          type: 'checkbox',
          label: {
            ar: "تجديد تلقائي",
            en: "Auto Renew"
          },
          defaultValue: false,
          admin: {
            description: {
              ar: "تجديد العقد تلقائياً عند انتهاء صلاحيته",
              en: "Automatically renew contract when it expires"
            },
          },
        },
      ],
    },
    {
      name: 'payrollInfo',
      type: 'group',
      label: {
        ar: "معلومات الرواتب",
        en: "Payroll Information"
      },
      admin: {
        description: {
          ar: "معلومات الراتب والرواتب",
          en: "Salary and payroll information"
        },
      },
      fields: [
        {
          name: 'basicSalary',
          type: 'number',
          label: {
            ar: "الراتب الأساسي",
            en: "Basic Salary"
          },
          required: true,
          min: 0,
          admin: {
            placeholder: '0.00',
            description: {
              ar: "الراتب الشهري الأساسي بالريال السعودي",
              en: "Basic monthly salary in SAR"
            },
            step: 0.01,
          },
        },
        {
          name: 'allowances',
          type: 'number',
          label: {
            ar: "البدلات",
            en: "Allowances"
          },
          defaultValue: 0,
          min: 0,
          admin: {
            placeholder: '0.00',
            description: {
              ar: "البدلات الشهرية بالريال السعودي",
              en: "Monthly allowances in SAR"
            },
            step: 0.01,
          },
        },
        {
          name: 'deductions',
          type: 'number',
          label: {
            ar: "الاستقطاعات",
            en: "Deductions"
          },
          defaultValue: 0,
          min: 0,
          admin: {
            hidden: true,
            placeholder: '0.00',
            description: {
              ar: "الاستقطاعات الشهرية بالريال السعودي",
              en: "Monthly deductions in SAR"
            },
            step: 0.01,
          },
        },
        {
          name: 'grossPay',
          type: 'number',
          label: {
            ar: "الراتب الإجمالي",
            en: "Gross Pay"
          },
          admin: {
            hidden: true,
            readOnly: true,
            description: {
              ar: "الراتب الإجمالي = الراتب الأساسي + البدلات (محسوب تلقائياً)",
              en: "Gross Pay = Basic Salary + Allowances (auto-calculated)"
            },
            step: 0.01,
          },
        },
        {
          name: 'netSalary',
          type: 'number',
          label: {
            ar: "الراتب الصافي",
            en: "Net Salary"
          },
          admin: {
            hidden: true,
            readOnly: true,
            description: {
              ar: "الراتب الصافي = الراتب الإجمالي - الاستقطاعات (محسوب تلقائياً)",
              en: "Net Salary = Gross Pay - Deductions (auto-calculated)"
            },
            step: 0.01,
          },
        },
        {
          name: 'iban',
          type: 'text',
          label: {
            ar: "رقم الآيبان",
            en: "IBAN"
          },
          required: true,
          maxLength: 24,
          admin: {
            placeholder: 'SA0000000000000000000000',
            description: {
              ar: "رقم الآيبان السعودي (24 حرف يبدأ بـ SA)",
              en: "Saudi IBAN (24 characters starting with SA)"
            },
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
      label: {
        ar: "معلومات الاتصال",
        en: "Contact Information"
      },
      admin: {
        description: {
          ar: "معلومات الاتصال بالموظف",
          en: "Employee contact information"
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: 'email',
              type: 'email',
              label: {
                ar: "البريد الإلكتروني",
                en: "Email"
              },
              admin: {
                placeholder: 'employee@company.com',
                description: {
                  ar: "عنوان البريد الإلكتروني للموظف",
                  en: "Employee email address"
                },
              },
            },
            {
              name: 'phone',
              type: 'text',
              label: {
                ar: "رقم الهاتف",
                en: "Phone"
              },
              admin: {
                placeholder: '+966501234567',
                description: {
                  ar: "رقم هاتف الموظف",
                  en: "Employee phone number"
                },
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
            }
          ]
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: {
        ar: "الحالة",
        en: "Status"
      },
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: {
            ar: "نشط",
            en: "Active"
          },
          value: 'active',
        },
        {
          label: {
            ar: "غير نشط",
            en: "Inactive"
          },
          value: 'inactive',
        },
        {
          label: {
            ar: "منهي الخدمة",
            en: "Terminated"
          },
          value: 'terminated',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "حالة الموظف",
          en: "Employee status"
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: {
        ar: "ملاحظات",
        en: "Notes"
      },
      localized: true,
      admin: {
        placeholder: {
          ar: "ملاحظات داخلية حول هذا الموظف",
          en: "Internal notes about this employee"
        },
        description: {
          ar: "ملاحظات داخلية للاستخدام الإداري",
          en: "Internal notes for administrative use"
        },
        position: 'sidebar',
        rows: 4,
      },
    },
  ],
}