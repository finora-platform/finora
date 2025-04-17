"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, X, Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatTime } from "@/utils/format"
import { EditTradeModal } from "./edit-trade-modal"
import { ExitTradeModal } from "./exit-trade-modal"
import { TimelineModal } from "./Timelinemodal"
import RationaleModal from "@/app/dashboard/advisory/components/rationale-modal"

interface TradeCardProps {
  trade: Trade
  isLast: boolean
  onTradeUpdate: (trade: Trade) => Promise<void>
  onTradeExit: (tradeId: string, exitData: ExitData) => Promise<void>
  clientId: string
  clientName: string
}

interface Trade {
  id: string
  userId: string
  tradeType: string
  stock: string
  segment: string
  timeHorizon: string
  status: string
  entry: number
  stoploss: number
  exitPrice?: number
  riskReward?: number
  rationale: string
  createdAt: string
  updatedAt?: string
}

interface ExitData {
  exitPrice: number
  exitDate: string
}

export const AdvisoryTradeCard = ({
  trade,
  isLast,
  onTradeUpdate,
  onTradeExit,
  clientId,
  clientName,
}: TradeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const tradeData = trade
  const isActiveTrade = tradeData?.status === "ACTIVE"

  const handleEditSubmit = async (updatedTrade: Trade) => {
    try {
      await onTradeUpdate({
        ...updatedTrade,
        updatedAt: new Date().toISOString(),
      })
      setIsEditing(false)
      console.log("Trade updated successfully.")
    } catch (error) {
      console.error("Error updating trade:", error)
    }
  }

  const handleExitSubmit = async (exitData: ExitData) => {
    try {
      await onTradeExit(trade.id, {
        ...exitData,
        exitDate: new Date().toISOString(),
      })
      setIsExiting(false)
    } catch (error) {
      console.error("Error exiting trade:", error)
    }
  }

  return (
    <div className={`p-4 border rounded-lg bg-white hover:bg-gray-50 transition ${isLast ? "" : "mb-4"}`}>
      {/* Top Section */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Left Section (Type & Name) */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span
            className={`font-semibold flex items-center ${tradeData?.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}
          >
            <span className="h-2 w-2 rounded-full mr-1 inline-block bg-current"></span>
            {tradeData?.tradeType || "N/A"}
          </span>
          <span className="font-medium text-gray-800">{tradeData?.stock || "Unknown Stock"}</span>
          {clientName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {clientName}
            </Badge>
          )}
          {tradeData?.segment && (
            <Badge variant="secondary" className="font-normal text-xs">
              {tradeData.segment}
            </Badge>
          )}
          {tradeData?.timeHorizon && (
            <Badge variant="outline" className="font-normal text-xs">
              {tradeData.timeHorizon}
            </Badge>
          )}
          {tradeData?.status && (
            <Badge
              variant={
                tradeData.status === "ACTIVE"
                  ? "default"
                  : tradeData.status === "COMPLETED"
                    ? "secondary"
                    : "destructive"
              }
            >
              {tradeData.status}
            </Badge>
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <RationaleModal rationale={tradeData.rationale} />
        </div>

        {/* Right Section (Actions & Date) */}
        <div className="flex items-center gap-2 text-sm">
          {isActiveTrade && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 p-1 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExiting(true)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Timeline button - available for all trade statuses */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 p-1 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              setIsTimelineOpen(true)
            }}
          >
            <Clock className="h-4 w-4" />
          </Button>

          <div className="text-gray-500 ml-2">
            <span>📅 {formatDate(tradeData.createdAt || "")}</span>
            <span className="ml-2">⏰ {formatTime(tradeData.createdAt || "")}</span>
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
              <span className="text-gray-900 font-medium">{tradeData?.entry ?? "—"}</span>
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
              <span className="text-gray-900 font-medium">{tradeData?.stoploss ?? "—"}</span>
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
                Exit Price
              </p>
              <span className="text-gray-900 font-medium">{tradeData?.exitPrice ?? "—"}</span>
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
              <span className="text-gray-900 font-medium">{tradeData?.riskReward ?? "—"}</span>
            </div>
          </div>

          {/* Rationale section if available */}
          {tradeData.rationale && (
            <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              <p className="flex items-center gap-1 font-medium">📝 Rationale</p>
              <span className="text-gray-900">{tradeData.rationale}</span>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TimelineModal
        isOpen={isTimelineOpen}
        onOpenChange={setIsTimelineOpen}
        stock={tradeData.stock}
        userId={tradeData.userId}
        tradeType={tradeData.tradeType}
      />

      {isActiveTrade && (
        <EditTradeModal
          trade={trade}
          isOpen={isEditing}
          onOpenChange={setIsEditing}
          onSave={handleEditSubmit}
          clientId={trade.userId}
        />
      )}

      {isActiveTrade && (
        <ExitTradeModal 
          trade={trade} 
          isOpen={isExiting} 
          onOpenChange={setIsExiting} 
          onExit={handleExitSubmit} 
        />
      )}
    </div>
  )
}