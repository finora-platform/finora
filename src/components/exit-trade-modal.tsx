"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ExitData, Trade } from "@/types/trade-types"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"
import { SendHorizonal } from "lucide-react"

interface ExitTradeModalProps {
  trade: Trade
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onExit: (exitData: ExitData) => Promise<void>
  clientInfo?: {
    name: string
    whatsapp: string
  }
}

// Utility function to generate WhatsApp link
const getWhatsAppLink = (phone: string, message: string = "") => {
  const cleanedPhone = phone.replace(/\D/g, '').replace(/^0+/, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
}

export const ExitTradeModal = ({ 
  trade, 
  isOpen, 
  onOpenChange, 
  onExit,
  clientInfo 
}: ExitTradeModalProps) => {
  const [isRange, setIsRange] = useState(false)
  const [exitData, setExitData] = useState<ExitData>({
    exitPrice: "",
    exitPriceMax: "",
    exitReason: "",
    pnl: "",
  })
  const { session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientData, setClientData] = useState<{name: string; whatsapp: string} | null>(null)

  // Fetch client data if not provided
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientInfo && trade.userId) {
        try {
          const supabase = await createClerkSupabaseClient(session)
          const { data, error } = await supabase
            .from("client3")
            .select("name, whatsapp")
            .eq("id", trade.userId)
            .single()
          
          if (!error && data) {
            setClientData(data)
          }
        } catch (error) {
          console.error("Error fetching client data:", error)
        }
      }
    }
    
    if (isOpen) {
      fetchClientData()
    }
  }, [isOpen, trade.userId, clientInfo, session])

  // Generate WhatsApp message for trade exit
  const getWhatsAppMessage = () => {
    const client = clientInfo || clientData
    if (!client) return ""
    
    const exitPriceText = isRange
      ? `Exit Range: ₹${exitData.exitPrice} - ₹${exitData.exitPriceMax}`
      : `Exit Price: ₹${exitData.exitPrice}`
    
    return `Hi ${client.name},\n\nTrade exit update for ${trade.stock}:\n\n` +
           `Trade: ${trade.tradeType}\n` +
           `Stock: ${trade.stock}\n` +
           `${exitPriceText}\n` +
           `Segment: ${trade.segment}\n` +
           `Time Horizon: ${trade.timeHorizon}\n\n` +
           `Regards,\n${session?.user?.firstName || "Your Advisor"}`
  }

  const handleSubmit = async () => {
    if (isRange && Number(exitData.exitPrice) >= Number(exitData.exitPriceMax)) {
      alert("Exit min price should be less than max price.")
      return
    }
  
    setIsSubmitting(true)
  
    try {
      await onExit(exitData)
  
      const supabase = await createClerkSupabaseClient(session)
      const exitTimestamp = new Date().toISOString()

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
      }
  
      // Remove undefined/null values
      const cleanTradeData = Object.fromEntries(
        Object.entries(tradeData).filter(([_, v]) => v !== undefined && v !== null)
      )
      
      // Insert new record with proper user_id and advisor_id
      const { error: insertError } = await supabase
        .from("user_trades")
        .insert({
          user_id: trade.userId,
          advisor_id: trade.advisorId,
          trade_data: [cleanTradeData],
          created_at: exitTimestamp,
          updated_at: exitTimestamp
        })
  
      if (insertError) throw insertError

      // Close the modal first
      onOpenChange(false)

      // Then open WhatsApp if client has WhatsApp number
      const client = clientInfo || clientData
      if (client?.whatsapp) {
        const whatsappUrl = getWhatsAppLink(client.whatsapp, getWhatsAppMessage())
        // Use setTimeout to ensure modal closes before opening new window
        setTimeout(() => {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        }, 300)
      }
    } catch (error) {
      console.error("Error creating exit trade record:", error)
      alert("Failed to record exit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if client has WhatsApp
  const hasWhatsApp = !!(clientInfo?.whatsapp || clientData?.whatsapp)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-[450px] px-6 py-5">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <span className={`${trade.tradeType === "BUY" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} px-2 py-1 rounded text-sm font-medium`}>
              {trade.tradeType || trade.type}
            </span>
            <span className="text-sm text-muted-foreground">{trade.stock}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Client info (if available) */}
        {(clientInfo || clientData) && (
          <div className="p-2 border rounded-md bg-gray-50 mb-4">
            <div className="text-sm font-medium">
              {(clientInfo || clientData)?.name}
              {hasWhatsApp && (
                <span className="ml-2 text-xs text-green-600">
                  (WhatsApp available)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Exit price input */}
        <div className="mt-2 space-y-2">
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

        {/* Exit reason (optional) */}
        <div className="mt-4 space-y-2">
          <Label className="text-sm">Exit reason (optional)</Label>
          <Input
            placeholder="Why are you exiting this trade?"
            value={exitData.exitReason}
            onChange={(e) => setExitData({ ...exitData, exitReason: e.target.value })}
          />
        </div>

        {/* CTA Button */}
        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md py-2 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                {hasWhatsApp ? "Save & Send via WhatsApp" : "Record Exit"}
                <SendHorizonal className="w-4 h-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Exit will be recorded for advisor tracking
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}