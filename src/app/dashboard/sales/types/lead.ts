export interface Lead {
  id: string
  name: string
  source: string
  stage: "lead" | "contacted" | "documented" | "paid"
  plan?: string
  quality?: string
  isElite?: boolean
  rating?: number
  views?: number
  phone?: string
  disposition?: string
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