"use client"

import { Timeline } from "./Timeline"
import { X, Clock, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TimelineModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  stock: string
  userId: string
  tradeType: string
}

export const TimelineModal = ({
  isOpen,
  onOpenChange,
  stock,
  userId,
  tradeType,
}: TimelineModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.divc
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold dark:text-white">
                      Timeline
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-purple-600 dark:text-purple-400 font-medium">{stock}</span>
                      <span>({tradeType})</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2 transition-colors"
                  aria-label="Close Timeline"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <Timeline stock={stock} userId={userId} className="animate-fadeIn" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}