"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { colors } from "@/styles/colors";
import { Button } from "../ui/button";
import { SquareArrowOutUpRight } from "lucide-react";

interface ComplianceArea {
  id: number;
  title: string;
  description: string;
  checked: boolean;
}

interface ComplianceScoreChartProps {
  score: number;
  areas: ComplianceArea[];
}

export function ComplianceScoreChart({
  score,
  areas,
}: ComplianceScoreChartProps) {
  // Determine status text based on score
  const getStatus = () => {
    if (score >= 100) return "Excellent";
    if (score > 40) return "Good";
    return "Low";
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Compliance Score</span>
          {/* <span className="text-2xl font-bold">{score}%</span> */}
          <Button className="bg-[#7F56D9]">
            Improve
            <SquareArrowOutUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row space-x-4">
        {/* Score Circle */}
        <div className="relative h-[200px] w-[200px] flex-shrink-0">
            <svg className="transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={colors.gray[200]}
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={colors.primary[500]}
                strokeWidth="10"
                strokeDasharray={`${score * 2.83} ${283 - score * 2.83}`}
              />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{getStatus()}</span>
            <span className="text-sm text-gray-500">{score}%</span>
          </div>
        </div>

        {/* Compliance Areas */}
        <div className="flex-grow overflow-y-auto max-h-[200px] pr-2">
          <AnimatePresence>
            {areas.map((area) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-lg border p-3 text-sm transition-all hover:scale-[1.02] mb-2"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={area.checked}
                    readOnly
                    className="mt-1 h-4 w-4"
                  />
                  <div>
                    <h3 className="font-medium">{area.title}</h3>
                    <p className="text-xs text-gray-500">{area.description}</p>
                  </div>
                </div>
                {/* Gradient effect */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
