import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef } from "react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { X, ChevronDown, Filter } from "lucide-react";
import { useSession } from "@clerk/nextjs";

type Client = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  assigned_rn: string;
  risk: "aggressive" | "hard" | "conservative";
  ekyc_status?: "pending" | "verified" | "rejected";
  plan?: "elite" | "premium" | "standard";
};

type TradeData = {
  stock: string;
  tradeType: "BUY" | "SELL";
  segment: "EQUITY" | "F&O" | "COMMODITIES";
  timeHorizon: "INTRADAY" | "SWING" | "LONGTERM";
  entry: string;
  stoploss: string;
  targets: string[];
  trailingSL: boolean;
  rangeEntry: boolean;
  rangeTarget: boolean;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
};

export default function PostAdviceForm({ 
  selectedStock,
  onSuccess
}: { 
  selectedStock?: string;
  onSuccess?: () => void;
}) {
  const { session } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);

  // Form state
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [segment, setSegment] = useState<"EQUITY" | "F&O" | "COMMODITIES">("EQUITY");
  const [timeHorizon, setTimeHorizon] = useState<"INTRADAY" | "SWING" | "LONGTERM">("INTRADAY");
  const [entryPrice, setEntryPrice] = useState("");
  const [stoplossPrice, setStoplossPrice] = useState("");
  const [targetPrices, setTargetPrices] = useState("");
  const [trailingSL, setTrailingSL] = useState(false);
  const [rangeEntry, setRangeEntry] = useState(false);
  const [rangeTarget, setRangeTarget] = useState(false);

  // Client search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Plan selection
  const [activeTab, setActiveTab] = useState<string>("individual");
  const [availablePlans, setAvailablePlans] = useState<Array<{name: string, count: number}>>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      const supabase = await createClerkSupabaseClient(session);
      const { data, error } = await supabase
        .from("client3")
        .select("plan")
        .not("plan", "is", null);
      
      if (!error && data) {
        // Count clients by plan
        const planCounts: Record<string, number> = {};
        data.forEach(client => {
          if (client.plan) {
            planCounts[client.plan] = (planCounts[client.plan] || 0) + 1;
          }
        });
        
        // Convert to array for rendering
        const plans = Object.entries(planCounts).map(([name, count]) => ({
          name,
          count
        }));
        
        setAvailablePlans(plans);
      }
    };
    
    fetchPlans();
  }, [session]);

  // Fetch clients on search query change
  useEffect(() => { 
    const fetchSearchResults = async () => {
      if (searchQuery.length > 2) {
        const supabase = await createClerkSupabaseClient(session);
        const { data, error } = await supabase
          .from("client3")
          .select("id, name, email, whatsapp, assigned_rn, risk, ekyc_status, plan")
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,assigned_rn.ilike.%${searchQuery}%,risk.ilike.%${searchQuery}%,plan.ilike.%${searchQuery}%`)
          .limit(40);
        
        if (!error) {
          setSearchResults(data || []);
          setShowSearchResults(true);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, session]);

  // Fetch clients by plan
  const fetchClientsByPlan = async (plan: string) => {
    const supabase = await createClerkSupabaseClient(session);
    const { data, error } = await supabase
      .from("client3")
      .select("id, name, email, whatsapp, assigned_rn, risk, ekyc_status, plan")
      .eq("plan", plan)
      .limit(100);
    
    if (!error && data) {
      setSelectedClients(data);
      setSelectedPlan(plan);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setShowPlanSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(`${client.name} (${client.assigned_rn || 'No RN'})`);
    setShowSearchResults(false);
  };

  const handlePlanSelect = (plan: string) => {
    fetchClientsByPlan(plan);
    setShowPlanSelector(false);
  };

  const handleRemoveClient = (clientId: number) => {
    setSelectedClients(prev => prev.filter(client => client.id !== clientId));
  };

  // 
  const handleSubmit = async () => {
    if ((activeTab === "individual" && !selectedClient) || 
        (activeTab === "plan" && (!selectedPlan || selectedClients.length === 0)) || 
        !entryPrice || !stoplossPrice || !targetPrices) {
      alert("Please fill all required fields and select client(s)");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const supabase = await createClerkSupabaseClient(session);
  
      const newTrade: TradeData = {
        stock: selectedStock || "UNKNOWN",
        tradeType,
        segment,
        timeHorizon,
        entry: entryPrice,
        stoploss: stoplossPrice,
        targets: targetPrices.split(",").map(t => t.trim()),
        trailingSL,
        rangeEntry,
        rangeTarget,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
  
      const clientsToNotify = activeTab === "individual" 
        ? [selectedClient!] 
        : selectedClients;
  
      const promises = clientsToNotify.map(async (client) => {
        // Fetch existing trade data
        const { data: existingRow, error: fetchError } = await supabase
          .from("user_trades")
          .select("trade_data")
          .eq("advisor_id", advisorId)  // or use user_id if applicable
          .eq("user_id", client.id)
          .single();
  
        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 = no rows found
          console.error("Fetch error:", fetchError);
          return;
        }
  
        const existingTrades = existingRow?.trade_data || [];
  
        const updatedTrades = [...existingTrades, newTrade];
  
        if (existingRow) {
          // Update existing row
          const { error: updateError } = await supabase
            .from("user_trades")
            .update({
              trade_data: updatedTrades,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", client.id)
            .eq("advisor_id", advisorId);
  
          if (updateError) console.error("Update error:", updateError);
        } else {
          // Insert new row
          const { error: insertError } = await supabase
            .from("user_trades")
            .insert({
              user_id: client.id,
              advisor_id: advisorId,
              trade_data: [newTrade],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
  
          if (insertError) console.error("Insert error:", insertError);
        }
      });
  
      await Promise.all(promises);
  
      // Reset form
      setEntryPrice("");
      setStoplossPrice("");
      setTargetPrices("");
      setSelectedClient(null);
      setSelectedClients([]);
      setSelectedPlan(null);
      setSearchQuery("");
  
      if (onSuccess) onSuccess();
  
    } catch (error) {
      console.error("Error submitting trade:", error);
      alert("Failed to post trade advice");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <Card className="max-w-lg w-full border rounded-xl shadow-lg p-4" ref={searchRef}>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Post advice for {selectedStock}</h2>
        </div>

        <div className="mb-4">
          <Label>Trade Type</Label>
          <RadioGroup 
            value={tradeType} 
            onValueChange={(value: "BUY" | "SELL") => setTradeType(value)}
            className="flex gap-4 mt-1"
          >
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="BUY" /> BUY
            </Label> 
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="SELL" /> SELL
            </Label>
          </RadioGroup>
        </div>

        <div className="mb-4">
          <Label>Segment</Label>
          <RadioGroup 
            value={segment} 
            onValueChange={(value: "EQUITY" | "F&O" | "COMMODITIES") => setSegment(value)}
            className="flex gap-4 mt-1"
          >
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="EQUITY" /> EQUITY
            </Label> 
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="F&O" /> F&O
            </Label>
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="COMMODITIES" /> COMMODITIES
            </Label>
          </RadioGroup>
        </div>

        <div className="mb-4">
          <Label>Time horizon</Label>
          <RadioGroup 
            value={timeHorizon} 
            onValueChange={(value: "INTRADAY" | "SWING" | "LONGTERM") => setTimeHorizon(value)}
            className="flex gap-4 mt-1"
          >
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="INTRADAY" /> INTRADAY
            </Label> 
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="SWING" /> SWING
            </Label>
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="LONGTERM" /> LONGTERM
            </Label>
          </RadioGroup>
        </div>

        <div className="mb-4">
          <Label>Entry</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input 
              type="text" 
              placeholder="₹" 
              className="flex-1" 
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Switch checked={rangeEntry} onCheckedChange={setRangeEntry} />
              <Label>Range</Label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Label>Stoploss</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input 
              type="text" 
              placeholder="₹" 
              className="flex-1" 
              value={stoplossPrice}
              onChange={(e) => setStoplossPrice(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Switch checked={trailingSL} onCheckedChange={setTrailingSL} />
              <Label>Trailing</Label>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Label>Target(s)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input 
              type="text" 
              placeholder="₹ (comma separated for multiple)" 
              className="flex-1" 
              value={targetPrices}
              onChange={(e) => setTargetPrices(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Switch checked={rangeTarget} onCheckedChange={setRangeTarget} />
              <Label>Range</Label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Client</TabsTrigger>
              <TabsTrigger value="plan">Plan/Group</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="mt-2">
              <Label>Search Client</Label>
              <Input 
                type="text" 
                placeholder="Search by name, email, or RN..." 
                className="mt-1" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
              />
              {showSearchResults && searchResults.length > 0 && (
                <ul className="mt-2 border rounded p-2 max-h-60 overflow-y-auto">
                  {searchResults.map((client) => (
                    <li 
                      key={client.id} 
                      className="p-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.email}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{client.assigned_rn || 'No RN'}</Badge>
                        {client.plan && (
                          <Badge variant="secondary">{client.plan}</Badge>
                        )}
                        <Badge variant={client.risk === "aggressive" ? "destructive" : "outline"}>
                          {client.risk}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {selectedClient && (
                <div className="mt-2 p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{selectedClient.name}</span>
                      {selectedClient.ekyc_status && (
                        <Badge className="ml-2" variant={selectedClient.ekyc_status === "verified" ? "success" : "warning"}>
                          {selectedClient.ekyc_status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedClient(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {selectedClient.plan && (
                      <Badge variant="secondary">{selectedClient.plan}</Badge>
                    )}
                    <Badge variant={selectedClient.risk === "aggressive" ? "destructive" : "outline"}>
                      {selectedClient.risk}
                    </Badge>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="plan" className="mt-2">
              <div className="relative">
                <Label>Select Plan/Group</Label>
                <div 
                  className="mt-1 p-2 border rounded flex items-center justify-between cursor-pointer"
                  onClick={() => setShowPlanSelector(!showPlanSelector)}
                >
                  <div>
                    {selectedPlan ? (
                      <div className="flex gap-2 items-center">
                        <Badge variant="secondary">{selectedPlan}</Badge>
                        <span className="text-gray-600">({selectedClients.length} clients)</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a plan</span>
                    )}
                  </div>
                  <ChevronDown size={16} />
                </div>
                
                {showPlanSelector && (
                  <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow-lg p-2 max-h-60 overflow-y-auto">
                    <div className="mb-2 pb-2 border-b">
                      <div className="font-medium">Subscription plans</div>
                    </div>
                    {availablePlans.map((plan) => (
                      <div 
                        key={plan.name}
                        className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                        onClick={() => handlePlanSelect(plan.name)}
                      >
                        <Checkbox checked={selectedPlan === plan.name} />
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-gray-600">{plan.count} clients</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedClients.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Selected Clients ({selectedClients.length})</Label>
                  </div>
                  <div className="border rounded p-2 max-h-40 overflow-y-auto">
                    {selectedClients.slice(0, 5).map((client) => (
                      <div key={client.id} className="flex items-center justify-between py-1 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{client.name}</span>
                          {client.risk && (
                            <Badge className="ml-2" variant={client.risk === "aggressive" ? "destructive" : "outline"}>
                              {client.risk}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedClients.length > 5 && (
                      <div className="text-center text-sm text-gray-500 mt-2">
                        And {selectedClients.length - 5} more clients
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Button 
          className="w-full" 
          disabled={(activeTab === "individual" && !selectedClient) || 
                   (activeTab === "plan" && (!selectedPlan || selectedClients.length === 0)) || 
                   isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Posting..." : `Post Advice to ${activeTab === "individual" ? "Client" : `${selectedClients.length} Clients`}`}
        </Button>
      </CardContent>
    </Card>
  );
}