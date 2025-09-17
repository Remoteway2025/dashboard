import type { CollectionConfig } from 'payload'

export const TicketMessages: CollectionConfig = {
  slug: 'ticket-messages',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['sender', 'message', 'createdAt', 'ticket'],
    hidden: true
  },
  labels: {
    singular: {
      ar: "رسالة",
      en: "Message"
    },
    plural: {
      ar: "الرسائل",
      en: "Messages"
    }
  },
  timestamps: true,
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      label: {
        ar: "التذكرة",
        en: "Ticket"
      },
      relationTo: 'tickets',
      required: true,
      admin: {
        readOnly: true,
        description: {
          ar: "التذكرة المرتبطة بهذه الرسالة",
          en: "The ticket associated with this message"
        },
      },
    },
    {
      name: 'sender',
      type: 'relationship',
      label: {
        ar: "المرسل",
        en: "Sender"
      },
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        hidden: true,
        description: {
          ar: "المستخدم الذي أرسل هذه الرسالة",
          en: "The user who sent this message"
        },
      },
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'message',
      type: 'textarea',
      label: {
        ar: "الرسالة",
        en: "Message"
      },
      required: true,
      maxLength: 1000,
      localized: true,
      admin: {
        placeholder: {
          ar: "أدخل رسالتك هنا",
          en: "Enter your message here"
        },
        description: {
          ar: "محتوى الرسالة (حتى 1000 حرف)",
          en: "Message content (max 1000 characters)"
        },
      },
    },
    {
      name: 'messageType',
      type: 'select',
      label: {
        ar: "نوع الرسالة",
        en: "Message Type"
      },
      required: true,
      defaultValue: 'reply',
      options: [
        {
          label: {
            ar: "رد",
            en: "Reply"
          },
          value: 'reply',
        },
        {
          label: {
            ar: "ملاحظة داخلية",
            en: "Internal Note"
          },
          value: 'internal_note',
        },
      ],
      admin: {
        description: {
          ar: "الملاحظات الداخلية مرئية فقط للمديرين",
          en: "Internal notes are only visible to admins"
        },
      },
      access: {
        read: ({ req: { user } }) => user?.role !== 'employer',
      }
    },
    {
      name: 'attachments',
      type: 'array',
      label: {
        ar: "المرفقات",
        en: "Attachments"
      },
      maxRows: 3,
      admin: {
        description: {
          ar: "حد أقصى 3 ملفات، حتى 10 ميجابايت لكل ملف",
          en: "Maximum 3 files, up to 10MB each"
        },
      },
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
      name: 'isRead',
      type: 'checkbox',
      label: {
        ar: "مقروءة",
        en: "Is Read"
      },
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          ar: "هل تم قراءة هذه الرسالة",
          en: "Whether this message has been read"
        },
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {

      if (!user) return false

      if (user.role === 'super admin') return true

      if (user.role === 'employer') {
        return {
          sender: {
            equals: user.id,
          },
          messageType: {
            not_equals: 'internal_note',
          },
          'ticket.company': {
            equals: user.id,
          }
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
      return false
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Always set sender to current user
        if (operation === 'create' && req.user) {
          data.sender = req.user.id

          // Force messageType to 'reply' for employer users
          if (req.user.role === 'employer') {
            data.messageType = 'reply'
          }
        }

        return data
      },
    ],
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