import type { CollectionConfig } from 'payload'

export const TicketMessages: CollectionConfig = {
  slug: 'ticket-messages',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['ticket', 'sender', 'messageType', 'createdAt'],
    hidden: true
  },
  timestamps: true,
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: 'Enter your message here',
      },
    },
    {
      name: 'messageType',
      type: 'select',
      required: true,
      defaultValue: 'reply',
      options: [
        {
          label: 'Reply',
          value: 'reply',
        },
        {
          label: 'Internal Note',
          value: 'internal_note',
        },
      ],
      admin: {
        description: 'Internal notes are only visible to admins',
      },
    },
    {
      name: 'attachments',
      type: 'array',
      maxRows: 3,
      admin: {
        description: 'Maximum 3 files, up to 10MB each',
      },
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
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer') {
        return {
          or: [
            {
              sender: {
                equals: user.id,
              },
            },
            {
              and: [
                {
                  messageType: {
                    not_equals: 'internal_note',
                  },
                },
                {
                  'ticket.company': {
                    equals: user.id,
                  },
                },
              ],
            },
          ],
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
      return user.role === 'super admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.messageType === 'reply') {
          // TODO: Send email notification to the other party
          // This would be implemented with your email service
          console.log('Email notification would be sent here')
        }
        return doc
      },
    ],
  },
}