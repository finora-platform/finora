"use client"
import type { Lead } from "@/types/lead"
import { LeadCard } from "./lead-card"


interface LeadStageProps {
  title: string
  leads?: Lead[]
  count?: number
  onLeadClick: (lead: Lead) => void
}

/**
 * Renders a column for a specific sales lead stage.
 *
 * Displays the stage title, count of leads, and a list of LeadCard components for each lead in the stage.
 * Handles lead selection via the onLeadClick callback.
 *
 * @component
 * @param {LeadStageProps} props - The props for the lead stage column.
 * @param {string} props.title - The title of the stage (e.g., "Leads", "Called").
 * @param {Lead[]} [props.leads] - Array of leads in this stage.
 * @param {number} [props.count] - Number of leads in this stage.
 * @param {(lead: Lead) => void} props.onLeadClick - Callback when a lead is selected.
 *
 * @example
 * <LeadStage title="Leads" leads={leads} count={leads.length} onLeadClick={handleLeadClick} />
 */
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
