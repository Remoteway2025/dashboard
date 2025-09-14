import type { CollectionConfig } from 'payload'

export const NotificationRecipients: CollectionConfig = {
  slug: 'notification-recipients',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['notification', 'company', 'user', 'isRead', 'deliveredAt', 'readAt'],
    hidden: true, // Super admins can see delivery tracking
  },
  timestamps: true,
  fields: [
    {
      name: 'notification',
      type: 'relationship',
      relationTo: 'notifications',
      required: true,
      admin: {
        description: 'The notification that was sent',
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Company that received the notification',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Specific user who read the notification (optional)',
      },
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this notification has been read',
      },
    },
    {
      name: 'deliveredAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the notification was delivered',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        description: 'When the notification was read',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
    {
      name: 'deliveryStatus',
      type: 'select',
      required: true,
      defaultValue: 'delivered',
      options: [
        {
          label: 'Delivered',
          value: 'delivered',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Pending',
          value: 'pending',
        },
      ],
      admin: {
        description: 'Status of notification delivery',
      },
    },
    {
      name: 'readBy',
      type: 'array',
      admin: {
        description: 'List of users from this company who have read the notification',
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'readAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              displayFormat: 'dd/MM/yyyy HH:mm',
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
        // Company users can only see their own notification receipts
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
      // Only system can create notification receipts (through hooks)
      return user.role === 'super admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer' && user.company) {
        // Company users can only update read status for their notifications
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
        // When marking as read, set readAt timestamp
        if (operation === 'update' && data.isRead && !originalDoc.isRead) {
          data.readAt = new Date().toISOString()
          
          // Add the user to readBy array if not already there
          if (!data.readBy) {
            data.readBy = []
          }
          
          const existingRead = data.readBy.find((r: any) => r.user === req.user.id)
          if (!existingRead) {
            data.readBy.push({
              user: req.user.id,
              readAt: new Date().toISOString(),
            })
          }
        }
        
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Update notification stats when read status changes
        if (operation === 'update' && doc.isRead) {
          // Here you would update the parent notification's read count
          console.log(`Notification marked as read by company: ${doc.company}`)
        }
        return doc
      },
    ],
  },
}