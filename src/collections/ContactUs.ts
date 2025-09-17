import type { CollectionConfig } from 'payload'

export const ContactUs: CollectionConfig = {
  slug: 'contact-us',
  labels: {
    singular: {
      ar: "تواصل معنا",
      en: "Contact us"
    },
    plural: {
      ar: "طلبات التواصل",
      en: "Contact us Requests"
    }
  },
  admin: {
    useAsTitle: 'contactPersonName',
    defaultColumns: ['companyName', 'contactPersonName', 'jobTitle', 'status', 'createdAt'],
    listSearchableFields: ['companyName', 'contactPersonName', 'email'],
  },
  timestamps: true,
  versions: {
    drafts: false
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: 'companyName',
          type: 'text',
          label: {
            ar: "اسم الشركة",
            en: "Company Name"
          },
          required: true,
          maxLength: 100,
          localized: true,
          admin: {
            placeholder: {
              ar: "أدخل اسم الشركة",
              en: "Enter company name"
            },
            description: {
              ar: "اسم الشركة (حتى 100 حرف)",
              en: "Name of the company (max 100 characters)"
            },
          },
        },
        {
          name: 'contactPersonName',
          type: 'text',
          label: {
            ar: "اسم الشخص المسؤول",
            en: "Contact Person Name"
          },
          required: true,
          maxLength: 50,
          localized: true,
          admin: {
            placeholder: {
              ar: "أدخل اسم الشخص المسؤول",
              en: "Enter contact person name"
            },
            description: {
              ar: "الاسم الكامل للشخص المسؤول (حتى 50 حرف)",
              en: "Full name of the contact person (max 50 characters)"
            },
          },
        },
      ]
    },
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
          required: true,
          admin: {
            placeholder: {
              ar: "أدخل عنوان البريد الإلكتروني",
              en: "Enter email address"
            },
            description: {
              ar: "عنوان بريد إلكتروني صالح للتواصل",
              en: "Valid email address for contact"
            },
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
              en: "Enter job title"
            },
            description: {
              ar: "المسمى الوظيفي أو المنصب (حتى 100 حرف)",
              en: "Job title or position (max 100 characters)"
            },
          },
        },
      ]
    },
    {
      type: "row",
      fields: [
        {
          name: 'companySize',
          type: 'select',
          label: {
            ar: "حجم الشركة",
            en: "Company Size"
          },
          required: true,
          options: [
            {
              label: { ar: "1-10 موظفين", en: "1-10 employees" },
              value: '1-10',
            },
            {
              label: { ar: "11-50 موظف", en: "11-50 employees" },
              value: '11-50',
            },
            {
              label: { ar: "51-200 موظف", en: "51-200 employees" },
              value: '51-200',
            },
            {
              label: { ar: "201-500 موظف", en: "201-500 employees" },
              value: '201-500',
            },
            {
              label: { ar: "501-1000 موظف", en: "501-1000 employees" },
              value: '501-1000',
            },
            {
              label: { ar: "أكثر من 1000 موظف", en: "1000+ employees" },
              value: '1000+',
            },
          ]
        },
        {
          name: 'contactMethod',
          type: 'select',
          label: {
            ar: "طريقة التواصل",
            en: "Contact Method"
          },
          required: true,
          options: [
            {
              label: { ar: "البريد الإلكتروني", en: "Email" },
              value: 'email',
            },
            {
              label: { ar: "مكالمة هاتفية", en: "Phone Call" },
              value: 'phone',
            },
            {
              label: { ar: "اجتماع فيديو", en: "Video Meeting" },
              value: 'video',
            },
          ]
        },
      ]
    },
    {
      name: 'message',
      type: 'textarea',
      label: {
        ar: "الرسالة",
        en: "Message"
      },
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: {
          ar: "رسالة اختيارية أو معلومات إضافية",
          en: "Optional message or additional information"
        },
        description: {
          ar: "رسالة إضافية أو معلومات (حتى 1000 حرف)",
          en: "Additional message or information (max 1000 characters)"
        },
        rows: 4,
      }
    },
    {
      name: 'status',
      type: 'select',
      label: {
        ar: "الحالة",
        en: "Status"
      },
      required: true,
      defaultValue: 'open',
      options: [
        {
          label: { ar: "مفتوح", en: "Open" },
          value: 'open',
        },
        {
          label: { ar: "مغلق", en: "Closed" },
          value: 'closed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "الحالة الحالية لهذا الاستفسار",
          en: "Current status of this contact inquiry"
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
    },
    {
      name: 'notes',
      type: 'array',
      label: {
        ar: "الملاحظات",
        en: "Notes"
      },
      admin: {
        description: {
          ar: "ملاحظات داخلية حول هذا الاستفسار",
          en: "Internal notes about this contact inquiry"
        },
        position: "sidebar"
      },
      fields: [
        {
          name: 'note',
          type: 'textarea',
          label: {
            ar: "الملاحظة",
            en: "Note"
          },
          required: true,
          maxLength: 500,
          admin: {
            placeholder: {
              ar: "أضف ملاحظة حول هذا الاستفسار",
              en: "Add a note about this inquiry"
            },
            rows: 3,
          },
        },
        {
          name: 'addedBy',
          type: 'relationship',
          label: {
            ar: "أضيفت بواسطة",
            en: "Added By"
          },
          relationTo: 'users',
          required: true,
          admin: {
            readOnly: true,
          },
          filterOptions: {
            role: {
              equals: 'super admin',
            },
          },
        },
        {
          name: 'addedAt',
          type: 'date',
          label: {
            ar: "تاريخ الإضافة",
            en: "Added At"
          },
          required: true,
          admin: {
            readOnly: true,
            date: {
              displayFormat: 'dd/MM/yyyy HH:mm',
            },
          },
        },
      ],
    },
    {
      name: 'closedAt',
      type: 'date',
      label: {
        ar: "تاريخ الإغلاق",
        en: "Closed At"
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.status === 'closed',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: {
          ar: "تاريخ إغلاق الاستفسار",
          en: "Date when inquiry was closed"
        },
      },
    },
    {
      name: 'closedBy',
      type: 'relationship',
      label: {
        ar: "تم الإغلاق بواسطة",
        en: "Closed By"
      },
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.status === 'closed',
        description: {
          ar: "المدير الذي أغلق هذا الاستفسار",
          en: "Admin who closed this inquiry"
        },
      },
      filterOptions: {
        role: {
          equals: 'super admin',
        },
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    create: () => {
      // Allow public creation from landing page form
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Set timestamps and user info for notes
        if (data.notes && Array.isArray(data.notes)) {
          data.notes = data.notes.map((note: any) => {
            if (!note.addedBy && req.user) {
              note.addedBy = req.user.id
            }
            if (!note.addedAt) {
              note.addedAt = new Date().toISOString()
            }
            return note
          })
        }

        // Handle status changes
        if (operation === 'update' && data.status !== originalDoc.status) {
          if (data.status === 'closed' && originalDoc.status === 'open') {
            data.closedAt = new Date().toISOString()
            if (req.user) {
              data.closedBy = req.user.id
            }
          } else if (data.status === 'open' && originalDoc.status === 'closed') {
            // Clear closed fields when reopening
            data.closedAt = null
            data.closedBy = null
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log(`New contact inquiry received from ${doc.companyName} (${doc.contactPersonName})`)
        }

        if (operation === 'update' && doc.status === 'closed') {
          console.log(`Contact inquiry from ${doc.companyName} has been closed`)
        }

        return doc
      },
    ],
  },
}