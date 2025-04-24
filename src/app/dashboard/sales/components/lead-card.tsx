"use client"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/lead"
import { ExternalLink, Star, FileCheck, FileWarning } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

export const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Website": return <ExternalLink className="h-4 w-4" />
      case "Google Ads": return <span className="text-xs">G</span>
      case "Meta Ads": return <span className="text-xs">M</span>
      case "Email Campaign": return <span className="text-xs">E</span>
      default: return <ExternalLink className="h-4 w-4" />
    }
  }

  const getDispositionColor = (disposition: string) => {
    switch (disposition?.toLowerCase()) {
      case 'hot': return 'bg-red-50 text-red-700 border-red-200'
      case 'warm': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cold': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'called': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'elite': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'premium': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'standard': return 'bg-gray-50 text-gray-700 border-gray-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getDocumentStatusColor = (verified: boolean) => {
    return verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }

  const getTimeAgo = (date: string | Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return null
    }
  }

  const displayTimeAgo = getTimeAgo(lead.updated_at || lead.created_at)
  const displayCalledOrSubscribedDate = lead.updated_at ? getTimeAgo(lead.updated_at) : null
  const displayOnboardingDate = lead.onboarding_date ? getTimeAgo(lead.onboarding_date) : null

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-6 pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="font-medium">{lead.name}</div>

          {/* Source and Elite Badge */}
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

          {/* Rating for lead stage */}
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

          {/* Stage: called or subscribed */}
          {(lead.stage === 'called' || lead.stage === 'subscribed') && (
            <div className="flex gap-2 flex-wrap">
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
              {lead.updated_at && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  📞 {new Date(lead.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              )}
            </div>
          )}

          {/* Stage: onboarding */}
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
              {lead.disposition && (
                <Badge 
                  variant="outline" 
                  className={cn("capitalize", getDispositionColor(lead.disposition))}
                >
                  {lead.disposition}
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={getDocumentStatusColor(lead.document_verified || false)}
              >
                {lead.document_verified ? (
                  <>
                    <FileCheck className="h-3 w-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <FileWarning className="h-3 w-3 mr-1" />
                    Pending
                  </>
                )}
              </Badge>
              {displayOnboardingDate && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  🚀 {displayOnboardingDate}
                </Badge>
              )}
            </div>
          )}

          {/* Footer with views/messages/timestamp */}
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
            </div>
            {displayTimeAgo && (
              <div className="text-xs text-muted-foreground">{displayTimeAgo}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}