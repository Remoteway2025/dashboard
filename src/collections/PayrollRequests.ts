import type { CollectionConfig } from 'payload'

export const PayrollRequests: CollectionConfig = {
  slug: 'payroll-requests',
  labels: {
    singular: {
      ar: "مسيرة رواتب",
      en: "Payroll request"
    },
    plural: {
      ar: "مسيرات الرواتب",
      en: "Payroll Requests"
    }
  },
  admin: {
    defaultColumns: ['company', 'payrollPeriod', 'employeesCount', 'totalAmount', 'status', 'createdAt'],
    listSearchableFields: ['company', 'payrollPeriod'],
    group: {
      ar: "الماليه",
      en: "Finance"
    },
  },
  versions: {
    drafts: false,
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
    readVersions: ({ req: { user } }) => user?.role == "super admin"
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

        // Calculate deduction amounts and validate against basic salary
        if (data.employeeDeductions && data.employeeDeductions.length > 0) {
          const payload = req.payload

          for (const empDeduction of data.employeeDeductions) {
            if (empDeduction.employee && empDeduction.deductions) {
              // Fetch employee to get basic salary
              const employee = await payload.findByID({
                collection: 'employees',
                id: empDeduction.employee,
              })

              if (employee?.payrollInfo?.basicSalary) {
                const basicSalary = employee.payrollInfo.basicSalary

                // Calculate amounts for each deduction
                for (const deduction of empDeduction.deductions) {

                  if (deduction.type === 'gosi_percentage' && deduction.gosiPercentage !== undefined) {

                    deduction.calculatedAmount = Number((basicSalary * (deduction.gosiPercentage / 100)).toFixed(2))

                  } else if (deduction.type === 'fixed_amount' && deduction.fixedAmount !== undefined) {
                    deduction.calculatedAmount = deduction.fixedAmount
                  }
                }
              }
            }
          }
        }

        // Calculate totals for all company employees including additional deductions
        if (data.company && (operation === 'create' || (operation === 'update' && data.company !== originalDoc?.company))) {
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
          let totalAdditionalDeductions = 0
          let totalGross = 0
          let totalNet = 0

          // Create a map of additional deductions by employee ID
          const additionalDeductionsMap = new Map()
          if (data.employeeDeductions) {
            for (const empDeduction of data.employeeDeductions) {
              if (empDeduction.employee && empDeduction.deductions) {
                let employeeAdditionalDeductions = 0
                for (const deduction of empDeduction.deductions) {
                  if (deduction.calculatedAmount) {
                    employeeAdditionalDeductions += deduction.calculatedAmount
                  }
                }
                additionalDeductionsMap.set(empDeduction.employee, employeeAdditionalDeductions)
              }
            }
          }

          // Calculate totals from all employees
          for (const employee of employees.docs) {
            if (employee.payrollInfo) {
              const basic = employee.payrollInfo.basicSalary || 0
              const allowances = employee.payrollInfo.allowances || 0
              const baseDeductions = employee.payrollInfo.deductions || 0
              const additionalDeductions = additionalDeductionsMap.get(employee.id) || 0
              const gross = basic + allowances
              const net = gross - baseDeductions - additionalDeductions

              totalBasic += basic
              totalAllowances += allowances
              totalDeductions += baseDeductions
              totalAdditionalDeductions += additionalDeductions
              totalGross += gross
              totalNet += net
            }
          }

          data.payrollSummary = {
            totalBasicSalary: totalBasic,
            totalAllowances: totalAllowances,
            totalDeductions: totalDeductions + totalAdditionalDeductions,
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

              // Create a map of additional deductions by employee ID
              const additionalDeductionsMap = new Map()
              if (doc.employeeDeductions) {
                for (const empDeduction of doc.employeeDeductions) {
                  if (empDeduction.employee && empDeduction.deductions) {
                    additionalDeductionsMap.set(empDeduction.employee, empDeduction.deductions)
                  }
                }
              }

              // Create payslips for each employee
              for (const employee of employees.docs) {
                if (employee.payrollInfo) {
                  const basic = employee.payrollInfo.basicSalary || 0
                  const allowances = employee.payrollInfo.allowances || 0
                  const baseDeductions = employee.payrollInfo.deductions || 0
                  const additionalDeductions = additionalDeductionsMap.get(employee.id) || []

                  // Calculate total additional deductions amount
                  let totalAdditionalAmount = 0
                  for (const deduction of additionalDeductions) {
                    if (deduction.calculatedAmount) {
                      totalAdditionalAmount += deduction.calculatedAmount
                    }
                  }

                  const gross = basic + allowances
                  const net = gross - baseDeductions - totalAdditionalAmount

                  await payload.create({
                    collection: 'payslips',
                    data: {
                      payrollRequest: doc.id,
                      employee: employee.id,
                      company: doc.company,
                      payrollPeriod: doc.payrollPeriod,
                      payrollDetails: {
                        basicSalary: basic,
                        allowances: allowances,
                        baseDeductions: baseDeductions,
                        additionalDeductions: additionalDeductions.map(deduction => ({
                          type: deduction.type,
                          description: deduction.type === 'gosi_percentage'
                            ? `GOSI ${deduction.gosiPercentage}%`
                            : deduction.reason,
                          amount: deduction.calculatedAmount || 0,
                        })),
                        totalDeductions: baseDeductions + totalAdditionalAmount,
                        grossPay: gross,
                        netPay: net,
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
      type: "row",
      fields: [
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
              ar: "الشركة التي تطلب معالجة الرواتب",
              en: "Company requesting payroll processing"
            },
          },
          filterOptions: () => ({
            status: {
              equals: 'active'
            }
          }),
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
          label: {
            ar: "فترة الرواتب",
            en: "Payroll Period"
          },
          required: true,
          admin: {
            description: {
              ar: "شهر/سنة فترة الرواتب",
              en: "Payroll period month/year"
            },
            date: {
              displayFormat: 'MMMM yyyy',
              pickerAppearance: "monthOnly",
              minDate: new Date()
            },
          },
        }
      ]
    },
    {
      name: 'employeeDeductions',
      type: 'array',
      maxRows: 50,
      label: {
        en: 'Employee Specific Deductions',
        ar: 'استقطاعات خاصة بالموظفين'
      },
      admin: {
        description: {
          en: 'Additional deductions for specific employees this month (maximum 50 employees for optimal performance)',
          ar: 'استقطاعات إضافية للموظفين المحددين هذا الشهر (حد أقصى 50 موظف لضمان الأداء الأمثل)'
        },
        condition: (data) => data?.company, // Only show when company is selected
      },
      validate: async (value, { req }) => {
        if (!value || !Array.isArray(value)) return true

        const payload = req.payload

        for (const empDeduction of value) {
          if (empDeduction.employee && empDeduction.deductions) {
            try {
              // Fetch employee to get basic salary
              const employee = await payload.findByID({
                collection: 'employees',
                id: empDeduction.employee,
              })

              if (employee?.payrollInfo?.basicSalary) {
                const basicSalary = employee.payrollInfo.basicSalary

                for (const deduction of empDeduction.deductions) {
                  if (deduction.type === 'fixed_amount' && deduction.fixedAmount !== undefined) {
                    if (deduction.fixedAmount > basicSalary) {
                      return req.locale === 'ar'
                        ? `مبلغ الاستقطاع الثابت (${deduction.fixedAmount} ريال) لا يمكن أن يتجاوز الراتب الأساسي (${basicSalary} ريال) للموظف ${employee.fullName}`
                        : `Fixed deduction amount (${deduction.fixedAmount} SAR) cannot exceed basic salary (${basicSalary} SAR) for employee ${employee.fullName}`
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error validating employeeDeductions:', error)
            }
          }
        }

        return true
      },
      fields: [
        {
          name: 'employee',
          type: 'relationship',
          relationTo: 'employees',
          required: true,
          label: {
            en: 'Employee',
            ar: 'الموظف'
          },
          filterOptions: ({ data }) => {

            return {
              company: {
                equals: data.company,
              },
              status: {
                equals: "active"
              },
            }
          },
          admin: {

            description: {
              en: 'Select employee for deductions',
              ar: 'اختر الموظف للاستقطاعات'
            },
          },
        },
        {
          name: 'deductions',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 2,
          label: {
            en: 'Deductions',
            ar: 'الاستقطاعات'
          },
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              label: {
                en: 'Deduction Type',
                ar: 'نوع الاستقطاع'
              },
              options: [
                {
                  label: {
                    en: 'GOSI (Percentage)',
                    ar: 'التأمينات الاجتماعية (نسبة مئوية)'
                  },
                  value: 'gosi_percentage'
                },
                {
                  label: {
                    en: 'Fixed Amount',
                    ar: 'مبلغ ثابت'
                  },
                  value: 'fixed_amount'
                },
              ],
            },
            {
              name: 'gosiPercentage',
              type: 'number',
              label: {
                en: 'GOSI Percentage (%)',
                ar: 'نسبة التأمينات الاجتماعية (%)'
              },
              min: 0,
              max: 99,
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'gosi_percentage',
                description: {
                  en: 'Percentage of basic salary (0-99%)',
                  ar: 'نسبة من الراتب الأساسي (0-99%)'
                },
                step: 0.01,
              },
              validate: (value, { siblingData }) => {
                if (siblingData?.type === 'gosi_percentage') {
                  if (value === undefined || value === null) {
                    return 'GOSI percentage is required'
                  }
                  if (value < 0 || value > 99) {
                    return 'GOSI percentage must be between 0% and 99%'
                  }
                }
                return true
              },
            },
            {
              name: 'fixedAmount',
              type: 'number',
              label: {
                en: 'Amount (SAR)',
                ar: 'المبلغ (ريال سعودي)'
              },
              min: 0,
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'fixed_amount',
                description: {
                  en: 'Fixed deduction amount (cannot exceed basic salary)',
                  ar: 'مبلغ الاستقطاع الثابت (لا يمكن أن يتجاوز الراتب الأساسي)'
                },
                step: 0.01,
              },
              validate: (value, { siblingData }) => {
                if (siblingData?.type === 'fixed_amount') {
                  if (value === undefined || value === null || value <= 0) {
                    return 'Fixed amount is required and must be greater than 0'
                  }
                }
                return true
              },
            },
            {
              name: 'reason',
              type: 'text',
              label: {
                en: 'Reason',
                ar: 'السبب'
              },
              maxLength: 10,
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'fixed_amount',
                description: {
                  en: 'Reason for deduction (max 10 characters)',
                  ar: 'سبب الاستقطاع (حد أقصى 10 أحرف)'
                },
                placeholder: {
                  en: 'e.g., Loan, Advance',
                  ar: 'مثال: قرض، سلفة'
                },
              },
              validate: (value, { siblingData }) => {
                if (siblingData?.type === 'fixed_amount') {
                  if (!value || value.trim() === '') {
                    return 'Reason is required for fixed amount deductions'
                  }
                  if (value.length > 10) {
                    return 'Reason must not exceed 10 characters'
                  }
                }
                return true
              },
            },
            {
              name: 'calculatedAmount',
              type: 'number',
              label: {
                en: 'Calculated Amount (SAR)',
                ar: 'المبلغ المحسوب (ريال سعودي)'
              },
              admin: {
                readOnly: true,
                description: {
                  en: 'Auto-calculated deduction amount',
                  ar: 'مبلغ الاستقطاع المحسوب تلقائياً'
                },
                step: 0.01,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'payrollSummary',
      type: 'group',
      label: {
        ar: "ملخص الرواتب",
        en: "Payroll Summary"
      },
      admin: {
        description: {
          ar: "إجماليات وملخص الرواتب",
          en: "Payroll totals and summary"
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: 'totalBasicSalary',
              type: 'number',
              label: {
                ar: "إجمالي الراتب الأساسي",
                en: "Total Basic Salary"
              },
              admin: {
                readOnly: true,
                description: {
                  ar: "إجمالي الراتب الأساسي لجميع الموظفين",
                  en: "Total basic salary for all employees"
                },
                step: 0.01,
              },
            },
            {
              name: 'totalAllowances',
              type: 'number',
              label: {
                ar: "إجمالي البدلات",
                en: "Total Allowances"
              },
              admin: {
                readOnly: true,
                description: {
                  ar: "إجمالي البدلات لجميع الموظفين",
                  en: "Total allowances for all employees"
                },
                step: 0.01,
              },
            },
            {
              name: 'totalDeductions',
              type: 'number',
              label: {
                ar: "إجمالي الاستقطاعات",
                en: "Total Deductions"
              },
              admin: {
                readOnly: true,
                description: {
                  ar: "إجمالي الاستقطاعات لجميع الموظفين",
                  en: "Total deductions for all employees"
                },
                step: 0.01,
              },
            },
            {
              name: 'totalGrossPay',
              type: 'number',
              label: {
                ar: "إجمالي الراتب الإجمالي",
                en: "Total Gross Pay"
              },
              admin: {
                readOnly: true,
                description: {
                  ar: "إجمالي الراتب الإجمالي لجميع الموظفين",
                  en: "Total gross pay for all employees"
                },
                step: 0.01,
              },
            },
            {
              name: 'totalNetPay',
              type: 'number',
              label: {
                ar: "إجمالي الراتب الصافي",
                en: "Total Net Pay"
              },
              admin: {
                readOnly: true,
                description: {
                  ar: "إجمالي الراتب الصافي لجميع الموظفين",
                  en: "Total net pay for all employees"
                },
                step: 0.01,
              },
            },
          ]
        }
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
      defaultValue: 'new',
      options: [
        {
          label: {
            ar: "جديد",
            en: "New"
          },
          value: 'new',
        },
        {
          label: {
            ar: "قيد المراجعة",
            en: "Under Review"
          },
          value: 'under_review',
        },
        {
          label: {
            ar: "موافق عليه",
            en: "Approved"
          },
          value: 'approved',
        },
        {
          label: {
            ar: "مرفوض",
            en: "Rejected"
          },
          value: 'rejected',
        },
        {
          label: {
            ar: "تم إنشاء الفاتورة",
            en: "Invoice Generated"
          },
          value: 'invoice_generated',
        },
        {
          label: {
            ar: "تمت المعالجة",
            en: "Processed"
          },
          value: 'processed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "الحالة الحالية لطلب الرواتب",
          en: "Current status of the payroll request"
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
      access: {
        update: ({ req: { user } }) => user?.role == "employer" ? false : true,
        create: ({ req: { user } }) => {

          if (user?.role === 'employer') return false

          return true
        }
      }
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      label: {
        ar: "سبب الرفض",
        en: "Rejection Reason"
      },
      admin: {
        condition: (data) => data?.status === 'rejected',
        description: {
          ar: "سبب رفض طلب الرواتب",
          en: "Reason for rejecting this payroll request"
        },
        placeholder: {
          ar: "أدخل سبب الرفض",
          en: "Enter rejection reason"
        },
        position: "sidebar",
        rows: 3,
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      label: {
        ar: "مقدم الطلب",
        en: "Submitted By"
      },
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: {
          ar: "المستخدم الذي قدم طلب الرواتب",
          en: "User who submitted this payroll request"
        },
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      label: {
        ar: "تمت المراجعة بواسطة",
        en: "Reviewed By"
      },
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['approved', 'rejected', 'invoice_generated', 'processed'].includes(data?.status),
        description: {
          ar: "المدير الذي راجع طلب الرواتب",
          en: "Admin who reviewed this payroll request"
        },
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      label: {
        ar: "تاريخ المراجعة",
        en: "Reviewed At"
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => ['approved', 'rejected', 'invoice_generated', 'processed'].includes(data?.status),
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: {
          ar: "تاريخ مراجعة طلب الرواتب",
          en: "Date when payroll request was reviewed"
        },
      },
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      label: {
        ar: "رقم الفاتورة",
        en: "Invoice Number"
      },
      admin: {
        readOnly: true,
        condition: (data) => ['invoice_generated', 'processed'].includes(data?.status),
        description: {
          ar: "رقم الفاتورة المولد",
          en: "Generated invoice number"
        },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: 'totalAmount',
          type: 'number',
          label: {
            ar: "المبلغ الإجمالي",
            en: "Total Amount"
          },
          admin: {
            readOnly: true,
            description: {
              ar: "المبلغ الإجمالي لطلب الرواتب (نفس إجمالي الراتب الصافي)",
              en: "Total amount for this payroll request (same as total net pay)"
            },
            step: 0.01,
          },
        },
        {
          name: 'employeesCount',
          type: 'number',
          label: {
            ar: "عدد الموظفين",
            en: "Employees Count"
          },
          admin: {
            readOnly: true,
            description: {
              ar: "عدد الموظفين في هذه الرواتب (محسوب تلقائياً)",
              en: "Number of employees in this payroll (auto-calculated)"
            },
          },
        },
      ]
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
          ar: "ملاحظات داخلية حول طلب الرواتب",
          en: "Internal notes about this payroll request"
        },
        placeholder: {
          ar: "أدخل ملاحظات",
          en: "Enter notes"
        },
        position: 'sidebar',
        rows: 4,
      },
    },
  ]
}