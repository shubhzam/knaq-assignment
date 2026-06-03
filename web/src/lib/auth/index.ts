// the token is set in .env.local as NEXT_PUBLIC_TOKEN
// NEXT_PUBLIC_ prefix means Next.js exposes it to the browser (not just server)
// without that prefix, process.env.TOKEN would be undefined in the browser

export const getToken = (): string => {
  return process.env.NEXT_PUBLIC_TOKEN ?? "";
};

// the current user's token - used for identifying "you" in the timeline
// e.g. highlighting your own actions differently
export const TOKEN = process.env.NEXT_PUBLIC_TOKEN ?? "";