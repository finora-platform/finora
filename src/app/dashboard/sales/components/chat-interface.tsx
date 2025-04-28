"use client"

import type React from "react"
import { useState } from "react"
import type { Message } from "@/types/lead"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, FileText } from "lucide-react"

interface ChatInterfaceProps {
  messages: Message[]
  stage: string
  onSendProfileForm: () => Promise<void>
  onSendPaymentLink: () => Promise<void>
}

/**
 * Renders a chat interface for lead communication with conditional actions
 * based on lead stage.
 */
export const ChatInterface = ({ 
  messages = [], 
  stage,
  onSendProfileForm,
  onSendPaymentLink
}: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<Message[]>(messages)
  const [isSendingForm, setIsSendingForm] = useState(false)
  const [isSendingPayment, setIsSendingPayment] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOutgoing: true,
    }

    setChatMessages([...chatMessages, message])
    setNewMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleProfileFormClick = async () => {
    setIsSendingForm(true)
    try {
      await onSendProfileForm()
    } finally {
      setIsSendingForm(false)
    }
  }

  const handlePaymentLinkClick = async () => {
    setIsSendingPayment(true)
    try {
      await onSendPaymentLink()
    } finally {
      setIsSendingPayment(false)
    }
  }

  const isContactedOrLater = ["contacted", "documented", "paid"].includes(stage)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-muted-foreground">No messages yet</div>
          </div>
        ) : (
          chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.isOutgoing ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-70">{message.time}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!isContactedOrLater || isSendingPayment}
            onClick={handlePaymentLinkClick}
          >
            {isSendingPayment ? (
              "Sending..."
            ) : (
              <>
                <span className="mr-1">₹</span>
                Payment link
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!isContactedOrLater || isSendingForm}
            onClick={handleProfileFormClick}
          >
            {isSendingForm ? (
              "Sending..."
            ) : (
              <>
                <Paperclip className="h-4 w-4 mr-1" />
                Profile Form
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Send message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            size="icon" 
            disabled={!newMessage.trim()} 
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}