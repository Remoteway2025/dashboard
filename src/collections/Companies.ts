import type { CollectionConfig, AccessArgs, Where } from 'payload'

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
  labels: {
    singular: {
      ar: "شركة",
      en: "Company"
    },
    plural: {
      ar: "الشركات",
      en: "Companies"
    }
  },
  timestamps: true,
  trash: true,
  access: {
    read: ({ req, req: { user, query } }) => {

      if (user?.role === 'super admin') return true

      // Type assertion to tell TypeScript about the where structure
      const where = query.where as Where | undefined

      if (user?.role === 'employer' && where?.id) {
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
      label: {
        ar: "الاسم القانوني للشركة",
        en: "Company Legal Name"
      },
      required: true,
      maxLength: 200,
      localized: true,
      admin: {
        placeholder: {
          ar: "أدخل الاسم القانوني للشركة",
          en: "Enter company legal name"
        },
        description: {
          ar: "الاسم الرسمي المسجل للشركة",
          en: "Official registered company name"
        },
      },
    },
    {
      name: 'region',
      type: 'select',
      label: {
        ar: "المنطقة",
        en: "Region"
      },
      required: true,
      options: [
        { label: { ar: "الرياض", en: "Riyadh" }, value: 'riyadh' },
        { label: { ar: "جدة", en: "Jeddah" }, value: 'jeddah' },
        { label: { ar: "الدمام/الخبر", en: "Dammam/Khobar" }, value: 'dammam_khobar' },
        { label: { ar: "المدينة المنورة", en: "Medina" }, value: 'medina' },
        { label: { ar: "مكة المكرمة", en: "Makkah" }, value: 'makkah' },
        { label: { ar: "أبها", en: "Abha" }, value: 'abha' },
        { label: { ar: "حائل", en: "Hail" }, value: 'hail' },
        { label: { ar: "تبوك", en: "Tabuk" }, value: 'tabuk' },
        { label: { ar: "جازان", en: "Jazan" }, value: 'jazan' },
        { label: { ar: "أخرى (السعودية)", en: "Other (Saudi Arabia)" }, value: 'other_saudi' },
      ],
      admin: {
        placeholder: {
          ar: "اختر المنطقة/المدينة",
          en: "Select region/city"
        },
      },
    },
    {
      name: 'industry',
      type: 'select',
      label: {
        ar: "القطاع",
        en: "Industry"
      },
      required: true,
      options: [
        { label: { ar: "تقنية المعلومات / البرمجيات", en: "ICT / Software" }, value: 'ict_software' },
        { label: { ar: "الصناعة والتصنيع", en: "Industrial & Manufacturing" }, value: 'industrial_manufacturing' },
        { label: { ar: "التجزئة والتجارة الإلكترونية", en: "Retail & E-commerce" }, value: 'retail_ecommerce' },
        { label: { ar: "الخدمات المالية", en: "Financial Services" }, value: 'financial_services' },
        { label: { ar: "اللوجستيات والنقل", en: "Logistics & Transportation" }, value: 'logistics_transportation' },
        { label: { ar: "التعليم والتدريب", en: "Education & Training" }, value: 'education_training' },
        { label: { ar: "الرعاية الصحية", en: "Healthcare" }, value: 'healthcare' },
        { label: { ar: "البناء والعقارات", en: "Construction & Real Estate" }, value: 'construction_realestate' },
        { label: { ar: "الضيافة والسياحة", en: "Hospitality & Tourism" }, value: 'hospitality_tourism' },
        { label: { ar: "حكومي / شبه حكومي", en: "Government / Semi-Gov" }, value: 'government' },
        { label: { ar: "أخرى", en: "Other" }, value: 'other' },
      ],
      admin: {
        placeholder: {
          ar: "اختر القطاع",
          en: "Select industry"
        },
      },
    },
    {
      name: 'companySize',
      type: 'select',
      label: {
        ar: "حجم الشركة",
        en: "Company Size"
      },
      required: true,
      options: [
        { label: { ar: "0-10 موظفين", en: "0-10 employees" }, value: '0_10' },
        { label: { ar: "5-25 موظف", en: "5-25 employees" }, value: '5_25' },
        { label: { ar: "25-50 موظف", en: "25-50 employees" }, value: '25_50' },
        { label: { ar: "50-100 موظف", en: "50-100 employees" }, value: '50_100' },
        { label: { ar: "100-500 موظف", en: "100-500 employees" }, value: '100_500' },
        { label: { ar: "500-1000 موظف", en: "500-1000 employees" }, value: '500_1000' },
        { label: { ar: "أكثر من 1000 موظف", en: "1000+ employees" }, value: '1000_plus' },
      ],
      admin: {
        placeholder: {
          ar: "اختر حجم الشركة",
          en: "Select company size"
        },
      },
    },
    {
      name: 'primaryContactName',
      type: 'text',
      label: {
        ar: "اسم جهة الاتصال الأساسية",
        en: "Primary Contact Name"
      },
      required: true,
      maxLength: 100,
      localized: true,
      admin: {
        placeholder: {
          ar: "أدخل الاسم الكامل لجهة الاتصال الأساسية",
          en: "Enter primary contact full name"
        },
      },
    },
    {
      name: 'primaryContactEmail',
      type: 'email',
      label: {
        ar: "البريد الإلكتروني لجهة الاتصال",
        en: "Primary Contact Email"
      },
      required: true,
      admin: {
        placeholder: 'contact@company.com',
        description: {
          ar: "عنوان البريد الإلكتروني للعمل فقط (لا يقبل عناوين البريد الإلكتروني المجانية)",
          en: "Business email address only (no free email domains)"
        },
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
      label: {
        ar: "رقم هاتف جهة الاتصال",
        en: "Primary Contact Phone"
      },
      required: true,
      admin: {
        placeholder: '+966501234567',
        description: {
          ar: "رقم الهاتف (9-15 رقم، + اختياري في البداية)",
          en: "Phone number (9-15 digits, optional + at start)"
        },
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
      label: {
        ar: "الحالة",
        en: "Status"
      },
      required: true,
      defaultValue: 'active',
      options: [
        { label: { ar: "نشط", en: "Active" }, value: 'active' },
        { label: { ar: "غير نشط", en: "Inactive" }, value: 'inactive' },
        { label: { ar: "معلق", en: "Suspended" }, value: 'suspended' },
        { label: { ar: "قيد التحقق", en: "Pending Verification" }, value: 'pending' },
      ],
      admin: {
        position: 'sidebar',
        components: {
          Cell: "/components/client/statusCell"
        }
      },
    },
    {
      name: 'additionalInfo',
      type: 'group',
      label: {
        ar: "معلومات إضافية",
        en: "Additional Information"
      },
      admin: {
        description: {
          ar: "معلومات إضافية عن الشركة",
          en: "Additional company information"
        },
      },
      fields: [
        {
          name: 'website',
          type: 'text',
          label: {
            ar: "الموقع الإلكتروني",
            en: "Website"
          },
          admin: {
            placeholder: 'https://company.com',
            description: {
              ar: "رابط موقع الشركة",
              en: "Company website URL"
            },
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
          label: {
            ar: "الرقم الضريبي",
            en: "Tax Number"
          },
          admin: {
            placeholder: {
              ar: "رقم ضريبة القيمة المضافة (10-15 رقم)",
              en: "Tax/VAT number (10-15 digits)"
            },
            description: {
              ar: "رقم التسجيل الضريبي",
              en: "VAT registration number"
            },
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
          label: {
            ar: "رقم السجل التجاري",
            en: "Commercial Registration"
          },
          required: true,
          unique: true,
          admin: {
            placeholder: {
              ar: "رقم السجل التجاري (10-15 رقم)",
              en: "Commercial registration number (10-15 digits)"
            },
            description: {
              ar: "رقم السجل التجاري - معرف فريد",
              en: "CR Number - unique identifier"
            },
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
          label: {
            ar: "العنوان",
            en: "Address"
          },
          fields: [
            {
              name: 'street',
              type: 'text',
              label: {
                ar: "الشارع",
                en: "Street"
              },
              maxLength: 300,
              localized: true,
              admin: {
                placeholder: {
                  ar: "عنوان الشارع",
                  en: "Street address"
                },
                description: {
                  ar: "عنوان الشارع (حتى 300 حرف)",
                  en: "Street address (max 300 characters)"
                },
              },
            },
            {
              name: 'city',
              type: 'text',
              label: {
                ar: "المدينة",
                en: "City"
              },
              maxLength: 100,
              localized: true,
              admin: {
                placeholder: {
                  ar: "المدينة",
                  en: "City"
                },
                description: {
                  ar: "اسم المدينة",
                  en: "City name"
                },
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              label: {
                ar: "الرمز البريدي",
                en: "Postal Code"
              },
              admin: {
                placeholder: {
                  ar: "الرمز البريدي",
                  en: "Postal code"
                },
              },
            },
            {
              name: 'country',
              type: 'text',
              label: {
                ar: "الدولة",
                en: "Country"
              },
              defaultValue: 'Saudi Arabia',
              localized: true,
              admin: {
                placeholder: {
                  ar: "الدولة",
                  en: "Country"
                },
              },
            },
          ],
        },
      ],
    },

    {
      name: 'notes',
      type: 'textarea',
      label: {
        ar: "ملاحظات",
        en: "Notes"
      },
      localized: true,
      admin: {
        placeholder: {
          ar: "ملاحظات داخلية حول هذه الشركة (للمدير فقط)",
          en: "Internal notes about this company (admin only)"
        },
        position: 'sidebar',
      },
    },
  ],
}