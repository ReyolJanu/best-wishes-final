"use client"

import ChatbotToggle from '@/components/ChatbotToggle';

export default function ChatbotTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Gift Assistant Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Test our AI-powered product recommendation chatbot!
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How it works:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose Occasion</h3>
                <p className="text-sm text-gray-600 text-center">
                  Tell us what the gift is for (Birthday, Anniversary, etc.)
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Select Recipient</h3>
                <p className="text-sm text-gray-600 text-center">
                  Who is the gift for? (Partner, Friend, Family, etc.)
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Set Budget</h3>
                <p className="text-sm text-gray-600 text-center">
                  Choose your preferred price range
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Suggestions</h3>
                <p className="text-sm text-gray-600 text-center">
                  Receive personalized product recommendations
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              🎯 Try it now!
            </h3>
            <p className="text-yellow-700 mb-4">
              Click the chat icon in the bottom-right corner to start getting personalized gift recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-white px-3 py-1 rounded-full text-yellow-800 border border-yellow-200">
                Smart matching
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-yellow-800 border border-yellow-200">
                Budget-friendly options
              </span>
              <span className="bg-white px-3 py-1 rounded-full text-yellow-800 border border-yellow-200">
                Alternative suggestions
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🤖 AI Features
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Intelligent product matching based on occasion and recipient</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Budget-aware filtering to stay within your price range</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Fallback recommendations when exact matches aren't found</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Category and style-based filtering</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🎁 Supported Categories
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Gifts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Jewelry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Accessories</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Home & Decor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Customizable Items</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to find the perfect gift?
          </h2>
          <p className="text-gray-600 mb-6">
            Our AI assistant is standing by to help you discover amazing products that match your needs.
          </p>
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
            <span className="text-2xl">👉</span>
            <span className="font-medium">Look for the chat button in the bottom-right corner!</span>
          </div>
        </div>
      </div>
      
      {/* This will add the ChatbotToggle to this specific page */}
      <ChatbotToggle />
    </div>
  );
}