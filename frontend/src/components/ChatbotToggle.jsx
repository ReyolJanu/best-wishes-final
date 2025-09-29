"use client"

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import the AIChatbot to avoid SSR issues
const AIChatbot = dynamic(() => import('./AIChatbot'), { 
  ssr: false,
  loading: () => <div>Loading chatbot...</div>
});

const ChatbotToggle = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  // Auto-hide/show based on scroll (optional)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    // Only add scroll listener if chatbot is not open
    if (!isChatbotOpen) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isChatbotOpen]);

  return (
    <>
      {/* Floating Action Button must remove that hidden */}
      <div className={`hidden fixed bottom-5 left-25 z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      } ${isChatbotOpen ? 'opacity-0 pointer-events-none' : ''}`}>
        <Button
          onClick={toggleChatbot}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse opacity-75 -z-10"></div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Need help finding the perfect gift?
          <div className="absolute top-full left-3 w-2 h-2 bg-gray-900 rotate-45 transform -mt-1"></div>
        </div>
      </div>

      {/* Chatbot Component */}
      <AIChatbot 
        isOpen={isChatbotOpen} 
        onToggle={toggleChatbot}
      />
    </>
  );
};

export default ChatbotToggle;