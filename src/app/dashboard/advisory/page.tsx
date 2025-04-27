"use client"

import React, { useState } from 'react'
import { StockSearch } from './components/stock-search'
import TradeCard from './components/trade-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle } from 'lucide-react'
import  AdvisoryTradeList  from '@/components/advisory-trade-list'

export default function AdvisoryPage() {
  const [mainTab, setMainTab] = useState('trades')
  const [tradeTypeTab, setTradeTypeTab] = useState('equity')
  const [tradeStatusTab, setTradeStatusTab] = useState('active')
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined)

  const UnderMaintenanceScreen = () => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 ">
      <AlertTriangle className="h-16 w-16 mb-4" />
      <h3 className="text-xl font-medium mb-2">Under Maintenance</h3>
      <p>This section is currently under maintenance. Please check back later.</p>
    </div>
  )

  return (
    <div className="w-full h-screen overflow-y-auto bg-[#F2F4F7]">
      {/* Top-level navigation tabs */}
      <Tabs defaultValue="trades" value={mainTab} onValueChange={setMainTab} className="w-full">
        <div className="border-b flex bg-white">
          <TabsList className="mx-auto flex justify-center bg-transparent mb-0">
            <TabsTrigger 
              value="trades" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none px-6 py-3 bg-transparent text-base"
            >
              Trades
            </TabsTrigger>
            <TabsTrigger 
              value="stock-basket" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none px-6 py-3 bg-transparent text-base"
            >
              Stock basket
            </TabsTrigger>
            <TabsTrigger 
              value="financial-planning" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none px-6 py-3 bg-transparent text-base"
            >
              Financial planning
            </TabsTrigger>
          </TabsList>
        </div>

        <div className='px-4'>
        <TabsContent value="trades" className="mt-6 w-full px-4">
          {/* Create new section */}
          <div className="mb-6 w-full">
            <h2 className="text-base font-medium mb-4">Create new</h2>
            
            {/* Trade type tabs */}
            <Tabs defaultValue="equity" value={tradeTypeTab} onValueChange={setTradeTypeTab} className="w-full bg-white border rounded-xl">
              <TabsList className="w-full mb-4 justify-between rounded-xl text-center">
                <TabsTrigger value="equity" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:text-purple-600 data-[state=active]:border-purple-600 rounded-none">
                  Equity
                </TabsTrigger>
                <TabsTrigger value="fno" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:text-purple-600 data-[state=active]:border-purple-600 rounded-none">
                  F&O
                </TabsTrigger>
                <TabsTrigger value="commodities" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:text-purple-600 data-[state=active]:border-purple-600 rounded-none">
                  Commodities
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="equity" className="mt-0">
                <div className="flex flex-col space-y-4 px-5 pb-8">
                  <StockSearch />
                  
                  {/* Quick select stocks */}
                  <div className="flex flex-wrap gap-2">
                    {['RELIANCE', 'HEROMOTOCO', 'ITC'].map(ticker => (
                      <div key={ticker} className="px-3 py-1 text-sm bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                        {ticker}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fno" className="mt-0">
                <UnderMaintenanceScreen />
              </TabsContent>
              
              <TabsContent value="commodities" className="mt-0">
                <UnderMaintenanceScreen />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Trades list section */}
          {/* <div className="w-full">
            <Tabs defaultValue="active" value={tradeStatusTab} onValueChange={setTradeStatusTab}>
              <TabsList className="mb-4 justify-start bg-transparent border-b w-full space-x-6 rounded-none">
                <TabsTrigger value="active" className="relative data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-2 bg-transparent">
                  Active
                  {activeTrades.length > 0 && (
                    <span className="ml-2 bg-gray-200 text-xs px-2 py-0.5 rounded-full">
                      {activeTrades.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-2 bg-transparent">
                  Completed
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-0">
                {activeTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active trades found
                  </div>
                ) : (
                  <div>
                    {activeTrades.map((trade, index) => (
                      <TradeCard
                        key={trade.id}
                        trade={trade}
                        isExpanded={index === 0} // First one expanded by default
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-0">
                <div className="text-center py-8 text-gray-500">
                  No completed trades found
                </div>
              </TabsContent>
            </Tabs>
          </div> */}
        </TabsContent>

        {/* Stock Basket Tab Content */}
        <TabsContent value="stock-basket">
          <UnderMaintenanceScreen />
        </TabsContent>

        {/* Financial Planning Tab Content */}
        <TabsContent value="financial-planning">
          <UnderMaintenanceScreen />
        </TabsContent>
        </div>
      </Tabs>

      {/* Advisory Trade List Section */}
      <div className="pt-8 px-4">
        {/* <h2 className="text-xl font-semibold mb-6">Advisory Trade Management</h2>
        <p className="text-gray-600 mb-6">
          Below is the advisory trade list where you can manage trades for your clients. You can edit trade details and exit trades when needed.
        </p> */}
        
        <Tabs defaultValue="active">
          <TabsList className="mb-4 justify-start bg-transparent border-b w-full space-x-6 rounded-none">
            <TabsTrigger value="active" className="relative data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none rounded-none py-2 data-[state=active]:bg-transparent">
              Active
            </TabsTrigger>
            <TabsTrigger value="exited" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none rounded-none py-2 data-[state=active]:bg-transparent">
              Exited
            </TabsTrigger>
            {/* <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none py-2 bg-transparent">
              All Trades
            </TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            <AdvisoryTradeList statusFilter="ACTIVE" clientId={selectedClientId} />
          </TabsContent>
          
          <TabsContent value="exited" className="mt-0">
            <AdvisoryTradeList statusFilter="EXITED" clientId={selectedClientId} />
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <AdvisoryTradeList clientId={selectedClientId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
