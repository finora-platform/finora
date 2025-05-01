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
import type { AdvisoryTradeListProps, Trade } from "@/components/types";

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
      if (!session) {
        console.error("No session available");
        return;
      }
  
      const supabase = await createClerkSupabaseClient(session);
      const { data, error } = await supabase
        .from("client3")
        .select("id, name")
  
      if (error) throw error;
  
      const namesMap = data.reduce((acc, client) => {
        acc[client.id] = client.name;
        return acc;
      }, {} as Record<string, string>);
  
      setClientNames(namesMap);
    } catch (error) {
      console.error("Error fetching client names:", error);
    }
  };

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const supabase = await createClerkSupabaseClient(session);
      
      let query = supabase
        .from("user_trades")
        .select("*")
        .eq("advisor_id", session.user.id);
  
      if (clientId) {
        query = query.eq("user_id", clientId);
      }
  
      const { data, error } = await query.order("created_at", { ascending: false });
  
      if (error) {
        console.error("Error fetching trades:", error);
        setLoading(false);
        return;
      }
  
      if (!data || data.length === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }
  
      const uniqueTradesMap = new Map<string, Trade>();
      
      data.forEach((row, rowIndex) => {
        if (row.trade_data && Array.isArray(row.trade_data)) {
          row.trade_data.forEach((tradeData, tradeIndex) => {
            const tradeKey = `${tradeData.stock}-${tradeData.tradeType}-${tradeData.segment}`;
            const tradeId = rowIndex * 1000 + tradeIndex;
            
            const formattedTrade = {
              id: tradeId, 
              rowId: row.id,
              advisorId: row.advisor_id,
              userId: row.user_id,
              ...tradeData,
              targets: Array.isArray(tradeData.targets)
                ? tradeData.targets
                : tradeData.targets
                  ? [tradeData.targets]
                  : [],
            };
            
            if (!uniqueTradesMap.has(tradeKey) || 
                new Date(tradeData.createdAt) > new Date(uniqueTradesMap.get(tradeKey)!.created_at)) {
              uniqueTradesMap.set(tradeKey, formattedTrade);
            }
          });
        }
      });
      
      let allTrades = Array.from(uniqueTradesMap.values());
      
      let filteredTrades = allTrades;
      
      if (segmentFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.segment === segmentFilter);
      }
      
      if (statusFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.status === statusFilter);
      }
      
      filteredTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTrades(filteredTrades);
    } catch (error) {
      console.error("Error in fetchTrades:", error);
    } finally {
      setLoading(false);
    }
  }

  // Simplified to just refresh data after external updates
  const handleTradeUpdated = () => {
    fetchTrades()
  }

  return (
    <div className="w-full">
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

      {showNewTradeForm && clientId && (
        <NewTradeForm
          clientId={clientId}
          onTradeCreated={() => {
            setShowNewTradeForm(false)
            fetchTrades()
          }}
        />
      )}

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
              onTradeUpdate={handleTradeUpdated}
              onTradeExit={handleTradeUpdated}
              clientId={clientId}
              clientName={clientNames[trade.userId] || "Unknown Client"}
              stock={trade.stock}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdvisoryTradeList