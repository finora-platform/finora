import { useState, useEffect } from 'react';
import { Send, Plus, Paperclip, Mic, X } from 'lucide-react';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [attachmentMenu, setAttachmentMenu] = useState(false);

  // Simulate fetching lead conversations
  useEffect(() => {
    // This would be an API call in your actual implementation
    const fetchConversations = async () => {
      // Simulated data
      const fakeLeads = [
        { id: 1, name: 'John Smith', phone: '+1234567890', unread: 2, lastMessage: 'I need more information about pricing', lastMessageTime: '10:45 AM' },
        { id: 2, name: 'Sarah Wilson', phone: '+1987654321', unread: 0, lastMessage: 'Thanks for your help yesterday', lastMessageTime: 'Yesterday' },
        { id: 3, name: 'Michael Johnson', phone: '+1122334455', unread: 0, lastMessage: 'When can we schedule a demo?', lastMessageTime: 'Monday' },
        { id: 4, name: 'Emily Davis', phone: '+1555666777', unread: 3, lastMessage: 'Are there any discounts available?', lastMessageTime: '8:30 AM' },
      ];
      setConversations(fakeLeads);
    };
    
    fetchConversations();
  }, []);

  // Simulate fetching messages for a specific chat
  useEffect(() => {
    if (selectedChat) {
      // This would be an API call in your actual implementation
      const fetchMessages = async () => {
        // Simulated chat messages
        const fakeMessages = [
          { id: 1, sender: 'lead', text: `Hi there, I'm interested in your services', time: '10:30 AM' `},
          { id: 2, sender: 'agent', text: 'Hello! Thank you for your interest. How can I help you today?', time: '10:32 AM' },
          { id: 3, sender: 'lead', text: 'I need more information about pricing', time: '10:45 AM' },
        ];
        setChatMessages(fakeMessages);
      };
      
      fetchMessages();
    }
  }, [selectedChat]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    // Add message to UI immediately for better UX
    const newMessage = {
      id: Date.now(),
      sender: 'agent',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages([...chatMessages, newMessage]);
    
    // In actual implementation, this would be an API call to your backend
    try {
      // Example API call (commented out)
      // await fetch('/api/messages/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     phone: selectedChat.phone,
      //     message: message
      //   })
      // });
      
      // Clear the input after sending
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error - show notification, etc.
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar - Conversations list */}
      <div className="w-1/3 bg-white border-r">
        <div className="p-4 bg-[#F4EBFF] text-white">
          <h1 className="text-xl font-bold">Conversations</h1>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {conversations.map(convo => (
            <div 
              key={convo.id} 
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${selectedChat?.id === convo.id ? 'bg-gray-100' : ''}`}
              onClick={() => setSelectedChat(convo)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{convo.name}</h3>
                  <p className="text-sm text-gray-600">{convo.phone}</p>
                </div>
                <span className="text-xs text-gray-500">{convo.lastMessageTime}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-700 truncate">{convo.lastMessage}</p>
                {convo.unread > 0 && (
                  <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {convo.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right side - Chat area */}
      <div className="w-2/3 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-gray-200 flex items-center">
              <div>
                <h2 className="font-bold">{selectedChat.name}</h2>
                <p className="text-sm text-gray-600">{selectedChat.phone}</p>
              </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
              <div className="space-y-4">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.sender === 'agent' 
                          ? 'bg-[#F4EBFF] text-black rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 text-right">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Message input */}
            <div className="p-4 bg-gray-200">
              <div className="relative">
                {attachmentMenu && (
                  <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-lg p-2">
                    <div className="flex space-x-2">
                      <button 
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        onClick={() => setAttachmentMenu(false)}
                      >
                        <X size={20} />
                      </button>
                      <button className="p-2 bg-blue-100 rounded-full hover:bg-blue-200">
                        <span className="block h-5 w-5 text-blue-600">📄</span>
                      </button>
                      <button className="p-2 bg-green-100 rounded-full hover:bg-green-200">
                        <span className="block h-5 w-5 text-green-600">📷</span>
                      </button>
                      <button className="p-2 bg-purple-100 rounded-full hover:bg-purple-200">
                        <span className="block h-5 w-5 text-purple-600">📹</span>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center bg-white rounded-full pl-4 pr-2 py-2">
                  <button 
                    className="text-gray-500 hover:text-gray-700 mr-2"
                    onClick={() => setAttachmentMenu(!attachmentMenu)}
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="ml-2 p-2 text-gray-500 hover:text-gray-700">
                    <Mic size={20} />
                  </button>
                  <button 
                    className="ml-2 bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                    onClick={handleSendMessage}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <p className="text-xl">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}