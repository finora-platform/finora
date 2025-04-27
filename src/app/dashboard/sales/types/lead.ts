export interface Lead {
  id: string
  name: string
  source: string
  stage: "lead" | "called" | "subscribed" | "onboarded"
  phone: number
  updated_at: string
  created_at: string
  onboarding_date?: string
  document_verified?: boolean
  plan?: string
  email?: string
  disposition?: string
  quality?: string
  isElite?: boolean
  rating?: number
  views?: number
  messageCount: number
  documents?: number
  timeAgo?: string
  timeLeft?: string
  date?: string
  activities?: Activity[]
  messages?: Message[]
  unreadMessages?: number
}

export interface Activity {
  title: string
  subtitle?: string
  time: string
}

export interface Message {
  content: string
  time: string
  isOutgoing: boolean
}

