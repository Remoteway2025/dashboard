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
      titleSuffix: " - Remoteway",
      openGraph: {
        description: "Dashboard",
        siteName: 'Remoteway',
        title: 'Admin Panel',
      },
      robots: 'noindex, nofollow'
    },
    components: {
      graphics: {
        Logo: "/components/client/logo",
        Icon: "/components/client/icon"
      },
      beforeNavLinks: ["/components/client/logo"],
    },
    avatar: "default"
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
          emptyTrash: "تفريغ الأرشيف",
          noTrashResults: "لا توجد نتائج في الأرشيف",
          noResults: "لا توجد نتائج ...",
          collapse: "إغلاق",
          permanentlyDelete: "تجاوز الأرشيف واحذف بشكل دائم",
          payloadSettings: "الإعدادات",
          aboutToTrash: 'You are about to move the {{label}} <1>{{title}}</1> to the Archive. Are you sure?',
          aboutToTrashCount: 'You are about to move {{count}} {{label}} to the Archive',
          aboutToPermanentlyDeleteTrash: 'You are about to permanently delete <0>{{count}}</0> <1>{{label}}</1> from the Archive. Are you sure?',
        }
      },
      en: {
        general: {
          trash: "Archive",
          payloadSettings: "Settings"

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
  hooks: {
    afterError: [(args) => console.log(args)]
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
