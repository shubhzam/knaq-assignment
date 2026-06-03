// typed error with http status - throw this from any route, global handler picks it up
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// which statuses can move to which - resolved is terminal
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new:          ["acknowledged"],
  acknowledged: ["resolved"],
  resolved:     [],
  dismissed:    [],
}

export const validateTransition = (current: string, target: string) => {
  const allowed = ALLOWED_TRANSITIONS[current] ?? []
  if (!allowed.includes(target)) {
    throw new ApiError(409, `cannot transition from '${current}' to '${target}'`)
  }
}

// assign is allowed in new or acknowledged, not resolved
export const validateAssignable = (status: string) => {
  if (status === "resolved" || status === "dismissed") {
    throw new ApiError(409, `cannot assign alert in '${status}' status`)
  }
}

// helper to build a timeline entry
export const makeTimelineEntry = (action: string, user: string, details?: string, note?: string) => ({
  action,
  user,
  timestamp: new Date().toISOString(),
  ...(details ? { details } : {}),
  ...(note ? { note } : {}),
})