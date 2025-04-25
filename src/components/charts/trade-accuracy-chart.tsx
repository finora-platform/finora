"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Purple fallback colors
const fallbackColors = {
  purple: {
    200: "#d0bfff", // Standard
    500: "#845ef7", // Premium
    900: "#5f3dc4"  // Elite
  }
}

interface TradeData {
  entry: string
  stock: string
  status: string
  targets: string[]
  stoploss: string
  createdAt: string
  tradeType: string
  rangeEntry: boolean
  trailingSL: boolean
  rangeTarget: boolean
  timeHorizon: string
  exitPrice?: string
  exitDate?: string
}

interface Trade {
  id: string
  advisor_id: string
  trade_data: TradeData | string
  user_id?: string
  created_at?: string
  updated_at?: string
}

export function TradeAccuracyChart() {
  const [percentage, setPercentage] = useState(0)
  const [completedTrades, setCompletedTrades] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)
  const [loading, setLoading] = useState(true)
  const { session } = useSession()
  const { user } = useUser()

  const getColor = (shade: 200 | 500 | 900) => {
    return fallbackColors.purple[shade]
  }

  useEffect(() => {
    const fetchAndCalculateTrades = async () => {
      if (!session || !user) return
      setLoading(true)
      try {
        const supabase = await createClerkSupabaseClient(session)
        const { data: trades, error } = await supabase
          .from("user_trades")
          .select("id, advisor_id, trade_data")
          .eq("advisor_id", user.id)

        if (error) throw error
        if (!trades || trades.length === 0) {
          setPercentage(0)
          setCompletedTrades(0)
          setPercentageChange(0)
          return
        }

        const parsedTrades = trades.map(trade => {
          if (typeof trade.trade_data === "string") {
            try {
              return {
                ...trade,
                trade_data: JSON.parse(trade.trade_data)
              }
            } catch {
              return trade
            }
          } else if (Array.isArray(trade.trade_data)) {
            return {
              ...trade,
              trade_data: trade.trade_data[0]
            }
          }
          return trade
        })

        const exitedTrades = parsedTrades.filter(trade => {
          const tradeData = trade.trade_data as TradeData
          return tradeData && tradeData.status === "EXITED"
        })

        if (exitedTrades.length === 0) {
          setPercentage(0)
          setCompletedTrades(0)
          setPercentageChange(0)
          return
        }

        const profitableTrades = exitedTrades.filter(trade => {
          const tradeData = trade.trade_data as TradeData
          const entryPrice = parseFloat(tradeData.entry)
          const exitPrice = tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : null

          if (isNaN(entryPrice) || !exitPrice) return false

          return tradeData.tradeType === "BUY"
            ? exitPrice > entryPrice
            : exitPrice < entryPrice
        })

        const accuracy = Math.round((profitableTrades.length / exitedTrades.length) * 100)
        setPercentage(accuracy)
        setCompletedTrades(exitedTrades.length)

        const prevPeriodAccuracy = 75
        const change = Math.round(((accuracy - prevPeriodAccuracy) / prevPeriodAccuracy) * 100)
        setPercentageChange(change)
      } catch (error) {
        console.error("Error fetching trades:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndCalculateTrades()
  }, [session, user])

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Trade accuracy</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Trade accuracy</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-purple-700">{percentage}%</span>
            <span className={`text-sm ${percentageChange >= 0 ? "text-purple-500" : "text-purple-900"}`}>
              {percentageChange >= 0 ? "+" : ""}
              {percentageChange}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-[200px] mx-auto">
          <svg className="transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getColor(200)}
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getColor(percentage > 75 ? 900 : 500)}
              strokeWidth="10"
              strokeDasharray={`${percentage * 2.83} ${283 - percentage * 2.83}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-purple-700">{percentage}%</span>
            <span className="text-sm text-purple-400">
              {completedTrades} completed {completedTrades === 1 ? "trade" : "trades"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
