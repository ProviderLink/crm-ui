const apiUrl = import.meta.env.VITE_API_URL as string | undefined
if (!apiUrl) {
  throw new Error('Missing required environment variable: VITE_API_URL')
}

export const config = {
  apiUrl,
} as const
