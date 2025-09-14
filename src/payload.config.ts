// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { importExportPlugin } from '@payloadcms/plugin-import-export'

import { Users } from './collections/Users'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Companies,
    Employees,
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
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || path.resolve(dirname, './payload.db'),
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    importExportPlugin({
      collections: ['employees', 'payroll-requests', 'contact-us']
    })
  ],
})
