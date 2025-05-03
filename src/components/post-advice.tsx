"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { X, SendHorizonal, Users } from "lucide-react"
import { useSession } from "@clerk/nextjs"

type Client = {
  id: number
  name: string
  email: string
  whatsapp: string
  assigned_rn: string
  risk: "aggressive" | "hard" | "conservative"
  ekyc_status?: "pending" | "verified" | "rejected"
  plan?: "elite" | "premium" | "standard"
}

type TradeData = {
  stock: string
  tradeType: "BUY" | "SELL"
  segment: "EQUITY" | "F&O" | "COMMODITIES"
  timeHorizon: "INTRADAY" | "SWING" | "LONGTERM"
  entry: string
  stoploss: string
  targets: string[]
  trailingSL: boolean
  rangeEntry: boolean
  rangeTarget: boolean
  status: "ACTIVE" | "COMPLETED"
  createdAt: string
}

// Utility function to generate WhatsApp link
const getWhatsAppLink = (phone: string, message = "") => {
  // Remove any non-digit characters and leading zeros
  const cleanedPhone = phone.replace(/\D/g, "").replace(/^0+/, "")
  // URL encode the message
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
}

// Utility function to generate WhatsApp group link
const getWhatsAppGroupLink = (message = "") => {
  // URL encode the message
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/?text=${encodedMessage}`
}

export default function PostAdviceForm({
  selectedStock,
  onSuccess,
}: {
  selectedStock?: string
  onSuccess?: () => void
}) {
  const { session } = useSession()
  const searchRef = useRef<HTMLDivElement>(null)

  // Form state
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY")
  const [segment, setSegment] = useState<"EQUITY" | "F&O" | "COMMODITIES">("EQUITY")
  const [timeHorizon, setTimeHorizon] = useState<"INTRADAY" | "SWING" | "LONGTERM">("INTRADAY")
  const [entryPrice, setEntryPrice] = useState("")
  const [stoplossPrice, setStoplossPrice] = useState("")
  const [targetPrices, setTargetPrices] = useState("")
  const [trailingSL, setTrailingSL] = useState(false)
  const [rangeEntry, setRangeEntry] = useState(false)
  const [rangeTarget, setRangeTarget] = useState(false)

  // Client search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // WhatsApp group option
  const [sendToGroup, setSendToGroup] = useState(false)
  const [groupName, setGroupName] = useState("")

  // Plan options
  const [availablePlans, setAvailablePlans] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [planClients, setPlanClients] = useState<Client[]>([])
  const [updateDatabase, setUpdateDatabase] = useState(true)

  // Generate default WhatsApp message
  const getDefaultMessage = (client: Client) => {
    return (
      `Hi ${client.name},\n\nHere's your trade advice for ${selectedStock}:\n\n` +
      `Trade: ${tradeType}\n` +
      `Entry: ${entryPrice}\n` +
      `Stop Loss: ${stoplossPrice}\n` +
      `Targets: ${targetPrices.replace(/,/g, ", ")}\n\n` +
      `Regards,\n${session?.user?.firstName || "Your Advisor"}`
    )
  }

  // Generate group message
  const getGroupMessage = () => {
    const groupTitle = selectedPlan ? `${selectedPlan.toUpperCase()} Plan` : groupName ? `${groupName} Group` : "Group"
    return (
      `Hi ${groupTitle},\n\nHere's trade advice for ${selectedStock}:\n\n` +
      `Trade: ${tradeType}\n` +
      `Segment: ${segment}\n` +
      `Time Horizon: ${timeHorizon}\n` +
      `Entry: ${entryPrice}${rangeEntry ? " (Range)" : ""}\n` +
      `Stop Loss: ${stoplossPrice}${trailingSL ? " (Trailing)" : ""}\n` +
      `Targets: ${targetPrices.replace(/,/g, ", ")}${rangeTarget ? " (Range)" : ""}\n\n` +
      `Regards,\n${session?.user?.firstName || "Your Advisor"}`
    )
  }

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      const supabase = await createClerkSupabaseClient(session)
      const { data, error } = await supabase.from("client3").select("plan").not("plan", "is", null)

      if (!error && data) {
        const uniquePlans = [...new Set(data.map((client) => client.plan).filter(Boolean))]
        setAvailablePlans(uniquePlans as string[])
      }
    }

    fetchPlans()
  }, [session])

  // Fetch clients by plan
  const fetchClientsByPlan = async (plan: string) => {
    const supabase = await createClerkSupabaseClient(session)
    const { data, error } = await supabase
      .from("client3")
      .select("id, name, email, whatsapp, assigned_rn, risk, ekyc_status, plan")
      .eq("plan", plan)
      .limit(100)

    if (!error && data) {
      setPlanClients(data)
    } else {
      setPlanClients([])
    }
  }

  // Fetch clients on search query change
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.length > 2) {
        const supabase = await createClerkSupabaseClient(session)
        const { data, error } = await supabase
          .from("client3")
          .select("id, name, email, whatsapp, assigned_rn, risk, ekyc_status, plan")
          .or(
            `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,assigned_rn.ilike.%${searchQuery}%,risk.ilike.%${searchQuery}%,plan.ilike.%${searchQuery}%`,
          )
          .limit(40)

        if (!error) {
          setSearchResults(data || [])
          setShowSearchResults(true)
        }
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }

    const debounceTimer = setTimeout(fetchSearchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, session])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchQuery(`${client.name} (${client.assigned_rn || "No RN"})`)
    setShowSearchResults(false)
  }

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan)
    fetchClientsByPlan(plan)
  }

  // Get the appropriate WhatsApp URL based on selected option
  const getWhatsAppUrl = () => {
    if (sendToGroup) {
      return getWhatsAppGroupLink(getGroupMessage())
    } else if (selectedClient?.whatsapp) {
      return getWhatsAppLink(selectedClient.whatsapp, getDefaultMessage(selectedClient))
    }
    return null
  }

  const handleSubmit = async () => {
    if (!entryPrice || !stoplossPrice || !targetPrices) {
      alert("Please fill all required trade details")
      return
    }

    if (!sendToGroup && !selectedClient) {
      alert("Please select a client")
      return
    }

    if (sendToGroup && updateDatabase && !selectedPlan) {
      alert("Please select a plan to update the database")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = await createClerkSupabaseClient(session)
      const advisorId = session?.user.id

      const newTrade: TradeData = {
        stock: selectedStock || "UNKNOWN",
        tradeType,
        segment,
        timeHorizon,
        entry: entryPrice,
        stoploss: stoplossPrice,
        targets: targetPrices.split(",").map((t) => t.trim()),
        trailingSL,
        rangeEntry,
        rangeTarget,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      }

      // Update database for individual client
      if (!sendToGroup && selectedClient) {
        // Fetch existing trade data
        const { data: existingRow, error: fetchError } = await supabase
          .from("user_trades")
          .select("trade_data")
          .eq("advisor_id", advisorId)
          .eq("user_id", selectedClient.id)
          .single()

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Fetch error:", fetchError)
          return
        }

        const existingTrades = existingRow?.trade_data || []
        const updatedTrades = [...existingTrades, newTrade]

        if (existingRow) {
          // Update existing row
          await supabase
            .from("user_trades")
            .update({
              trade_data: updatedTrades,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", selectedClient.id)
            .eq("advisor_id", advisorId)
        } else {
          // Insert new row
          await supabase.from("user_trades").insert({
            user_id: selectedClient.id,
            advisor_id: advisorId,
            trade_data: [newTrade],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      // Update database for all clients in the selected plan
      if (sendToGroup && updateDatabase && selectedPlan && planClients.length > 0) {
        const promises = planClients.map(async (client) => {
          // Fetch existing trade data
          const { data: existingRow, error: fetchError } = await supabase
            .from("user_trades")
            .select("trade_data")
            .eq("advisor_id", advisorId)
            .eq("user_id", client.id)
            .single()

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Fetch error for client", client.id, fetchError)
            return
          }

          const existingTrades = existingRow?.trade_data || []
          const updatedTrades = [...existingTrades, newTrade]

          if (existingRow) {
            // Update existing row
            await supabase
              .from("user_trades")
              .update({
                trade_data: updatedTrades,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", client.id)
              .eq("advisor_id", advisorId)
          } else {
            // Insert new row
            await supabase.from("user_trades").insert({
              user_id: client.id,
              advisor_id: advisorId,
              trade_data: [newTrade],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }
        })

        await Promise.all(promises)
      }

      // Open WhatsApp after successful submission
      const whatsappUrl = getWhatsAppUrl()
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank")
      }

      // Reset form
      setEntryPrice("")
      setStoplossPrice("")
      setTargetPrices("")
      setSelectedClient(null)
      setSearchQuery("")
      setSendToGroup(false)
      setGroupName("")
      setSelectedPlan(null)
      setPlanClients([])

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error submitting trade:", error)
      alert("Failed to post trade advice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-lg w-full border rounded-xl shadow-lg bg-white" ref={searchRef}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-purple-800">
            {selectedStock ? `Trade Advice: ${selectedStock}` : "New Trade Advice"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Trade Type</Label>
              <RadioGroup
                value={tradeType}
                onValueChange={(value: "BUY" | "SELL") => setTradeType(value)}
                className="flex gap-6 mt-1"
              >
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="BUY" />
                  <span className="text-green-700 font-medium">BUY</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="SELL" />
                  <span className="text-red-700 font-medium">SELL</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Segment</Label>
                <RadioGroup
                  value={segment}
                  onValueChange={(value: "EQUITY" | "F&O" | "COMMODITIES") => setSegment(value)}
                  className="flex flex-col gap-2 mt-1"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="EQUITY" /> EQUITY
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="F&O" /> F&O
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="COMMODITIES" /> COMMODITIES
                  </Label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Time Horizon</Label>
                <RadioGroup
                  value={timeHorizon}
                  onValueChange={(value: "INTRADAY" | "SWING" | "LONGTERM") => setTimeHorizon(value)}
                  className="flex flex-col gap-2 mt-1"
                >
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="INTRADAY" /> INTRADAY
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="SWING" /> SWING
                  </Label>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="LONGTERM" /> LONGTERM
                  </Label>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Entry Price</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  placeholder="₹"
                  className="flex-1 bg-white"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Switch checked={rangeEntry} onCheckedChange={setRangeEntry} />
                  <Label className="cursor-pointer">Range</Label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Stoploss</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  placeholder="₹"
                  className="flex-1 bg-white"
                  value={stoplossPrice}
                  onChange={(e) => setStoplossPrice(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Switch checked={trailingSL} onCheckedChange={setTrailingSL} />
                  <Label className="cursor-pointer">Trailing</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Target(s)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  placeholder="₹ (comma separated for multiple)"
                  className="flex-1 bg-white"
                  value={targetPrices}
                  onChange={(e) => setTargetPrices(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Switch checked={rangeTarget} onCheckedChange={setRangeTarget} />
                  <Label className="cursor-pointer">Range</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Send To</Label>
              <RadioGroup
                value={sendToGroup ? "group" : "individual"}
                onValueChange={(value) => {
                  setSendToGroup(value === "group")
                  if (value === "group") {
                    setSelectedClient(null)
                  } else {
                    setSelectedPlan(null)
                    setPlanClients([])
                  }
                }}
                className="flex gap-6 mt-1"
              >
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="individual" />
                  <span className="font-medium">Individual Client</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="group" />
                  <span className="font-medium flex items-center gap-1">
                    <Users size={16} />
                    WhatsApp Group
                  </span>
                </Label>
              </RadioGroup>
            </div>

            {sendToGroup ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Select Plan</Label>
                  <Select value={selectedPlan || ""} onValueChange={handlePlanChange}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPlan && planClients.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {planClients.length} clients with {selectedPlan.toUpperCase()} plan
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="update-database" checked={updateDatabase} onCheckedChange={setUpdateDatabase} />
                  <Label htmlFor="update-database" className="cursor-pointer">
                    Update database for all clients with this plan
                  </Label>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Group Name (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="Enter group name"
                    className="mt-1 bg-white"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will open WhatsApp with a pre-filled message that you can send to any group
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Search Client</Label>
                <Input
                  type="text"
                  placeholder="Search by name, email, or RN..."
                  className="mt-1 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <ul className="mt-2 border rounded bg-white p-2 max-h-60 overflow-y-auto z-10 absolute w-[calc(100%-2.5rem)]">
                    {searchResults.map((client) => (
                      <li
                        key={client.id}
                        className="p-2 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-600">{client.email}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{client.assigned_rn || "No RN"}</Badge>
                          {client.plan && <Badge variant="secondary">{client.plan}</Badge>}
                          <Badge variant={client.risk === "aggressive" ? "destructive" : "outline"}>
                            {client.risk}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedClient && (
                  <div className="mt-3 p-3 border rounded bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{selectedClient.name}</span>
                        {selectedClient.ekyc_status && (
                          <Badge
                            className="ml-2"
                            variant={selectedClient.ekyc_status === "verified" ? "success" : "warning"}
                          >
                            {selectedClient.ekyc_status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelectedClient(null)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {selectedClient.plan && <Badge variant="secondary">{selectedClient.plan}</Badge>}
                      <Badge variant={selectedClient.risk === "aggressive" ? "destructive" : "outline"}>
                        {selectedClient.risk}
                      </Badge>
                      <Badge variant="outline">{selectedClient.assigned_rn || "No RN"}</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
          disabled={
            (!sendToGroup && !selectedClient) ||
            (sendToGroup && updateDatabase && !selectedPlan) ||
            isSubmitting ||
            !entryPrice ||
            !stoplossPrice ||
            !targetPrices
          }
          onClick={handleSubmit}
        >
          <SendHorizonal size={16} />
          {isSubmitting
            ? "Posting..."
            : sendToGroup
              ? `Send to ${selectedPlan ? selectedPlan.toUpperCase() + " Plan" : "WhatsApp Group"}${updateDatabase ? " & Update Database" : ""}`
              : "Send to Individual Client"}
        </Button>
      </CardContent>
    </Card>
  )
}
