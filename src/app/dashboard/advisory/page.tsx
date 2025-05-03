"use client"

import React, { useState } from 'react'
import { StockSearch } from './components/stock-search'
import TradeCard from './components/trade-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle } from 'lucide-react'
import { AdvisoryTradeList } from '@/components/advisory-trade-list'

export default function AdvisoryPage() {
  const [mainTab, setMainTab] = useState('trades')
  const [tradeTypeTab, setTradeTypeTab] = useState('equity')
  const [tradeStatusTab, setTradeStatusTab] = useState('active')
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined)

  const UnderMaintenanceScreen = () => (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <AlertTriangle className="h-16 w-16 mb-4 text-yellow-500" />
      <h3 className="text-xl font-medium mb-2">Under Maintenance</h3>
      <p className="text-sm">This section is currently under maintenance. Please check back later.</p>
    </div>
  )

  return (
    <div className="w-full h-screen overflow-y-auto bg-background">
      {/* Top-level navigation tabs */}
      <Tabs defaultValue="trades" value={mainTab} onValueChange={setMainTab} className="w-full">
        <div className="border-b bg-background">
          <div className="container mx-auto">
            <TabsList className="w-auto bg-transparent p-0">
              <TabsTrigger 
                value="trades" 
                className="relative px-4 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none
                  data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 
                  data-[state=active]:after:w-full data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
              >
                Trades
              </TabsTrigger>
              <TabsTrigger 
                value="stock-basket" 
                className="relative px-4 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none
                  data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 
                  data-[state=active]:after:w-full data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
              >
                Stock Basket
              </TabsTrigger>
              <TabsTrigger 
                value="financial-planning" 
                className="relative px-4 py-3 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none
                  data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 
                  data-[state=active]:after:w-full data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
              >
                Financial Planning
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <TabsContent value="trades" className="mt-0">
            {/* Create new section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Create New Trade</h2>
              
              {/* Trade type tabs */}
              <Tabs defaultValue="equity" value={tradeTypeTab} onValueChange={setTradeTypeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted p-1 h-auto rounded-lg">
                  <TabsTrigger 
                    value="equity" 
                    className="py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Equity
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fno" 
                    className="py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    F&O
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commodities" 
                    className="py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Commodities
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="equity" className="mt-4">
                  <div className="flex flex-col space-y-4 p-4 bg-background border rounded-lg">
                    <StockSearch />
                    
                    {/* Quick select stocks */}
                    <div className="flex flex-wrap gap-2">
                      {['RELIANCE', 'HEROMOTOCO', 'ITC'].map(ticker => (
                        <div 
                          key={ticker} 
                          className="px-3 py-1.5 text-sm bg-muted rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          {ticker}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="fno" className="mt-4">
                  <UnderMaintenanceScreen />
                </TabsContent>
                
                <TabsContent value="commodities" className="mt-4">
                  <UnderMaintenanceScreen />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Stock Basket Tab Content */}
          <TabsContent value="stock-basket" className="mt-0">
            <UnderMaintenanceScreen />
          </TabsContent>

          {/* Financial Planning Tab Content */}
          <TabsContent value="financial-planning" className="mt-0">
            <UnderMaintenanceScreen />
          </TabsContent>
        </div>
      </Tabs>

      {/* Advisory Trade List Section */}
      <div className="container mx-auto px-4 py-6 border-t">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-auto bg-transparent p-0 gap-2">
            <TabsTrigger 
              value="active" 
              className="relative px-4 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none
                data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 
                data-[state=active]:after:w-full data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              Active
            </TabsTrigger>
            <TabsTrigger 
              value="exited" 
              className="relative px-4 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none
                data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 
                data-[state=active]:after:w-full data-[state=active]:after:h-[2px] data-[state=active]:after:bg-primary"
            >
              Exited
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="active" className="mt-0">
              <AdvisoryTradeList statusFilter="ACTIVE" clientId={selectedClientId} />
            </TabsContent>
            
            <TabsContent value="exited" className="mt-0">
              <AdvisoryTradeList statusFilter="EXITED" clientId={selectedClientId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}