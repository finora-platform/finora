"use client"

import { useState, useEffect, useRef } from "react"
import { LeadStage } from "./components/lead-stage"
import { LeadDetailPanel } from "./components/lead-detail-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RotateCcw, Download } from "lucide-react"
import type { Lead } from "./types/lead"
import { FilterDropdown } from "./components/filter-dropdown"
import LeadCSVImportDialog from "./components/lead-csv-import"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession, useUser } from "@clerk/nextjs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Sales() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [filters, setFilters] = useState({
    plan: "All Plans",
    source: "All Sources",
    quality: "All Lead quality",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session, isLoaded: isSessionLoaded } = useSession()
  const { user, isLoaded: isUserLoaded } = useUser()

  const plans = ["All Plans", "Free", "Basic", "Premium", "Enterprise"]
  const qualities = ["All Lead quality", "Cold", "Warm", "Hot"]
  const boardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchLeads = async () => {
      if (!isSessionLoaded || !isUserLoaded || !session) return

      setLoading(true)
      setError(null)
      try {
        const supabase = await createClerkSupabaseClient(session)
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("advisor_id", session.user.id)
          .order("updated_at", { ascending: true })

        if (error) {
          throw error
        }
        setAllLeads(data as Lead[])
        setFilteredLeads(data as Lead[])
      } catch (err) {
        console.error("Failed to fetch leads:", err)
        setError("Failed to load leads. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [isSessionLoaded, isUserLoaded, session])

  const sources = ["All Sources", ...new Set(allLeads.map((lead) => lead.source))]

  useEffect(() => {
    let result = [...allLeads]

    if (filters.source !== "All Sources") {
      result = result.filter((lead) => lead.source === filters.source)
    }

    if (filters.plan !== "All Plans") {
      result = result.filter((lead) => lead.plan === filters.plan)
    }

    if (filters.quality !== "All Lead quality") {
      result = result.filter((lead) => lead.quality === filters.quality)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((lead) => lead.name.toLowerCase().includes(query))
    }

    setFilteredLeads(result)
  }, [filters, searchQuery, allLeads])

  const resetFilters = () => {
    setFilters({
      plan: "All Plans",
      source: "All Sources",
      quality: "All Lead quality",
    })
    setSearchQuery("")
  }

  const leadsStage = filteredLeads.filter((lead) => lead.stage === "lead")
  const calledStage = filteredLeads.filter((lead) => lead.stage === "contacted")
  const subscribedStage = filteredLeads.filter((lead) => lead.stage === "documented")
  const onboardedStage = filteredLeads.filter((lead) => lead.stage === "paid")

  if (!isSessionLoaded || !isUserLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to view leads</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterDropdown options={plans} value={filters.plan} onChange={(value) => setFilters({ ...filters, plan: value })} />
              <FilterDropdown options={sources} value={filters.source} onChange={(value) => setFilters({ ...filters, source: value })} />
              <FilterDropdown options={qualities} value={filters.quality} onChange={(value) => setFilters({ ...filters, quality: value })} />
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
              <span className="text-sm text-muted-foreground">Leads imported live</span>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Import leads
              </Button>
            </div>
          </div>
        </header>

        <div 
          className="flex-1 overflow-auto p-4" 
          ref={boardRef}
          style={{ overflowY: "auto" }}
        >
          <div className="grid grid-cols-4 gap-4 min-h-full">
  <LeadStage
    title="Leads"
    leads={leadsStage}
    count={leadsStage.length}
    onLeadClick={setSelectedLead}
  />
  <LeadStage
    title="Contacted"
    leads={calledStage}
    count={calledStage.length}
    onLeadClick={setSelectedLead}
  />
  <LeadStage
    title="Documented"
    leads={subscribedStage}
    count={subscribedStage.length}
    onLeadClick={setSelectedLead}
  />

  {/* Paid column: greyed-out + no pointer events */}
  <div className="bg-gray-50 rounded-lg p-2 pointer-events-none opacity-60">
    <LeadStage
      title="Paid"
      leads={onboardedStage}
      count={onboardedStage.length}
      onLeadClick={setSelectedLead}
    />
  </div>
</div>

        </div>
      </div>

      {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      <LeadCSVImportDialog show={isDialogOpen} setShow={setIsDialogOpen} />
    </div>
  )
}