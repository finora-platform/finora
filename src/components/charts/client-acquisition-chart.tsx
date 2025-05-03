"use client"

import { useEffect, useState } from "react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { useSession } from "@clerk/nextjs"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { colors } from "@/styles/colors"

interface ChartData {
  date: string
  value: number
}

export function ClientAcquisitionChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [total, setTotal] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)
  const [loading, setLoading] = useState(true)
  const { session } = useSession()

  useEffect(() => {
    const fetchOnboardedLeads = async () => {
      if (!session) return

      setLoading(true)
      const supabase = await createClerkSupabaseClient(session)

      const { data: leads, error } = await supabase
        .from("leads")
        .select("created_at, updated_at")
        .eq("stage", "paid")
        .order("updated_at", { ascending: true })

      if (error) {
        console.error("Error fetching onboarded leads:", error)
        setLoading(false)
        return
      }

      if (!leads || leads.length === 0) {
        setData([])
        setTotal(0)
        setPercentageChange(0)
        setLoading(false)
        return
      }

      // You can switch to lead.updated_at if needed
      const dateCounts: Record<string, number> = {}
      leads.forEach((lead) => {
        const localDate = new Date(new Date(lead.updated_at).getTime() + (5.5 * 60 * 60 * 1000))
        const date = localDate.toISOString().split('T')[0];      
        dateCounts[date] = (dateCounts[date] || 0) + 1
      })

      const chartData = Object.entries(dateCounts)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const totalOnboarded = leads.length
      let changePercentage = 0

      if (chartData.length >= 2) {
        const [prev, current] = chartData.slice(-2)
        if (prev.value === 0) {
          changePercentage = current.value === 0 ? 0 : 100
        } else {
          changePercentage = ((current.value - prev.value) / prev.value) * 100
        }
      }

      setData(chartData)
      setTotal(totalOnboarded)
      setPercentageChange(parseFloat(changePercentage.toFixed(1)))
      setLoading(false)
    }

    fetchOnboardedLeads()
  }, [session])

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Client Onboarding</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{total}</span>
            <span className={`text-sm ${percentageChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {percentageChange >= 0 ? "+" : ""}
              {percentageChange}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading...
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke={colors.gray[400]}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getDate()}/${date.getMonth() + 1}`
                  }}
                />
                <YAxis
                  stroke={colors.gray[400]}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })
                  }}
                  formatter={(value) => [`${value} onboarded`, "Clients"]}
                  labelStyle={{ color: colors.gray[700], fontWeight: 500 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primary[500]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: colors.primary[500] }}
                  activeDot={{ r: 6, stroke: colors.primary[700], strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No onboarding data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
