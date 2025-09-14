import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipientType', 'createdAt', 'sentBy'],
    listSearchableFields: ['title', 'message'],
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 120,
      localized: true,
      admin: {
        placeholder: 'Enter notification title',
        description: 'Short, clear notification title (max 120 characters)',
      },
    },
    {
      name: 'message',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'Detailed message content (max 500 characters)',
      },
      validate: (value) => {
        // For rich text, we need to check the text length
        const textContent = value.root?.children
          ?.map((node: any) => node.children?.map((child: any) => child.text).join(''))
          ?.join('') || ''
        
        if (textContent.length > 2000) {
          return 'Message must be 2000 characters or less.'
        }
        return true
      },
    },
    {
      name: 'recipientType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'All Companies',
          value: 'all',
        },
        {
          label: 'Specific Companies',
          value: 'specific',
        },
      ],
      admin: {
        description: 'Who should receive this notification',
      },
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
      admin: {
        condition: (data) => data?.recipientType !== 'all',
        description: 'Select specific companies to notify',
      },
      validate: (value, { data }) => {
        if (data?.recipientType !== 'all' && (!value || value.length === 0)) {
          return 'You must select at least one company when not sending to all companies.'
        }
        return true
      },
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Admin who sent this notification',
      },
      filterOptions: {
        role: {
          equals: 'super admin',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Sent',
          value: 'sent',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer' && user.company) {
        return {
          or: [
            {
              recipientType: {
                equals: 'all',
              },
            },
            {
              recipients: {
                contains: user.company?.id || user.company,
              },
            },
          ],
        }
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
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
      async ({ data, req, operation }) => {
        // Set sentBy to current user for new notifications
        if (operation === 'create') {
          data.sentBy = req.user.id
          data.status = 'draft'
        }
        
        // Set sentAt when status changes to sent
        if (data.status === 'sent' && !data.sentAt) {
          data.sentAt = new Date().toISOString()
        }
        
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // When notification is sent, create individual notification records
        if (operation === 'update' && doc.status === 'sent') {
          const payload = req.payload
          let recipientCompanies: any[] = []
          
          try {
            // Get the list of companies to send to
            if (doc.recipientType === 'all') {
              const allCompanies = await payload.find({
                collection: 'companies',
                where: {
                  status: {
                    equals: 'active',
                  },
                },
                limit: 1000, // Adjust as needed
              })
              recipientCompanies = allCompanies.docs
            } else if (doc.recipients && doc.recipients.length > 0) {
              // For specific companies
              for (const companyId of doc.recipients) {
                const company = await payload.findByID({
                  collection: 'companies',
                  id: typeof companyId === 'object' ? companyId.id : companyId,
                })
                if (company) {
                  recipientCompanies.push(company)
                }
              }
            }

            // Create notification recipient records
            let deliveredCount = 0
            const deliveryPromises = recipientCompanies.map(async (company) => {
              try {
                await payload.create({
                  collection: 'notification-recipients',
                  data: {
                    notification: doc.id,
                    company: company.id,
                    isRead: false,
                    deliveredAt: new Date().toISOString(),
                    deliveryStatus: 'delivered',
                  },
                })
                deliveredCount++
                return true
              } catch (error) {
                console.error(`Failed to deliver notification to company ${company.id}:`, error)
                return false
              }
            })

            await Promise.all(deliveryPromises)

            console.log(`Notification "${doc.title}" delivered to ${deliveredCount}/${recipientCompanies.length} companies`)

            // Update status if delivery failed
            if (deliveredCount === 0 && recipientCompanies.length > 0) {
              await payload.update({
                collection: 'notifications',
                id: doc.id,
                data: {
                  status: 'failed',
                },
              })
            }

          } catch (error) {
            console.error('Error in notification delivery:', error)
            
            // Mark notification as failed
            await payload.update({
              collection: 'notifications',
              id: doc.id,
              data: {
                status: 'failed',
              },
            })
          }
        }
        return doc
      },
    ],
  },
}