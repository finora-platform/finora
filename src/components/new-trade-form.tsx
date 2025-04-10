"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"
import type { NewTradeFormProps } from "@/types/trade-types"

export const NewTradeForm = ({ clientId, onTradeCreated }: NewTradeFormProps) => {
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
