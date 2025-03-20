"use client"
import type { Lead } from "@/types/lead"
import { LeadCard } from "./lead-card"

interface LeadStageProps {
  title: string
  leads?: Lead[]
  count?: number
  onLeadClick: (lead: Lead) => void
}

export const LeadStage = ({ title, leads = [], count = 0, onLeadClick }: LeadStageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="bg-muted rounded-full px-2 py-0.5 text-sm">{count}</span>
      </div>
      <div className="flex flex-col gap-2">
        {(leads || []).map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
        ))}
      </div>
    </div>
  )
}

