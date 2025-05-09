"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const colors = {
  gray: { 200: "#E5E7EB", 400: "#9CA3AF" },
  primary: { 500: "#3B82F6", 600: "#2563EB" },
  green: { 100: "#D1FAE5", 500: "#10B981", 800: "#065F46" },
  red: { 100: "#FEE2E2", 500: "#EF4444", 800: "#991B1B" },
}

const fallbackColors = {
  gray: { 200: "#E5E7EB", 400: "#9CA3AF" },
  primary: { 500: "#3B82F6", 600: "#2563EB" },
  green: { 100: "#D1FAE5", 500: "#10B981", 800: "#065F46" },
  red: { 100: "#FEE2E2", 500: "#EF4444", 800: "#991B1B" },
}

const getColor = (color: string, shade: string | number) => {
  try {
    // @ts-ignore
    return colors?.[color]?.[shade] || fallbackColors[color][shade]
  } catch {
    return fallbackColors[color][shade]
  }
}

interface TradeData {
  entry: string | number
  exitPrice?: string | number
  exitDate?: string
  stock: string
  status: string
  createdAt: string
  tradeType: string
  // Additional fields from your data
  segment: string
  targets: string[]
  stoploss: string
  rangeEntry: boolean
  trailingSL: boolean
  rangeTarget: boolean
  timeHorizon: string
}

interface Trade {
  id: string
  advisor_id: string
  trade_data: TradeData | TradeData[] // Can be either a single object or an array
}

export function RevenueChart() {
  const [chartData, setChartData] = useState<{ date: string; value: number; stock: string; type: string }[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)
  const [loading, setLoading] = useState(true)
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const fetchAndProcessTrades = async () => {
      if (!session || !user) return

      setLoading(true)
      try {
        const supabase = await createClerkSupabaseClient(session)

        // Fetch trades for current user
        const { data: trades, error } = await supabase
          .from("user_trades")
          .select("id, advisor_id, trade_data")
          .eq("advisor_id", user.id)

        if (error) throw error

        if (!trades?.length) {
          setChartData([])
          setTotalProfit(0)
          setPercentageChange(0)
          return
        }

        // Check if trade_data is an array or a single object and normalize it
        const allTradeDatas = trades.flatMap((trade) => {
          // If trade_data is an array, use it directly
          if (Array.isArray(trade.trade_data)) {
            return trade.trade_data.map((td) => ({
              ...td,
              parentId: trade.id,
            }))
          }
          // If trade_data is a single object, wrap it in an array
          else {
            return [
              {
                ...trade.trade_data,
                parentId: trade.id,
              },
            ]
          }
        })

        // Now filter & process
        const exitedTrades = allTradeDatas
          .filter((td) => td.status === "EXITED" && td.exitPrice !== undefined)
          .map((td) => {
            const entry = Number(td.entry)
            const exit = Number(td.exitPrice)
            if (isNaN(entry) || isNaN(exit)) {
              return null
            }
            const date = td.exitDate || td.createdAt
            return {
              date: new Date(date).toLocaleDateString(),
              value: exit - entry,
              stock: td.stock,
              type: td.tradeType,
            }
          })
          .filter(Boolean) as { date: string; value: number; stock: string; type: string }[]

        // Group by date and calculate daily profit
        const dailyProfitMap = exitedTrades.reduce(
          (acc, trade) => {
            acc[trade.date] = (acc[trade.date] || 0) + trade.value
            return acc
          },
          {} as Record<string, number>,
        )

        // Convert to chart data and sort
        const sortedData = Object.entries(dailyProfitMap)
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate metrics
        const total = sortedData.reduce((sum, day) => sum + day.value, 0)
        const change = calculatePercentageChange(sortedData)

        setChartData(sortedData)
        setTotalProfit(total)
        setPercentageChange(change)
      } catch (error) {
        console.error("Error processing trades:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessTrades()
  }, [session, user])

  const calculatePercentageChange = (data: { value: number }[]) => {
    if (data.length < 2) return 0
    const prev = data[data.length - 2].value
    const current = data[data.length - 1].value
    return Number.parseFloat((((current - prev) / Math.abs(prev)) * 100).toFixed(1))
  }

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Revenue Generated</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg font-semibold">Revenue Generated</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">₹{totalProfit.toLocaleString()}</span>
            <span
              className={`text-sm font-medium px-2 py-1 rounded-md ${
                percentageChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {percentageChange >= 0 ? "↑" : "↓"} {Math.abs(percentageChange)}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getColor("gray", 200)} />
              <XAxis dataKey="date" stroke={getColor("gray", 400)} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke={getColor("gray", 400)}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
                width={80}
              />
              <Tooltip
                formatter={(value) => [`₹${value}`, "Profit"]}
                labelFormatter={(date) => `Date: ${date}`}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  background: "white",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={getColor("primary", 500)}
                strokeWidth={2}
                dot={{ r: 4, fill: getColor("primary", 500) }}
                activeDot={{
                  r: 6,
                  stroke: getColor("primary", 600),
                  strokeWidth: 2,
                  fill: "white",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
