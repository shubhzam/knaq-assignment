import { Router, Request, Response, NextFunction } from "express"
import { prisma } from "../utils/prisma"

export const userRoutes = Router()

// GET /users - teammates in the same company (excludes sensitive fields like token)
userRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { company: req.user.company },
      select: {
        id: true,
        name: true,
        role: true,
        company: true,
        email: true,
        // intentionally omitting token - no reason to expose it to frontend
      },
      orderBy: { name: "asc" },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})