import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import PostAdviceForm from "@/components/post-advice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdvisoruPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState("");
  const [selectedStockName, setSelectedStockName] = useState("");

  // List of random stocks
  const randomStocks = [
    { symbol: "RELIANCE", name: "Reliance Industries" },
    { symbol: "TATASTEEL", name: "Tata Steel" },
    { symbol: "HDFCBANK", name: "HDFC Bank" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "ICICIBANK", name: "ICICI Bank" },
    { symbol: "ITC", name: "ITC Limited" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel" },
    { symbol: "LT", name: "Larsen & Toubro" },
    { symbol: "SBIN", name: "State Bank of India" },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
  ];

  const handleStockSelect = (value: string) => {
    const stock = randomStocks.find(s => s.symbol === value);
    if (stock) {
      setSelectedStock(stock.symbol);
      setSelectedStockName(stock.name);
    }
  };

  const handleBuyClick = () => {
    if (selectedStock) {
      setShowForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 relative">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="equity">
          <TabsList className="flex justify-center gap-2 mb-6">
            <TabsTrigger value="equity">Equity</TabsTrigger>
            <TabsTrigger value="fo">F&O</TabsTrigger>
            <TabsTrigger value="commodities">Commodities</TabsTrigger>
          </TabsList>

          <TabsContent value="equity">
            <Card className="mb-6">
              <CardContent className="flex flex-col sm:flex-row gap-4 items-center p-4">
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-100"
                  onClick={handleBuyClick}
                  disabled={!selectedStock}
                >
                  Buy
                </Button>
                
                <Select onValueChange={handleStockSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {randomStocks.map((stock) => (
                      <SelectItem key={stock.symbol} value={stock.symbol}>
                        {stock.name} ({stock.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input placeholder="Start a post..." className="flex-1" />
                <div className="flex flex-wrap gap-2">
                  {randomStocks.slice(0, 3).map(stock => (
                    <Badge 
                      key={stock.symbol} 
                      variant={selectedStock === stock.symbol ? "default" : "outline"}
                      onClick={() => handleStockSelect(stock.symbol)}
                      className="cursor-pointer"
                    >
                      {stock.symbol}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active/Completed tabs */}
            <div className="flex gap-6 mb-4">
              <span className="text-purple-700 font-semibold">Active <Badge variant="outline">2</Badge></span>
              <span className="text-gray-500">Completed</span>
            </div>

            {/* Sample trade cards */}
            {[1, 2].map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="success">BUY</Badge>
                      <span className="font-semibold">TATACHEM 25JAN FUT</span>
                      <Badge variant="outline">F&O</Badge>
                      <Badge variant="outline">INTRADAY</Badge>
                    </div>
                    <span className="text-sm text-gray-500">24 Oct 2024 11:15:58 AM</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Entry</p>
                      <p>80124 - 80312</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stoploss</p>
                      <p>80000</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Target(s)</p>
                      <p>82000 → 103000</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Risk/Reward</p>
                      <p>2/3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
            <PostAdviceForm selectedStock={`${selectedStockName} (${selectedStock})`} />
          </div>
        </div>
      )}
    </div>
  );
}