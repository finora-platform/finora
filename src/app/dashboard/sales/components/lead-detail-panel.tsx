"use client";

import { useState } from "react";
import { X, Phone, Check, CheckCircle, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ActivityTimeline } from "./activity-timeline";
import { ChatInterface } from "./chat-interface";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";
import { Lead } from "@/app/dashboard/sales/types/lead";


interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  onStatusChange: () => void;
}

export const LeadDetailPanel = ({ lead, onClose, onStatusChange }: LeadDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("activity");
  const [disposition, setDisposition] = useState(lead.disposition || "");
  const [plan, setPlan] = useState(lead.plan || "");
  const [verificationDocUploaded, setVerificationDocUploaded] = useState(false);
  const [riskProfile, setRiskProfile] = useState("");
  const [contractUploaded, setContractUploaded] = useState(false);
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);
  const { session } = useSession();

  const handleMarkAsCalled = async () => {
    if (!window.confirm("Have you called this lead?")) return;

    try {
      const supabase = await createClerkSupabaseClient(session);
      const { error } = await supabase
        .from('leads')
        .update({ 
          disposition: disposition || lead.disposition,
          plan: plan || lead.plan || 'standard',
          stage: 'called',
          called: true
        })
        .eq('id', lead.id);

      if (error) throw error;

      alert("Lead status updated successfully!");
      onStatusChange();
      onClose();
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead status");
    }
  };

  const handleMarkAsSubscribed = async () => {
    if (!window.confirm("Mark this lead as subscribed?")) return;

    try {
      const supabase = await createClerkSupabaseClient(session);
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage: 'subscribed'
        })
        .eq('id', lead.id);

      if (error) throw error;

      alert("Lead marked as subscribed successfully!");
      onStatusChange();
      onClose();
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead status");
    }
  };

  const handleVerifyOnboarding = async () => {
    if (!window.confirm("Complete onboarding and add to clients?")) return;
  
    try {
      const supabase = await createClerkSupabaseClient(session);
      
      // Get advisor ID from session
      const advisorId = session?.user?.id || 'unknown';

      // 1. Update lead status to onboarded
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          stage: 'onboarded',
          updated_at: new Date().toISOString(),
          document:true
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // 2. Add to client3 table
      const clientData = {
        name: lead.name,
        email: lead.email,
        whatsapp: lead.phone,
        role: 'client',
        assigned_rn: lead.assigned_rm || 'unassigned',
        risk: riskProfile || 'medium',
        ekyc_status: verificationDocUploaded ? 'verified' : 'pending',
        plan: lead.plan || 'standard',
        // status: 'active',
        // source: 'lead_conversion',
        created_at: new Date().toISOString(),
        // lead_id: lead.id,
        user_id: advisorId,
        // documents: {
        //   verification: verificationDocUploaded,
        //   contract: contractUploaded
        // }
      };

      const { error: clientError } = await supabase
        .from('client3')
        .insert([clientData]);

      if (clientError) throw clientError;

      alert("Client successfully onboarded and added to system!");
      onStatusChange();
      onClose();
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Failed to complete onboarding");
    }
  };

  const handleRiskProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRiskProfile(e.target.value);
  };

  const isLeadStage = lead.stage === 'lead';
  const isCalled = lead.stage === 'called';
  const isSubscribed = lead.stage === 'subscribed';
  const isOnboarding = lead.stage === 'onboarded';
  const allDocumentsUploaded = verificationDocUploaded && riskProfile && contractUploaded;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent side="right" className="w-1/3 border-l bg-background flex flex-col h-screen p-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1 border-b">
            <DialogTitle className="text-base font-medium">{lead.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status display */}
          {isOnboarding ? (
            <div className="flex items-center gap-2 border border-blue-500 rounded-md p-2 m-2 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-700">Onboarding</span>
            </div>
          ) : isSubscribed ? (
            <div className="flex items-center gap-2 border border-green-500 rounded-md p-2 m-2 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-700" />
              <span className="text-sm font-medium text-green-700">Subscribed</span>
            </div>
          ) : isCalled ? (
            <div className="flex items-center gap-2 border border-green-500 rounded-md p-2 m-2 bg-green-50">
              <Check className="h-4 w-4 text-green-700" />
              <span className="text-sm font-medium text-green-700">Called</span>
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
                onClick={handleMarkAsSubscribed}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Subscribed
              </Button>
            </div>
          ) : isLeadStage ? (
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
          ) : null}

          <Tabs defaultValue="activity" className="flex-1 flex flex-col overflow-hidden">
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
              <ChatInterface messages={lead.messages || []} />
            </TabsContent>

            <TabsContent value="call" className="flex-1 p-4">
              <div className="flex flex-col items-center justify-center h-full text-center">
                {isOnboarding ? (
                  <div className="text-muted-foreground">Onboarding in progress</div>
                ) : isSubscribed ? (
                  <>
                    <div className="text-muted-foreground mb-2">Lead has subscribed</div>
                    <Button onClick={() => setActiveTab("documents")}>
                      Begin Onboarding
                    </Button>
                  </>
                ) : isCalled ? (
                  <>
                    <div className="text-muted-foreground mb-2">Call completed</div>
                    <div className="text-sm mb-4">Disposition: {lead.disposition || 'Not specified'}</div>
                    <div className="text-sm">Plan: {lead.plan || 'Not specified'}</div>
                    <Button className="mt-4" onClick={handleMarkAsSubscribed}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Subscribed
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground mb-2">No call history yet</div>
                    <Button>Start a call</Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="flex-1 p-4">
              {isSubscribed || isOnboarding ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Verification document
                    </h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setVerificationDocUploaded(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    {verificationDocUploaded && (
                      <span className="ml-2 text-sm text-green-600">✓ Uploaded</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Risk Profile</h3>
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
                    {riskProfile && (
                      <span className="text-sm text-green-600">✓ Selected: {riskProfile}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Signed contract
                    </h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setContractUploaded(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    {contractUploaded && (
                      <span className="ml-2 text-sm text-green-600">✓ Uploaded</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="compliance-check"
                        checked={complianceConfirmed}
                        onChange={(e) => setComplianceConfirmed(e.target.checked)}
                      />
                      <label htmlFor="compliance-check" className="text-sm">
                        Confirm compliant onboarding
                      </label>
                    </div>

                    <Button
                      className="w-full mt-4"
                      disabled={!allDocumentsUploaded || !complianceConfirmed}
                      onClick={handleVerifyOnboarding}
                    >
                      Complete Onboarding
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-muted-foreground mb-2">No documents shared yet</div>
                  <Button>Upload document</Button>
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
  );
};