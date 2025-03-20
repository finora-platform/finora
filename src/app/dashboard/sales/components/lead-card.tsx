"use client"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/lead"
import { ExternalLink, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

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

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
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

          {lead.rating > 0 && (
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-4 w-4", i < lead.rating ? "text-amber-400 fill-amber-400" : "text-muted")}
                />
              ))}
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

              {lead.documents > 0 && (
                <div className="flex items-center gap-1">
                  <span>📄</span>
                  <span>{lead.documents}</span>
                </div>
              )}
            </div>

            <div>
              {lead.timeAgo && <span>{lead.timeAgo}</span>}
              {lead.timeLeft && <span>{lead.timeLeft} left</span>}
              {lead.date && <span>{lead.date}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

