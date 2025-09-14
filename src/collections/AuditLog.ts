import type { CollectionConfig } from 'payload'

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: {
    singular: 'Audit Log Entry',
    plural: 'Audit Log'
  },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'user', 'resourceType', 'resourceId', 'createdAt'],
    listSearchableFields: ['action', 'resourceType', 'resourceId'],
    description: 'System audit trail for compliance and security',
    group: 'Finance',
    hidden: true
  },
  timestamps: true,
  fields: [
    {
      name: 'action',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'Action that was performed',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        description: 'User who performed the action',
      },
    },
    {
      name: 'resourceType',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Payroll Request',
          value: 'payroll-requests',
        },
        {
          label: 'Payslip',
          value: 'payslips',
        },
        {
          label: 'Employee',
          value: 'employees',
        },
        {
          label: 'Company',
          value: 'companies',
        },
        {
          label: 'User',
          value: 'users',
        },
        {
          label: 'Ticket',
          value: 'tickets',
        },
        {
          label: 'Notification',
          value: 'notifications',
        },
      ],
      admin: {
        readOnly: true,
        description: 'Type of resource that was affected',
      },
    },
    {
      name: 'resourceId',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'ID of the resource that was affected',
      },
    },
    {
      name: 'details',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Additional details about the action',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'IP address of the user',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'User agent string',
      },
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        {
          label: 'Info',
          value: 'info',
        },
        {
          label: 'Warning',
          value: 'warning',
        },
        {
          label: 'Critical',
          value: 'critical',
        },
      ],
      admin: {
        readOnly: true,
        description: 'Severity level of the action',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Authentication',
          value: 'auth',
        },
        {
          label: 'Payroll',
          value: 'payroll',
        },
        {
          label: 'Employee Management',
          value: 'employee',
        },
        {
          label: 'Company Management',
          value: 'company',
        },
        {
          label: 'System Configuration',
          value: 'system',
        },
        {
          label: 'Data Export',
          value: 'export',
        },
        {
          label: 'Financial Transaction',
          value: 'financial',
        },
      ],
      admin: {
        readOnly: true,
        description: 'Category of the action',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    create: () => {
      // Only system can create audit logs
      return true
    },
    update: () => {
      // Audit logs cannot be updated
      return false
    },
    delete: () => {
      // Audit logs cannot be deleted
      return false
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {

        if (operation !== 'create') {
          throw new Error('Audit logs cannot be modified or deleted.')
        }

        if (req.user && !data.user) {
          data.user = req.user.id
        }

        if (req.headers) {
          data.ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
          data.userAgent = req.headers.get('user-agent') || 'unknown'
        }

        return data
      },
    ],
  },
}

// Helper function to create audit log entries
export const createAuditLog = async (payload: any, {
  action,
  user,
  resourceType,
  resourceId,
  details,
  severity = 'info',
  category,
}: {
  action: string
  user: string
  resourceType: string
  resourceId: string
  details?: any
  severity?: 'info' | 'warning' | 'critical'
  category: 'auth' | 'payroll' | 'employee' | 'company' | 'system' | 'export' | 'financial'
}) => {
  try {
    await payload.create({
      collection: 'audit-log',
      data: {
        action,
        user,
        resourceType,
        resourceId,
        details,
        severity,
        category,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log entry:', error)
  }
}