"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"
import { AdvisoryTradeCard } from "@/components/advisory-tradecard"
import { NewTradeForm } from "@/components/new-trade-form"
import { formatDate } from "@/utils/format"
import type { AdvisoryTradeListProps, Trade } from "@/types/trade-types"

export const AdvisoryTradeList: React.FC<AdvisoryTradeListProps> = ({
  segmentFilter = "all",
  statusFilter = "all",
  clientId,
}) => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [clientNames, setClientNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showNewTradeForm, setShowNewTradeForm] = useState(false)
  const { isLoaded, session } = useSession()

  useEffect(() => {
    if (isLoaded && session) {
      fetchTrades()
      fetchClientNames()
    }
  }, [isLoaded, session, segmentFilter, statusFilter, clientId])

  const fetchClientNames = async () => {
    try {
      const supabase = await createClerkSupabaseClient(session)
      const { data, error } = await supabase
        .from("client3")
        .select("id, name")
      
      if (error) throw error

      const namesMap = data.reduce((acc, client) => {
        acc[client.id] = client.name
        return acc
      }, {} as Record<string, string>)

      setClientNames(namesMap)
    } catch (error) {
      console.error("Error fetching client names:", error)
    }
  }

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const supabase = await createClerkSupabaseClient(session)
  
      // First fetch the rows
      let query = supabase.from("user_trades").select("*")
  
      // If clientId is provided, filter by it
      if (clientId) {
        query = query.eq("user_id", clientId)
      }
  
      const { data, error } = await query.order("created_at", { ascending: false })
  
      if (error) {
        console.error("Error fetching trades:", error)
        setLoading(false)
        return
      }
  
      if (!data || data.length === 0) {
        setTrades([])
        setLoading(false)
        return
      }
  
      // Process trade data to get all unique trades with their latest version
      const uniqueTradesMap = new Map<string, Trade>();
      
      data.forEach((row, rowIndex) => {
        if (row.trade_data && Array.isArray(row.trade_data)) {
          row.trade_data.forEach((tradeData, tradeIndex) => {
            // Create a unique key for each trade based on stock, tradeType, and potentially other identifiers
            // You might need to adjust this key construction based on your specific requirements
            const tradeKey = `${tradeData.stock}-${tradeData.tradeType}-${tradeData.segment}`;
            
            // Generate an ID for this trade
            const tradeId = rowIndex * 1000 + tradeIndex;
            
            // Format the trade with required properties
            const formattedTrade = {
              id: tradeId, 
              rowId: row.id,
              advisorId: row.advisor_id,
              userId: row.user_id,
              ...tradeData,
              // Ensure targets is always an array
              targets: Array.isArray(tradeData.targets)
                ? tradeData.targets
                : tradeData.targets
                  ? [tradeData.targets]
                  : [],
            };
            
            // If we haven't seen this trade before, or this version is newer than what we have
            if (!uniqueTradesMap.has(tradeKey) || 
                new Date(tradeData.createdAt) > new Date(uniqueTradesMap.get(tradeKey)!.createdAt)) {
              uniqueTradesMap.set(tradeKey, formattedTrade);
            }
          });
        }
      });
      
      // Convert map to array
      let allTrades = Array.from(uniqueTradesMap.values());
      
      // Apply filters
      let filteredTrades = allTrades;
      
      if (segmentFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.segment === segmentFilter);
      }
      
      if (statusFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.status === statusFilter);
      }
      
      // Sort by created date, newest first
      filteredTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTrades(filteredTrades);
    } catch (error) {
      console.error("Error in fetchTrades:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTradeUpdate = async (updatedTrade: Trade) => {
    try {
      const supabase = await createClerkSupabaseClient(session)

      const { data, error } = await supabase
        .from("user_trades")
        .update({ trade_data: updatedTrade.trade_data })
        .eq("id", updatedTrade.rowId) // Using rowId instead of id to match the correct database row
        .select()

      if (error) throw error

      // Update trades in local state
      setTrades(trades.map((t) => (t.id === updatedTrade.id ? { ...t, ...updatedTrade } : t)))
      return Promise.resolve()
    } catch (error) {
      console.error("Error updating trade:", error)
      return Promise.reject(error)
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

      // Find the database row that contains this trade
      const rowId = tradeToUpdate.rowId;

      // Get the current row data first
      const { data: currentRowData, error: fetchError } = await supabase
        .from("user_trades")
        .select("trade_data")
        .eq("id", rowId)
        .single();

      if (fetchError) throw fetchError;

      // Update the specific trade within the trade_data array
      const updatedTradeDataArray = currentRowData.trade_data.map((trade: any) => {
        // Match the trade by comparing relevant fields
        if (trade.stock === tradeToUpdate.stock && 
            trade.tradeType === tradeToUpdate.tradeType && 
            trade.createdAt === tradeToUpdate.createdAt) {
          return {
            ...trade,
            status: "EXITED",
            exitPrice: exitData.exitPrice,
            exitDate: exitData.exitDate,
            exitReason: exitData.exitReason,
            pnl: exitData.pnl,
            updatedAt: new Date().toISOString(),
          };
        }
        return trade;
      });

      // Update the row with the modified trade_data array
      const { error: updateError } = await supabase
        .from("user_trades")
        .update({ trade_data: updatedTradeDataArray })
        .eq("id", rowId);

      if (updateError) throw updateError;

      // Update local state
      setTrades(trades.map((trade) => 
        trade.id === tradeId 
          ? { 
              ...trade, 
              status: "EXITED",
              exitPrice: exitData.exitPrice,
              exitDate: exitData.exitDate,
              exitReason: exitData.exitReason,
              pnl: exitData.pnl,
              updatedAt: new Date().toISOString(),
            } 
          : trade
      ));

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

          {trades.map((trade, index) => (
            <AdvisoryTradeCard
              key={trade.id}
              trade={trade}
              isLast={index === trades.length - 1}
              onTradeUpdate={handleTradeUpdate}
              onTradeExit={handleTradeExit}
              clientId={clientId}
              clientName={clientNames[trade.userId] || "Unknown Client"}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdvisoryTradeList