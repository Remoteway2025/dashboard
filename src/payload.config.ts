// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { importExportPlugin } from '@payloadcms/plugin-import-export'

import { Users } from './collections/Admins'
import { Media } from './collections/Media'
import { Companies } from './collections/Companies'
import { Tickets } from './collections/Tickets'
import { TicketMessages } from './collections/TicketMessages'
import { Notifications } from './collections/Notifications'
import { NotificationRecipients } from './collections/NotificationRecipients'
import { ContactUs } from './collections/ContactUs'
import { Employees } from './collections/Employees'
import { PayrollRequests } from './collections/PayrollRequests'
import { Payslips } from './collections/Payslips'
import { AuditLog } from './collections/AuditLog'
import { Candidates } from './collections/Candidates'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import { auditFieldsPlugin } from "@payload-bites/audit-fields";

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: "Remoteway",
      description: 'The best admin panel in the world !',
      titleSuffix: " - Remoteway"
    },
    components: {
      graphics: {
        Logo: "/components/client/Logo",
        Icon: "/components/client/icon"
      },
      beforeNavLinks: "/components/client/Logo",
    }
  },
  i18n: {
    supportedLanguages: { en, ar },
    translations: {
      ar: {
        general: {
          true: "نعم",
          false: "لا",
          collections: "الكل",
          createNew: "إنشاء جديد",
          all: "كل",
          trash: "الأرشيف",
          noResults: "لا توجد نتائج ..."
        }
      },
      en: {
        general: {
          trash: "Archive"
        }
      }
    }
  },
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Arabic',
        code: 'ar',
        // opt-in to setting default text-alignment on Input fields to rtl (right-to-left)
        // when current locale is rtl
        rtl: true,
      },
    ],
    defaultLocale: 'en', // required
    fallback: true, // defaults to true
  },
  collections: [
    Users,
    Media,
    Companies,
    Employees,
    Candidates,
    PayrollRequests,
    Payslips,
    AuditLog,
    Tickets,
    TicketMessages,
    Notifications,
    NotificationRecipients,
    ContactUs
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost/remoteway',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    auditFieldsPlugin({}),
    importExportPlugin({
      collections: ['companies', 'employees', 'payroll-requests', 'contact-us']
    })
  ],
})
