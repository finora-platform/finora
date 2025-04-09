// src/components/stock-search.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import PostAdviceForm  from "@/components/post-advice";

interface Stock {
  ticker: string;
  name: string;
}

// Levenshtein distance function for fuzzy search
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

export const StockSearch = () => {
  const [query, setQuery] = useState<string>('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showAdviceForm, setShowAdviceForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch stocks data
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3002/stocks');
        
        if (!response.ok) throw new Error('Failed to fetch stocks data');
        
        const data = await response.json();
        setStocks(data);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load stocks data. Using demo data.');
        setStocks([
          { ticker: "RELIANCE", name: "Reliance Industries Ltd" },
          { ticker: "TATACHEM", name: "Tata Chemicals Ltd" },
          { ticker: "HEROMOTOCO", name: "Hero MotoCorp Ltd" },
          { ticker: "ITC", name: "ITC Limited" },
          { ticker: "RELINFRA", name: "Reliance Infrastructure Ltd" },
          {ticker: "TATAMOTORS", name: "Tata Motors Ltd" },
          {ticker: "MARUTI", name: "Maruti Suzuki India Ltd"},
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Filter stocks based on search query
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredStocks([]);
      return;
    }

    const results = stocks
      .map(stock => {
        const tickerDistance = levenshteinDistance(query.toLowerCase(), stock.ticker.toLowerCase());
        const nameDistance = levenshteinDistance(query.toLowerCase(), stock.name.toLowerCase());
        const distance = Math.min(tickerDistance, nameDistance);
        const startsWithQuery = 
          stock.ticker.toLowerCase().startsWith(query.toLowerCase()) || 
          stock.name.toLowerCase().startsWith(query.toLowerCase());
        
        return { ...stock, distance, startsWithQuery };
      })
      .filter(stock => {
        const threshold = Math.max(2, Math.floor(query.length / 2));
        return stock.distance <= threshold || stock.startsWithQuery;
      })
      .sort((a, b) => {
        if (a.startsWithQuery && !b.startsWithQuery) return -1;
        if (!a.startsWithQuery && b.startsWithQuery) return 1;
        return a.distance - b.distance;
      })
      .slice(0, 5)
      .map(({ ticker, name }) => ({ ticker, name }));
    
    setFilteredStocks(results);
  }, [query, stocks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (stock: Stock) => {
    setQuery(stock.ticker);
    setSelectedStock(stock);
    setShowAdviceForm(true);
    setIsDropdownOpen(false);
  };

  const toggleTradeType = () => {
    setTradeType(tradeType === 'BUY' ? 'SELL' : 'BUY');
  };

  const closeAdviceForm = () => {
    setShowAdviceForm(false);
    setSelectedStock(null);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex">
        <Button
          variant="default"
          className={`${
            tradeType === 'BUY' 
              ? '!bg-green-700 hover:!bg-green-800' 
              : '!bg-red-700 hover:!bg-red-800'
          } rounded-r-none px-4 flex items-center`}
          onClick={toggleTradeType}
        >
          {tradeType} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
        
        <Input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 border-l-0"
        />
      </div>

      {isDropdownOpen && filteredStocks.length > 0 && (
        <div className="absolute w-full bg-white mt-1 rounded-md shadow-lg z-10 border border-gray-200">
          {filteredStocks.map((stock) => (
            <div
              key={stock.ticker}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectStock(stock)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{stock.name}</div>
                  <div className="text-xs text-gray-500">{stock.ticker}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && query.length > 0 && filteredStocks.length === 0 && (
        <div className="absolute w-full bg-white mt-1 rounded-md shadow-lg z-10 border border-gray-200 p-4 text-center text-sm text-gray-500">
          Loading stocks...
        </div>
      )}

      {error && query.length > 0 && filteredStocks.length === 0 && !isLoading && (
        <div className="absolute w-full bg-white mt-1 rounded-md shadow-lg z-10 border border-gray-200 p-4 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      {showAdviceForm && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button
              onClick={closeAdviceForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <PostAdviceForm 
              selectedStock={selectedStock.ticker}
              tradeType={tradeType}
              onSuccess={closeAdviceForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch;