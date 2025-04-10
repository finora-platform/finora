"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Edit, X } from "lucide-react"
import { formatDate, formatTime } from "@/utils/format"
import type { Trade, TradeCardProps, ExitData } from "@/types/trade-types"
import RationaleModal  from "../app/dashboard/advisory/components/rationale-modal"

export const AdvisoryTradeCard = ({ trade, isLast, onTradeUpdate, onTradeExit }: TradeCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [editedTrade, setEditedTrade] = useState<Trade>(trade)
    const [exitData, setExitData] = useState<ExitData>({
        exitPrice: "",
        exitReason: "",
        pnl: "",
    })

    const tradeData = trade.trade_data

    const handleEditSubmit = async () => {
        try {
            await onTradeUpdate({
                ...editedTrade,
                trade_data: {
                    ...editedTrade.trade_data,
                    updatedAt: new Date().toISOString(),
                },
            })
            setIsEditing(false)
            console.log("Trade updated successfully.")
        } catch (error) {
            console.error("Error updating trade:", error)
        }
    }

    const handleExitSubmit = async () => {
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

    const handleEditChange = (field: string, value: any) => {
        setEditedTrade({
            ...editedTrade,
            trade_data: {
                ...editedTrade.trade_data,
                [field]: value,
                updatedAt: new Date().toISOString(),
            },
        })
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
                                                        {/* <div onClick={(e) => { e.stopPropagation(); }}><RationaleModal /></div> */}

                    <span className="text-gray-500">{tradeData?.stock || "Unknown Stock"}</span>
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
                    <span>📅 {formatDate(trade.created_at)}</span>
                    <span>⏰ {formatTime(trade.created_at)}</span>
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
                            <strong>📩 Created At:</strong> {formatDate(trade.created_at)} at {formatTime(trade.created_at)}
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

            {/* Edit Trade Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Trade: {tradeData.stock}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="entry">Entry Price</Label>
                                <Input
                                    id="entry"
                                    value={editedTrade.trade_data.entry}
                                    onChange={(e) => handleEditChange("entry", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stoploss">Stop Loss</Label>
                                <Input
                                    id="stoploss"
                                    value={editedTrade.trade_data.stoploss}
                                    onChange={(e) => handleEditChange("stoploss", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targets">Targets (comma separated)</Label>
                            <Input
                                id="targets"
                                value={editedTrade.trade_data.targets.join(", ")}
                                onChange={(e) =>
                                    handleEditChange(
                                        "targets",
                                        e.target.value.split(",").map((t) => t.trim()),
                                    )
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="segment">Segment</Label>
                                <Select
                                    value={editedTrade.trade_data.segment}
                                    onValueChange={(value) => handleEditChange("segment", value)}
                                >
                                    <SelectTrigger id="segment">
                                        <SelectValue placeholder="Select segment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EQUITY">Equity</SelectItem>
                                        <SelectItem value="F&O">F&O</SelectItem>
                                        <SelectItem value="COMMODITIES">Commodities</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timeHorizon">Time Horizon</Label>
                                <Select
                                    value={editedTrade.trade_data.timeHorizon}
                                    onValueChange={(value) => handleEditChange("timeHorizon", value)}
                                >
                                    <SelectTrigger id="timeHorizon">
                                        <SelectValue placeholder="Select time horizon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INTRADAY">Intraday</SelectItem>
                                        <SelectItem value="SWING">Swing</SelectItem>
                                        <SelectItem value="LONGTERM">Long Term</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Added field for rationale */}
                        <div className="space-y-2">
                            <Label htmlFor="rationale">Trade Rationale</Label>
                            <Textarea
                                id="rationale"
                                value={editedTrade.trade_data.rationale || ""}
                                onChange={(e) => handleEditChange("rationale", e.target.value)}
                                placeholder="Explain the reasoning behind this trade"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditSubmit}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Exit Trade Dialog */}
            <Dialog open={isExiting} onOpenChange={setIsExiting}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Exit Trade: {tradeData.stock}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="exitPrice">Exit Price</Label>
                            <Input
                                id="exitPrice"
                                value={exitData.exitPrice}
                                onChange={(e) => setExitData({ ...exitData, exitPrice: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pnl">P&L (include + or - sign)</Label>
                            <Input
                                id="pnl"
                                value={exitData.pnl}
                                onChange={(e) => setExitData({ ...exitData, pnl: e.target.value })}
                                placeholder="e.g. +10.5% or -5.2%"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exitReason">Exit Reason</Label>
                            <Textarea
                                id="exitReason"
                                value={exitData.exitReason}
                                onChange={(e) => setExitData({ ...exitData, exitReason: e.target.value })}
                                placeholder="Why are you exiting this trade?"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsExiting(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleExitSubmit}>
                            Exit Trade
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
