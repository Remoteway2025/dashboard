import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: {
      ar: "المستخدم",
      en: "Admin"
    },
    plural: {
      ar: "المستخدمين",
      en: "Admins"
    }
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
      label: {
        ar: "الدور",
        en: "Role"
      },
      required: true,
      options: [
        {
          label: {
            ar: "مدير عام",
            en: "Super Admin"
          },
          value: 'super admin',
        },
        {
          label: {
            ar: "صاحب عمل",
            en: "Employer"
          },
          value: 'employer',
        },
      ],
    },
    {
      name: 'company',
      type: 'relationship',
      label: {
        ar: "الشركة",
        en: "Company"
      },
      relationTo: 'companies',
      required: true,
      admin: {
        condition: (data) => data?.role === 'employer',
        description: {
          ar: "الشركة التي ينتمي إليها هذا المستخدم",
          en: "The company this user belongs to"
        },
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
      label: {
        ar: "الاسم الأول",
        en: "First Name"
      },
      localized: true,
      admin: {
        placeholder: {
          ar: "الاسم الأول",
          en: "First name"
        },
      },
    },
    {
      name: 'lastName',
      type: 'text',
      label: {
        ar: "الاسم الأخير",
        en: "Last Name"
      },
      localized: true,
      admin: {
        placeholder: {
          ar: "الاسم الأخير",
          en: "Last name"
        },
      },
    },
  ],
}
