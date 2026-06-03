import { Router, Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../utils/prisma"
import {
  ApiError,
  validateTransition,
  validateAssignable,
  makeTimelineEntry,
} from "../utils/transitions"

export const alertRoutes = Router()

// shared include block so every alert response has device + assignee attached
const alertInclude = {
  device: true,
  assignee: {
    select: { id: true, name: true, role: true, company: true, email: true },
  },
}

// GET /alerts - filtered list scoped to user's company
// query params: severity, status, device_id, q (search), from, to
alertRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, status, device_id, q, from, to } = req.query as Record<string, string>

    // build the where clause piece by piece
    const where: Record<string, any> = {
      // scope to company via device join
      device: { company: req.user.company },
    }

    if (severity) where.severity = severity
    if (status) where.status = status
    if (device_id) where.device_id = device_id

    // text search across alert_type and device name
    if (q) {
      where.OR = [
        { alert_type: { contains: q, mode: "insensitive" } },
        { device: { name: { contains: q, mode: "insensitive" } } },
      ]
    }

    // date range on triggered_at
    if (from || to) {
      where.triggered_at = {}
      if (from) where.triggered_at.gte = new Date(from)
      if (to) where.triggered_at.lte = new Date(to)
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: alertInclude,
      orderBy: { triggered_at: "desc" },
    })

    res.json(alerts)
  } catch (err) {
    next(err)
  }
})

// GET /alerts/:id - full alert with timeline, device, assignee
alertRoutes.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: Number(req.params.id) },
      include: alertInclude,
    })

    if (!alert) throw new ApiError(404, "alert not found")
    if (alert.device.company !== req.user.company) throw new ApiError(403, "alert not in your company")

    res.json(alert)
  } catch (err) {
    next(err)
  }
})

// POST /alerts/:id/acknowledge - new → acknowledged
alertRoutes.post("/:id/acknowledge", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: Number(req.params.id) },
      include: { device: true },
    })

    if (!alert) throw new ApiError(404, "alert not found")
    if (alert.device.company !== req.user.company) throw new ApiError(403, "alert not in your company")

    validateTransition(alert.status, "acknowledged")

    const timeline = alert.timeline as any[]
    const entry = makeTimelineEntry("acknowledged", req.user.name, `acknowledged by ${req.user.name}`)

    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: "acknowledged",
        acknowledged_at: new Date(),
        timeline: [...timeline, entry],
      },
      include: alertInclude,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /alerts/:id/assign - set assignee, allowed in new or acknowledged
const assignSchema = z.object({
  assignee_id: z.number().int().positive(),
  note: z.string().optional(),
})

alertRoutes.post("/:id/assign", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = assignSchema.safeParse(req.body)
    if (!body.success) throw new ApiError(400, body.error.issues[0].message)

    const alert = await prisma.alert.findUnique({
      where: { id: Number(req.params.id) },
      include: { device: true },
    })

    if (!alert) throw new ApiError(404, "alert not found")
    if (alert.device.company !== req.user.company) throw new ApiError(403, "alert not in your company")

    validateAssignable(alert.status)

    // make sure the assignee is a real user in the same company
    const assignee = await prisma.user.findFirst({
      where: { id: body.data.assignee_id, company: req.user.company },
    })
    if (!assignee) throw new ApiError(404, "assignee not found in your company")

    const timeline = alert.timeline as any[]
    const details = `assigned to ${assignee.name}`
    const entry = makeTimelineEntry("assigned", req.user.name, details, body.data.note)

    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        assigned_to: assignee.id,
        timeline: [...timeline, entry],
      },
      include: alertInclude,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /alerts/:id/resolve - acknowledged → resolved
// body uses short names; we map to prefixed DB columns
const resolveSchema = z.object({
  resolution_type: z.enum(["fixed", "false_alarm", "known_issue", "deferred", "cannot_reproduce"]),
  root_cause: z.string().min(1, "root cause is required"),
  action_taken: z.string().min(1, "action taken is required"),
  preventive_measures: z.string().optional(),
  time_spent_minutes: z.number().int().positive().optional(),
})

alertRoutes.post("/:id/resolve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = resolveSchema.safeParse(req.body)
    if (!body.success) throw new ApiError(400, body.error.issues[0].message)

    const alert = await prisma.alert.findUnique({
      where: { id: Number(req.params.id) },
      include: { device: true },
    })

    if (!alert) throw new ApiError(404, "alert not found")
    if (alert.device.company !== req.user.company) throw new ApiError(403, "alert not in your company")

    validateTransition(alert.status, "resolved")

    const timeline = alert.timeline as any[]
    const entry = makeTimelineEntry(
      "resolved",
      req.user.name,
      `resolved as ${body.data.resolution_type}`
    )

    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: "resolved",
        resolved_at: new Date(),
        resolution_type: body.data.resolution_type,
        resolution_root_cause: body.data.root_cause,
        resolution_action_taken: body.data.action_taken,
        resolution_preventive_measures: body.data.preventive_measures ?? null,
        resolution_time_spent_minutes: body.data.time_spent_minutes ?? null,
        timeline: [...timeline, entry],
      },
      include: alertInclude,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// POST /alerts/:id/notes - append a note, allowed in any status
const noteSchema = z.object({
  note: z.string().min(1, "note cannot be empty"),
})

alertRoutes.post("/:id/notes", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = noteSchema.safeParse(req.body)
    if (!body.success) throw new ApiError(400, body.error.issues[0].message)

    const alert = await prisma.alert.findUnique({
      where: { id: Number(req.params.id) },
      include: { device: true },
    })

    if (!alert) throw new ApiError(404, "alert not found")
    if (alert.device.company !== req.user.company) throw new ApiError(403, "alert not in your company")

    const timeline = alert.timeline as any[]
    const entry = makeTimelineEntry("note_added", req.user.name, undefined, body.data.note)

    const updated = await prisma.alert.update({
      where: { id: alert.id },
      data: {
        timeline: [...timeline, entry],
      },
      include: alertInclude,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})