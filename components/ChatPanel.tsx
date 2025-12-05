import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface ChatPanelRef {
  addResponse: (text: string, isError?: boolean, trace?: TraceData) => void;
  clearMessages: () => void;
}

interface TraceData {
  planner?: string[];
  rag?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isError?: boolean;
  trace?: TraceData;
}

interface ChatPanelProps {
  onSendMessage: (text: string) => Promise<void>;
}

const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ onSendMessage }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]); // Start empty
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    addResponse: (text: string, isError: boolean = false, trace?: TraceData) => {
      // Only show response if it's an error
      if (isError) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          text,
          isError,
          trace
        }]);

        // Auto-dismiss errors after 5 seconds
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.text !== text));
        }, 5000);
      }
      setIsLoading(false);
    },
    clearMessages: () => {
      setMessages([]);
    }
  }));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const textToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      await onSendMessage(textToSend);
    } catch (error) {
      console.error(error);
      const errorMsg = "Không thể kết nối với AI Server.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: errorMsg,
        isError: true
      }]);

      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.text !== errorMsg));
      }, 5000);

      setIsLoading(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* Error Toast Area (Floating at top) */}
      <div className="absolute top-0 left-0 right-0 p-4 space-y-2 pointer-events-none z-10 flex flex-col items-center">
        {messages.map((msg) => (
          msg.isError && (
            <div key={msg.id} className="pointer-events-auto px-4 py-3 bg-red-50 dark:bg-red-900/90 backdrop-blur-sm text-red-600 dark:text-red-200 rounded-xl text-sm border border-red-100 dark:border-red-800 shadow-lg animate-in slide-in-from-top-2 fade-in duration-200 max-w-md text-center">
              <span className="font-bold mr-1">Lỗi:</span> {msg.text}
            </div>
          )
        ))}
      </div>

      {/* Centered Input Area */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 blur"></div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Nhập lệnh chỉnh sửa hình..."
            className="relative w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-0 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 text-lg shadow-sm"
            disabled={isLoading}
            autoComplete="off"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;