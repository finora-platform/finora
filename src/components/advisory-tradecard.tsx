"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Edit, X, User } from "lucide-react"
import { formatDate, formatTime } from "@/utils/format"
import type { Trade, TradeCardProps, ExitData } from "@/types/trade-types"
import RationaleModal from "../app/dashboard/advisory/components/rationale-modal"
import { EditTradeModal } from "./edit-trade-modal"
import { ExitTradeModal } from "./exit-trade-modal"

export const AdvisoryTradeCard = ({ trade, isLast, onTradeUpdate, onTradeExit, clientId, clientName }: TradeCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isExiting, setIsExiting] = useState(false)

    const tradeData = trade

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
        <div className={`p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition ${isLast ? "" : "mb-4"}`}>
            {/* Top Section */}
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                {/* Left Section (Type & Name) */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`font-semibold ${tradeData?.tradeType === "BUY" ? "text-green-600" : "text-red-600"}`}>
                        {tradeData?.tradeType || "N/A"}
                    </span>
                    <span className="text-gray-500">{tradeData?.stock || "Unknown Stock"}</span>
                    {clientName && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {clientName}
                        </Badge>
                    )}
                    {tradeData?.segment && <Badge variant="outline">{tradeData.segment}</Badge>}
                    {tradeData?.timeHorizon && <Badge variant="outline">{tradeData.timeHorizon}</Badge>}
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
                <div onClick={(e) => { e.stopPropagation(); }}><RationaleModal /></div>

                {/* Right Section (Date & Time) */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📅 {formatDate(trade.created_at || trade.createdAt)}</span>
                    <span>⏰ {formatTime(trade.created_at || trade.createdAt)}</span>
                </div>
            </div>

            {/* Expanded Section */}
            {isExpanded && (
                <div className="mt-4 p-4 border-t bg-white rounded-md shadow-sm flex flex-col gap-4">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant={tradeData?.tradeType === "BUY" ? "success" : "destructive"}>
                                {tradeData?.tradeType || "N/A"}
                            </Badge>
                            <span className="font-bold text-lg">{tradeData?.stock || "Unknown Stock"}</span>
                            {clientName && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {clientName}
                                </Badge>
                            )}
                            {tradeData?.segment && <Badge variant="outline">{tradeData.segment}</Badge>}
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
                        <div className="flex gap-2">
                            {tradeData.status === "ACTIVE" && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExiting(true);
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Exit Trade
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Client Info Section */}
                    {clientName && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Client:</span>
                            <span>{clientName}</span>
                            {clientId && (
                                <Badge variant="secondary" className="ml-2">
                                    ID: {clientId}
                                </Badge>
                            )}
                        </div>
                    )}


                    {/* Rest of your existing expanded section content remains the same */}
                    {/* Entry, Stoploss, and Targets */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm text-gray-700">
                        <div>
                            <p className="flex items-center gap-1 font-medium">⏳ Entry</p>
                            <span className="text-gray-900 font-semibold">{tradeData?.entry ?? "—"}</span>
                        </div>
                        <div>
                            <p className="flex items-center gap-1 font-medium">🚫 Stoploss</p>
                            <span className="text-gray-900 font-semibold">{tradeData?.stoploss ?? "—"}</span>
                        </div>
                        <div>
                            <p className="flex items-center gap-1 font-medium">🚩 Target(s)</p>
                            <span className="text-gray-900 font-semibold">
                                {tradeData?.targets?.length > 0 ? tradeData.targets.join(" » ") : "No targets"}
                            </span>
                        </div>
                    </div>

                    {/* Rationale section if available */}
                    {tradeData.rationale && (
                        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            <p className="flex items-center gap-1 font-medium">📝 Rationale</p>
                            <span className="text-gray-900">{tradeData.rationale}</span>
                        </div>
                    )}

                    {/* Exit Information (if exited) */}
                    {tradeData.status === "EXITED" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            <div>
                                <p className="flex items-center gap-1 font-medium">💰 Exit Price</p>
                                <span className="text-gray-900 font-semibold">{tradeData?.exitPrice ?? "—"}</span>
                            </div>
                            <div>
                                <p className="flex items-center gap-1 font-medium">📊 P&L</p>
                                <span
                                    className={`font-semibold ${tradeData?.pnl?.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                                >
                                    {tradeData?.pnl ?? "—"}
                                </span>
                            </div>
                            <div>
                                <p className="flex items-center gap-1 font-medium">📝 Exit Reason</p>
                                <span className="text-gray-900 font-semibold">{tradeData?.exitReason ?? "—"}</span>
                            </div>
                            <div className="col-span-3">
                                <p className="flex items-center gap-1 font-medium">📅 Exit Date</p>
                                <span className="text-gray-900 font-semibold">
                                    {tradeData?.exitDate ? `${formatDate(tradeData.exitDate)} at ${formatTime(tradeData.exitDate)}` : "—"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Date & Debug Info */}
                    <div className="mt-4 text-zinc-800 text-sm">
                        <p>
                            <strong>📩 Created At:</strong> {formatDate(trade.created_at || trade.createdAt)} at {formatTime(trade.created_at || trade.createdAt)}
                        </p>
                        {tradeData.updatedAt && (
                            <p>
                                <strong>🔄 Last Updated:</strong> {formatDate(tradeData.updatedAt)} at {formatTime(tradeData.updatedAt)}
                            </p>
                        )}

                        {/* Debug JSON Output */}
                        <details className="mt-3 bg-gray-100 p-2 rounded-md">
                            <summary className="cursor-pointer text-gray-700 font-medium">🔍 View Raw Trade JSON</summary>
                            <pre className="text-xs mt-2 text-gray-600 overflow-x-auto">{JSON.stringify(trade, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            )}

            {/* Edit Trade Modal */}

            {/* // In parent component (AdvisoryTradeCard) */}
            <EditTradeModal
                trade={trade}
                isOpen={isEditing}
                onOpenChange={setIsEditing}
                onSave={handleEditSubmit}
                clientId={trade.userId} 
                
            />

            {/* Exit Trade Modal */}
            <ExitTradeModal
                trade={trade}
                isOpen={isExiting}
                onOpenChange={setIsExiting}
                onExit={handleExitSubmit}
            />
        </div>
    )
}