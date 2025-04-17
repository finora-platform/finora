"use client"

import { useState, useEffect } from "react"
import { FaEdit, FaPaperPlane, FaTimes, FaAngleDown, FaAngleUp } from "react-icons/fa"
import { MdArrowForward } from "react-icons/md"
import { createClerkSupabaseClient } from "@/utils/supabaseClient"
import { useSession } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface TimelineItem {
  type: "Created" | "Edited" | "Exited"
  timestamp: string
  stoploss?: string
  entry?: string
  target?: string
  targetChange?: string
  exitPrice?: string
  tradeData?: any // Store the full trade data for display
}

interface TimelineProps {
  stock: string
  userId: string
  onClose?: () => void
  className?: string
}

export const Timeline = ({ stock, userId, onClose, className = "" }: TimelineProps) => {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const { isLoaded, session } = useSession()

  useEffect(() => {
    if (isLoaded && session && stock && userId) {
      fetchTradeTimeline(stock, userId)
    }
  }, [isLoaded, session, stock, userId])

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const fetchTradeTimeline = async (stockSymbol: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = await createClerkSupabaseClient(session)
      
      // Get all trades for this user
      const { data: allTrades, error } = await supabase
        .from("user_trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
  
      if (error) {
        throw error
      }
  
      if (!allTrades || allTrades.length === 0) {
        setTimelineData([])
        return
      }
  
      // Filter trades that match our stock symbol
      const relevantTrades = allTrades.filter(trade => {
        try {
          let tradeData = trade.trade_data
          
          if (typeof tradeData === 'string') {
            tradeData = JSON.parse(tradeData)
          }
          
          if (Array.isArray(tradeData)) {
            tradeData = tradeData[0]
          }
          
          return tradeData?.stock === stockSymbol
        } catch (err) {
          return false
        }
      })
  
      if (relevantTrades.length === 0) {
        setTimelineData([])
        return
      }
  
      const timeline: TimelineItem[] = []
  
      // First item is always creation
      const firstTrade = relevantTrades[0]
      let firstTradeData = firstTrade.trade_data
      if (typeof firstTradeData === 'string') {
        firstTradeData = JSON.parse(firstTradeData)
      }
      if (Array.isArray(firstTradeData)) {
        firstTradeData = firstTradeData[0]
      }
  
      timeline.push({
        type: "Created",
        timestamp: firstTrade.createdAt || firstTrade.created_at,
        entry: firstTradeData?.entry?.toString(),
        stoploss: firstTradeData?.stoploss?.toString(),
        target: Array.isArray(firstTradeData?.targets) 
          ? firstTradeData.targets.join(", ") 
          : firstTradeData?.targets?.toString(),
        tradeData: firstTradeData
      })
  
      // Compare subsequent items with previous ones to detect changes
      for (let i = 1; i < relevantTrades.length; i++) {
        const current = relevantTrades[i]
        const previous = relevantTrades[i - 1]
  
        // Parse trade_data (handle both string and object cases)
        let currentData = current.trade_data
        let previousData = previous.trade_data
        
        if (typeof currentData === 'string') {
          currentData = JSON.parse(currentData)
        }
        if (Array.isArray(currentData)) {
          currentData = currentData[0]
        }
        
        if (typeof previousData === 'string') {
          previousData = JSON.parse(previousData)
        }
        if (Array.isArray(previousData)) {
          previousData = previousData[0]
        }
  
        const changes: Partial<TimelineItem> = {
          tradeData: currentData
        }
        let hasChanges = false
  
        // Check for stoploss changes
        if (currentData?.stoploss !== previousData?.stoploss) {
          changes.stoploss = `${previousData?.stoploss} → ${currentData?.stoploss}`
          hasChanges = true
        }
  
        // Check for target changes
        if (JSON.stringify(currentData?.targets) !== JSON.stringify(previousData?.targets)) {
          changes.targetChange = `${previousData?.targets?.join(", ") || ""} → ${currentData?.targets?.join(", ") || ""}`
          hasChanges = true
        }
  
        if (hasChanges) {
          timeline.push({
            type: "Edited",
            timestamp: current.createdAt || current.created_at,
            ...changes
          })
        }
  
        // Check for exit
        if (previousData?.status !== "EXITED" && currentData?.status === "EXITED") {
          timeline.push({
            type: "Exited",
            timestamp: currentData?.exitDate || current.createdAt || current.created_at,
            exitPrice: currentData?.exitPrice,
            tradeData: currentData
          })
        }
      }
  
      setTimelineData(timeline)
      
      // Auto-expand the first item
      if (timeline.length > 0) {
        setExpandedItems({ 0: true })
      }
    } catch (err) {
      console.error("Error in fetchTradeTimeline:", err)
      setError("Failed to load trade history. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (e) {
      return dateString
    }
  }

  const renderIcon = (type: TimelineItem["type"]) => {
    switch(type) {
      case "Created": return <FaPaperPlane className="w-3 h-3" />
      case "Edited": return <FaEdit className="w-3 h-3" />
      case "Exited": return <FaTimes className="w-3 h-3" />
    }
  }

  return (
    <div className={`bg-white rounded-xl w-full ${className}`}>
      <div className="flex justify-between items-center mb-2 px-4 py-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Close timeline"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="flex items-center mb-1">
                <Skeleton className="h-4 w-4 rounded-full mr-2" />
                <Skeleton className="h-4 w-16 mr-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full mt-1" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
          {error}
          <button 
            onClick={() => fetchTradeTimeline(stock, userId)}
            className="ml-2 text-purple-600 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : timelineData.length === 0 ? (
        <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
          No timeline data available for this trade
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {timelineData.map((item, idx) => (
            <div key={idx} className="border-l-4 border-gray-200 hover:bg-gray-50">
              <div 
                className="px-4 py-3 flex items-start cursor-pointer"
                onClick={() => toggleExpand(idx)}
              >
                <div className="mr-3 mt-1 p-1 rounded-full bg-gray-100">
                  {renderIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.type}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.timestamp)}
                  </div>
                  
                  {item.stoploss && !expandedItems[idx] && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      <span className="font-medium">STOPLOSS:</span> {item.stoploss}
                    </div>
                  )}
                  
                  {item.targetChange && !expandedItems[idx] && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      <span className="font-medium">TARGET:</span> {item.targetChange}
                    </div>
                  )}
                </div>
                
                <div className="text-gray-400 ml-2">
                  {expandedItems[idx] ? <FaAngleUp /> : <FaAngleDown />}
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedItems[idx] && (
                <div className="px-4 py-3 pb-4 bg-gray-50 text-sm">
                  {item.type === "Created" && (
                    <div className="space-y-2">
                      {item.entry && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">ENTRY</span>
                          <span className="font-medium">{item.entry}</span>
                        </div>
                      )}
                      {item.stoploss && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">STOPLOSS</span>
                          <span className="font-medium">{typeof item.stoploss === 'string' && !item.stoploss.includes('→') ? item.stoploss : item.tradeData?.stoploss}</span>
                        </div>
                      )}
                      {item.target && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">TARGET</span>
                          <span className="font-medium">{item.target}</span>
                        </div>
                      )}
                      {item.tradeData?.riskReward && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">RISK/REWARD</span>
                          <span className="font-medium">{item.tradeData.riskReward}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {item.type === "Edited" && (
                    <div className="space-y-2">
                      {item.stoploss && (
                        <div>
                          <div className="font-medium text-gray-500 mb-1">STOPLOSS</div>
                          <div className="flex items-center">
                            <span className="font-medium">{item.stoploss.split(' → ')[0]}</span>
                            <MdArrowForward className="mx-2 text-gray-400" />
                            <span className="font-medium">{item.stoploss.split(' → ')[1]}</span>
                          </div>
                        </div>
                      )}
                      
                      {item.targetChange && (
                        <div>
                          <div className="font-medium text-gray-500 mb-1">TARGET</div>
                          <div className="flex items-center">
                            <span className="font-medium">{item.targetChange.split(' → ')[0]}</span>
                            <MdArrowForward className="mx-2 text-gray-400" />
                            <span className="font-medium">{item.targetChange.split(' → ')[1]}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Show all current values */}
                      <div className="border-t border-gray-200 mt-3 pt-3">
                        <div className="text-gray-500 mb-2 text-xs font-medium">CURRENT VALUES</div>
                        <div className="space-y-2">
                          {item.tradeData?.entry && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-500">ENTRY</span>
                              <span className="font-medium">{item.tradeData.entry}</span>
                            </div>
                          )}
                          {item.tradeData?.stoploss && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-500">STOPLOSS</span>
                              <span className="font-medium">{item.tradeData.stoploss}</span>
                            </div>
                          )}
                          {item.tradeData?.targets && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-500">TARGET</span>
                              <span className="font-medium">
                                {Array.isArray(item.tradeData.targets) 
                                  ? item.tradeData.targets.join(', ') 
                                  : item.tradeData.targets}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {item.type === "Exited" && (
                    <div className="space-y-2">
                      {item.exitPrice && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">EXIT PRICE</span>
                          <span className="font-medium">{item.exitPrice}</span>
                        </div>
                      )}
                      {item.tradeData?.entry && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">ENTRY</span>
                          <span className="font-medium">{item.tradeData.entry}</span>
                        </div>
                      )}
                      {item.tradeData?.stoploss && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">STOPLOSS</span>
                          <span className="font-medium">{item.tradeData.stoploss}</span>
                        </div>
                      )}
                      {item.tradeData?.profitLoss && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-500">PROFIT/LOSS</span>
                          <span className={`font-medium ${Number(item.tradeData.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.tradeData.profitLoss}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}