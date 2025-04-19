"use client";

import { useEffect, useState } from "react";
import { TradeCard } from "./clientsidepanel";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useAuth } from "@clerk/nextjs";
import { useSession } from '@clerk/nextjs';

export const TradeList = ({ segmentFilter, statusFilter }: TradeListProps) => {
  const { userId } = useAuth();
  const { session } = useSession();

  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // optional error state

  useEffect(() => {
    const fetchMyAdvisories = async () => {
        setLoading(true);
        setError(null);
        console.log("🔁 Fetching trades where advisor_id is in client3.user_id");
      
        const supabase = await createClerkSupabaseClient(session);
      
        // Step 1: Get all user_ids from client3 table
        const { data: clients, error: clientError } = await supabase
          .from("client3")
          .select("user_id");
      
        if (clientError) {
          console.error("❌ Error fetching client3 user_ids:", clientError);
          setError("Failed to fetch client3 user data.");
          setLoading(false);
          return;
        }
      
        const clientIds = clients.map((c) => c.user_id);
        console.log("👥 Fetched user_ids from client3:", clientIds);
      
        if (clientIds.length === 0) {
          console.log("⚠️ No client3 user_ids found.");
          setTrades([]);
          setLoading(false);
          return;
        }
      
        // Step 2: Fetch trades where advisor_id matches user_id from client3
        let query = supabase
          .from("user_trades")
          .select("*") 
          .in("advisor_id", clientIds);
      
        if (segmentFilter !== "all") {
          console.log("📍 Applying segment filter:", segmentFilter);
          query = query.contains("trade_data", { segment: segmentFilter });
        }
      
        if (statusFilter !== "all") {
          console.log("📍 Applying status filter:", statusFilter);
          query = query.contains("trade_data", { status: statusFilter });
        }
      
        const { data: trades, error: tradeError } = await query;
      
        if (tradeError) {
          console.error("❌ Error fetching trades:", tradeError);
          setError("Failed to fetch trade data.");
        } else {
          console.log("✅ Successfully fetched trades:", trades);
          setTrades(trades || []);
        }
      
        setLoading(false);
      };      
  
    if (userId && session) {
      fetchMyAdvisories();
    }
  }, [userId, segmentFilter, statusFilter, session]);
  

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading trades...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40 text-red-500">
          <p>{error}</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p>No trades found for this client</p>
        </div>
      ) : (
        trades.map((trade, index) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            isExpanded={index === 0}
            isLast={index === trades.length - 1}
          />
        ))
      )}
    </div>
  );
};
