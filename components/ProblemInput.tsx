
import React, { useState, useRef } from 'react';

interface ProblemInputProps {
  onGenerate: (text: string, imageBase64: string | null) => void;
  isGenerating: boolean;
}

const ProblemInput: React.FC<ProblemInputProps> = ({ onGenerate, isGenerating }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExample1 = () => {
    setText("Cho hình chóp S.ABC, trong đó ABC là tam giác đều cạnh a. Hãy vẽ hình và thể hiện các cạnh SA, SB, SC.");
    setImage(null);
    setFileName('');
  };

  const handleExample2 = () => {
    setText("Cho hình lập phương ABCD.A'B'C'D'. Vẽ hình và thể hiện tất cả các cạnh.");
    setImage(null);
    setFileName('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent pasting binary text
        const file = item.getAsFile();
        if (file) {
          setFileName('pasted-image.png');
          const reader = new FileReader();
          reader.onloadend = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          return; // Stop after first image found
        }
      }
    }
  };

  const clearImage = () => {
    setImage(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    onGenerate(text, image);
  };

  const hasContent = text.trim().length > 0 || image !== null;

  return (
    <div className="flex flex-col h-full p-4 md:p-5 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden">
      {/* Header with Shrinkable Title and Fixed Buttons */}
      <div className="flex items-center justify-between mb-3 gap-3 shrink-0">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate min-w-0">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg text-white shrink-0 shadow-md shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
          <span className="truncate tracking-tight">Describe Problem</span>
        </h2>

        <div className="flex gap-1.5 shrink-0">
          <button onClick={handleExample1} className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 whitespace-nowrap">
            #Pyramid
          </button>
          <button onClick={handleExample2} className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 whitespace-nowrap">
            #Cube
          </button>
        </div>
      </div>

      {/* Main Input Area - Grows and Scrolls Internally */}
      <div className="flex-grow flex flex-col gap-3 min-h-0 relative group">
        <textarea
          className="w-full h-full flex-grow p-4 border border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-[#020617] text-sm font-medium placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200"
          placeholder="Describe geometry problem here... (You can also paste an image)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
        />

        {/* Floating Image Preview */}
        {image && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-500/30 rounded-xl shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm" style={{ backgroundImage: `url(${image})` }}></div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[150px]">{fileName}</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">Image Attached</span>
              </div>
            </div>
            <button
              onClick={clearImage}
              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions - Pinned to Bottom */}
      <div className="mt-4 flex gap-3 shrink-0">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex-shrink-0 w-12 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          title="Upload Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!hasContent || isGenerating}
          className={`flex-grow h-11 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2
            ${!hasContent || isGenerating
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 border border-transparent'
            }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
              Generate Model
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProblemInput;
