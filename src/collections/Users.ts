import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: "Admin",
    plural: "Admins"
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  timestamps: true,
  access: {
    read: ({ req: { user, query }, id }) => {

      if (user?.role === 'super admin') return true

      if (user?.role === 'employer' && (query.where?.id || id)) {
        return true
      }

      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true
      if (user.role === 'employer') {
        return {
          id: {
            equals: user.id,
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
  fields: [
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      options: [
        {
          label: 'Super Admin',
          value: 'super admin',
        },
        {
          label: 'Employer',
          value: 'employer',
        },
      ],
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        condition: (data) => data?.role === 'employer',
        description: 'The company this user belongs to',
      },
      validate: (value, { data }) => {
        if (data?.role === 'employer' && !value) {
          return 'Company is required for employer users.'
        }
        return true
      },
    },
    {
      name: 'firstName',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'First name',
      },
    },
    {
      name: 'lastName',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Last name',
      },
    },
  ],
}
