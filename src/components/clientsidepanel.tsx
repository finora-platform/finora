import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, X } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";

// Utility functions moved outside the component
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

// Updated Trade interface to match the actual data structure
interface TradeData {
  stock: string;
  tradeType: "BUY" | "SELL";
  segment: "EQUITY" | "F&O" | "COMMODITIES";
  timeHorizon: "INTRADAY" | "SWING" | "LONGTERM";
  entry: string;
  stoploss: string;
  targets: string[];
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
  rowId?: number;
  advisorId?: string;
}

interface Trade {
  id?: number; // Optional because we're generating it
  rowId?: number;
  advisorId?: string;
  stock: string;
  tradeType: "BUY" | "SELL";
  segment: "EQUITY" | "F&O" | "COMMODITIES";
  timeHorizon: "INTRADAY" | "SWING" | "LONGTERM";
  entry: string;
  stoploss: string;
  targets: string[];
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
  plan: "elite" | "premium" | "standard";
  risk: "aggressive" | "hard" | "conservative";
}

interface ClientSidePanelProps {
  client: Client;
  onClose: () => void;
}

// Updated TradeCard component
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

            {/* Debug JSON Output */}
            <details className="mt-3 bg-gray-100 p-2 rounded-md">
              <summary className="cursor-pointer text-gray-700 font-medium">🔍 View Raw Trade JSON</summary>
              <pre className="text-xs mt-2 text-gray-600 overflow-x-auto">
                {JSON.stringify(trade, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientSidePanel: React.FC<ClientSidePanelProps> = ({ client, onClose }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { session } = useSession();

  useEffect(() => {
    const fetchTrades = async () => {
      const supabase = await createClerkSupabaseClient(session);
      setLoading(true);
      
      // First, fetch all trade data for this user
      const { data, error } = await supabase
        .from("user_trades")
        .select("*")
        .eq("user_id", client.id);
        
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
      
      // Extract and process the trade data from the JSON array
      let allTrades: Trade[] = [];
      
      data.forEach((row, index) => {
        // Each row contains an array of trade objects
        if (row.trade_data && Array.isArray(row.trade_data)) {
          // Map each trade to include the row ID for reference
          const tradesWithId = row.trade_data.map((tradeData: TradeData, tradeIndex: number) => ({
            id: index * 1000 + tradeIndex, // Generate a unique ID for each trade
            rowId: row.id, // Keep the database row ID for updates
            advisorId: row.advisor_id,
            ...tradeData
          }));
          
          allTrades = [...allTrades, ...tradesWithId];
        }
      });
      
      // Apply filters
      let filteredTrades = allTrades;
      
      if (segmentFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.segment === segmentFilter);
      }
      
      if (statusFilter !== "all") {
        filteredTrades = filteredTrades.filter(trade => trade.status === statusFilter);
      }
      
      setTrades(filteredTrades);
      setLoading(false);
    };

    fetchTrades();
  }, [client.id, segmentFilter, statusFilter, session]);

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

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="F&O">Futures & Options</SelectItem>
                <SelectItem value="COMMODITIES">Commodities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Post Trade
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p>No trades found for this client</p>
        </div>
      ) : (
        trades.map((trade, index) => (
          <TradeCard 
            key={trade.id || index} 
            trade={trade} 
            isLast={index === trades.length - 1}
          />
        ))
      )}

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