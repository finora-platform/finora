// Type definitions for the trade system
export interface Trade {
    id: number
    user_id: number
    client_name?: string
    trade_data: {
      stock: string
      tradeType: "BUY" | "SELL"
      segment: "EQUITY" | "F&O" | "COMMODITIES"
      timeHorizon: "INTRADAY" | "SWING" | "LONGTERM"
      entry: string
      stoploss: string
      targets: string[]
      status: "ACTIVE" | "COMPLETED" | "EXITED"
      exitPrice?: string
      exitDate?: string
      exitReason?: string
      pnl?: string
      createdAt: string
      updatedAt?: string
      rationale?: string
    }
    created_at: string
  }
  
  export interface TradeCardProps {
    trade: Trade
    isLast: boolean
    onTradeUpdate: (updatedTrade: Trade) => Promise<void>
    onTradeExit: (tradeId: number, exitData: any) => Promise<void>
    clientId: string
    advisorId?: string
  }
  
  export interface NewTradeFormProps {
    clientId: number
    onTradeCreated: () => void
  }
  
  export interface AdvisoryTradeListProps {
    segmentFilter?: string
    statusFilter?: string
    clientId?: number
  }
  
  export interface ExitData {
    exitPrice: string
    exitReason: string
    pnl: string
    exitDate?: string
  }
  