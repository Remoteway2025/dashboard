import type { CollectionConfig } from 'payload'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['ticketId', 'company', 'subject', 'type', 'status', 'createdAt', 'updatedAt'],
    listSearchableFields: ['ticketId', 'subject', 'description'],
  },
  timestamps: true,
  versions:{
    drafts: false
  },  
  fields: [
    {
      name: 'ticketId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, operation }) => {
            if (operation === 'create' && !value) {
              const timestamp = Date.now()
              const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
              return `TKT-${timestamp}-${random}`
            }
            return value
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
        description: 'The company that created this ticket',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who created this ticket',
        readOnly: true,
      },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      maxLength: 150,
      localized: true,
      admin: {
        placeholder: 'Brief description of the issue',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Technical',
          value: 'technical',
        },
        {
          label: 'Payroll',
          value: 'payroll',
        },
        {
          label: 'Contract',
          value: 'contract',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Medium',
          value: 'medium',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
      access: {
        create: ({ req: { user } }) => {
          if (user?.role === 'employer') return false
          return true
        },
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
          label: 'In Progress',
          value: 'in_progress',
        },
        {
          label: 'Resolved',
          value: 'resolved',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
      admin: {
        position: 'sidebar',
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
      required: true,
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: 'Detailed description of the issue',
      },
    },
    {
      name: 'attachments',
      type: 'array',
      admin: {
        description: 'Maximum 3 files, up to 10MB each',
      },
      maxRows: 3,
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
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
  ],
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
      if (!user) return false
      return user.role === 'super admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // Auto-set createdBy and company for new tickets
        if (operation === 'create') {
          data.createdBy = req.user.id
          if (req.user.role === 'employer' && req.user.company) {
            data.company = req.user.company?.id || req.user.company
          }
        }
        
        // Track status changes
        if (operation === 'update' && originalDoc && data.status !== originalDoc.status) {
          if (!data.statusHistory) {
            data.statusHistory = originalDoc.statusHistory || []
          }
          data.statusHistory.push({
            status: data.status,
            changedBy: req.user.id,
            changedAt: new Date().toISOString(),
          })
        }
        return data
      },
    ],
  },
}