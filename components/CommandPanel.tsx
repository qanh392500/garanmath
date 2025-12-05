import React, { useState, useEffect } from 'react';
import { GeoGebraConstruction } from '../types';

interface CommandPanelProps {
  construction: GeoGebraConstruction | null;
  onUpdateCommands: (commands: string[]) => void;
}

enum Tab {
  RAW = 'Script',
  JSON = 'JSON Data',
}

const CommandPanel: React.FC<CommandPanelProps> = ({ construction, onUpdateCommands }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.RAW);
  const [copied, setCopied] = useState(false);

  // Local state for editing
  const [scriptContent, setScriptContent] = useState('');
  const [jsonContent, setJsonContent] = useState('');

  // Sync local state when construction changes from parent (AI generation)
  useEffect(() => {
    if (construction) {
      setScriptContent(construction.rawCommands.join('\n'));
      setJsonContent(JSON.stringify(construction, null, 2));
    } else {
      setScriptContent('');
      setJsonContent('');
    }
  }, [construction]);

  const handleCopy = () => {
    const content = activeTab === Tab.RAW ? scriptContent : jsonContent;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRun = () => {
    if (activeTab === Tab.RAW) {
      // Parse script by lines
      const commands = scriptContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      onUpdateCommands(commands);
    } else {
      // Parse JSON
      try {
        const parsed = JSON.parse(jsonContent);
        if (parsed.rawCommands && Array.isArray(parsed.rawCommands)) {
          onUpdateCommands(parsed.rawCommands);
        } else {
          alert("Invalid JSON: Missing 'rawCommands' array.");
        }
      } catch (e) {
        alert("Invalid JSON syntax.");
      }
    }
  };

  if (!construction && !scriptContent) {
    return (
      <div className="h-full p-6 bg-white dark:bg-black rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center text-center transition-all duration-300">
        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mb-3 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        </div>
        <p className="text-sm text-slate-400 dark:text-white font-medium">Generated construction code will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between px-2 pt-2 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1">
          {Object.values(Tab).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-4 py-2 rounded-t-lg transition-all ${activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#0f172a] border-t border-x border-slate-200 dark:border-slate-800 translate-y-[1px]'
                : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleRun}
            className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-1 border border-transparent"
            title="Execute current code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Run
          </button>
          <button
            onClick={handleCopy}
            className="mr-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Copied
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-grow relative bg-[#282c34] dark:bg-[#0B1120] group">
        <textarea
          className={`absolute inset-0 w-full h-full p-4 font-mono text-xs leading-relaxed bg-transparent border-none resize-none focus:outline-none custom-scrollbar ${activeTab === Tab.RAW ? 'text-emerald-400 dark:text-emerald-400' : 'text-amber-300 dark:text-amber-400'
            }`}
          spellCheck={false}
          value={activeTab === Tab.RAW ? scriptContent : jsonContent}
          onChange={(e) => activeTab === Tab.RAW ? setScriptContent(e.target.value) : setJsonContent(e.target.value)}
          onBlur={handleRun}
        />
      </div>

      {construction && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">Detected:</span>
          <span className="truncate">{construction.description}</span>
        </div>
      )}
    </div>
  );
};

export default CommandPanel;