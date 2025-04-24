// src/components/trade-card.tsx
import React, { useState, useRef } from "react";
import {
  ChevronUp,
  ChevronDown
} from "lucide-react";
import RationaleModal from "./rationale-modale";

interface TradeCardProps {
  id: string;
  type: "BUY" | "SELL";
  stockName: string;
  date: string;
  time: string;
  category: "F&O" | "EQUITY";
  tradeType: "INTRADAY" | "POSITIONAL";
  entry: {
    min: number;
    max: number;
  };
  stoploss: number;
  targets: {
    primary: number;
    secondary?: number;
  };
  riskReward: string;
  isExpanded?: boolean;
}

export default function TradeCard({
  // id,
  // type,
  // stockName,
  // date,
  // time,
  // category,
  // tradeType,
  // entry,
  // stoploss,
  // targets,
  // riskReward,
  trade,
  isExpanded = false,
}){
  const {id,
    type,
    stockName,
    date,
    time,
    category,
    tradeType,
    entry,
    stoploss,
    targets,
    riskReward}=trade

  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    console.log(`Trade card ${id} ${expanded ? "collapsed" : "expanded"}`);
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg shadow-sm transition-all duration-200">
      {/* Header - Always visible */}
      <div
        className="px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center">
          <div
            className={`px-2 py-0.5 rounded text-xs font-medium mr-3 ${
              type === "BUY"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {type}
          </div>
          <div className="font-medium">{stockName}</div>
        </div>

        <div className="flex items-center space-x-2">
          <div onClick={(e) => {e.stopPropagation();}}><RationaleModal trade={trade} /></div>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded flex items-center">
            <svg
              className="h-3 w-3 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {tradeType}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-4 gap-4 py-2">
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <svg
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Entry
              </div>
              <div className="font-medium text-sm">
                {entry.min} - {entry.max}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <svg
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Stoploss
              </div>
              <div className="font-medium text-sm">{stoploss}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <svg
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Target(s)
              </div>
              <div className="font-medium text-sm">
                {targets.primary}
                {targets.secondary && <span> » {targets.secondary}</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <svg
                  className="h-3 w-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22V2M17 12H2M22 12h-3"></path>
                </svg>
                Risk/Reward
              </div>
              <div className="font-medium text-sm">{riskReward}</div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <svg
                className="h-3 w-3 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {date} {time}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
