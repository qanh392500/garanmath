import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface ChatPanelRef {
  addResponse: (text: string, isError?: boolean) => void;
  clearMessages: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isError?: boolean;
}

interface ChatPanelProps {
  onSendMessage: (text: string) => Promise<void>;
}

const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ onSendMessage }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn chỉnh sửa hình vẽ. Hãy thử yêu cầu: "Nối A với C" hoặc "Lấy trung điểm của SB".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    addResponse: (text: string, isError: boolean = false) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text,
        isError
      }]);
      setIsLoading(false);
    },
    clearMessages: () => {
      setMessages([{
        id: 'init',
        role: 'ai',
        text: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn chỉnh sửa hình vẽ. Hãy thử yêu cầu: "Nối A với C" hoặc "Lấy trung điểm của SB".'
      }]);
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const textToSend = input;
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSend }]);

    try {
      await onSendMessage(textToSend);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: "Không thể kết nối với AI Server.",
        isError: true
      }]);
      setIsLoading(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{isLoading ? 'Reasoning...' : 'Online'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#0f172a] scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] px-4 py-3 text-sm shadow-sm relative animate-in slide-in-from-bottom-1 duration-200
              ${msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-indigo-500/20'
                : msg.isError
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-2xl rounded-bl-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700 rounded-2xl rounded-bl-sm'
              }
            `}>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Modify figure (e.g. 'Connect points')..."
            className="flex-grow pl-4 pr-12 py-3.5 text-sm bg-slate-50 dark:bg-[#020617] border-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white rounded-xl transition-all placeholder-slate-400"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;