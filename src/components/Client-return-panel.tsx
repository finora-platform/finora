import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { useSession } from "@clerk/nextjs";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface PerformanceData {
  date: string;
  value: number;
}

interface Trade {
  entry: string;
  stock: string;
  status: string;
  segment: string;
  targets: string[];
  exitDate?: string;
  stoploss: string;
  createdAt: string;
  exitPrice?: string;
  tradeType: "BUY" | "SELL";
  rangeEntry: boolean;
  trailingSL: boolean;
  rangeTarget: boolean;
  timeHorizon: "INTRADAY" | "SWING" | "LONGTERM";
}

interface PerformanceMetrics {
  totalReturns: number;
  lastTenTradesReturn: number;
  thisYearReturn: number;
  lastTenTradesPercentage: number;
  thisYearPercentage: number;
  overallGrowthPercent: number;
  xirr: number;
}

interface ClientReturnsProps {
  clientId: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('₹', 'Rs ');
};

const calculateTradeReturn = (trade: Trade): number => {
  if (trade.status !== "EXITED" || !trade.exitPrice) return 0;
  
  const entry = parseFloat(trade.entry);
  const exit = parseFloat(trade.exitPrice);
  
  if (isNaN(entry) || isNaN(exit)) return 0;
  
  if (trade.tradeType === "BUY") {
    return exit - entry;
  } else {
    return entry - exit;
  }
};

const calculateXIRR = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;
  
  const totalReturn = trades.reduce((sum, trade) => sum + calculateTradeReturn(trade), 0);
  const oldestTrade = trades.reduce((oldest, trade) => 
    new Date(trade.createdAt) < new Date(oldest.createdAt) ? trade : oldest, trades[0]);
  
  const timeDiffMs = Date.now() - new Date(oldestTrade.createdAt).getTime();
  const timeDiffYears = timeDiffMs / (1000 * 60 * 60 * 24 * 365);
  
  if (timeDiffYears < 0.1) return totalReturn * 10;
  
  const annualizedReturn = (totalReturn / 100) / timeDiffYears;
  return Math.round(annualizedReturn * 1000) / 10;
};

