import type { CollectionConfig, AccessArgs } from 'payload'

const freeEmailDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'yandex.com',
  'zoho.com',
]

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'companyLegalName',
    defaultColumns: ['companyLegalName', 'region', 'industry', 'primaryContactEmail', 'status', 'createdAt'],
  },
  timestamps: true,
  trash: true,
  access: {
    read: ({ req, req: { user, query } }) => {

      if (user?.role === 'super admin') return true

      if (user?.role === 'employer' && query.where?.id) {
        return { id: { equals: user.company?.id || user.company } }
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
      async ({ data, operation }) => {
        // Clean phone number before saving (remove spaces and dashes but keep +)
        if (data.primaryContactPhone) {
          data.primaryContactPhone = data.primaryContactPhone.replace(/[\s-]/g, '')
        }

        // Ensure email is lowercase
        if (data.primaryContactEmail) {
          data.primaryContactEmail = data.primaryContactEmail.toLowerCase()
        }

        // Trim company name
        if (data.companyLegalName) {
          data.companyLegalName = data.companyLegalName.trim()
        }

        // Trim contact name
        if (data.primaryContactName) {
          data.primaryContactName = data.primaryContactName.trim()
        }

        // Clean commercial registration number
        if (data.additionalInfo?.commercialRegistration) {
          data.additionalInfo.commercialRegistration = data.additionalInfo.commercialRegistration.replace(/[\s-]/g, '')
        }

        // Clean tax number
        if (data.additionalInfo?.taxNumber) {
          data.additionalInfo.taxNumber = data.additionalInfo.taxNumber.replace(/[\s-]/g, '')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'companyLegalName',
      type: 'text',
      required: true,
      maxLength: 200,
      localized: true,
      admin: {
        placeholder: 'Enter company legal name',
        description: 'Official registered company name',
      },
    },
    {
      name: 'region',
      type: 'select',
      required: true,
      options: [
        { label: 'Riyadh', value: 'riyadh' },
        { label: 'Jeddah', value: 'jeddah' },
        { label: 'Dammam/Khobar', value: 'dammam_khobar' },
        { label: 'Medina', value: 'medina' },
        { label: 'Makkah', value: 'makkah' },
        { label: 'Abha', value: 'abha' },
        { label: 'Hail', value: 'hail' },
        { label: 'Tabuk', value: 'tabuk' },
        { label: 'Jazan', value: 'jazan' },
        { label: 'Other (Saudi Arabia)', value: 'other_saudi' },
      ],
      admin: {
        placeholder: 'Select region/city',
      },
    },
    {
      name: 'industry',
      type: 'select',
      required: true,
      options: [
        { label: 'ICT / Software', value: 'ict_software' },
        { label: 'Industrial & Manufacturing', value: 'industrial_manufacturing' },
        { label: 'Retail & E-commerce', value: 'retail_ecommerce' },
        { label: 'Financial Services', value: 'financial_services' },
        { label: 'Logistics & Transportation', value: 'logistics_transportation' },
        { label: 'Education & Training', value: 'education_training' },
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Construction & Real Estate', value: 'construction_realestate' },
        { label: 'Hospitality & Tourism', value: 'hospitality_tourism' },
        { label: 'Government / Semi-Gov', value: 'government' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        placeholder: 'Select industry',
      },
    },
    {
      name: 'companySize',
      type: 'select',
      required: true,
      options: [
        { label: '0-10 employees', value: '0_10' },
        { label: '5-25 employees', value: '5_25' },
        { label: '25-50 employees', value: '25_50' },
        { label: '50-100 employees', value: '50_100' },
        { label: '100-500 employees', value: '100_500' },
        { label: '500-1000 employees', value: '500_1000' },
        { label: '1000+ employees', value: '1000_plus' },
      ],
      admin: {
        placeholder: 'Select company size',
      },
    },
    {
      name: 'primaryContactName',
      type: 'text',
      required: true,
      maxLength: 100,
      localized: true,
      admin: {
        placeholder: 'Enter primary contact full name',
      },
    },
    {
      name: 'primaryContactEmail',
      type: 'email',
      required: true,
      admin: {
        placeholder: 'contact@company.com',
        description: 'Business email address only (no free email domains)',
      },
      validate: (value) => {
        // Check for free email domains
        const domain = value.toLowerCase().split('@')[1]
        if (freeEmailDomains.includes(domain)) {
          return 'Please use a business email address (no free email domains).'
        }

        return true
      },
    },
    {
      name: 'primaryContactPhone',
      type: 'text',
      required: true,
      admin: {
        placeholder: '+966501234567',
        description: 'Phone number (9-15 digits, optional + at start)',
      },
      validate: (value) => {
        // Remove spaces and dashes for validation
        const cleanedPhone = value.replace(/[\s-]/g, '')

        // Check if it starts with + and then digits, or just digits
        const phoneRegex = /^\+?\d{9,15}$/
        if (!phoneRegex.test(cleanedPhone)) {
          return 'Please enter a valid phone number (9-15 digits).'
        }

        return true
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Pending Verification', value: 'pending' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'additionalInfo',
      type: 'group',
      admin: {
        description: 'Additional company information',
      },
      fields: [
        {
          name: 'website',
          type: 'text',
          admin: {
            placeholder: 'https://company.com',
            description: 'Company website URL',
          },
          validate: (value) => {
            if (value) {
              // Basic URL validation
              const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
              if (!urlRegex.test(value)) {
                return 'Please enter a valid URL (e.g., https://company.com)'
              }
            }
            return true
          },
        },
        {
          name: 'taxNumber',
          type: 'text',
          admin: {
            placeholder: 'Tax/VAT number (10-15 digits)',
            description: 'VAT registration number',
          },
          validate: (value) => {
            if (value) {
              // Remove any spaces or dashes
              const cleanedNumber = value.replace(/[\s-]/g, '')

              // Check if it's numeric and between 10-15 digits
              const taxRegex = /^\d{10,15}$/
              if (!taxRegex.test(cleanedNumber)) {
                return 'Tax/VAT number must be 10-15 digits only.'
              }
            }
            return true
          },
        },
        {
          name: 'commercialRegistration',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            placeholder: 'Commercial registration number (10-15 digits)',
            description: 'CR Number - unique identifier',
          },
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'Commercial registration number is required.'
            }

            // Remove any spaces or dashes
            const cleanedCR = value.replace(/[\s-]/g, '')

            // Check if it's numeric and between 10-15 digits
            const crRegex = /^\d{10,15}$/
            if (!crRegex.test(cleanedCR)) {
              return 'CR number must be 10-15 digits only.'
            }

            return true
          },
        },
        {
          name: 'address',
          type: 'group',
          fields: [
            {
              name: 'street',
              type: 'text',
              maxLength: 300,
              localized: true,
              admin: {
                placeholder: 'Street address',
                description: 'Street address (max 300 characters)',
              },
            },
            {
              name: 'city',
              type: 'text',
              maxLength: 100,
              localized: true,
              admin: {
                placeholder: 'City',
                description: 'City name',
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              admin: {
                placeholder: 'Postal code',
              },
            },
            {
              name: 'country',
              type: 'text',
              defaultValue: 'Saudi Arabia',
              localized: true,
              admin: {
                placeholder: 'Country',
              },
            },
          ],
        },
      ],
    },

    {
      name: 'notes',
      type: 'textarea',
      localized: true,
      admin: {
        placeholder: 'Internal notes about this company (admin only)',
        position: 'sidebar',
      },
    },
  ],
}