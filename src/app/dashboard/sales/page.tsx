"use client"

import { useState, useEffect } from "react"
import { LeadStage } from "./components/lead-stage"
import { LeadDetailPanel } from "./components/lead-detail-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RotateCcw, Download } from "lucide-react"
import { leadsData } from "@/lib/dummyleads"
import type { Lead } from "./types/lead"
import { FilterDropdown } from "./components/filter-dropdown"

export default function Sales() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLeads, setFilteredLeads] = useState(leadsData.leads)
  const [filters, setFilters] = useState({
    plan: "All Plans",
    source: "All Sources",
    quality: "All Lead quality",
  })

  // Extract unique values for filters
  const sources = ["All Sources", ...new Set(leadsData.leads.map((lead) => lead.source))]
  const plans = ["All Plans", "Free", "Basic", "Premium", "Enterprise"]
  const qualities = ["All Lead quality", "Cold", "Warm", "Hot"]

  // Handle lead selection
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  // Apply filters and search
  useEffect(() => {
    let result = leadsData.leads

    // Apply source filter
    if (filters.source !== "All Sources") {
      result = result.filter((lead) => lead.source === filters.source)
    }

    // Apply plan filter
    if (filters.plan !== "All Plans") {
      result = result.filter((lead) => lead.plan === filters.plan)
    }

    // Apply quality filter
    if (filters.quality !== "All Lead quality") {
      result = result.filter((lead) => lead.quality === filters.quality)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((lead) => lead.name.toLowerCase().includes(query))
    }

    setFilteredLeads(result)
  }, [filters, searchQuery])

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      plan: "All Plans",
      source: "All Sources",
      quality: "All Lead quality",
    })
    setSearchQuery("")
  }

  // Group leads by stage
  const leadsStage = filteredLeads.filter((lead) => lead.stage === "lead")
  const calledStage = filteredLeads.filter((lead) => lead.stage === "called")
  const trialStage = filteredLeads.filter((lead) => lead.stage === "trial")
  const subscribedStage = filteredLeads.filter((lead) => lead.stage === "subscribed")
  const onboardedStage = filteredLeads.filter((lead) => lead.stage === "onboarded")

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterDropdown
                options={plans}
                value={filters.plan}
                onChange={(value) => setFilters({ ...filters, plan: value })}
              />

              <FilterDropdown
                options={sources}
                value={filters.source}
                onChange={(value) => setFilters({ ...filters, source: value })}
              />

              <FilterDropdown
                options={qualities}
                value={filters.quality}
                onChange={(value) => setFilters({ ...filters, quality: value })}
              />

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name"
                  className="w-[250px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Leads imported 1h ago</span>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Import leads
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-5 gap-4">
            <LeadStage title="Leads" leads={leadsStage} count={leadsStage.length} onLeadClick={handleLeadClick} />
            <LeadStage title="Called" leads={calledStage} count={calledStage.length} onLeadClick={handleLeadClick} />
            <LeadStage title="On trial" leads={trialStage} count={trialStage.length} onLeadClick={handleLeadClick} />
            <LeadStage
              title="Subscribed"
              leads={subscribedStage}
              count={subscribedStage.length}
              onLeadClick={handleLeadClick}
            />
            <LeadStage
              title="Onboarded"
              leads={onboardedStage}
              count={onboardedStage.length}
              onLeadClick={handleLeadClick}
            />
          </div>
        </div>
      </div>

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  )
}

