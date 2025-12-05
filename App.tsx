import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ProblemInput from './components/ProblemInput';
import CommandPanel from './components/CommandPanel';
import ChatPanel, { ChatPanelRef } from './components/ChatPanel';
import GeoGebraContainer, { GeoGebraRef } from './components/GeoGebraContainer';
import { generateGeoGebraCommands, generateIncrementalCommands } from './services/geometryParser';
import { GeoGebraConstruction } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import logo from './pages/logo.jpg';
import ApiKeySettings from './components/ApiKeySettings';
import AdminPage from './pages/AdminPage';
import PromotePage from './pages/PromotePage';
import DonateModal from './components/DonateModal';

type LeftPanelMode = 'input' | 'chat';

// --- Protected Route Component ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Helper Component
const ActionButton: React.FC<{ onClick: () => void, disabled: boolean, icon: React.ReactNode, label: string, colorClass: string }> = ({ onClick, disabled, icon, label, colorClass }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${disabled ? 'opacity-40 cursor-not-allowed' : colorClass}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// --- Main Application Logic (Formerly App) ---
const MainApp: React.FC = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [construction, setConstruction] = useState<GeoGebraConstruction | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [activePanel, setActivePanel] = useState<LeftPanelMode>('input');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [history, setHistory] = useState<GeoGebraConstruction[]>([]); // Undo History

  // Auth Context
  const { user, logout } = useAuth();

  // Resizable State
  // Default height: 55% of window height (Top 45%, Bottom 55%)
  const [commandPanelHeight, setCommandPanelHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight * 0.55;
    }
    return 500; // Fallback
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // GeoGebra Style State
  const [lineThickness, setLineThickness] = useState(2);
  const [pointSize, setPointSize] = useState(2);
  const [sliderMode, setSliderMode] = useState<'line' | 'point'>('line');
  const [isTransparent, setIsTransparent] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  const ggbRef = useRef<GeoGebraRef>(null);
  const chatRef = useRef<ChatPanelRef>(null);

  // Ref for scrolling logic
  const resultRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check for API Key
  useEffect(() => {
    if (user && !user.hasApiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, [user]);

  // Resizable Logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = commandPanelHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate delta. Moving UP increases height (positive delta), Moving DOWN decreases height.
      // e.clientY decreases as we go up.
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.min(Math.max(100, dragStartHeight.current + delta), window.innerHeight - 200);

      setCommandPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  const handleGenerate = async (text: string, imageBase64: string | null) => {
    setIsGenerating(true);
    try {
      const result = await generateGeoGebraCommands(text, imageBase64);

      // --- VISUALIZATION: Log Thought Process ---
      if (result.trace) {
        console.group("🧠 AI Thought Process (Generate)");
        console.log("📝 Planned Steps:");
        console.table(result.trace.planner);
        console.log("📚 RAG Context:");
        console.table(result.trace.rag);
        console.log("💻 Generated Commands:");
        console.log(result.rawCommands.join('\n'));
        console.groupEnd();
      }
      // ------------------------------------------

      setHistory([]); // Clear undo history for new problem
      setChatHistory([]); // Clear history for new problem
      chatRef.current?.clearMessages(); // Clear UI messages
      setConstruction(result);

      // Render to GeoGebra
      if (ggbRef.current) {
        ggbRef.current.loadCommands(result.rawCommands);
        // Apply initial styles
        setTimeout(() => {
          ggbRef.current?.setGlobalLineThickness(lineThickness);
          ggbRef.current?.setGlobalPointSize(pointSize);
        }, 500);
      }

      // Switch to chat view
      setActivePanel('chat');

      // Mobile Experience Handling
      if (window.innerWidth < 1024) {
        // On mobile, we might want to see the Result first, then the user can scroll up to chat
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error("Failed to generate commands", error);
      alert("Đã có lỗi xảy ra khi xử lý. Vui lòng kiểm tra API Key hoặc kết nối mạng.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenderToGeoGebra = () => {
    if (ggbRef.current && construction) {
      ggbRef.current.loadCommands(construction.rawCommands);
      // Re-apply current style settings after reload
      setTimeout(() => {
        ggbRef.current?.setGlobalLineThickness(lineThickness);
        ggbRef.current?.setGlobalPointSize(pointSize);
      }, 500);
    }
  };

  const handleManualUpdate = (newCommands: string[]) => {
    // Save to history before updating
    if (construction) {
      setHistory(prev => [...prev, construction]);
    }

    // 1. Update State
    setConstruction(prev => {
      if (!prev) return null;
      return {
        ...prev,
        rawCommands: newCommands,
        description: prev.description + " (Manually Edited)"
      };
    });

    // 2. Render to GGB
    if (ggbRef.current) {
      ggbRef.current.loadCommands(newCommands);
      // Re-apply styles
      setTimeout(() => {
        ggbRef.current?.setGlobalLineThickness(lineThickness);
        ggbRef.current?.setGlobalPointSize(pointSize);
      }, 300);
    }
  };

  const handleChatCommand = async (message: string) => {
    try {
      // Save to history before updating (if we have a valid result later)
      const stateBeforeUpdate = construction;

      const currentCmds = construction?.rawCommands || [];
      // Optimistic UI update could go here

      // NOTE: generateIncrementalCommands now returns the FULL script (State-Driven)
      // Pass empty array for history to make it stateless as requested
      const result = await generateIncrementalCommands(message, currentCmds, []);

      // Update History - DISABLED as requested (Stateless Mode)
      // setChatHistory(prev => [
      //   ...prev,
      //   { role: 'user', text: message },
      //   { role: 'model', text: result.message }
      // ]);

      if (ggbRef.current && result.commands && result.commands.length > 0) {
        // --- VISUALIZATION: Log Thought Process ---
        if (result.trace) {
          console.group("🧠 AI Thought Process (Chat)");
          console.log("📝 Planned Steps:");
          console.table(result.trace.planner);
          console.log("📚 RAG Context:");
          console.table(result.trace.rag);
          console.log("💻 Generated Commands:");
          console.log(result.commands.join('\n'));
          console.groupEnd();
        }
        // ------------------------------------------

        // State-Driven Update: Reload full script
        ggbRef.current.loadCommands(result.commands);

        // Save history only if we actually have changes
        if (stateBeforeUpdate) {
          setHistory(prev => [...prev, stateBeforeUpdate]);
        }

        // Update local state
        setConstruction(prev => ({
          ...prev!,
          rawCommands: result.commands
        }));

        // Re-apply global settings
        setTimeout(() => {
          if (ggbRef.current) {
            ggbRef.current.setGlobalLineThickness(lineThickness);
            ggbRef.current.setGlobalPointSize(pointSize);
          }
        }, 500);
      }     // Update State with the NEW FULL SCRIPT
      // Update State with the NEW FULL SCRIPT
      setConstruction(prev => {
        const base = prev || {
          points: [],
          segments: [],
          rawCommands: [],
          description: "Interactive Session"
        };

        return {
          ...base,
          rawCommands: result.commands, // Replace, don't append
          description: base.description + ` (Cập nhật: ${message})`
        };
      });

      chatRef.current?.addResponse(result.message, false, result.trace);
    } catch (error: any) {
      console.error("Chat command failed", error);
      chatRef.current?.addResponse(`⚠️ Lỗi: ${error.message || "Không thể xử lý yêu cầu."}`, true);
    }
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bảng vẽ không?")) {
      ggbRef.current?.newConstruction();
      setConstruction(null);
      setChatHistory([]);
      setActivePanel('input');
    }
  };

  const handleColorPoints = () => {
    if (!construction) return;
    construction.points.forEach(p => {
      ggbRef.current?.setColor(p.name, 239, 68, 68); // Red-500
    });
  };

  const handleLockPoints = () => {
    if (!construction) return;
    construction.points.forEach(p => {
      ggbRef.current?.setFixed(p.name, true);
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (sliderMode === 'line') {
      setLineThickness(val);
      ggbRef.current?.setGlobalLineThickness(val);
    } else {
      setPointSize(val);
      ggbRef.current?.setGlobalPointSize(val);
    }
  };

  const toggleSliderMode = () => {
    setSliderMode(prev => prev === 'line' ? 'point' : 'line');
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setHistory(newHistory);
    setConstruction(previousState);

    if (ggbRef.current && previousState) {
      ggbRef.current.loadCommands(previousState.rawCommands);
      // Re-apply styles
      setTimeout(() => {
        ggbRef.current?.setGlobalLineThickness(lineThickness);
      }, 300);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="shrink-0 h-[60px] z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0f172a]/80 border-b border-slate-200/60 dark:border-slate-800/60 px-4 flex items-center justify-between shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-xl shadow-lg shadow-indigo-500/20" />
          <h1 className="text-xl font-bold tracking-tight mr-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">GARAN</span>
            <span className="font-light text-slate-600 dark:text-slate-400">MATH</span>
          </h1>
          <button
            onClick={() => setIsDonateModalOpen(true)}
            className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors flex items-center gap-1"
          >
            <span>❤</span> Donate
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* User Profile / Logout */}
          <div className="flex items-center gap-3 mr-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mr-3"
            >
              API Key
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline mr-3"
              >
                Admin
              </button>
            )}
            <button
              onClick={logout}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
            >
              Logout
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Garanmath AI</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">

        {/* LEFT PANEL: Controls */}
        <div ref={leftPanelRef} className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 h-full relative z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">

          {/* Toggle Switcher */}
          <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0f172a]">
            <div className="relative flex p-1.5 bg-slate-100 dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 h-12">
              {/* Animated Background Pill */}
              <div
                className={`absolute top-1.5 bottom-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${activePanel === 'input' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'
                  }`}
              ></div>

              {/* Buttons */}
              <button
                onClick={() => setActivePanel('input')}
                className={`relative flex-1 z-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-200 ${activePanel === 'input'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                Generate
              </button>

              <button
                onClick={() => setActivePanel('chat')}
                className={`relative flex-1 z-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors duration-200 ${activePanel === 'chat'
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M9 5H5"></path></svg>
                Assistant
              </button>
            </div>
          </div>

          {/* Swappable Area */}
          <div className="flex-grow relative bg-slate-50/50 dark:bg-[#0f172a] min-h-0">

            {/* Problem Input Panel */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform p-3 overflow-y-auto custom-scrollbar ${activePanel === 'input'
              ? 'translate-x-0 opacity-100 z-10'
              : '-translate-x-[15%] opacity-0 z-0 pointer-events-none'
              }`}>
              <ProblemInput onGenerate={(t, i) => { handleGenerate(t, i); }} isGenerating={isGenerating} />
            </div>

            {/* Chat Panel */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform p-3 overflow-y-auto custom-scrollbar ${activePanel === 'chat'
              ? 'translate-x-0 opacity-100 z-10'
              : 'translate-x-[15%] opacity-0 z-0 pointer-events-none'
              }`}>
              <ChatPanel ref={chatRef} onSendMessage={handleChatCommand} />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className="shrink-0 h-1.5 hover:h-2 -mt-0.5 z-30 cursor-row-resize bg-slate-100 hover:bg-indigo-500 dark:bg-slate-800 dark:hover:bg-indigo-500 transition-colors w-full flex items-center justify-center group"
            title="Drag to resize"
          >
            <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-white transition-colors"></div>
          </div>

          {/* Fixed Command Panel at Bottom (Resizable) */}
          <div
            className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-[#0f172a] z-20"
            style={{ height: `${commandPanelHeight}px` }}
          >
            <CommandPanel construction={construction} onUpdateCommands={handleManualUpdate} />
          </div>
        </div>

        {/* RIGHT PANEL: GeoGebra */}
        <div ref={resultRef} className="flex-grow h-full flex flex-col relative bg-slate-50 dark:bg-[#020617] overflow-hidden border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
          {/* Canvas */}
          <div className="flex-grow relative w-full h-full">
            <GeoGebraContainer ref={ggbRef} transparentGraphics={isTransparent} />

            {/* Floating Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md shadow-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-x-auto max-w-[95%]">
              <button onClick={handleRenderToGeoGebra} disabled={!construction} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors disabled:opacity-30" title="Re-render">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors disabled:opacity-30"
                title="Undo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
              </button>

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2"></div>

              <ActionButton onClick={handleColorPoints} disabled={!construction} icon={<div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800 shadow-sm"></div>} label="Color" colorClass="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" />
              <ActionButton onClick={handleLockPoints} disabled={!construction} icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>} label="Lock" colorClass="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" />

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2"></div>

              {/* Unified Thickness/Size Slider */}
              <div className="flex items-center gap-2 px-1" title={sliderMode === 'line' ? "Adjust Line Thickness" : "Adjust Point Size"}>
                <button
                  onClick={toggleSliderMode}
                  className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center ${sliderMode === 'line'
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  title="Độ dày đoạn thẳng"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="20" y2="4"></line></svg>
                </button>

                <button
                  onClick={toggleSliderMode}
                  className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center ${sliderMode === 'point'
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 ring-1 ring-indigo-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  title="Độ dày điểm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="6"></circle></svg>
                </button>

                <div className="w-2"></div>

                <input
                  type="range"
                  min="1"
                  max="13"
                  value={sliderMode === 'line' ? lineThickness : pointSize}
                  onChange={handleSliderChange}
                  className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 hover:accent-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-2"></div>

              {/* Transparent Toggle */}
              <button
                onClick={() => setIsTransparent(!isTransparent)}
                className={`p-2 rounded-xl transition-colors ${isTransparent ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title={isTransparent ? "Disable Transparency" : "Enable Transparency"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
              </button>



              <button onClick={handleClear} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors" title="Clear">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
        <ApiKeySettings
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
        />
        <DonateModal
          isOpen={isDonateModalOpen}
          onClose={() => setIsDonateModalOpen(false)}
        />
      </main>
    </div>

  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/promote"
            element={
              <ProtectedRoute>
                <PromotePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;