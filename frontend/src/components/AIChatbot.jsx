"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  ShoppingBag,
  Heart,
  Star,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

const CHATBOT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('CHATBOT_API_URL:', CHATBOT_API_URL);

const AIChatbot = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState(null);
  const [conversationData, setConversationData] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startConversation();
    }
  }, [isOpen]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${CHATBOT_API_URL}/chatbot/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        const botMessage = {
          type: 'bot',
          content: result.data.message,
          question: result.data.question,
          options: result.data.options,
          timestamp: Date.now()
        };
        
        setMessages([botMessage]);
        setConversationState(result.data.state);
        setConversationData(result.data.conversationData || {});
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting. Please try again later.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (userInput) => {
    if (!userInput.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${CHATBOT_API_URL}/chatbot/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          currentState: conversationState,
          conversationData
        })
      });

      const result = await response.json();
      if (result.success) {
        const botMessage = {
          type: 'bot',
          content: result.data.message,
          question: result.data.question,
          options: result.data.options,
          suggestions: result.data.suggestions,
          alternatives: result.data.alternatives,
          searchSummary: result.data.searchSummary,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMessage]);
        setConversationState(result.data.state);
        setConversationData(result.data.conversationData || {});
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    const optionText = typeof option === 'object' ? option.label : option;
    sendMessage(optionText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentInput);
    }
  };

  const resetConversation = async () => {
    setMessages([]);
    setConversationState(null);
    setConversationData({});
    await startConversation();
  };

  const ProductSuggestion = ({ product }) => (
    <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {product.images && product.images[0] && (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border"
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 leading-tight">
            {product.name}
          </h4>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">
            {product.shortDescription}
          </p>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-purple-600">
                ${product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{product.rating}</span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            className="w-full mt-auto bg-purple-600 hover:bg-purple-700 text-sm py-2"
            onClick={() => window.open(`/productDetail/${product.id}`, '_self')}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View Product
          </Button>
        </div>
      </div>
    </div>
  );

  const MessageContent = ({ message }) => {
    if (message.type === 'user') {
      return (
        <div className="flex gap-3 justify-end">
          <div className="bg-purple-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
            <p className="text-sm">{message.content}</p>
          </div>
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <p className="text-sm text-gray-800">{message.content}</p>
          </div>
          
          {/* Options */}
          {message.options && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {message.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3 hover:bg-purple-50 hover:border-purple-300"
                    onClick={() => handleOptionClick(option)}
                  >
                    <span className="text-xs">
                      {typeof option === 'object' ? option.label : option}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">
                  Perfect Matches ({message.suggestions.length})
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {message.suggestions.map((product, index) => (
                  <ProductSuggestion key={product.id || index} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Alternative Suggestions */}
          {message.alternatives && message.alternatives.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  You Might Also Like ({message.alternatives.length})
                </span>
              </div>
              <div className="space-y-2 pr-1">
                {message.alternatives.map((product, index) => (
                  <ProductSuggestion key={product.id || index} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Search Summary */}
          {message.searchSummary && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Search Summary
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-blue-700 font-medium">Occasion:</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {message.searchSummary.occasion}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Recipient:</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {message.searchSummary.recipient}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Budget:</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {message.searchSummary.budget}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Found:</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {message.searchSummary.totalFound} items
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-96 h-16' : 'w-[480px] h-[600px]'
    }`}>
      <Card className="w-full h-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" />
            Gift Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1"
              onClick={resetConversation}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1"
              onClick={onToggle}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0">
              <ScrollArea ref={scrollAreaRef} className="h-[480px] p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <MessageContent key={index} message={message} />
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage(currentInput)}
                  disabled={isLoading || !currentInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIChatbot;