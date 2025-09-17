import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipientType', 'createdAt'],
    listSearchableFields: ['title', 'message'],
  },
  labels: {
    singular: {
      ar: "إشعار",
      en: "Notification"
    },
    plural: {
      ar: "الإشعارات",
      en: "Notifications"
    }
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        ar: "العنوان",
        en: "Title"
      },
      required: true,
      maxLength: 120,
      localized: true,
      admin: {
        placeholder: {
          ar: "أدخل عنوان الإشعار",
          en: "Enter notification title"
        },
        description: {
          ar: "عنوان إشعار قصير وواضح (حتى 120 حرف)",
          en: "Short, clear notification title (max 120 characters)"
        },
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: {
        ar: "الرسالة",
        en: "Message"
      },
      required: true,
      localized: true,
      admin: {
        placeholder: {
          ar: "أدخل محتوى الرسالة",
          en: "Enter message content"
        },
        description: {
          ar: "محتوى الرسالة التفصيلي (حتى 2000 حرف)",
          en: "Detailed message content (max 2000 characters)"
        },
        rows: 4,
      },
      validate: (value) => {
        if (value && value.length > 2000) {
          return 'Message must be 2000 characters or less.'
        }
        return true
      },
    },
    {
      name: 'recipientType',
      type: 'select',
      label: {
        ar: "نوع المستلمين",
        en: "Recipient Type"
      },
      required: true,
      options: [
        {
          label: {
            ar: "جميع الشركات",
            en: "All Companies"
          },
          value: 'all',
        },
        {
          label: {
            ar: "شركات محددة",
            en: "Specific Companies"
          },
          value: 'specific',
        },
      ],
      admin: {
        description: {
          ar: "من يجب أن يتلقى هذا الإشعار",
          en: "Who should receive this notification"
        },
      },
    },
    {
      name: 'recipients',
      type: 'relationship',
      label: {
        ar: "المستلمون",
        en: "Recipients"
      },
      relationTo: 'companies',
      hasMany: true,
      admin: {
        condition: (data) => data?.recipientType !== 'all',
        description: {
          ar: "اختر الشركات المحددة لإرسال الإشعار إليها",
          en: "Select specific companies to notify"
        },
      },
      validate: (value, { data }) => {
        if (data?.recipientType !== 'all' && (!value || value.length === 0)) {
          return 'You must select at least one company when not sending to all companies.'
        }
        return true
      },
    },
    {
      name: 'status',
      type: 'select',
      label: {
        ar: "الحالة",
        en: "Status"
      },
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: {
            ar: "مسودة",
            en: "Draft"
          },
          value: 'draft',
        },
        {
          label: {
            ar: "مرسل",
            en: "Sent"
          },
          value: 'sent',
        },
        {
          label: {
            ar: "فشل",
            en: "Failed"
          },
          value: 'failed',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          ar: "حالة الإشعار",
          en: "Notification status"
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
        description: {
          ar: "التاريخ والوقت الذي تم فيه إرسال الإشعار",
          en: "Date and time when the notification was sent"
        },
        date: {
          displayFormat: 'dd/MM/yyyy HH:mm',
        },
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {

      if (user?.role === 'super admin') return true

      if (user?.role === 'employer' && user.company) {
        return {
          recipientType: {
            in: ["all", "specific"],
          },
          recipients: {
            contains: user.company?.id || user.company,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'super admin',
    update: ({ req: { user } }) => false,
    delete: ({ req: { user } }) => false,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Set sentBy to current user for new notifications
        if (operation === 'create') {
          data.sentBy = req.user?.id
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