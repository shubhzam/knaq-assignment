import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

//seed data
const users = [
  { name: 'Sarah Chen',  role: 'manager',  company: 'Brookfield Properties', token: 'token-sarah',  email: 'sarah@brookfield.com' },
  { name: 'James Park',  role: 'engineer', company: 'Brookfield Properties', token: 'token-james',  email: 'james@brookfield.com' },
  { name: 'Nina Torres', role: 'engineer', company: 'Brookfield Properties', token: 'token-nina',   email: 'nina@brookfield.com' },
  { name: 'Raj Patel',   role: 'manager',  company: 'Hines',                 token: 'token-raj',    email: 'raj@hines.com' },
  { name: 'Lisa Wong',   role: 'engineer', company: 'Hines',                 token: 'token-lisa',   email: 'lisa@hines.com' },
  { name: 'Kenji Mori',  role: 'manager',  company: 'Mitsui Fudosan',        token: 'token-kenji',  email: 'kenji@mitsui.com' },
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {

      const devicesPath = join(__dirname, '../../../data/devices.json')
      const rawDevices: any[] = JSON.parse(readFileSync(devicesPath, 'utf-8'))
      console.log(`seeding ${rawDevices.length} devices...`)
      for (const d of rawDevices) {
        await prisma.device.upsert({
        where: { device_id: d.device_id },
        create: {
            device_id:     d.device_id,
            type:          d.type,
            company:       d.company,
            name:          d.name          ?? d.device_id,
            location:      d.location      ?? 'Unknown',
            timezone:      d.timezone,
            floor_count:   d.floor_count   ?? null,
            installed_date: d.installed_date ?? '2020-01-01',
            reading_types: d.reading_types  ?? [],
            thresholds:    d.alert_thresholds ??  {},
        },
        update: {
            thresholds: d.alert_thresholds ?? {},
        },
        })
        console.log(`  upserted ${d.device_id}`)
    }
    console.log(`\nseeding ${users.length} users...`)
  for (const u of users) {
    await prisma.user.upsert({
      where: { token: u.token },
      create: u,
      update: { name: u.name, role: u.role, company: u.company, email: u.email },
    })
    console.log(`  upserted ${u.name}`)
}
console.log('\nseed complete')    
}

main()
    .catch(e=>{console.error(e); process.exit(1)})
    .finally(()=> pool.end())