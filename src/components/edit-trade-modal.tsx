"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Trade } from "@/types/trade-types"
import { SendHorizonal } from "lucide-react"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"

interface EditTradeModalProps {
  trade: Trade
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientInfo?: {
    name: string;
    whatsapp: string;
  }
}

// Utility function to generate WhatsApp link
const getWhatsAppLink = (phone: string, message: string = "") => {
  const cleanedPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
};

export const EditTradeModal = ({ trade, isOpen, onOpenChange, clientId, clientInfo }: EditTradeModalProps) => {
  const { session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState({
    entry: trade.entry || "",
    entryMax: trade.entryMax || "",
    stoploss: trade.stoploss || "",
    targets: trade.targets || [""],
    targetMax: trade.targetMax || "",
    timeHorizon: trade.timeHorizon || "INTRADAY",
    trailingSL: trade.trailingSL || false,
    rangeEntry: trade.rangeEntry || false,
    rangeTarget: trade.rangeTarget || false
  })

  const [entryRange, setEntryRange] = useState(!!trade.entryMax)
  const [targetRange, setTargetRange] = useState(!!trade.targetMax)
  const [clientData, setClientData] = useState<{name: string; whatsapp: string;} | null>(null)

  // Fetch client data if not provided
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientInfo && clientId) {
        try {
          const supabase = await createClerkSupabaseClient(session);
          const { data, error } = await supabase
            .from("client3")
            .select("name, whatsapp")
            .eq("id", clientId)
            .single();
          
          if (!error && data) {
            setClientData(data);
          }
        } catch (error) {
          console.error("Error fetching client data:", error);
        }
      }
    };
    
    if (isOpen) {
      fetchClientData();
    }
  }, [isOpen, clientId, clientInfo, session]);

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        entry: trade.entry || "",
        entryMax: trade.entryMax || "",
        stoploss: trade.stoploss || "",
        targets: trade.targets || [""],
        targetMax: trade.targetMax || "",
        timeHorizon: trade.timeHorizon || "INTRADAY",
        trailingSL: trade.trailingSL || false,
        rangeEntry: trade.rangeEntry || false,
        rangeTarget: trade.rangeTarget || false
      })
      setEntryRange(!!trade.entryMax)
      setTargetRange(!!trade.targetMax)
    }
  }, [isOpen, trade])

  // Generate WhatsApp message for trade update
  const getWhatsAppMessage = () => {
    const client = clientInfo || clientData;
    if (!client) return "";
    
    const entryText = entryRange 
      ? `${formValues.entry} - ${formValues.entryMax}` 
      : formValues.entry;
    
    const targetText = formValues.targets
      .filter(t => t !== "")
      .map((t, i) => `Target ${i+1}: ${t}`)
      .join("\n");
    
    const timeHorizonText = formValues.timeHorizon.charAt(0) + formValues.timeHorizon.slice(1).toLowerCase();
    
    return `Hi ${client.name},\n\nUpdated trade information for ${trade.stock}:\n\n` +
           `Trade: ${trade.tradeType}\n` +
           `Segment: ${trade.segment}\n` +
           `Time Horizon: ${timeHorizonText}\n` +
           `Entry: ${entryText}\n` +
           `Stop Loss: ${formValues.stoploss}${formValues.trailingSL ? " (Trailing)" : ""}\n` +
           `${targetText}\n\n` +
           `Regards,\n${session?.user?.firstName || "Your Advisor"}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = await createClerkSupabaseClient(session)
      const advisorId = session?.user?.id

      if (!clientId || !advisorId) {
        throw new Error("Missing required IDs")
      }

      // Prepare the trade data
      const tradeData = {
        entry: formValues.entry,
        stock: trade.stock,
        status: "ACTIVE",
        segment: trade.segment,
        targets: formValues.targets.filter(t => t !== ""),
        stoploss: formValues.stoploss,
        createdAt: new Date().toISOString(),
        tradeType: trade.tradeType,
        rangeEntry: formValues.rangeEntry,
        trailingSL: formValues.trailingSL,
        rangeTarget: formValues.rangeTarget,
        timeHorizon: formValues.timeHorizon,
        ...(entryRange && { entryMax: formValues.entryMax }),
        ...(targetRange && { targetMax: formValues.targetMax })
      }

      // Get existing trades data
      const { data: existingData, error: fetchError } = await supabase
        .from("user_trades")
        .select("trade_data")
        .eq("user_id", clientId)
        .eq("advisor_id", advisorId)
        .single();
      
      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      let result;
      
      if (existingData) {
        // Update existing trade data
        const updatedTradeData = [...(existingData.trade_data || []), tradeData];
        
        result = await supabase
          .from("user_trades")
          .update({
            trade_data: updatedTradeData,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", clientId)
          .eq("advisor_id", advisorId);
      } else {
        // Create new trade entry
        result = await supabase
          .from("user_trades")
          .insert([{
            user_id: clientId,
            advisor_id: advisorId,
            trade_data: [tradeData],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }

      if (result.error) throw result.error;

      // Close the modal first
      onOpenChange(false);

      // Then open WhatsApp if client has WhatsApp number
      const client = clientInfo || clientData;
      if (client?.whatsapp) {
        const whatsappUrl = getWhatsAppLink(client.whatsapp, getWhatsAppMessage());
        // Use setTimeout to ensure modal closes before opening new window
        setTimeout(() => {
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }, 300);
      }

    } catch (error) {
      console.error("Trade update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update target handling for multiple targets
  const handleTargetChange = (index: number, value: string) => {
    const newTargets = [...formValues.targets];
    newTargets[index] = value;
    setFormValues(prev => ({ ...prev, targets: newTargets }));
  }

  const addTarget = () => {
    setFormValues(prev => ({ ...prev, targets: [...prev.targets, ""] }));
  }

  const removeTarget = (index: number) => {
    const newTargets = formValues.targets.filter((_, i) => i !== index);
    setFormValues(prev => ({ ...prev, targets: newTargets }));
  }

  // Check if client has WhatsApp
  const hasWhatsApp = !!(clientInfo?.whatsapp || clientData?.whatsapp);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className={`${trade.tradeType === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-xs font-medium px-2 py-1 rounded-full`}>
              ● {trade.tradeType}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{trade.stock}</span>
            <span className="text-xs border px-1.5 py-0.5 rounded bg-muted">{trade.segment}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Time Horizon */}
        <div className="mt-4 space-y-2">
          <Label className="text-muted-foreground text-sm">Time horizon</Label>
          <RadioGroup
            value={formValues.timeHorizon}
            onValueChange={(val) => setFormValues(prev => ({ ...prev, timeHorizon: val }))}
            className="flex gap-6 mt-1"
          >
            {["INTRADAY", "SWING", "LONGTERM"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={type} />
                <Label htmlFor={type} className="text-sm">
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Entry */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Entry</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Range
              <Switch 
                checked={entryRange} 
                onCheckedChange={(checked) => {
                  setEntryRange(checked);
                  setFormValues(prev => ({ ...prev, rangeEntry: checked }));
                }} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="₹ Min" 
              value={formValues.entry} 
              onChange={(e) => setFormValues(prev => ({ ...prev, entry: e.target.value }))} 
            />
            {entryRange && (
              <Input 
                placeholder="₹ Max" 
                value={formValues.entryMax} 
                onChange={(e) => setFormValues(prev => ({ ...prev, entryMax: e.target.value }))} 
              />
            )}
          </div>
        </div>

        {/* Stoploss */}
        <div className="mt-4 space-y-1">
          <Label className="text-sm">Stoploss</Label>
          <div className="grid grid-cols-2 gap-4 items-center">
            <Input 
              placeholder="% or ₹" 
              value={formValues.stoploss} 
              onChange={(e) => setFormValues(prev => ({ ...prev, stoploss: e.target.value }))} 
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Trailing % (of LTP)
              <Switch 
                checked={formValues.trailingSL} 
                onCheckedChange={(checked) => setFormValues(prev => ({ ...prev, trailingSL: checked }))} 
              />
            </div>
          </div>
        </div>

        {/* Target - Updated for multiple targets */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Targets</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Range
              <Switch 
                checked={targetRange} 
                onCheckedChange={(checked) => {
                  setTargetRange(checked);
                  setFormValues(prev => ({ ...prev, rangeTarget: checked }));
                }} 
              />
            </div>
          </div>
          
          {formValues.targets.map((target, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 mb-2">
              <div className="flex gap-2">
                <Input
                  placeholder={`Target ${index + 1}`}
                  value={target}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                />
                {index > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeTarget(index)}
                    className="text-red-500"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {index === 0 && targetRange && (
                <Input 
                  placeholder="₹ Max" 
                  value={formValues.targetMax} 
                  onChange={(e) => setFormValues(prev => ({ ...prev, targetMax: e.target.value }))} 
                />
              )}
            </div>
          ))}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addTarget}
            className="mt-2"
          >
            Add Target
          </Button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSubmit} 
            className="w-full rounded-full font-medium gap-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (
              <>
                {hasWhatsApp ? "Save & Send via WhatsApp" : "Save Update"} 
                <SendHorizonal className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}