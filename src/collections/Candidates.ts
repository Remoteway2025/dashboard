import type { CollectionConfig } from 'payload'

// Helper function for field access control
const adminOnlyUpdateAccess = {
  update: ({ req: { user } }) => {
    if (user?.role === 'super admin') return true
    return false // Employers cannot update this field
  },
}

// Common tech skills list
const techSkills = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'Ruby', 'PHP',
  'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express.js', 'Django', 'Flask',
  'Spring Boot', '.NET', 'Laravel', 'Rails', 'FastAPI',
  'Android', 'iOS', 'React Native', 'Flutter', 'Swift', 'Kotlin',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Oracle',
  'Git', 'REST API', 'GraphQL', 'Microservices', 'DevOps', 'Agile', 'Scrum',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap',
  'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
  'Blockchain', 'Web3', 'Solidity', 'Smart Contracts'
]

// Countries list (focusing on common ones, expand as needed)
const countries = [
  { en: 'Saudi Arabia', ar: 'السعودية' },
  { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
  { en: 'Kuwait', ar: 'الكويت' },
  { en: 'Qatar', ar: 'قطر' },
  { en: 'Bahrain', ar: 'البحرين' },
  { en: 'Oman', ar: 'عمان' },
  { en: 'Egypt', ar: 'مصر' },
  { en: 'Jordan', ar: 'الأردن' },
  { en: 'Lebanon', ar: 'لبنان' },
  { en: 'Syria', ar: 'سوريا' },
  { en: 'Iraq', ar: 'العراق' },
  { en: 'Yemen', ar: 'اليمن' },
  { en: 'India', ar: 'الهند' },
  { en: 'Pakistan', ar: 'باكستان' },
  { en: 'Bangladesh', ar: 'بنغلاديش' },
  { en: 'Philippines', ar: 'الفلبين' },
  { en: 'Indonesia', ar: 'إندونيسيا' },
  { en: 'Malaysia', ar: 'ماليزيا' },
  { en: 'United States', ar: 'الولايات المتحدة' },
  { en: 'United Kingdom', ar: 'المملكة المتحدة' },
  { en: 'Canada', ar: 'كندا' },
  { en: 'Australia', ar: 'أستراليا' },
  { en: 'Germany', ar: 'ألمانيا' },
  { en: 'France', ar: 'فرنسا' },
  { en: 'Italy', ar: 'إيطاليا' },
  { en: 'Spain', ar: 'إسبانيا' },
  { en: 'Netherlands', ar: 'هولندا' },
  { en: 'Other', ar: 'أخرى' }
]

// Nationalities (same as countries but as adjectives)
const nationalities = [
  { en: 'Saudi', ar: 'سعودي' },
  { en: 'Emirati', ar: 'إماراتي' },
  { en: 'Kuwaiti', ar: 'كويتي' },
  { en: 'Qatari', ar: 'قطري' },
  { en: 'Bahraini', ar: 'بحريني' },
  { en: 'Omani', ar: 'عماني' },
  { en: 'Egyptian', ar: 'مصري' },
  { en: 'Jordanian', ar: 'أردني' },
  { en: 'Lebanese', ar: 'لبناني' },
  { en: 'Syrian', ar: 'سوري' },
  { en: 'Iraqi', ar: 'عراقي' },
  { en: 'Yemeni', ar: 'يمني' },
  { en: 'Indian', ar: 'هندي' },
  { en: 'Pakistani', ar: 'باكستاني' },
  { en: 'Bangladeshi', ar: 'بنغلاديشي' },
  { en: 'Filipino', ar: 'فلبيني' },
  { en: 'Indonesian', ar: 'إندونيسي' },
  { en: 'Malaysian', ar: 'ماليزي' },
  { en: 'American', ar: 'أمريكي' },
  { en: 'British', ar: 'بريطاني' },
  { en: 'Canadian', ar: 'كندي' },
  { en: 'Australian', ar: 'أسترالي' },
  { en: 'German', ar: 'ألماني' },
  { en: 'French', ar: 'فرنسي' },
  { en: 'Italian', ar: 'إيطالي' },
  { en: 'Spanish', ar: 'إسباني' },
  { en: 'Dutch', ar: 'هولندي' },
  { en: 'Other', ar: 'أخرى' }
]

export const Candidates: CollectionConfig = {
  slug: 'candidates',
  labels: {
    singular: {
      ar: "مرشح",
      en: "Candidate"
    },
    plural: {
      ar: "المرشحين",
      en: 'Candidates'
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['avatar', 'name', 'jobTitle', 'status', 'company', 'createdAt'],
    listSearchableFields: ['name', 'jobTitle', 'skills'],
    components: {
      edit: {
        beforeDocumentControls: ["/components/client/CandidateActionButtons"]
      }
    }
  },
  timestamps: true,
  trash: true,
  versions: {
    drafts: false,
  },
  fields: [
    {
      name: 'avatar',
      label: {
        ar: "الصورة الشخصية",
        en: "Avatar"
      },
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
      access: adminOnlyUpdateAccess,
    },
    {
      type: "row",
      fields: [
        {
          name: 'name',
          label: {
            ar: "الإسم",
            en: "Name"
          },
          type: 'text',
          required: true,
          localized: true,
          admin: {
            placeholder: { en: 'Full name', ar: 'الإسم كامل' },
          },
          access: adminOnlyUpdateAccess,
        },
        {
          name: 'jobTitle',
          type: 'text',
          label: {
            ar: "المسمى الوظيفي",
            en: "Job Title"
          },
          required: true,
          localized: true,
          admin: {
            placeholder: 'e.g., Senior Software Engineer',
            description: { en: 'Desired or current job title', ar: "المسمى الوظيفي الحالي" },
          },
          access: adminOnlyUpdateAccess,
        },
      ]
    },
    {
      name: 'employmentPreferences',
      type: 'radio',
      label: {
        en: 'Employment Preferences',
        ar: 'تفضيلات التوظيف'
      },
      required: true,
      defaultValue: 'fullTime',
      options: [
        {
          label: {
            en: 'Full-time',
            ar: 'دوام كامل'
          },
          value: 'fullTime',
        },
        {
          label: {
            en: 'Part-time',
            ar: 'دوام جزئي'
          },
          value: 'partTime',
        },
        {
          label: {
            en: 'Both (Flexible)',
            ar: 'كلاهما (مرن)'
          },
          value: 'both',
        },
      ],
      admin: {
        layout: 'horizontal',
        description: {
          en: 'Select preferred employment type',
          ar: 'اختر نوع التوظيف المفضل'
        },
      },
      access: adminOnlyUpdateAccess,
    },
    {
      name: 'basicSalary',
      type: 'number',
      label: {
        en: 'Basic Salary',
        ar: 'الراتب الأساسي'
      },
      required: true,
      min: 0,
      max: 40000,
      admin: {
        placeholder: {
          en: 'Expected salary in SAR',
          ar: 'الراتب المتوقع بالريال السعودي'
        },
        description: {
          en: 'Basic salary expectation (SAR)',
          ar: 'توقعات الراتب الأساسي (ريال سعودي)'
        },
        step: 100,
      },
      access: adminOnlyUpdateAccess,
    },
    {
      name: 'experiences',
      type: 'array',
      label: {
        en: 'Work Experience',
        ar: 'الخبرة العملية'
      },
      localized: true,
      admin: {
        description: {
          en: 'Work experience history',
          ar: 'سجل الخبرة العملية'
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: {
            en: 'Job Title',
            ar: 'المسمى الوظيفي'
          },
          required: true,
          localized: true,
          admin: {
            placeholder: {
              en: 'Job title',
              ar: 'المسمى الوظيفي'
            },
          },
        },
        {
          name: 'company',
          type: 'text',
          label: {
            en: 'Company',
            ar: 'الشركة'
          },
          required: true,
          localized: true,
          admin: {
            placeholder: {
              en: 'Company name',
              ar: 'اسم الشركة'
            },
          },
        },
        {
          name: 'employmentType',
          type: 'select',
          label: {
            en: 'Employment Type',
            ar: 'نوع التوظيف'
          },
          required: true,
          options: [
            { label: { en: 'Full-time', ar: 'دوام كامل' }, value: 'full_time' },
            { label: { en: 'Part-time', ar: 'دوام جزئي' }, value: 'part_time' },
            { label: { en: 'Contract', ar: 'عقد' }, value: 'contract' },
            { label: { en: 'Freelance', ar: 'عمل حر' }, value: 'freelance' },
            { label: { en: 'Internship', ar: 'تدريب' }, value: 'internship' },
          ],
        },
        {
          name: 'startDate',
          type: 'date',
          label: {
            en: 'Start Date',
            ar: 'تاريخ البدء'
          },
          required: true,
          admin: {
            date: {
              displayFormat: 'MMM yyyy',
              pickerFormat: 'MMM yyyy',
            },
          },
        },
        {
          name: 'currentlyWorking',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: "I'm currently working here",
            ar: 'أعمل حالياً هنا'
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: {
            en: 'End Date',
            ar: 'تاريخ الانتهاء'
          },
          admin: {
            condition: (data, siblingData) => !siblingData?.currentlyWorking,
            date: {
              displayFormat: 'MMM yyyy',
              pickerFormat: 'MMM yyyy',
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: {
            en: 'Description',
            ar: 'الوصف'
          },
          localized: true,
          admin: {
            placeholder: {
              en: 'Describe your responsibilities and achievements',
              ar: 'اوصف مسؤولياتك وإنجازاتك'
            },
            rows: 4,
          },
        },
      ],
      access: adminOnlyUpdateAccess,
    },
    {
      name: 'skills',
      type: 'select',
      label: {
        en: 'Skills',
        ar: 'المهارات'
      },
      hasMany: true,
      options: techSkills.map(skill => ({
        label: skill,
        value: skill.toLowerCase().replace(/[\s.#+]/g, '_'),
      })),
      admin: {
        description: {
          en: 'Technical skills and technologies',
          ar: 'المهارات التقنية والتكنولوجيا'
        },
        isClearable: true,
      },
      access: adminOnlyUpdateAccess,
    },
    {
      name: 'languages',
      type: 'array',
      label: {
        en: 'Languages',
        ar: 'اللغات'
      },
      admin: {
        description: {
          en: 'Language proficiencies',
          ar: 'إتقان اللغات'
        },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: 'language',
              type: 'select',
              label: {
                en: 'Language',
                ar: 'اللغة'
              },
              required: true,
              options: [
                { label: { en: 'Arabic', ar: 'العربية' }, value: 'arabic' },
                { label: { en: 'English', ar: 'الإنجليزية' }, value: 'english' },
                { label: { en: 'French', ar: 'الفرنسية' }, value: 'french' },
                { label: { en: 'Spanish', ar: 'الإسبانية' }, value: 'spanish' },
                { label: { en: 'German', ar: 'الألمانية' }, value: 'german' },
                { label: { en: 'Hindi', ar: 'الهندية' }, value: 'hindi' },
                { label: { en: 'Urdu', ar: 'الأردية' }, value: 'urdu' },
                { label: { en: 'Bengali', ar: 'البنغالية' }, value: 'bengali' },
                { label: { en: 'Chinese', ar: 'الصينية' }, value: 'chinese' },
                { label: { en: 'Other', ar: 'أخرى' }, value: 'other' },
              ],
            },
            {
              name: 'fluencyLevel',
              type: 'select',
              label: {
                en: 'Fluency Level',
                ar: 'مستوى الطلاقة'
              },
              required: true,
              options: [
                { label: { en: 'Native', ar: 'لغة أم' }, value: 'native' },
                { label: { en: 'Fluent', ar: 'طلق' }, value: 'fluent' },
                { label: { en: 'Advanced', ar: 'متقدم' }, value: 'advanced' },
                { label: { en: 'Intermediate', ar: 'متوسط' }, value: 'intermediate' },
                { label: { en: 'Basic', ar: 'أساسي' }, value: 'basic' },
              ],
            }
          ]
        }
      ],
      access: adminOnlyUpdateAccess,
    },
    {
      type: "row",
      fields: [
        {
          name: 'nationality',
          type: 'select',
          label: {
            en: 'Nationality',
            ar: 'الجنسية'
          },
          required: true,
          options: nationalities.map(nat => ({
            label: nat,
            value: nat.en.toLowerCase().replace(/\s/g, '_'),
          })),
          admin: {
            placeholder: {
              en: 'Select nationality',
              ar: 'اختر الجنسية'
            },
          },
          access: adminOnlyUpdateAccess,
        },
        {
          name: 'country',
          type: 'select',
          label: {
            en: 'Country',
            ar: 'البلد'
          },
          required: true,
          options: countries.map(country => ({
            label: country,
            value: country.en.toLowerCase().replace(/\s/g, '_'),
          })),
          admin: {
            placeholder: {
              en: 'Current country of residence',
              ar: 'بلد الإقامة الحالي'
            },
          },
          access: adminOnlyUpdateAccess,
        },
      ]
    },

    {
      name: 'status',
      type: 'select',
      label: {
        en: 'Status',
        ar: 'الحالة'
      },
      required: true,
      defaultValue: 'available',
      options: [
        { label: { en: 'Available', ar: 'متاح' }, value: 'available' },
        { label: { en: 'Assigned', ar: 'مُسند' }, value: 'assigned' },
        { label: { en: 'Selected', ar: 'مختار' }, value: 'selected' },
        { label: { en: 'Rejected', ar: 'مرفوض' }, value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: {
          en: 'Candidate status in recruitment process',
          ar: 'حالة المرشح في عملية التوظيف'
        },
        components: {
          Cell: "/components/client/statusCell"
        }
      },
      access: {
        update: ({ req: { user } }) => {
          // Super admin can update status
          if (user?.role === 'super admin') return true
          // Employers cannot directly update status field
          // They should use the action buttons which go through server actions
          return false
        },
      },
    },
    {
      name: 'company',
      type: 'relationship',
      label: {
        en: 'Company',
        ar: 'الشركة'
      },
      relationTo: 'companies',
      admin: {
        position: 'sidebar',
        description: {
          en: 'Company candidate is assigned to',
          ar: 'الشركة المُسند إليها المرشح'
        },
      },
      filterOptions: {
        status: {
          equals: 'active',
        },
      },
      access: {
        read: ({ req }) => {

          if (req.user?.role == "employer") {
            return false
          }

          return true
        },
        update: ({ req }) => {

          if (req.user?.role == "employer") {
            return false
          }

          return true
        }
      },
      hooks: {
        beforeChange: [
          async ({ value, previousValue, siblingData }) => {

            if (previousValue == undefined && value) {
              siblingData.status = "assigned"
            }

            if (!Boolean(value) && previousValue) {
              siblingData.status = "available"
            }

            if (Boolean(value) && value != previousValue) siblingData.status = "assigned"

            return value
          }
        ]
      }
    },
    {
      name: 'notes',
      type: 'textarea',
      label: {
        en: 'Notes',
        ar: 'ملاحظات'
      },
      localized: true,
      admin: {
        position: 'sidebar',
        placeholder: {
          en: 'Internal notes about the candidate',
          ar: 'ملاحظات داخلية حول المرشح'
        },
        rows: 4,
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'super admin',
        update: ({ req: { user } }) => user?.role === 'super admin',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true

      // Employers can only see candidates not hidden from them
      if (user.role === 'employer' && user.company) {
        return {
          status: { in: ['available', 'selected', 'assigned'] },
          company: { equals: user.company?.id || user.company },

        }
      }

      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      // Only super admin can create candidates
      return user.role === 'super admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super admin') return true

      // Employers can update candidates assigned to their company
      if (user.role === 'employer' && user.company) {
        return {
          company: { equals: user.company?.id || user.company },
        }
      }

      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'super admin'
    },
    readVersions: ({ req: { user } }) => user?.role == "super admin"
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req, previousDoc }) => {
        const { user } = req

        if (operation === 'create') {
          console.log(`New candidate created: ${doc.name} for ${doc.jobTitle}`)
        }

        if (operation === 'update' && previousDoc) {
          // Handle assignment notification
          if (doc.status === 'assigned' && doc.company && previousDoc.status === 'available') {
            // Create notification for the assigned company
            // Create notification in English
            const notificationEN = await req.payload.create({
              collection: 'notifications',
              locale: 'en',
              data: {
                title: 'New Candidate Assigned',
                message: `A new candidate "${doc.name.en || doc.name}" has been assigned to your company for the position of ${doc.jobTitle.en || doc.jobTitle}`,
                recipientType: 'specific',
                recipients: [doc.company]
              },
            })

            // Update same notification with Arabic locale
            await req.payload.update({
              collection: 'notifications',
              id: notificationEN.id,
              locale: 'ar',
              data: {
                title: 'تم تعيين مرشح جديد',
                message: `تم تعيين مرشح جديد "${doc.name.ar || doc.name}" لشركتكم لوظيفة ${doc.jobTitle.ar || doc.jobTitle}`
              },
            })
          }

          // Handle employer status update notifications
          if ((doc.status === 'selected' || doc.status === 'rejected') &&
            previousDoc.status === 'assigned' &&
            user?.role === 'employer') {
            // Create notification for the company that the candidate was assigned to
            const statusTextEn = doc.status === 'selected' ? 'Selected' : 'Rejected'
            const statusTextAr = doc.status === 'selected' ? 'تم اختياره' : 'تم رفضه'
            const companyNameEn = user.company?.companyLegalName?.en || user.company?.companyLegalName || 'company'
            const companyNameAr = user.company?.companyLegalName?.ar || user.company?.companyLegalName || 'الشركة'

            // Create notification in English
            const notificationEN = await req.payload.create({
              collection: 'notifications',
              locale: 'en',
              data: {
                status: "draft",
                title: `Candidate ${statusTextEn}`,
                message: `Candidate ${doc.name.en || doc.name} has been ${doc.status} by ${companyNameEn}`,
                recipientType: 'specific',
                recipients: [doc.company]
              },
            })

            // Update same notification with Arabic locale
            await req.payload.update({
              collection: 'notifications',
              id: notificationEN.id,
              locale: 'ar',
              data: {
                title: `${statusTextAr} المرشح`,
                message: `${statusTextAr} المرشح ${doc.name.ar || doc.name} من قبل ${companyNameAr}`
              },
            })
          }
        }

        return doc
      },
    ],
  },
}