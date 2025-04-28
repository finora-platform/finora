"use client"

import { useState } from "react";
import type { Lead } from "../types/lead";
import { Phone, Check, CheckCircle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ActivityTimeline } from "./activity-timeline";
import { ChatInterface } from "./chat-interface";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";


interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
  onStatusChange: () => void
}

export const LeadDetailPanel = ({ lead, onClose, onStatusChange }: LeadDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("activity")
  const [disposition, setDisposition] = useState(lead.disposition || "")
  const [plan, setPlan] = useState(lead.plan || "")
  const [verificationDocUploaded, setVerificationDocUploaded] = useState(false)
  const [riskProfile, setRiskProfile] = useState("")
  const [contractUploaded, setContractUploaded] = useState(false)
  const [complianceConfirmed, setComplianceConfirmed] = useState(false)
  const [isSendingProfileForm, setIsSendingProfileForm] = useState(false)
  const [isSendingPaymentLink, setIsSendingPaymentLink] = useState(false)
  const { session } = useSession()

  const isLeadStage = lead.stage === 'lead'
  const isContacted = lead.stage === 'contacted'
  const isDocumented = lead.stage === 'documented'
  const isPaid = lead.stage === 'paid'
  const allDocumentsUploaded = verificationDocUploaded && riskProfile && contractUploaded

  const handleMarkAsContacted = async () => {
    if (!window.confirm("Have you contacted this lead?")) return

    try {
      const supabase = await createClerkSupabaseClient(session)
      
      const { data: currentLead, error: fetchError } = await supabase
        .from('leads')
        .select('stage')
        .eq('id', lead.id)
        .single()

      if (fetchError) throw fetchError
      
      if (currentLead.stage !== 'lead') {
        throw new Error(`Cannot mark as contacted from current status: ${currentLead.stage}`)
      }

      const { error } = await supabase
        .from('leads')
        .update({ 
          disposition: disposition || lead.disposition,
          plan: plan || lead.plan || 'standard',
          stage: 'contacted',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      const { error: historyError } = await supabase
        .from('lead_status_history')
        .insert({
          lead_id: lead.id,
          old_status: 'lead',
          new_status: 'contacted',
          changed_at: new Date().toISOString()
        })

      if (historyError) throw historyError

      alert("Lead status updated successfully!")
      onStatusChange()
    } catch (error) {
      console.error("Error updating lead:", error)
      alert(`Failed to update lead status: ${error.message}`)
    }
  }

  const handleMarkAsDocumented = async () => {
    if (!window.confirm("Mark this lead as documented?")) return

    try {
      const supabase = await createClerkSupabaseClient(session)
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: 'documented',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      alert("Lead marked as documented successfully!")
      onStatusChange()
    } catch (error) {
      console.error("Error updating lead:", error)
      alert("Failed to update lead status")
    }
  }

  const handleVerifyPayment = async () => {
    if (!window.confirm("Complete documentation and mark as paid?")) return
  
    try {
      const supabase = await createClerkSupabaseClient(session)
      const advisorId = session?.user?.id || 'unknown'

      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          stage: 'paid',
          updated_at: new Date().toISOString(),
          document: true
        })
        .eq('id', lead.id)

      if (leadError) throw leadError

      const clientData = {
        name: lead.name,
        email: lead.email,
        whatsapp: lead.phone,
        role: 'client',
        assigned_rn: lead.assigned_rm || 'unassigned',
        risk: riskProfile || 'medium',
        ekyc_status: verificationDocUploaded ? 'verified' : 'pending',
        plan: lead.plan || 'standard',
        created_at: new Date().toISOString(),
        user_id: advisorId,
      }

      const { error: clientError } = await supabase
        .from('client3')
        .insert([clientData])

      if (clientError) throw clientError

      alert("Client successfully documented and marked as paid!")
      onStatusChange()
      onClose()
    } catch (error) {
      console.error("Payment verification error:", error)
      alert("Failed to complete payment verification")
    }
  }

  const handleRiskProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRiskProfile(e.target.value)
  }

  const handleSendProfileForm = async () => {
    setIsSendingProfileForm(true)
    try {
      const supabase = await createClerkSupabaseClient(session)
      const { error } = await supabase
        .from('leads')
        .update({ 
          profile_form_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      alert("Profile form sent successfully!")
    } catch (error) {
      console.error("Error sending profile form:", error)
      alert("Failed to send profile form")
    } finally {
      setIsSendingProfileForm(false)
    }
  }

  const handleSendPaymentLink = async () => {
    setIsSendingPaymentLink(true)
    try {
      const supabase = await createClerkSupabaseClient(session)
      const { error } = await supabase
        .from('leads')
        .update({ 
          payment_link_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error

      alert("Payment link sent successfully!")
    } catch (error) {
      console.error("Error sending payment link:", error)
      alert("Failed to send payment link")
    } finally {
      setIsSendingPaymentLink(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent side="right" className="w-1/3 border-l bg-background flex flex-col h-screen p-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1 border-b">
            <DialogTitle className="text-base font-medium">{lead.name}</DialogTitle>
          </div>

          {/* Status display */}
          {isPaid ? (
            <div className="flex items-center gap-2 border border-green-500 rounded-md p-2 m-2 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-700" />
              <span className="text-sm font-medium text-green-700">Paid</span>
            </div>
          ) : isDocumented ? (
            <div className="flex items-center gap-2 border border-blue-500 rounded-md p-2 m-2 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-700">Documented</span>
              <Button 
                variant="default" 
                size="sm"
                className="ml-auto"
                onClick={handleVerifyPayment}
                disabled={!allDocumentsUploaded || !complianceConfirmed}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete Onboarding
              </Button>
            </div>
          ) : isContacted ? (
            <div className="flex items-center gap-2 border border-green-500 rounded-md p-2 m-2 bg-green-50">
              <Check className="h-4 w-4 text-green-700" />
              <span className="text-sm font-medium text-green-700">Contacted</span>
              {lead.disposition && (
                <span className="text-sm capitalize">{lead.disposition}</span>
              )}
              {lead.plan && (
                <span className="text-sm capitalize ml-2">{lead.plan} plan</span>
              )}
              <Button 
                variant="default" 
                size="sm"
                className="ml-auto"
                onClick={handleMarkAsDocumented}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Documented
              </Button>
            </div>
          ) : isLeadStage ? (
            <div className="flex items-center gap-2 border p-2 m-2">
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
                onClick={handleMarkAsContacted}
              >
                <Phone className="h-4 w-4" />
                <span>Mark as Contacted</span>
              </Button>
            </div>
          ) : null}

          <Tabs defaultValue="activity" className="overflow-hidden">
            <TabsList className="grid grid-cols-5 border-b bg-transparent p-0">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="chat" className="relative">
                Chat
                {lead.unreadMessages && lead.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {lead.unreadMessages}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="call">Call</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="flex-1 overflow-auto p-4">
              <ActivityTimeline activities={lead.activities || []} />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <ChatInterface 
                messages={lead.messages || []} 
                stage={lead.stage}
                onSendProfileForm={handleSendProfileForm}
                onSendPaymentLink={handleSendPaymentLink}
              />
            </TabsContent>

            <TabsContent value="call" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                {isPaid ? (
                  <div className="text-muted-foreground">Payment completed</div>
                ) : isDocumented ? (
                  <>
                    <div className="text-muted-foreground mb-2">Lead has been documented</div>
                    <Button onClick={() => setActiveTab("documents")}>
                      Verify Payment
                    </Button>
                  </>
                ) : isContacted ? (
                  <>
                    <div className="text-muted-foreground mb-2">Contact completed</div>
                    <div className="text-sm mb-4">Disposition: {lead.disposition || 'Not specified'}</div>
                    <div className="text-sm">Plan: {lead.plan || 'Not specified'}</div>
                    <Button className="mt-4" onClick={handleMarkAsDocumented}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Documented
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground mb-2">No contact history yet</div>
                    <Button>Start contact</Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="flex-1 p-4">
              {isDocumented || isPaid ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Identity Verification
                    </h3>
                    {lead.identity_verified ? (
                      <div className="text-sm text-green-600">✓ Verified</div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Client must provide government ID (Aadhaar, PAN, etc.)
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => setVerificationDocUploaded(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Verification
                        </Button>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Risk Profile</h3>
                    {lead.risk_profile ? (
                      <div className="text-sm text-green-600">
                        ✓ Completed: {lead.risk_profile}
                      </div>
                    ) : (
                      <>
                        <select 
                          className="border rounded px-3 py-2 text-sm w-full"
                          value={riskProfile}
                          onChange={handleRiskProfileChange}
                        >
                          <option value="">Select risk profile</option>
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                        </select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on client's profile form responses
                        </p>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Signed Contract
                    </h3>
                    {lead.contract_signed ? (
                      <div className="text-sm text-green-600">✓ Signed and Uploaded</div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          Client must sign the service agreement
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => setContractUploaded(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Signed Contract
                        </Button>
                      </>
                    )}
                  </div>

                  {!isPaid && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="compliance-check"
                          checked={complianceConfirmed}
                          onChange={(e) => setComplianceConfirmed(e.target.checked)}
                        />
                        <label htmlFor="compliance-check" className="text-sm">
                          Confirm all documents are complete and verified
                        </label>
                      </div>

                      <Button
                        className="w-full mt-4"
                        disabled={!allDocumentsUploaded || !complianceConfirmed}
                        onClick={handleVerifyPayment}
                      >
                        Complete Onboarding
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-muted-foreground mb-2">
                    {isContacted 
                      ? "Please send the profile form to collect client information"
                      : "Documents will be available after initial contact"}
                  </div>
                  {isContacted && (
                    <Button onClick={handleSendProfileForm}>
                      Send Profile Form
                    </Button>
                  )}
                </div>
              )}
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
  )
}