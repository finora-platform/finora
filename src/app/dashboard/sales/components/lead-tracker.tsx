"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LeadStage } from "@/components/lead-stage"
import { LeadSidebar } from "@/components/lead-sidebar"
import { LeadDetailPanel } from "@/components/lead-detail-panel"
import { Badge } from "@/components/ui/badge"
import { leadsData } from "@/data/leads"

export function LeadTracker() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    plans: "All Plans",
    sources: "All Sources",
    quality: "All Lead quality",
  })

  const stages = [
    { id: "leads", title: "Leads", count: leadsData.leads.length },
    { id: "called", title: "Called", count: leadsData.called.length },
    { id: "on-trial", title: "On trial", count: leadsData.onTrial.length },
    { id: "subscribed", title: "Subscribed", count: leadsData.subscribed.length },
    { id: "onboarded", title: "Onboarded", count: leadsData.onboarded.length },
  ]

  const handleLeadClick = (leadId: string) => {
    setSelectedLead(leadId)
  }

  const handleClosePanel = () => {
    setSelectedLead(null)
  }

  const getLeadById = (id: string) => {
    for (const stage in leadsData) {
      const lead = leadsData[stage as keyof typeof leadsData].find((lead) => lead.id === id)
      if (lead) return lead
    }
    return null
  }

  const selectedLeadData = selectedLead ? getLeadById(selectedLead) : null

  return (
    <div className="flex h-screen overflow-hidden">
      <LeadSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <div className="relative">
                <Button variant="outline" className="w-36">
                  {filters.plans}
                </Button>
              </div>
              <div className="relative">
                <Button variant="outline" className="w-36">
                  {filters.sources}
                </Button>
              </div>
              <div className="relative">
                <Button variant="outline" className="w-36">
                  {filters.quality}
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <span>Reset filters</span>
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Leads imported 1h ago
              </Badge>
              <Button className="bg-purple-600 hover:bg-purple-700">Import leads</Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto">
          <div className="flex h-full">
            {stages.map((stage) => (
              <LeadStage
                key={stage.id}
                title={stage.title}
                count={stage.count}
                leads={leadsData[stage.id as keyof typeof leadsData]}
                onLeadClick={handleLeadClick}
              />
            ))}
          </div>
        </main>
      </div>
      {selectedLeadData && <LeadDetailPanel lead={selectedLeadData} onClose={handleClosePanel} />}
    </div>
  )
}

