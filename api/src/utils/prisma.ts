import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// single prisma instance shared across all route handlers
export const prisma = new PrismaClient({ adapter })