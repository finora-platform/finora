"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ExitData, Trade } from "@/types/trade-types"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"

interface ExitTradeModalProps {
  trade: Trade
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onExit: (exitData: ExitData) => Promise<void>
}

export const ExitTradeModal = ({ trade, isOpen, onOpenChange, onExit }: ExitTradeModalProps) => {
  const [isRange, setIsRange] = useState(false)
  const [exitData, setExitData] = useState<ExitData>({
    exitPrice: "",
    exitPriceMax: "",
    exitReason: "",
    pnl: "",
  })
  const { session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isRange && Number(exitData.exitPrice) >= Number(exitData.exitPriceMax)) {
      alert("Exit min price should be less than max price.");
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      await onExit(exitData);
  
      const supabase = await createClerkSupabaseClient(session);
      const exitTimestamp = new Date().toISOString();
  
      // Create clean trade data object
      const tradeData = {
        entry: trade.entry,
        stock: trade.stock,
        status: "EXITED",
        segment: trade.segment,
        targets: trade.targets,
        stoploss: trade.stoploss,
        createdAt: trade.createdAt,
        tradeType: trade.tradeType,
        rangeEntry: trade.rangeEntry || false,
        trailingSL: trade.trailingSL || false,
        rangeTarget: trade.rangeTarget || false,
        timeHorizon: trade.timeHorizon || "INTRADAY",
        exitPrice: exitData.exitPrice,
        exitPriceMax: isRange ? exitData.exitPriceMax : undefined,
        exitDate: exitTimestamp
      };
  
      // Remove undefined/null values
      const cleanTradeData = Object.fromEntries(
        Object.entries(tradeData).filter(([_, v]) => v !== undefined && v !== null)
      );
  
      // Insert new record with proper user_id and advisor_id
      const { error: insertError } = await supabase
        .from("user_trades")
        .insert({
          user_id: trade.userId, // Client's user ID
          advisor_id: trade.advisorId, // Advisor's ID
          trade_data: [cleanTradeData], // Single trade in array
          created_at: exitTimestamp,
          updated_at: exitTimestamp
        });
  
      if (insertError) throw insertError;
  
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating exit trade record:", error);
      alert("Failed to record exit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-[450px] px-6 py-5">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm font-medium">
              {trade.tradeType || trade.type}
            </span>
            <span className="text-sm text-muted-foreground">{trade.stock}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Exit price input */}
        <div className="mt-4 space-y-2">
          <Label className="text-sm">₹ Exit price</Label>

          {isRange ? (
            <div className="flex gap-2">
              <Input
                placeholder="₹ Min"
                value={exitData.exitPrice}
                onChange={(e) => setExitData({ ...exitData, exitPrice: e.target.value })}
              />
              <Input
                placeholder="₹ Max"
                value={exitData.exitPriceMax}
                onChange={(e) => setExitData({ ...exitData, exitPriceMax: e.target.value })}
              />
            </div>
          ) : (
            <Input
              placeholder="₹ Exit Price"
              value={exitData.exitPrice}
              onChange={(e) =>
                setExitData({
                  ...exitData,
                  exitPrice: e.target.value,
                  exitPriceMax: "",
                })
              }
            />
          )}

          {/* Toggle Range */}
          <div className="flex items-center gap-2 pt-1">
            <Switch id="rangeToggle" checked={isRange} onCheckedChange={setIsRange} />
            <Label htmlFor="rangeToggle" className="text-sm font-normal">
              Range
            </Label>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Send update ✈️"}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Exit will be recorded for advisor tracking
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
