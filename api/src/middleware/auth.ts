import { Request, Response, NextFunction } from "express"
import { prisma } from "../utils/prisma"

// extend express Request to carry the resolved user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number
        name: string
        role: string
        company: string
        token: string
        email: string
      }
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing token" })
    return
  }

  const token = authHeader.replace("Bearer ", "").trim()

  try {
    const user = await prisma.user.findUnique({ where: { token } })
    if (!user) {
      res.status(401).json({ error: "invalid token" })
      return
    }
    req.user = user
    next()
  } catch (err) {
    console.error("[auth] db error resolving token:", err)
    res.status(500).json({ error: "auth lookup failed" })
  }
}