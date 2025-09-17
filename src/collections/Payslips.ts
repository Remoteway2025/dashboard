import type { CollectionConfig } from 'payload'

export const Payslips: CollectionConfig = {
  slug: 'payslips',
  labels: {
    singular: {
      ar: "كشف راتب",
      en: "Payslip"
    },
    plural: {
      ar: "كشوف الرواتب",
      en: "Payslips"
    }
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['employee', 'company', 'payrollPeriod', 'netPay', 'status', 'createdAt'],
    listSearchableFields: ['employee', 'payrollPeriod'],
    description: 'Individual employee payslips',
    group: {
      ar: "الماليه",
      en: "Finance"
    },
    components: {
      views: {
        list: { Component: "/components/client/payslipsSearch" }
      }
    }
  },
  timestamps: true,
  access: {
    read: ({ req: { user } }) => {

      if (user?.role === 'super admin') return false

      if (user?.role === 'employer' && user.company) {
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
      label: {
        ar: "العنوان",
        en: "Title"
      },
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
      label: {
        ar: "طلب الرواتب",
        en: "Payroll Request"
      },
      relationTo: 'payroll-requests',
      required: true,
      admin: {
        description: {
          ar: "طلب الرواتب الأساسي",
          en: "Parent payroll request"
        },
        readOnly: true,
      },
    },
    {
      name: 'employee',
      type: 'relationship',
      label: {
        ar: "الموظف",
        en: "Employee"
      },
      relationTo: 'employees',
      required: true,
      admin: {
        description: {
          ar: "الموظف لهذا كشف الراتب",
          en: "Employee for this payslip"
        },
        readOnly: true,
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
          ar: "الشركة المالكة لهذا كشف الراتب",
          en: "Company that owns this payslip"
        },
        readOnly: true,
      },
    },
    {
      name: 'payrollPeriod',
      type: 'date',
      label: {
        ar: "فترة الرواتب",
        en: "Payroll Period"
      },
      required: true,
      admin: {
        readOnly: true,
        description: {
          ar: "فترة الرواتب لهذا كشف الراتب",
          en: "Payroll period for this payslip"
        },
        date: {
          displayFormat: 'MMMM yyyy',
        },
      },
    },
    {
      name: 'payrollDetails',
      type: 'group',
      label: {
        ar: "تفاصيل الرواتب",
        en: "Payroll Details"
      },
      admin: {
        description: {
          ar: "تفصيل مفصل للرواتب",
          en: "Detailed payroll breakdown"
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
          admin: {
            readOnly: true,
            description: {
              ar: "مبلغ الراتب الأساسي",
              en: "Basic salary amount"
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
          admin: {
            readOnly: true,
            description: {
              ar: "إجمالي البدلات",
              en: "Total allowances"
            },
            step: 0.01,
          },
        },
        {
          name: 'baseDeductions',
          type: 'number',
          defaultValue: 0,
          label: {
            en: 'Base Deductions',
            ar: 'الاستقطاعات الأساسية'
          },
          admin: {
            readOnly: true,
            description: {
              en: 'Base deductions from employee profile',
              ar: 'الاستقطاعات الأساسية من ملف الموظف'
            },
            step: 0.01,
          },
        },
        {
          name: 'additionalDeductions',
          type: 'array',
          label: {
            en: 'Additional Deductions',
            ar: 'الاستقطاعات الإضافية'
          },
          admin: {
            readOnly: true,
            description: {
              en: 'Month-specific additional deductions',
              ar: 'الاستقطاعات الإضافية للشهر المحدد'
            },
          },
          fields: [
            {
              name: 'type',
              type: 'text',
              label: {
                en: 'Type',
                ar: 'النوع'
              },
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'description',
              type: 'text',
              label: {
                en: 'Description',
                ar: 'الوصف'
              },
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'amount',
              type: 'number',
              label: {
                en: 'Amount (SAR)',
                ar: 'المبلغ (ريال سعودي)'
              },
              admin: {
                readOnly: true,
                step: 0.01,
              },
            },
          ],
        },
        {
          name: 'totalDeductions',
          type: 'number',
          defaultValue: 0,
          label: {
            en: 'Total Deductions',
            ar: 'إجمالي الاستقطاعات'
          },
          admin: {
            readOnly: true,
            description: {
              en: 'Total of all deductions (base + additional)',
              ar: 'إجمالي جميع الاستقطاعات (أساسية + إضافية)'
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
            readOnly: true,
            description: {
              ar: "الراتب الإجمالي (الأساسي + البدلات)",
              en: "Gross pay (Basic + Allowances)"
            },
            step: 0.01,
          },
        },
        {
          name: 'netPay',
          type: 'number',
          required: true,
          label: {
            en: 'Net Pay',
            ar: 'صافي الراتب'
          },
          admin: {
            readOnly: true,
            description: {
              en: 'Net pay (Gross - Total Deductions)',
              ar: 'صافي الراتب (الإجمالي - إجمالي الاستقطاعات)'
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
          admin: {
            readOnly: true,
            description: {
              ar: "رقم آيبان الموظف للدفع",
              en: "Employee IBAN for payment"
            },
          },
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
      defaultValue: 'generated',
      options: [
        {
          label: {
            ar: "مولد",
            en: "Generated"
          },
          value: 'generated',
        },
        {
          label: {
            ar: "مرسل للموظف",
            en: "Sent to Employee"
          },
          value: 'sent',
        },
        {
          label: {
            ar: "تم تحميله بواسطة الموظف",
            en: "Downloaded by Employee"
          },
          value: 'downloaded',
        },
        {
          label: {
            ar: "تمت مشاهدته بواسطة الموظف",
            en: "Viewed by Employee"
          },
          value: 'viewed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "الحالة الحالية لكشف الراتب",
          en: "Current status of the payslip"
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      label: {
        ar: "تاريخ الإرسال",
        en: "Sent At"
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['sent', 'downloaded', 'viewed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: {
          ar: "تاريخ إرسال كشف الراتب للموظف",
          en: "Date when payslip was sent to employee"
        },
      },
    },
    {
      name: 'viewedAt',
      type: 'date',
      label: {
        ar: "تاريخ المشاهدة",
        en: "Viewed At"
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['downloaded', 'viewed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: {
          ar: "تاريخ مشاهدة/تحميل الموظف لكشف الراتب",
          en: "Date when employee viewed/downloaded payslip"
        },
      },
    },
    {
      name: 'pdfGenerated',
      type: 'checkbox',
      label: {
        ar: "تم إنشاء PDF",
        en: "PDF Generated"
      },
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: {
          ar: "هل تم إنشاء ملف PDF",
          en: "Whether PDF has been generated"
        },
      },
    },
    {
      name: 'pdfUrl',
      type: 'text',
      label: {
        ar: "رابط PDF",
        en: "PDF URL"
      },
      admin: {
        readOnly: true,
        condition: (data) => data?.pdfGenerated,
        description: {
          ar: "رابط/مسار ملف PDF المولد",
          en: "URL/path to generated PDF"
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: {
        ar: "ملاحظات",
        en: "Notes"
      },
      admin: {
        description: {
          ar: "ملاحظات داخلية حول هذا كشف الراتب",
          en: "Internal notes about this payslip"
        },
        placeholder: {
          ar: "أدخل ملاحظات",
          en: "Enter notes"
        },
        position: 'sidebar',
        rows: 3,
      },
    },
  ],
}