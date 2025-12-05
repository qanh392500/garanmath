import React, { useState } from 'react';

interface ProblemInputProps {
  onGenerate: (text: string, imageBase64: string | null) => void;
  isGenerating: boolean;
}

const ProblemInput: React.FC<ProblemInputProps> = ({ onGenerate, isGenerating }) => {
  const [text, setText] = useState('');

  const handleExample1 = () => setText("Cho hình chóp S.ABC, trong đó ABC là tam giác đều cạnh a. Hãy vẽ hình và thể hiện các cạnh SA, SB, SC.");
  const handleExample2 = () => setText("Cho hình lập phương ABCD.A'B'C'D'. Vẽ hình và thể hiện tất cả các cạnh.");

  const handleSubmit = () => {
    onGenerate(text, null);
  };

  const hasContent = text.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <textarea
        className="flex-grow w-full p-4 bg-transparent border-none resize-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-base"
        placeholder="Mô tả bài toán..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="p-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex gap-2">
          <button onClick={handleExample1} className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">#Pyramid</button>
          <button onClick={handleExample2} className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">#Cube</button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!hasContent || isGenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Đang tạo...' : 'Tạo hình'}
        </button>
      </div>
    </div>
  );
};

export default ProblemInput;
