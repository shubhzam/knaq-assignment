import "dotenv/config"
import express from "express"
import cors from "cors"
import { authenticate } from "./middleware/auth"
import { deviceRoutes } from "./routes/devices"
import { userRoutes } from "./routes/users"
import { alertRoutes } from "./routes/alerts"

const app = express()
const PORT = process.env.PORT ?? 8000

app.use(cors())
app.use(express.json())

// all routes below this require a valid bearer token
app.use(authenticate)

app.use("/devices", deviceRoutes)
app.use("/users", userRoutes)
app.use("/alerts", alertRoutes)

// global error handler - catches anything thrown with { status, message }
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500
  const message = err.message ?? "internal server error"
  console.error(`[error] ${status} - ${message}`)
  res.status(status).json({ error: message })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})