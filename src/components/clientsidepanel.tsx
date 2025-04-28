import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, X, Info } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";
import { Edit } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ClientReturnsPerformance from "./Client-return-panel";

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
  exitPrice?: string;
  exitDate?: string;
  updatedAt?: string;
  riskReward?: string;
  userId?: string;
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

// Performance data interfaces
interface PerformanceData {
  date: string;
  value: number;
}

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
  );
};


// New Returns Component
// const ReturnTab = ({ clientId }: { clientId: number }) => {
//   const [overallPerformance, setOverallPerformance] = useState<PerformanceData[]>([]);
//   const [lastTenTrades, setLastTenTrades] = useState<PerformanceData[]>([]);
//   const [yearPerformance, setYearPerformance] = useState<PerformanceData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { session } = useSession();

//   useEffect(() => {
//     const fetchPerformanceData = async () => {
//       setLoading(true);
      
//       try {
//         const supabase = await createClerkSupabaseClient(session);
        
//         // Mock data for the charts - in a real app, you would fetch this from your database
//         // Generate overall performance data (2023-2025)
//         const overallData: PerformanceData[] = [];
//         const startValue = 100;
//         let currentValue = startValue;
        
//         // Generate data for 2023-2025
//         const startDate = new Date('2023-01-01');
//         const endDate = new Date('2025-04-01');
//         const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
        
//         for (let i = 0; i <= monthDiff; i++) {
//           const date = new Date(startDate);
//           date.setMonth(date.getMonth() + i);
          
//           // Random fluctuation between -5% and +8%
//           const change = currentValue * (Math.random() * 0.13 - 0.05);
//           currentValue += change;
          
//           overallData.push({
//             date: date.toISOString().substring(0, 7),
//             value: Math.round(currentValue * 100) / 100
//           });
//         }
        
//         // Generate last 10 trades performance (negative trend)
//         const lastTenData: PerformanceData[] = [];
//         let tenTradesValue = 0;
        
//         for (let i = 0; i < 10; i++) {
//           const date = new Date();
//           date.setDate(date.getDate() - (10 - i));
          
//           // Negative trend
//           const change = -Math.random() * 12;
//           tenTradesValue += change;
          
//           lastTenData.push({
//             date: date.toISOString().substring(0, 10),
//             value: Math.round(tenTradesValue * 100) / 100
//           });
//         }
        
//         // Generate this year performance (positive trend)
//         const yearData: PerformanceData[] = [];
//         let yearValue = 0;
//         const today = new Date();
//         const yearStart = new Date(today.getFullYear(), 0, 1);
//         const dayDiff = Math.floor((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
        
//         for (let i = 0; i <= dayDiff; i++) {
//           if (i % 7 === 0) { // Add data points weekly
//             const date = new Date(yearStart);
//             date.setDate(date.getDate() + i);
            
//             // Positive trend with some fluctuation
//             const change = Math.random() * 2 - 0.5;
//             yearValue += change;
            
//             yearData.push({
//               date: date.toISOString().substring(0, 10),
//               value: Math.round(yearValue * 100) / 100
//             });
//           }
//         }
        
//         setOverallPerformance(overallData);
//         setLastTenTrades(lastTenData);
//         setYearPerformance(yearData);
//       } catch (error) {
//         console.error("Error fetching performance data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPerformanceData();
//   }, [clientId, session]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <p>Loading performance data...</p>
//       </div>
//     );
//   }

//   // Calculate final values
//   const overallValue = overallPerformance.length > 0 ? overallPerformance[overallPerformance.length - 1].value : 0;
//   const overallGrowth = overallValue - 100; // Assuming started at $100
//   const overallGrowthPercent = Math.round((overallGrowth / 100) * 100 * 10) / 10; // One decimal place
  
//   const lastTenValue = lastTenTrades.length > 0 ? lastTenTrades[lastTenTrades.length - 1].value : 0;
//   const yearValue = yearPerformance.length > 0 ? yearPerformance[yearPerformance.length - 1].value : 0;
//   const yearPercentage = Math.round((yearValue / 100) * 100 * 10) / 10; // One decimal place

//   return (
//     <div className="space-y-6">
//       {/* Overall Performance Card */}
//       <div className="bg-white p-4 rounded-lg border">
//         <div className="flex justify-between items-start mb-2">
//           <div>
//             <h3 className="text-lg font-semibold">Overall performance</h3>
//             <p className="text-sm text-gray-500">Shows the growth of $100 since subscription started</p>
//           </div>
//           <div className="text-right">
//             <span className="text-3xl font-bold">234</span>
//             <span className="text-sm text-green-500 ml-1">↗ 84.5%</span>
//             <p className="text-xs text-gray-500">XIRR</p>
//           </div>
//         </div>
        
