import type { CollectionConfig } from 'payload'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  labels: {
    singular: {
      ar: "تذكرة",
      en: "Ticket"
    },
    plural: {
      ar: "التذاكر",
      en: "Tickets"
    }
  },
  admin: {
    useAsTitle: 'ticketId',
    defaultColumns: ['ticketId', 'company', 'subject', 'type', 'status', 'createdAt', 'updatedAt'],
    listSearchableFields: ['ticketId', 'subject', 'description'],
  },
  timestamps: true,
  versions: {
    drafts: false
  },
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
            equals: user.company?.id || user.company,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => {
      return false
    },
    readVersions: ({ req: { user } }) => user?.role == "super admin"
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Auto-set createdBy and company for new tickets
        if (operation === 'create') {

          if (req?.user?.role === 'employer' && req.user.company) {
            data.company = req.user.company?.id || req.user.company
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'ticketId',
      type: 'text',
      label: {
        ar: "رقم التذكرة",
        en: "Ticket ID"
      },
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: {
          ar: "رقم فريد مولد تلقائياً للتذكرة",
          en: "Auto-generated unique identifier for the ticket"
        },
      },
      hooks: {
        beforeValidate: [
          async ({ value, operation, req }) => {
            if (operation === 'create' && !value) {
              // Get current year and month
              const now = new Date()
              const year = now.getFullYear().toString().slice(-2) // Last 2 digits of year
              const month = (now.getMonth() + 1).toString().padStart(2, '0')

              // Generate a random 4-digit number
              const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

              // Format: TK-YYMM-XXXX (e.g., TK-2509-1234)
              return `TK-${year}${month}-${random}`
            }
            return value
          },
        ],
      },
    },
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
          defaultValue: ({ user }) => {
            // If user is an employer, default to their company
            if (user?.role === 'employer' && user?.company) {
              return typeof user.company === 'object' ? user.company.id : user.company
            }
            return undefined
          },
          admin: {
            description: {
              ar: "الشركة التي أنشأت هذه التذكرة",
              en: "The company that created this ticket"
            }
          },
          hooks: {
            beforeChange: [
              ({ value, req }) => {

                if (req.user?.role === 'employer' && req.user?.company) {
                  return req.user.company?.id || req.user.company
                }

                return value
              }
            ]
          },
          access: {
            update: ({ req: { user } }) => user?.role === 'super admin',
            create: ({ req: { user } }) => user?.role === 'super admin'
          }
        },
        {
          name: 'subject',
          type: 'text',
          label: {
            ar: "الموضوع",
            en: "Subject"
          },
          required: true,
          maxLength: 150,
          localized: true,
          admin: {
            placeholder: {
              ar: "وصف موجز للمشكلة",
              en: "Brief description of the issue"
            },
            description: {
              ar: "عنوان التذكرة (حتى 150 حرف)",
              en: "Ticket title (max 150 characters)"
            },
          },
        },
        {
          name: 'type',
          type: 'select',
          label: {
            ar: "النوع",
            en: "Type"
          },
          required: true,
          options: [
            {
              label: {
                ar: "تقني",
                en: "Technical"
              },
              value: 'technical',
            },
            {
              label: {
                ar: "رواتب",
                en: "Payroll"
              },
              value: 'payroll',
            },
            {
              label: {
                ar: "عقد",
                en: "Contract"
              },
              value: 'contract',
            },
            {
              label: {
                ar: "أخرى",
                en: "Other"
              },
              value: 'other',
            },
          ],
          admin: {
            description: {
              ar: "نوع التذكرة أو المشكلة",
              en: "Type of ticket or issue"
            },
          },
        },
        {
          name: 'priority',
          type: 'select',
          label: {
            ar: "الأولوية",
            en: "Priority"
          },
          options: [
            {
              label: {
                ar: "منخفضة",
                en: "Low"
              },
              value: 'low',
            },
            {
              label: {
                ar: "متوسطة",
                en: "Medium"
              },
              value: 'medium',
            },
            {
              label: {
                ar: "عالية",
                en: "High"
              },
              value: 'high',
            },
          ],
          admin: {
            description: {
              ar: "مستوى أولوية التذكرة",
              en: "Priority level of the ticket"
            },
          },
          access: {
            create: ({ req: { user } }) => {
              if (user?.role === 'employer') return false
              return true
            },
          },
        },
      ]
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
            ar: "جديدة",
            en: "New"
          },
          value: 'new',
        },
        {
          label: {
            ar: "قيد المعالجة",
            en: "In Progress"
          },
          value: 'in_progress',
        },
        {
          label: {
            ar: "محلولة",
            en: "Resolved"
          },
          value: 'resolved',
        },
        {
          label: {
            ar: "مغلقة",
            en: "Closed"
          },
          value: 'closed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "حالة التذكرة الحالية",
          en: "Current status of the ticket"
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
      access: {
        create: ({ req: { user } }) => {
          if (user?.role === 'employer') return false
          return true
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: {
        ar: "الوصف",
        en: "Description"
      },
      required: true,
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: {
          ar: "وصف تفصيلي للمشكلة",
          en: "Detailed description of the issue"
        },
        description: {
          ar: "وصف مفصل للمشكلة (حتى 1000 حرف)",
          en: "Detailed description of the issue (max 1000 characters)"
        },
        rows: 4
      },
    },
    {
      name: 'attachments',
      type: 'array',
      label: {
        ar: "المرفقات",
        en: "Attachments"
      },
      admin: {
        description: {
          ar: "حد أقصى 3 ملفات، حتى 10 ميجابايت لكل ملف",
          en: "Maximum 3 files, up to 10MB each"
        },
      },
      maxRows: 3,
      fields: [
        {
          name: 'file',
          type: 'upload',
          label: {
            ar: "الملف",
            en: "File"
          },
          relationTo: 'media',
          required: true,
          admin: {
            description: {
              ar: "الملفات المسموحة: PDF, Word, Excel, JPEG, PNG",
              en: "Allowed files: PDF, Word, Excel, JPEG, PNG"
            },
          },
          filterOptions: {
            mimeType: {
              in: [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
              ],
            },
          },
        },
      ],
    },
    {
      name: "messages",
      label: {
        ar: "سلسلة الرسائل",
        en: "Thread"
      },
      type: "join",
      collection: "ticket-messages",
      on: "ticket",
      admin: {
        description: {
          ar: "جميع الرسائل المرتبطة بهذه التذكرة",
          en: "All messages associated with this ticket"
        },
      },
    },
  ]
}