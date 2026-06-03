import { Router, Request, Response, NextFunction } from "express"
import { fromZonedTime, toZonedTime, format } from "date-fns-tz"
import { prisma } from "../utils/prisma"
import { ApiError } from "../utils/transitions"

export const deviceRoutes = Router()

// GET /devices - all devices belonging to the authenticated user's company
deviceRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = await prisma.device.findMany({
      where: { company: req.user.company },
      orderBy: { device_id: "asc" },
    })
    res.json(devices)
  } catch (err) {
    next(err)
  }
})

// GET /devices/:id - single device, must belong to user's company
deviceRoutes.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const device = await prisma.device.findUnique({
      where: { device_id: req.params.id as string},
    })

    if (!device) throw new ApiError(404, "device not found")
    if (device.company !== req.user.company) throw new ApiError(403, "device not in your company")

    res.json(device)
  } catch (err) {
    next(err)
  }
})

// GET /devices/:id/readings?start=X&end=Y
// start/end are ISO strings in device local time - must convert to UTC for DB query
// response timestamps are converted back to device local time
deviceRoutes.get("/:id/readings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const device = await prisma.device.findUnique({
      where: { device_id: req.params.id as string},
    })

    if (!device) throw new ApiError(404, "device not found")
    if (device.company !== req.user.company) throw new ApiError(403, "device not in your company")

    const { start, end } = req.query as { start?: string; end?: string }

    // build the where clause - apply time range only if params provided
    const timeFilter: Record<string, Date> = {}

    if (start) {
      // caller gives us device local time, convert to UTC before hitting DB
      timeFilter.gte = fromZonedTime(start, device.timezone)
    }
    if (end) {
      timeFilter.lte = fromZonedTime(end, device.timezone)
    }

    const readings = await prisma.reading.findMany({
      where: {
        device_id: device.device_id,
        ...(Object.keys(timeFilter).length > 0 ? { timestamp: timeFilter } : {}),
      },
      orderBy: { timestamp: "asc" },
    })

    // convert UTC timestamps back to device local time for the response
    const localReadings = readings.map((r: { id: number; device_id: string; timestamp: Date; input_name: string; input_value: number }) => ({
      ...r,
      // format as ISO-like string in device timezone
      timestamp: format(toZonedTime(r.timestamp, device.timezone), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", {
        timeZone: device.timezone,
      }),
    }))

    res.json(localReadings)
  } catch (err) {
    next(err)
  }
})