//         <div className="h-40 mt-4">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={overallPerformance}>
//               <Line 
//                 type="monotone" 
//                 dataKey="value" 
//                 stroke="#8884d8" 
//                 strokeWidth={2} 
//                 dot={false} 
//               />
//               <XAxis 
//                 dataKey="date" 
//                 tickFormatter={(date) => date.substring(0, 4)}
//                 interval="preserveStartEnd"
//                 tick={{ fontSize: 12 }}
//               />
//               <YAxis hide />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//         {/* X-axis labels */}
//         <div className="flex justify-between mt-2 text-xs text-gray-500">
//           <span>2023</span>
//           <span>2024</span>
//           <span>2025</span>
//         </div>
//       </div>
      
//       {/* Performance Metrics Row */}
//       <div className="grid grid-cols-2 gap-4">
//         {/* Last 10 Trades Performance */}
//         <div className="bg-white p-4 rounded-lg border">
//           <div className="flex justify-between mb-1">
//             <h4 className="text-sm font-medium">Performance of last 10 trades</h4>
//             {/* Trophy icon placeholder */}
//             <div className="w-8 h-8 flex items-center justify-center">
//               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M8 21H16M12 17V21M6 17H18M6 9V17H18V9M6 9C6 9 8 7 12 7C16 7 18 9 18 9M6 9V8C6 6.4 7.2 3 12 3C16.8 3 18 6.4 18 8V9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-1">
//             <span className="text-xl font-bold">- $92</span>
//             <span className="text-xs text-red-500">▼ 10%</span>
//           </div>
//           <p className="text-xs text-gray-500">Effect on portfolio</p>
          
//           <div className="h-16 mt-2">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={lastTenTrades}>
//                 <Line 
//                   type="monotone" 
//                   dataKey="value" 
//                   stroke="#ff6b6b" 
//                   strokeWidth={2} 
//                   dot={false} 
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
        
//         {/* Performance This Year */}
//         <div className="bg-white p-4 rounded-lg border">
//           <div className="flex justify-between mb-1">
//             <h4 className="text-sm font-medium">Performance this year</h4>
//             <Info className="w-4 h-4 text-gray-400" />
//           </div>
          
//           <div className="flex items-center gap-1">
//             <span className="text-xl font-bold">$111.42</span>
//             <span className="text-xs text-green-500">▲ 2%</span>
//           </div>
//           <p className="text-xs text-gray-500">last year (this mth)</p>
          
//           <div className="h-16 mt-2">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={yearPerformance}>
//                 <Line 
//                   type="monotone" 
//                   dataKey="value" 
//                   stroke="#4ade80" 
//                   strokeWidth={2} 
//                   dot={false} 
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
      
//       {/* Note */}
//       <p className="text-xs text-gray-500 text-center mt-2">
//         Note: Returns are calculated on exited trades only
//       </p>
//     </div>
//   );
// };

// TradesTab Component
const TradesTab = ({ clientId }: { clientId: number }) => {
  const [latestClientTrades, setLatestClientTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { session } = useSession();

  useEffect(() => {
    const fetchLatestClientTrades = async () => {
      const supabase = await createClerkSupabaseClient(session);
      setLoading(true);
      
      try {
        // Fetch all trade data for the specific client
        const { data, error } = await supabase
          .from("user_trades")
          .select("*")
          .eq("user_id", clientId)
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
  }, [clientId, session, segmentFilter, statusFilter]);

  return (
    <div>
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
    </div>
  );
};

// Timeline Tab placeholder
const TimelineTab = () => (
  <div className="p-4 text-center">
    <p>Timeline content will be displayed here</p>
  </div>
);

// Call Logs Tab placeholder
const CallLogsTab = () => (
  <div className="p-4 text-center">
    <p>Call logs will be displayed here</p>
  </div>
);

// Documents Tab placeholder
const DocumentsTab = () => (
  <div className="p-4 text-center">
    <p>Documents will be displayed here</p>
  </div>
);

const ClientSidePanel: React.FC<ClientSidePanelProps> = ({ client, onClose }) => {
  const [activeTab, setActiveTab] = useState("return");
  const { session } = useSession();

  return (
    <div className="fixed right-0 top-0 h-screen w-108 bg-white shadow-lg p-6 border-l overflow-y-auto border-gray-200 border-rounded-lg">
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex justify-between border-b pb-2 mb-4">
          <TabsTrigger value="return">Return</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="calls">Call Logs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="return">
          <ClientReturnsPerformance clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="trades">
          <TradesTab clientId={client.id} />
        </TabsContent>
        
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
        
        <TabsContent value="calls">
          <CallLogsTab />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>
      </Tabs>

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