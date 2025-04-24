import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, X } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";
import { Edit} from "lucide-react"
// import { formatDate, formatTime } from "@/utils/format"
import type { Trade } from "@/types/trade-types"

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const isActiveTrade = trade.status === "ACTIVE"

  return (
    <div className={`p-4 border rounded-lg bg-white hover:bg-gray-50 transition ${isLast ? "" : "mb-4"}`}>
      {/* Top Section */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Left Section (Type & Name) */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span
            className={`font-semibold flex items-center ${trade.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}
          >
            <span className="h-2 w-2 rounded-full mr-1 inline-block bg-current"></span>
            {trade.tradeType || "N/A"}
          </span>
          <span className="font-medium text-gray-800">{trade.stock || "Unknown Stock"}</span>
          {trade.segment && (
            <Badge variant="secondary" className="font-normal text-xs">
              {trade.segment}
            </Badge>
          )}
          {trade.timeHorizon && (
            <Badge variant="outline" className="font-normal text-xs">
              {trade.timeHorizon}
            </Badge>
          )}
          {trade.status && (
            <Badge
              variant={
                trade.status === "ACTIVE"
                  ? "default"
                  : trade.status === "COMPLETED"
                    ? "secondary"
                    : "destructive"
              }
            >
              {trade.status}
            </Badge>
          )}
        </div>

        {/* Right Section (Actions & Date) */}
        <div className="flex items-center gap-2 text-sm">

          <div className="text-gray-500 ml-2">
            <span>📅 {formatDate(trade.createdAt)}</span>
            <span className="ml-2">⏰ {formatTime(trade.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="mt-4 p-4 border-t bg-white rounded-md shadow-sm flex flex-col gap-4">
          {/* Entry, Stoploss, and Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-700">
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M18 13l-6 6M6 13l6 6" />
                </svg>
                Entry
              </p>
              <span className="text-gray-900 font-medium">{trade.entry ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M4.93 4.93l14.14 14.14" />
                </svg>
                Stoploss
              </p>
              <span className="text-gray-900 font-medium">{trade.stoploss ?? "—"}</span>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Exited
              </p>
              <span className="text-gray-900 font-medium">
                {trade.exitPrice}
              </span>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22V2M17 7l-5-5M7 7l5-5M2 12h20M7 17l5 5M17 17l-5 5" />
                </svg>
                Risk/Reward
              </p>
              <span className="text-gray-900 font-medium">{trade.riskReward ?? "—"}</span>
            </div>
          </div>

  

          {/* Date Info */}
          <div className="mt-4 text-sm text-gray-600">
            <p>Created: {formatDate(trade.createdAt)} at {formatTime(trade.createdAt)}</p>
            {trade.updatedAt && (
              <p>Updated: {formatDate(trade.updatedAt)} at {formatTime(trade.updatedAt)}</p>
            )}
            {trade.exitDate && (
              <p>Exited: {formatDate(trade.exitDate)} at {formatTime(trade.exitDate)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
const ClientSidePanel: React.FC<ClientSidePanelProps> = ({ client, onClose }) => {
  const [latestClientTrades, setLatestClientTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { session } = useSession();

  // Inside your ClientSidePanel component
useEffect(() => {
  const fetchLatestClientTrades = async () => {
    const supabase = await createClerkSupabaseClient(session);
    setLoading(true);
    
    try {
      // Fetch all trade data for the specific client
      const { data, error } = await supabase
        .from("user_trades")
        .select("*")
        .eq("user_id", client.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setLatestClientTrades([]);
        setLoading(false);
        return;
      }
      
      // Process trade data to get all unique trades with their latest version
      const uniqueTradesMap = new Map<string, Trade>();
      
      data.forEach(row => {
        if (row.trade_data && Array.isArray(row.trade_data)) {
          row.trade_data.forEach(tradeData => {
            // Use stock as a unique identifier for trades
            // You might need a more specific identifier if stock alone isn't enough
            const tradeKey = tradeData.stock;
            
            // If we haven't seen this trade before, or this version is newer than what we have
            if (!uniqueTradesMap.has(tradeKey) || 
                new Date(tradeData.createdAt) > new Date(uniqueTradesMap.get(tradeKey)!.createdAt)) {
              uniqueTradesMap.set(tradeKey, {
                ...tradeData,
                id: row.id,
                rowId: row.id,
                advisorId: row.advisor_id,
                userId: row.user_id
              });
            }
          });
        }
      });
      
      // Convert map to array of trades
      let trades = Array.from(uniqueTradesMap.values());
      
      // Apply filters
      if (segmentFilter !== "all") {
        trades = trades.filter(trade => trade.segment === segmentFilter);
      }
      
      if (statusFilter !== "all") {
        trades = trades.filter(trade => trade.status === statusFilter);
      }
      
      // Sort by created date, newest first
      trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setLatestClientTrades(trades);
    } catch (error) {
      console.error("Error fetching client trades:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchLatestClientTrades();
}, [client.id, session, segmentFilter, statusFilter]);

  return (
    <div className="fixed right-0 top-0 h-screen w-108 bg-white shadow-lg p-6 border-l overflow-y-auto border-gray-200 border-rounded-lg">
      {/* Header */}
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
          <TabsTrigger value="document">Documents</TabsTrigger>
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

      {/* Trades List */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading latest trades...</p>
        </div>
      ) : latestClientTrades.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p>No trades found for this client</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Latest Trades</h3>
          {latestClientTrades.map((trade, index) => (
            <TradeCard 
              key={trade.id || index} 
              trade={trade} 
              isLast={index === latestClientTrades.length - 1}
            />
          ))}
        </div>
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