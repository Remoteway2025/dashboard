import type { CollectionConfig } from 'payload'

export const ContactUs: CollectionConfig = {
  slug: 'contact-us',
  labels: {
    singular: "Contact inquiry",
    plural: "Contact Us"
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
      name: 'companyName',
      type: 'text',
      required: true,
      maxLength: 100,
      localized: true,
      admin: {
        placeholder: 'Enter company name',
        description: 'Name of the company (max 100 characters)',
      },
    },
    {
      name: 'contactPersonName',
      type: 'text',
      required: true,
      maxLength: 50,
      localized: true,
      admin: {
        placeholder: 'Enter contact person name',
        description: 'Full name of the contact person (max 50 characters)',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        placeholder: 'Enter email address',
        description: 'Valid email address for contact',
      },
    },
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
      maxLength: 100,
      localized: true,
      admin: {
        placeholder: 'Enter job title',
        description: 'Job title or position (max 100 characters)',
      },
    },
    {
      name: 'companySize',
      type: 'select',
      required: true,
      options: [
        {
          label: '1-10 employees',
          value: '1-10',
        },
        {
          label: '11-50 employees',
          value: '11-50',
        },
        {
          label: '51-200 employees',
          value: '51-200',
        },
        {
          label: '201-500 employees',
          value: '201-500',
        },
        {
          label: '501-1000 employees',
          value: '501-1000',
        },
        {
          label: '1000+ employees',
          value: '1000+',
        },
      ],
      admin: {
        description: 'Size of the company by employee count',
      },
    },
    {
      name: 'contactMethod',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Email',
          value: 'email',
        },
        {
          label: 'Phone Call',
          value: 'phone',
        },
        {
          label: 'Video Meeting',
          value: 'video',
        },
      ],
      admin: {
        description: 'Preferred method of contact',
      }
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: 'Optional message or additional information',
        description: 'Additional message or information (max 1000 characters)',
        rows: 4,
      }
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        {
          label: 'Open',
          value: 'open',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current status of this contact inquiry',
      },
    },
    {
      name: 'notes',
      type: 'array',
      admin: {
        description: 'Internal notes about this contact inquiry',
      },
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
          maxLength: 500,
          admin: {
            placeholder: 'Add a note about this inquiry',
            rows: 3,
          },
        },
        {
          name: 'addedBy',
          type: 'relationship',
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
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.status === 'closed',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
        description: 'Date when inquiry was closed',
      },
    },
    {
      name: 'closedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data) => data?.status === 'closed',
        description: 'Admin who closed this inquiry',
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