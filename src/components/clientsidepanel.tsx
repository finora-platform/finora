import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, X } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";

// Utility functions remain the same
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

// TradeCard component remains the same
export const TradeCard = ({ trade, isLast }: { trade: Trade; isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`p-4 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition ${isLast ? "" : "mb-4"}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Top Section */}
      <div className="flex justify-between items-center">
        {/* Left Section (Type & Name) */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`font-semibold ${trade.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}>
            {trade.tradeType || "N/A"}
          </span>
          <span className="text-gray-500">{trade.stock || "Unknown Stock"}</span>
          {trade.segment && <Badge variant="outline">{trade.segment}</Badge>}
          {trade.timeHorizon && <Badge variant="outline">{trade.timeHorizon}</Badge>}
        </div>

        {/* Right Section (Date & Time) */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📅 {formatDate(trade.createdAt)}</span>
          <span>⏰ {formatTime(trade.createdAt)}</span>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="mt-4 p-4 border-t bg-white rounded-md shadow-sm flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={trade.tradeType === "BUY" ? "success" : "destructive"}>
                {trade.tradeType || "N/A"}
              </Badge>
              <span className="font-bold text-lg">{trade.stock || "Unknown Stock"}</span>
              {trade.segment && <Badge variant="outline">{trade.segment}</Badge>}
              {trade.status && (
                <Badge variant={trade.status === "ACTIVE" ? "default" : "secondary"}>
                  {trade.status}
                </Badge>
              )}
            </div>
            <button className="text-orange-500 text-sm border px-2 py-1 rounded-md hover:bg-orange-50 hover:text-orange-700 transition">
              ⚠️ Generate rationale
            </button>
          </div>

          {/* Entry, Stoploss, and Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm text-gray-700">
            <div>
              <p className="flex items-center gap-1 font-medium">⏳ Entry</p>
              <span className="text-gray-900 font-semibold">{trade.entry ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 font-medium">🚫 Stoploss</p>
              <span className="text-gray-900 font-semibold">{trade.stoploss ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 font-medium">🚩 Target(s)</p>
              <span className="text-gray-900 font-semibold">
                {trade.targets?.length > 0 ? trade.targets.join(" » ") : "No targets"}
              </span>
            </div>
          </div>

          {/* Date & Debug Info */}
          <div className="mt-4 text-zinc-800 text-sm">
            <p>
              <strong>📩 Created At:</strong> {formatDate(trade.createdAt)}
            </p>
            <p>
              <strong>⏰ Time:</strong> {formatTime(trade.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientSidePanel: React.FC<ClientSidePanelProps> = ({ client, onClose }) => {
  const [latestTrade, setLatestTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    const fetchLatestTrade = async () => {
      const supabase = await createClerkSupabaseClient(session);
      setLoading(true);
      
      try {
        // First, fetch all trade data for this user
        const { data, error } = await supabase
          .from("user_trades")
          .select("*")
          .eq("user_id", client.id)
          .order("created_at", { ascending: false }); // Get most recent first
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setLatestTrade(null);
          return;
        }
        
        // Find the most recent trade across all trade_data arrays
        let mostRecentTrade: Trade | null = null;
        let mostRecentDate = new Date(0); // Earliest possible date
        
        data.forEach(row => {
          if (row.trade_data && Array.isArray(row.trade_data)) {
            row.trade_data.forEach((tradeData: TradeData) => {
              const tradeDate = new Date(tradeData.createdAt);
              if (tradeDate > mostRecentDate) {
                mostRecentDate = tradeDate;
                mostRecentTrade = {
                  ...tradeData,
                  id: row.id, // Use the row ID as reference
                  advisorId: row.advisor_id
                };
              }
            });
          }
        });
        
        setLatestTrade(mostRecentTrade);
      } catch (error) {
        console.error("Error fetching latest trade:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestTrade();
  }, [client.id, session]);

  return (
    <div className="fixed right-0 top-0 h-full w-108 bg-white shadow-lg p-6 border-l overflow-y-auto">
      {/* Header with Client Info & Close Button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{client.name}</h2>
          <div className="flex space-x-2 mt-1">
            <Badge className="bg-purple-100 text-purple-700">
              {client.plan.toUpperCase()}
            </Badge>
            <Badge className="bg-green-100 text-green-700">
              {client.risk.toUpperCase()}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="trades">
        <TabsList className="flex justify-between border-b pb-2 mb-4">
          <TabsTrigger value="return">Return</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="calls">Call Logs</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Latest Trade Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Latest Trade</h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading latest trade...</p>
          </div>
        ) : latestTrade ? (
          <TradeCard trade={latestTrade} isLast={true} />
        ) : (
          <div className="flex justify-center items-center h-40 border rounded-lg bg-gray-50">
            <p>No trades found for this client</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" className="mr-2">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="outline">
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ClientSidePanel;