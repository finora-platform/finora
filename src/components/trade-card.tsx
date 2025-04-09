"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Edit, Plus, Trash2, X } from "lucide-react"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"
// import { useToast } from "@/hooks/use-toast"
// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface Trade {
  id: number
  user_id: number
  client_name?: string // Add this line
  trade_data: {
    stock: string
    tradeType: "BUY" | "SELL"
    segment: "EQUITY" | "F&O" | "COMMODITIES"
    timeHorizon: "INTRADAY" | "SWING" | "LONGTERM"
    entry: string
    stoploss: string
    targets: string[]
    status: "ACTIVE" | "COMPLETED" | "EXITED"
    exitPrice?: string
    exitDate?: string
    exitReason?: string
    pnl?: string
    createdAt: string
    updatedAt?: string
  }
  created_at: string
}

interface TradeCardProps {
  trade: Trade
  isLast: boolean
  onTradeUpdate: (updatedTrade: Trade) => Promise<void>
  onTradeExit: (tradeId: number, exitData: any) => Promise<void>
}

// TradeCard component with edit and exit capabilities
export const AdvisoryTradeCard = ({ trade, isLast, onTradeUpdate, onTradeExit }: TradeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [editedTrade, setEditedTrade] = useState<Trade>(trade)
  const [exitData, setExitData] = useState({
    exitPrice: "",
    exitReason: "",
    pnl: "",
  })
//   const {toast}= useToast();

  const tradeData = trade.trade_data

  const handleEditSubmit = async () => {
  try {
    await onTradeUpdate({
      ...editedTrade,
      trade_data: {
        ...editedTrade.trade_data,
        updatedAt: new Date().toISOString() // Ensure updatedAt is set
      }
    })
    setIsEditing(false)
    console.log("Trade updated successfully.")
  } catch (error) {
    console.error("Error updating trade:", error)
  }
}
  
  const handleExitSubmit = async () => {
    try {
      await onTradeExit(trade.id, {
        ...exitData,
        exitDate: new Date().toISOString(),
      })
      setIsExiting(false)
    //   toast({
    //     title: "Trade exited",
    //     description: "The trade has been successfully exited.",
    //     variant: "default",
    //   })
    } catch (error) {
    //   toast({
    //     title: "Exit failed",
    //     description: "There was an error exiting the trade.",
    //     variant: "destructive",
    //   })
    }
  }

  const handleEditChange = (field: string, value: any) => {
    setEditedTrade({
      ...editedTrade,
      trade_data: {
        ...editedTrade.trade_data,
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  return (
    <div className={`p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition ${isLast ? "" : "mb-4"}`}>
      {/* Top Section */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Left Section (Type & Name) */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`font-semibold ${tradeData?.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}>
            {tradeData?.tradeType || "N/A"}
          </span>
          <span className="text-gray-500">{tradeData?.stock || "Unknown Stock"}</span>
          {tradeData?.segment && <Badge variant="outline">{tradeData.segment}</Badge>}
          {tradeData?.timeHorizon && <Badge variant="outline">{tradeData.timeHorizon}</Badge>}
          {tradeData?.status && (
            <Badge
              variant={
                tradeData.status === "ACTIVE"
                  ? "default"
                  : tradeData.status === "COMPLETED"
                    ? "secondary"
                    : "destructive"
              }
            >
              {tradeData.status}
            </Badge>
          )}
        </div>

        {/* Right Section (Date & Time) */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📅 {formatDate(trade.created_at)}</span>
          <span>⏰ {formatTime(trade.created_at)}</span>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="mt-4 p-4 border-t bg-white rounded-md shadow-sm flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={tradeData?.tradeType === "BUY" ? "success" : "destructive"}>
                {tradeData?.tradeType || "N/A"}
              </Badge>
              <span className="font-bold text-lg">{tradeData?.stock || "Unknown Stock"}</span>
              {tradeData?.segment && <Badge variant="outline">{tradeData.segment}</Badge>}
              {tradeData?.status && (
                <Badge
                  variant={
                    tradeData.status === "ACTIVE"
                      ? "default"
                      : tradeData.status === "COMPLETED"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {tradeData.status}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {tradeData.status === "ACTIVE" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-600 hover:bg-purple-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExiting(true)
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Exit Trade
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Entry, Stoploss, and Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm text-gray-700">
            <div>
              <p className="flex items-center gap-1 font-medium">⏳ Entry</p>
              <span className="text-gray-900 font-semibold">{tradeData?.entry ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 font-medium">🚫 Stoploss</p>
              <span className="text-gray-900 font-semibold">{tradeData?.stoploss ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 font-medium">🚩 Target(s)</p>
              <span className="text-gray-900 font-semibold">
                {tradeData?.targets?.length > 0 ? tradeData.targets.join(" » ") : "No targets"}
              </span>
            </div>
          </div>

          {/* Exit Information (if exited) */}
          {tradeData.status === "EXITED" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              <div>
                <p className="flex items-center gap-1 font-medium">💰 Exit Price</p>
                <span className="text-gray-900 font-semibold">{tradeData?.exitPrice ?? "—"}</span>
              </div>
              <div>
                <p className="flex items-center gap-1 font-medium">📊 P&L</p>
                <span
                  className={`font-semibold ${tradeData?.pnl?.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                >
                  {tradeData?.pnl ?? "—"}
                </span>
              </div>
              <div>
                <p className="flex items-center gap-1 font-medium">📝 Exit Reason</p>
                <span className="text-gray-900 font-semibold">{tradeData?.exitReason ?? "—"}</span>
              </div>
              <div className="col-span-3">
                <p className="flex items-center gap-1 font-medium">📅 Exit Date</p>
                <span className="text-gray-900 font-semibold">
                  {tradeData?.exitDate ? `${formatDate(tradeData.exitDate)} at ${formatTime(tradeData.exitDate)}` : "—"}
                </span>
              </div>
            </div>
          )}

          {/* Date & Debug Info */}
          <div className="mt-4 text-zinc-800 text-sm">
            <p>
              <strong>📩 Created At:</strong> {formatDate(trade.created_at)} at {formatTime(trade.created_at)}
            </p>
            {tradeData.updatedAt && (
              <p>
                <strong>🔄 Last Updated:</strong> {formatDate(tradeData.updatedAt)} at {formatTime(tradeData.updatedAt)}
              </p>
            )}

            {/* Debug JSON Output */}
            <details className="mt-3 bg-gray-100 p-2 rounded-md">
              <summary className="cursor-pointer text-gray-700 font-medium">🔍 View Raw Trade JSON</summary>
              <pre className="text-xs mt-2 text-gray-600 overflow-x-auto">{JSON.stringify(trade, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}

      {/* Edit Trade Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Trade: {tradeData.stock}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry">Entry Price</Label>
                <Input
                  id="entry"
                  value={editedTrade.trade_data.entry}
                  onChange={(e) => handleEditChange("entry", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stoploss">Stop Loss</Label>
                <Input
                  id="stoploss"
                  value={editedTrade.trade_data.stoploss}
                  onChange={(e) => handleEditChange("stoploss", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targets">Targets (comma separated)</Label>
              <Input
                id="targets"
                value={editedTrade.trade_data.targets.join(", ")}
                onChange={(e) =>
                  handleEditChange(
                    "targets",
                    e.target.value.split(",").map((t) => t.trim()),
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="segment">Segment</Label>
                <Select
                  value={editedTrade.trade_data.segment}
                  onValueChange={(value) => handleEditChange("segment", value)}
                >
                  <SelectTrigger id="segment">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQUITY">Equity</SelectItem>
                    <SelectItem value="F&O">F&O</SelectItem>
                    <SelectItem value="COMMODITIES">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeHorizon">Time Horizon</Label>
                <Select
                  value={editedTrade.trade_data.timeHorizon}
                  onValueChange={(value) => handleEditChange("timeHorizon", value)}
                >
                  <SelectTrigger id="timeHorizon">
                    <SelectValue placeholder="Select time horizon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTRADAY">Intraday</SelectItem>
                    <SelectItem value="SWING">Swing</SelectItem>
                    <SelectItem value="LONGTERM">Long Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Trade Dialog */}
      <Dialog open={isExiting} onOpenChange={setIsExiting}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Exit Trade: {tradeData.stock}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                value={exitData.exitPrice}
                onChange={(e) => setExitData({ ...exitData, exitPrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pnl">P&L (include + or - sign)</Label>
              <Input
                id="pnl"
                value={exitData.pnl}
                onChange={(e) => setExitData({ ...exitData, pnl: e.target.value })}
                placeholder="e.g. +10.5% or -5.2%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitReason">Exit Reason</Label>
              <Textarea
                id="exitReason"
                value={exitData.exitReason}
                onChange={(e) => setExitData({ ...exitData, exitReason: e.target.value })}
                placeholder="Why are you exiting this trade?"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExiting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleExitSubmit}>
              Exit Trade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// New Trade Form Component
const NewTradeForm = ({ clientId, onTradeCreated }: { clientId: number; onTradeCreated: () => void }) => {
  const [newTrade, setNewTrade] = useState({
    stock: "",
    tradeType: "BUY" as "BUY" | "SELL",
    segment: "EQUITY" as "EQUITY" | "F&O" | "COMMODITIES",
    timeHorizon: "INTRADAY" as "INTRADAY" | "SWING" | "LONGTERM",
    entry: "",
    stoploss: "",
    targets: [""],
    rationale: "",
  })
  const { session } = useSession()

  const handleChange = (field: string, value: any) => {
    setNewTrade({
      ...newTrade,
      [field]: value,
    })
  }

  const handleTargetChange = (index: number, value: string) => {
    const updatedTargets = [...newTrade.targets]
    updatedTargets[index] = value
    setNewTrade({
      ...newTrade,
      targets: updatedTargets,
    })
  }

  const addTarget = () => {
    setNewTrade({
      ...newTrade,
      targets: [...newTrade.targets, ""],
    })
  }

  const removeTarget = (index: number) => {
    const updatedTargets = newTrade.targets.filter((_, i) => i !== index)
    setNewTrade({
      ...newTrade,
      targets: updatedTargets,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const supabase = await createClerkSupabaseClient(session)

      // Filter out empty targets
      const filteredTargets = newTrade.targets.filter((target) => target.trim() !== "")

      const tradeData = {
        stock: newTrade.stock,
        tradeType: newTrade.tradeType,
        segment: newTrade.segment,
        timeHorizon: newTrade.timeHorizon,
        entry: newTrade.entry,
        stoploss: newTrade.stoploss,
        targets: filteredTargets,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        rationale: newTrade.rationale,
      }

      const { error } = await supabase.from("user_trades").insert([
        {
          user_id: clientId,
          trade_data: tradeData,
        },
      ])

      if (error) {
        throw error
      }

    //   toast({
    //     title: "Trade created",
    //     description: "The trade has been successfully created.",
    //     variant: "default",
    //   })

      // Reset form
      setNewTrade({
        stock: "",
        tradeType: "BUY",
        segment: "EQUITY",
        timeHorizon: "INTRADAY",
        entry: "",
        stoploss: "",
        targets: [""],
        rationale: "",
      })

      onTradeCreated()
    } catch (error) {
      console.error("Error creating trade:", error)
    //   toast({
    //     title: "Creation failed",
    //     description: "There was an error creating the trade.",
    //     variant: "destructive",
    //   })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Create New Trade</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock/Instrument</Label>
          <Input
            id="stock"
            value={newTrade.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
            placeholder="e.g. RELIANCE, NIFTY"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tradeType">Trade Type</Label>
          <Select value={newTrade.tradeType} onValueChange={(value) => handleChange("tradeType", value)}>
            <SelectTrigger id="tradeType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="segment">Segment</Label>
          <Select value={newTrade.segment} onValueChange={(value) => handleChange("segment", value)}>
            <SelectTrigger id="segment">
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EQUITY">Equity</SelectItem>
              <SelectItem value="F&O">F&O</SelectItem>
              <SelectItem value="COMMODITIES">Commodities</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeHorizon">Time Horizon</Label>
          <Select value={newTrade.timeHorizon} onValueChange={(value) => handleChange("timeHorizon", value)}>
            <SelectTrigger id="timeHorizon">
              <SelectValue placeholder="Select time horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INTRADAY">Intraday</SelectItem>
              <SelectItem value="SWING">Swing</SelectItem>
              <SelectItem value="LONGTERM">Long Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry">Entry Price</Label>
          <Input
            id="entry"
            value={newTrade.entry}
            onChange={(e) => handleChange("entry", e.target.value)}
            placeholder="e.g. 2450.75"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stoploss">Stop Loss</Label>
          <Input
            id="stoploss"
            value={newTrade.stoploss}
            onChange={(e) => handleChange("stoploss", e.target.value)}
            placeholder="e.g. 2400.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Targets</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTarget} className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Add Target
          </Button>
        </div>

        {newTrade.targets.map((target, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={target}
              onChange={(e) => handleTargetChange(index, e.target.value)}
              placeholder={`Target ${index + 1}`}
            />
            {newTrade.targets.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeTarget(index)} className="h-8 px-2">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rationale">Trade Rationale</Label>
        <Textarea
          id="rationale"
          value={newTrade.rationale}
          onChange={(e) => handleChange("rationale", e.target.value)}
          placeholder="Explain the reasoning behind this trade recommendation"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Create Trade
      </Button>
    </form>
  )
}

interface AdvisoryTradeListProps {
  segmentFilter?: string
  statusFilter?: string
  clientId?: number
}

export const AdvisoryTradeList: React.FC<AdvisoryTradeListProps> = ({
  segmentFilter = "all",
  statusFilter = "all",
  clientId,
}) => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTradeForm, setShowNewTradeForm] = useState(false)
  const { isLoaded, session } = useSession()

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const supabase = await createClerkSupabaseClient(session)

      let query = supabase.from("user_trades").select("*")

      // If clientId is provided, filter by it
      if (clientId) {
        query = query.eq("user_id", clientId)
      }

      if (segmentFilter !== "all") {
        query = query.contains("trade_data", { segment: segmentFilter })
      }

      if (statusFilter !== "all") {
        query = query.contains("trade_data", { status: statusFilter })
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (!error) {
        setTrades(data || [])
      } else {
        console.error("Error fetching trades:", error)
        // toast({
        //   title: "Error",
        //   description: "Failed to fetch trades. Please try again.",
        //   variant: "destructive",
        // })
      }
    } catch (error) {
      console.error("Error in fetchTrades:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
}, [segmentFilter, statusFilter, clientId, isLoaded, session])

const handleTradeUpdate = async (updatedTrade: Trade) => {
    console.log("Attempting to update trade:", updatedTrade.id);
    try {
      const supabase = await createClerkSupabaseClient(session);
      console.log("Update payload:", { 
        trade_data: updatedTrade.trade_data 
      });
  
      const { data, error } = await supabase
        .from("user_trades")
        .update({ trade_data: updatedTrade.trade_data })
        .eq("id", updatedTrade.id)
        .select();
  
      console.log("Supabase response:", { data, error });
  
      if (error) throw error;
      
      setTrades(trades.map(t => t.id === updatedTrade.id ? data[0] : t));
      console.log("Local state updated");
      return Promise.resolve();
    } catch (error) {
      console.error("Full update error:", error);
      return Promise.reject(error);
    }
  }

  const handleTradeExit = async (tradeId: number, exitData: any) => {
    try {
      const supabase = await createClerkSupabaseClient(session)

      // Find the trade to update
      const tradeToUpdate = trades.find((trade) => trade.id === tradeId)

      if (!tradeToUpdate) {
        throw new Error("Trade not found")
      }

      // Update the trade data
      const updatedTradeData = {
        ...tradeToUpdate.trade_data,
        status: "EXITED",
        exitPrice: exitData.exitPrice,
        exitDate: exitData.exitDate,
        exitReason: exitData.exitReason,
        pnl: exitData.pnl,
        updatedAt: new Date().toISOString(),
      }

      const { error } = await supabase.from("user_trades").update({ trade_data: updatedTradeData }).eq("id", tradeId)

      if (error) {
        throw error
      }

      // Update local state
      setTrades(trades.map((trade) => (trade.id === tradeId ? { ...trade, trade_data: updatedTradeData } : trade)))

      return Promise.resolve()
    } catch (error) {
      console.error("Error exiting trade:", error)
      return Promise.reject(error)
    }
  }

  return (
    <div className="w-full">
      {/* Action Button */}
      {clientId && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowNewTradeForm(!showNewTradeForm)}
            className={`${showNewTradeForm ? "bg-gray-600" : "bg-purple-600"} text-white`}
          >
            {showNewTradeForm ? "Cancel" : "Create New Trade"}
          </Button>
        </div>
      )}

      {/* New Trade Form */}
      {showNewTradeForm && clientId && (
        <NewTradeForm
          clientId={clientId}
          onTradeCreated={() => {
            setShowNewTradeForm(false)
            fetchTrades()
          }}
        />
      )}

      {/* Trades List */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-40 bg-gray-50 rounded-lg border p-6">
          <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">No trades found</p>
          {clientId && (
            <Button variant="outline" className="mt-4" onClick={() => setShowNewTradeForm(true)}>
              Create First Trade
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">
              {trades.length} {trades.length === 1 ? "Trade" : "Trades"} Found
            </h3>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Last updated: {formatDate(new Date().toISOString())}
            </Badge>
          </div>

          {trades.filter(trade => trade?.id).map((trade, index) => (
  <AdvisoryTradeCard
    key={trade.id}
    trade={trade}
    isLast={index === trades.length - 1}
    onTradeUpdate={handleTradeUpdate}
    onTradeExit={handleTradeExit}
  />
))}
        </div>
      )}
    </div>
  )
}

export default AdvisoryTradeList