export const ClientReturnsPerformance: React.FC<ClientReturnsProps> = ({ clientId }) => {
  const [overallPerformance, setOverallPerformance] = useState<PerformanceData[]>([]);
  const [lastTenTrades, setLastTenTrades] = useState<PerformanceData[]>([]);
  const [yearPerformance, setYearPerformance] = useState<PerformanceData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalReturns: 0,
    lastTenTradesReturn: 0,
    thisYearReturn: 0,
    lastTenTradesPercentage: 0,
    thisYearPercentage: 0,
    overallGrowthPercent: 0,
    xirr: 0
  });
  const [loading, setLoading] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      
      try {
        const supabase = await createClerkSupabaseClient(session);
        
        const { data, error } = await supabase
          .from("user_trades")
          .select("*")
          .eq("user_id", clientId)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        const allTrades: Trade[] = [];
        data.forEach(row => {
          if (row.trade_data && Array.isArray(row.trade_data)) {
            const exitedTrades = row.trade_data.filter((trade: Trade) => trade.status === "EXITED");
            allTrades.push(...exitedTrades);
          }
        });

        allTrades.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        if (allTrades.length === 0) {
          setLoading(false);
          return;
        }

        let cumulativeValue = 100;
        const performanceData: PerformanceData[] = [];
        const tradeReturns: number[] = [];

        const monthlyData = new Map<string, number>();
        
        allTrades.forEach(trade => {
          const return_ = calculateTradeReturn(trade);
          tradeReturns.push(return_);
          
          cumulativeValue += return_;
          
          const date = new Date(trade.createdAt);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData.has(monthYear)) {
            monthlyData.set(monthYear, cumulativeValue);
          } else {
            monthlyData.set(monthYear, cumulativeValue);
          }
          
          performanceData.push({
            date: new Date(trade.createdAt).toISOString().split('T')[0],
            value: cumulativeValue
          });
        });

        const overallData: PerformanceData[] = Array.from(monthlyData.entries())
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        const recentTrades = allTrades.slice(-10);
        let recentValue = 0;
        const recentPerformanceData: PerformanceData[] = [];
        
        recentTrades.forEach(trade => {
          const return_ = calculateTradeReturn(trade);
          recentValue += return_;
          
          recentPerformanceData.push({
            date: new Date(trade.createdAt).toISOString().split('T')[0],
            value: recentValue
          });
        });
        
        const currentYear = new Date().getFullYear();
        const thisYearTrades = allTrades.filter(trade => 
          new Date(trade.createdAt).getFullYear() === currentYear
        );
        
        let yearValue = 0;
        const yearPerformanceData: PerformanceData[] = [];
        
        const weeklyData = new Map<string, number>();
        
        thisYearTrades.forEach(trade => {
          const return_ = calculateTradeReturn(trade);
          yearValue += return_;
          
          const date = new Date(trade.createdAt);
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil(days / 7);
          const weekKey = `${date.getFullYear()}-W${weekNumber}`;
          
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, yearValue);
          } else {
            weeklyData.set(weekKey, yearValue);
          }
        });
        
        const yearData: PerformanceData[] = Array.from(weeklyData.entries())
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        const totalReturn = tradeReturns.reduce((sum, ret) => sum + ret, 0);
        const lastTenReturn = recentTrades.reduce((sum, trade) => sum + calculateTradeReturn(trade), 0);
        const thisYearReturn = thisYearTrades.reduce((sum, trade) => sum + calculateTradeReturn(trade), 0);
        
        const lastTenPercentage = recentTrades.length > 0 ? (lastTenReturn / 10) * 100 : 0;
        const yearPercentage = thisYearTrades.length > 0 ? (thisYearReturn / thisYearTrades.length) * 100 : 0;
        const overallGrowthPercent = ((cumulativeValue - 100) / 100) * 100;
        
        const xirrValue = calculateXIRR(allTrades);
        
        setMetrics({
          totalReturns: cumulativeValue,
          lastTenTradesReturn: lastTenReturn,
          thisYearReturn: thisYearReturn,
          lastTenTradesPercentage: Math.round(lastTenPercentage * 10) / 10,
          thisYearPercentage: Math.round(yearPercentage * 10) / 10,
          overallGrowthPercent: Math.round(overallGrowthPercent * 10) / 10,
          xirr: xirrValue
        });
        
        setOverallPerformance(overallData);
        setLastTenTrades(recentPerformanceData);
        setYearPerformance(yearData);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [clientId, session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (overallPerformance.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>No exited trades found for this client</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Overall Performance Card */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">Overall performance</h3>
            <p className="text-sm text-gray-500">Shows the growth of Rs 100 since subscription started</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold">{Math.round(metrics.totalReturns)}</span>
            <span className={`text-sm ml-1 ${metrics.overallGrowthPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.overallGrowthPercent >= 0 ? '↗' : '↘'} {Math.abs(metrics.overallGrowthPercent)}%
            </span>
            <p className="text-xs text-gray-500">XIRR</p>
          </div>
        </div>
        
        <div className="h-40 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overallPerformance}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2} 
                dot={false} 
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => date.substring(0, 4)}
                interval="preserveStartEnd"
                tick={{ fontSize: 12 }}
              />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {overallPerformance.length > 0 && (
            <>
              <span>{new Date(overallPerformance[0].date).getFullYear()}</span>
              {overallPerformance.length > 1 && (
                <span>{new Date(overallPerformance[Math.floor(overallPerformance.length / 2)].date).getFullYear()}</span>
              )}
              <span>{new Date(overallPerformance[overallPerformance.length - 1].date).getFullYear()}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Performance Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Last 10 Trades Performance */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between mb-1">
            <h4 className="text-sm font-medium">Performance of last 10 trades</h4>
            {/* Trophy icon placeholder */}
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 21H16M12 17V21M6 17H18M6 9V17H18V9M6 9C6 9 8 7 12 7C16 7 18 9 18 9M6 9V8C6 6.4 7.2 3 12 3C16.8 3 18 6.4 18 8V9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold">
              {metrics.lastTenTradesReturn >= 0 ? '+' : '-'} {formatCurrency(Math.abs(metrics.lastTenTradesReturn))}
            </span>
            <span className={`text-xs ${metrics.lastTenTradesPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.lastTenTradesPercentage >= 0 ? '▲' : '▼'} {Math.abs(metrics.lastTenTradesPercentage)}%
            </span>
          </div>
          <p className="text-xs text-gray-500">Effect on portfolio</p>
          
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lastTenTrades}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metrics.lastTenTradesReturn >= 0 ? "#4ade80" : "#ff6b6b"} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Performance This Year */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between mb-1">
            <h4 className="text-sm font-medium">Performance this year</h4>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold">{formatCurrency(metrics.thisYearReturn)}</span>
            <span className={`text-xs ${metrics.thisYearPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.thisYearPercentage >= 0 ? '▲' : '▼'} {Math.abs(metrics.thisYearPercentage)}%
            </span>
          </div>
          <p className="text-xs text-gray-500">last year (this mth)</p>
          
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearPerformance}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={metrics.thisYearReturn >= 0 ? "#4ade80" : "#ff6b6b"}
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Note */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Note: Returns are calculated on exited trades only
      </p>
    </div>
  );
};

export default ClientReturnsPerformance;