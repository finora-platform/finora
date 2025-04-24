"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession, useUser } from "@clerk/nextjs"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const PLANS = [
  { id: "standard", name: "Standard", color: "#2563eb" },
  { id: "premium", name: "Premium", color: "#10b981" },
  { id: "elite", name: "Elite", color: "#f97316" }
]

interface PlanData {
  name: string
  value: number
  color: string
}

const renderLoadingState = () => (
  <Card className="col-span-1">
    <CardHeader>
      <CardTitle className="flex justify-between">
        <span>Active clients</span>
        <Skeleton className="h-8 w-12" />
      </CardTitle>
    </CardHeader>
    <CardContent>
    </CardContent>
  </Card>
)

const renderPlanLegend = (data: PlanData[]) => (
  <div className="mt-4 grid grid-cols-3 gap-4">
    {data.map((item) => (
      <div key={item.name} className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{item.value} clients</span>
      </div>
    ))}
  </div>
)

export function ActiveClientsChart() {
  const [data, setData] = useState<PlanData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!session || !user?.id) return;
  
      setLoading(true);
      const supabase = await createClerkSupabaseClient(session);
  
      try {
        const { data: rows, error } = await supabase
          .from("client3")
          .select("plan")
          .eq("user_id", user.id) // ✅ Filter by advisory_id


  
        if (error) throw error;
  
        const counts = PLANS.reduce((acc, plan) => {
          acc[plan.id] = rows.filter(r => r.plan === plan.id).length;
          return acc;
        }, {} as Record<string, number>);
  
        const chartData = PLANS.map(plan => ({
          name: plan.name,
          value: counts[plan.id] || 0,
          color: plan.color,
        }));
  
        setData(chartData);
        setTotal(Object.values(counts).reduce((sum, count) => sum + count, 0));
      } catch (error) {
        console.error("Error fetching plan data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPlanData();
  }, [session, user?.id]);
  

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Active clients</span>
          <span className="text-2xl font-bold">{total}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} clients`, "Count"]}
                labelFormatter={(name) => `Plan: ${name}`}
              />

            </PieChart>
          </ResponsiveContainer>
        </div>
        {renderPlanLegend(data)}
      </CardContent>
    </Card>
  )
}