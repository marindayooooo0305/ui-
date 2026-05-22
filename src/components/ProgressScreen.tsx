import { useEffect, useState } from 'react';
import { UploadedFile, Rule, SubscriptionState } from '../types';
import { processFileWithRules } from '../utils/processor';

interface ProgressScreenProps {
  files: UploadedFile[];
  rules: Rule[];
  isProUser: boolean;
  onOpenPreview: (file: UploadedFile) => void;
  onProcessingFinished: (updatedFiles: UploadedFile[]) => void;
  onReset: () => void;
}

export default function ProgressScreen({
  files,
  rules,
  isProUser,
  onOpenPreview,
  onProcessingFinished,
  onReset
}: ProgressScreenProps) {
  const [processedFiles, setProcessedFiles] = useState<UploadedFile[]>([]);
  const [generalProgress, setGeneralProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [completeCount, setCompleteCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);

  // Initialize processing sequence
  useEffect(() => {
    // Clone files to map state
    const clone: UploadedFile[] = files.map(f => ({
      ...f,
      status: 'pending',
      progress: 0
    }));
    setProcessedFiles(clone);
    startBatchProcessing(clone);
  }, [files]);

  const startBatchProcessing = async (loadedFiles: UploadedFile[]) => {
    setIsProcessing(true);
    const updated = [...loadedFiles];

    // Compute progress incrementally based on files
    for (let i = 0; i < updated.length; i++) {
      setCurrentFileIndex(i);
      updated[i].status = 'processing';
      setProcessedFiles([...updated]);

      try {
        // Execute rule processing on the file
        const resultRows = await processFileWithRules(
          updated[i],
          rules,
          isProUser,
          (filePercent) => {
            updated[i].progress = filePercent;
            // Aggregate progress
            const sumOfProgresses = updated.reduce((acc, f) => acc + f.progress, 0);
            const totalProgress = Math.round(sumOfProgresses / updated.length);
            setGeneralProgress(totalProgress);
            setProcessedFiles([...updated]);
          }
        );

        // Check if there is an AI rule enabled with server-side AI connection
        const activeAiRule = rules.find(r => r.enabled && r.type === 'ai');
        if (activeAiRule && activeAiRule.config.aiPrompt) {
          // Attempt server-side transformation proxy
          try {
            const aiCol = activeAiRule.config.targetCol || 'Notes';
            const reqBody = {
              rows: resultRows,
              column: aiCol,
              instruction: activeAiRule.config.aiPrompt
            };
            const response = await fetch('/api/ai-transform', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });
            const data = await response.json();
            if (data.success && data.updatedRows) {
              updated[i].processedData = data.updatedRows;
            } else {
              updated[i].processedData = resultRows;
            }
          } catch (aiErr) {
            console.warn("AI Server route error, fallback to mock rules:", aiErr);
            updated[i].processedData = resultRows;
          }
        } else {
          updated[i].processedData = resultRows;
        }

        updated[i].status = 'done';
        updated[i].progress = 100;
        setCompleteCount(c => c + 1);
      } catch (err: any) {
        console.error(err);
        updated[i].status = 'failed';
        updated[i].progress = 0;
      }

      setProcessedFiles([...updated]);
      // Gentle pause between files
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Finished
    const sumOfProgresses = updated.reduce((acc, f) => acc + f.progress, 0);
    setGeneralProgress(Math.round(sumOfProgresses / updated.length));
    setIsProcessing(false);
    onProcessingFinished(updated);
  };

  // Convert files into standard downloadable CSV blob files triggers
  const handleDownloadAll = () => {
    processedFiles.forEach(file => {
      if (file.status !== 'done' || !file.processedData) return;

      const headers = file.columns;
      const csvContent = [
        headers.join(','), // header row
        ...file.processedData.map(row => 
          headers.map(fieldName => {
            const val = row[fieldName] || '';
            // Escape double quotes
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\r\n');

      // Create browser link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ProTransformed_${file.name.replace(/\.[^/.]+$/, "")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Circular progress calculation matching Screen 4 layout parameters
  const radius = 46;
  const strokeWidth = 3;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (generalProgress / 100) * circumference;

  return (
    <div id="progress-screen-container" className="flex flex-col gap-6 animate-fadeIn pb-24">
      
      {/* Progress Circle Ring section matching design */}
      <section className="flex flex-col items-center justify-center py-6 rounded-2xl p-6 frosted-card">
        
        {/* Animated Circular Progress ring */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Gray background ring */}
            <circle 
              className="text-white/10" 
              cx="50" 
              cy="50" 
              fill="none" 
              r={normalizedRadius} 
              stroke="currentColor" 
              strokeWidth="2"
            />
            {/* Primary active arc indicator */}
            <circle 
              className="text-indigo-400 transition-all duration-300 ease-out" 
              cx="50" 
              cy="50" 
              fill="none" 
              r={normalizedRadius} 
              stroke="currentColor" 
              strokeWidth="3.2"
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Central percentage numerical readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[34px] font-bold text-white tracking-tight">{generalProgress}%</span>
            {isProcessing && <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">处理中</span>}
          </div>
        </div>

        {/* Text descriptions */}
        <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">
          {isProcessing 
            ? `正在处理第 ${currentFileIndex + 1}/${processedFiles.length} 个文件` 
            : `处理完毕 (共完成 ${completeCount} 个文件)`
          }
        </p>
      </section>

      {/* Button to Preview specific files results */}
      <div className="flex justify-center w-full">
        <button
          onClick={() => {
            // Open first completed or processing file
            const target = processedFiles.find(f => f.status === 'done' || f.status === 'processing');
            if (target) onOpenPreview(target);
          }}
          disabled={completeCount === 0}
          className={`w-full relative group overflow-hidden rounded-xl border py-3.5 px-6 flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 ${
            completeCount > 0 
              ? 'bg-white/8 border-white/15 text-white font-semibold shadow-md cursor-pointer hover:bg-white/12' 
              : 'bg-white/5 border-white/5 text-white/20 font-normal cursor-not-allowed opacity-40'
          }`}
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          <span>预览处理结果</span>
        </button>
      </div>

      {/* Files Process log Queue */}
      <section className="flex-1">
        <h2 className="text-[13px] font-bold text-white/60 uppercase tracking-widest mb-3 px-1">任务队列 (Queue Status)</h2>
        
        <div className="flex flex-col rounded-2xl overflow-hidden flex-col frosted-card">
          {processedFiles.map(file => (
            <div 
              key={file.id} 
              onClick={() => { if(file.status === 'done') onOpenPreview(file); }}
              className={`flex items-center justify-between p-4 border-b border-white/5 last:border-b-0 cursor-pointer hover:bg-white/4 transition-colors ${
                file.status === 'pending' ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-3 truncate max-w-[80%]">
                <span className="material-symbols-outlined text-slate-400 text-xl">description</span>
                <div className="flex flex-col truncate">
                  <span className={`text-[14px] truncate ${file.status === 'processing' ? 'font-semibold text-indigo-300' : 'text-white'}`}>
                    {file.name}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {file.size} • {file.status === 'processing' ? `正在应用规则 ${file.progress}%` : file.status === 'done' ? '格式化已落实' : '排队等待中'}
                  </span>
                </div>
              </div>

              {/* iOS vector status feedback icons */}
              {file.status === 'done' && (
                <span className="material-symbols-outlined text-emerald-400 font-semibold text-lg">check_circle</span>
              )}
              {file.status === 'processing' && (
                <span className="material-symbols-outlined text-indigo-400 animate-spin text-lg">progress_activity</span>
              )}
              {file.status === 'pending' && (
                <span className="material-symbols-outlined text-white/25 text-lg">schedule</span>
              )}
              {file.status === 'failed' && (
                <span className="material-symbols-outlined text-rose-400 text-lg">error_outline</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Action buttons sticky block */}
      <div className="fixed bottom-16 left-0 w-full px-4 pb-4 bg-gradient-to-t from-[#080a10] via-[#080a10]/85 to-transparent pt-8 z-40">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 w-full">
          
          <button
            onClick={onReset}
            className="flex-1 h-14 rounded-full border border-white/10 bg-white/7 text-white flex items-center justify-center gap-1 hover:bg-white/12 font-semibold text-[15px] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            重新上传
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isProcessing || completeCount === 0}
            className={`flex-[2] h-14 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-xl ${
              !isProcessing && completeCount > 0
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white hover:opacity-95 shadow-indigo-500/20 cursor-pointer font-bold text-[15px]'
                : 'bg-white/5 border border-white/5 text-white/25 cursor-not-allowed opacity-40 text-[15px]'
            }`}
          >
            <span className="material-symbols-outlined font-semibold text-lg">download</span>
            全部安全下载 ({completeCount}个文件)
          </button>

        </div>
      </div>

    </div>
  );
}
