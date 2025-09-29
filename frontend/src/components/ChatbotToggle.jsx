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

  // Add dynamic gradient animation styles
  const dynamicGradientStyle = {
    background: 'linear-gradient(-45deg, #9333ea, #ec4899, #8b5cf6, #a855f7, #d946ef)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 4s ease infinite'
  };

  // Add CSS animation keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientShift {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      
      .dynamic-gradient {
        background: linear-gradient(-45deg, #9333ea, #ec4899, #8b5cf6, #a855f7, #d946ef);
        background-size: 400% 400%;
        animation: gradientShift 4s ease infinite;
      }
      
      .dynamic-gradient-hover:hover {
        background: linear-gradient(-45deg, #7c3aed, #db2777, #7c3aed, #9333ea, #c026d3);
        background-size: 400% 400%;
        animation: gradientShift 3s ease infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
          className="w-14 h-14 rounded-full dynamic-gradient dynamic-gradient-hover shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
          size="lg"
          style={dynamicGradientStyle}
        >
          <MessageCircle className="w-6 h-6 text-white drop-shadow-sm" />
        </Button>
        
        {/* Enhanced pulse animation with dynamic gradient */}
        <div className="absolute inset-0 rounded-full dynamic-gradient animate-pulse opacity-30 -z-10" style={dynamicGradientStyle}></div>
        
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