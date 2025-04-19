"use client";

import { useState } from "react"
import type { Lead } from "./types/lead"
import { X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ActivityTimeline } from "./activity-timeline"
import { ChatInterface } from "./chat-interface"
import { useSession } from '@clerk/nextjs'
import { createClerkSupabaseClient } from "@/utils/supabaseClient"

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
  onStatusChange: () => void
}

export const LeadDetailPanel = ({ lead, onClose, onStatusChange }: LeadDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("activity")
  const [disposition, setDisposition] = useState(lead.disposition || "")
  const [plan, setPlan] = useState(lead.plan || "")
  const { session } = useSession()

  const handleMarkAsCalled = async () => {
    if (!window.confirm("Have you called this lead?")) return

    try {
      const supabase = await createClerkSupabaseClient(session)
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          disposition: disposition || lead.disposition,
          plan: plan || lead.plan || 'standard',
          stage: 'called',
          called: true
        })
        .eq('id', lead.id)

      if (error) throw error

      alert("Lead status updated successfully!")
      onStatusChange()
      onClose()
    } catch (error) {
      console.error("Error updating lead:", error)
      alert("Failed to update lead status")
    }
  }

  // Only show controls for leads in 'lead' stage
  const isLeadStage = lead.stage === 'lead'

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent side="right" className="w-1/3 border-l bg-background flex flex-col h-screen p-0">
        <div>
          <div className="flex items-center justify-between px-4 py-1 border-b">
            <DialogTitle className="text-base font-medium">{lead.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Only show these controls for leads in 'lead' stage */}
          {isLeadStage && (
            <div className="flex items-center gap-2 border border-yellow-500 rounded-md p-2 m-2">
              <select 
                className="border rounded px-2 py-1 text-sm flex-1"
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
              >
                <option value="">Select Disposition</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
              
              <select 
                className="border rounded px-2 py-1 text-sm flex-1"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="">Select Plan</option>
                <option value="elite">Elite</option>
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
              </select>

              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={handleMarkAsCalled}
              >
                <Phone className="h-4 w-4" />
                <span>Mark as Called</span>
              </Button>
            </div>
          )}

          <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 border-b bg-transparent p-0">
              <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Activity</TabsTrigger>
              <TabsTrigger value="chat" className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Chat
                {lead.unreadMessages && lead.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {lead.unreadMessages}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="call" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Call</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Documents</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="flex-1 overflow-auto p-4">
              <ActivityTimeline activities={lead.activities || []} />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <ChatInterface messages={lead.messages || []} />
            </TabsContent>

            <TabsContent value="call" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-muted-foreground mb-2">No call history yet</div>
                <Button>Start a call</Button>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-muted-foreground mb-2">No documents shared yet</div>
                <Button>Upload document</Button>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-muted-foreground mb-2">No notes added yet</div>
                <Button>Add note</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
