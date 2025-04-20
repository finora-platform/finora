"use client"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/lead"
import { ExternalLink, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

/**
 * Renders a summary card for a sales lead with stage-specific information.
 * 
 * - For leads in 'lead' stage: shows rating stars
 * - For 'called' stage: shows disposition and plan
 * - For 'subscribed' stage: shows plan and date
 * - For 'onboarding' stage: shows plan, date, and documents provided
 *
 * @component
 * @param {LeadCardProps} props - The props for the lead card.
 * @param {Lead} props.lead - The lead object to display.
 * @param {() => void} props.onClick - Callback when the card is clicked.
 */
export const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Website":
        return <ExternalLink className="h-4 w-4" />
      case "Google Ads":
        return <span className="text-xs">G</span>
      case "Meta Ads":
        return <span className="text-xs">M</span>
      case "Email Campaign":
        return <span className="text-xs">E</span>
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  // Get disposition badge color based on value
  const getDispositionColor = (disposition: string) => {
    switch (disposition?.toLowerCase()) {
      case 'hot':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'warm':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cold':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'called':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Get plan badge color
  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'elite':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'premium':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'standard':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // Format date from timestamp
  const formatDate = (timestamp: string | Date) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy')
    } catch {
      return null
    }
  }

  // Get the most relevant date to display
  const getDisplayDate = () => {
    if (lead.called) return formatDate(lead.called)
    if (lead.updated_at) return formatDate(lead.updated_at)
    if (lead.created_at) return formatDate(lead.created_at)
    return null
  }

  const displayDate = getDisplayDate()

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-6 pt-6">
        <div className="space-y-3">
          <div className="font-medium">{lead.name}</div>

          <div className="flex items-center text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              {getSourceIcon(lead.source)}
              <span>{lead.source}</span>
            </div>

            {lead.isElite && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                Elite
              </Badge>
            )}
          </div>

          {/* Stage-specific information */}
          {lead.stage === 'lead' && lead.rating > 0 && (
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-4 w-4", i < lead.rating ? "text-amber-400 fill-amber-400" : "text-muted")}
                />
              ))}
            </div>
          )}

{(lead.stage === 'called' || lead.stage === 'subscribed') && (
            <div className="flex gap-2">
              {lead.disposition && (
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getDispositionColor(lead.disposition))}
                >
                  {lead.disposition}
                </Badge>
              )}
              {lead.plan && (
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getPlanColor(lead.plan))}
                >
                  {lead.plan}
                </Badge>
              )}
            </div>
          )}

          {lead.stage === 'subscribed' && (
            <div className="flex gap-2">
              {lead.plan && (
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getPlanColor(lead.plan))}
                >
                  {lead.plan}
                </Badge>
              )}
              {displayDate && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {displayDate}
                </Badge>
              )}
            </div>
          )}

          {lead.stage === 'onboarding' && (
            <div className="flex gap-2 flex-wrap">
              {lead.plan && (
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getPlanColor(lead.plan))}
                >
                  {lead.plan}
                </Badge>
              )}
              {displayDate && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {displayDate}
                </Badge>
              )}
              {lead.it_sfile && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  📄 Document
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {lead.views > 0 && (
                <div className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{lead.views}</span>
                </div>
              )}

              {lead.messages > 0 && (
                <div className="flex items-center gap-1">
                  <span>💬</span>
                  <span>{lead.messages}</span>
                </div>
              )}

              {lead.it_sfile && lead.stage !== 'onboarding' && (
                <div className="flex items-center gap-1">
                  <span>📄</span>
                  <span>Document</span>
                </div>
              )}
            </div>

            <div>
              {lead.timeAgo && <span>{lead.timeAgo}</span>}
              {lead.timeLeft && <span>{lead.timeLeft} left</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}