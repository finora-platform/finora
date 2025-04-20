import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DetailPanel = ({ trade }) => {
  const {
    id,
    type,
    stockName,
    date,
    time,
    category,
    tradeType,
    entry,
    stoploss,
    targets,
    riskReward,
  } = trade;

  return (
    <div className="w-[25%] px-2 border-l">
      <Accordion
        type="multiple"
        defaultValue={["value-1", "value-2"]}
        className="w-full mt-6"
      >
        <AccordionItem value="value-1">
          <AccordionTrigger>Trade Details</AccordionTrigger>
          <AccordionContent>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium mr-3 ${
                type === "BUY"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {type}
            </span>
            <h3 className="font-medium text-lg border-b mt-2">{stockName}</h3>
            <div className="p-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 py-2">
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
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
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
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="value-2">
          <AccordionTrigger>Timeline</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that matches the other
            components&apos; aesthetic.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default DetailPanel;
