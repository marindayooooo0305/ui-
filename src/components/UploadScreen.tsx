import React, { useRef, useState } from 'react';
import { UploadedFile, SubscriptionState } from '../types';
import { mockFiles } from '../mockData';

interface UploadScreenProps {
  files: UploadedFile[];
  onAddFiles: (newFiles: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onStartProcessing: () => void;
  isProUser: boolean;
  onOpenSubscription: () => void;
}

export default function UploadScreen({
  files,
  onAddFiles,
  onRemoveFile,
  onStartProcessing,
  isProUser,
  onOpenSubscription,
}: UploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Helper to parse CSV text into a JSON array of rows
  const parseCSVText = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',');
      if (currentline.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = (currentline[index] || '').trim().replace(/^["']|["']$/g, '');
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFilesSelected = (fileList: FileList) => {
    // Pro limit check
    if (!isProUser && files.length + fileList.length > 3) {
      setAlertMsg("您当前的免费版已经达到最多 3 个文件的限制。");
      onOpenSubscription();
      return;
    }

    const processedNewFiles: UploadedFile[] = [];

    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      const ext = file.name.split('.').pop()?.toLowerCase();

      reader.onload = (event) => {
        const textStr = event.target?.result as string;
        let parsedRows: Record<string, string>[] = [];
        let discoveredColumns: string[] = [];

        try {
          if (ext === 'json') {
            const parsed = JSON.parse(textStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedRows = parsed;
              discoveredColumns = Object.keys(parsed[0]);
            }
          } else {
            // Treat as CSV
            parsedRows = parseCSVText(textStr);
            if (parsedRows.length > 0) {
              discoveredColumns = Object.keys(parsedRows[0]);
            }
          }
        } catch (e) {
          console.error("Failed to parse file values direct:", e);
        }

        // Fallback dummy columns if failed
        if (discoveredColumns.length === 0) {
          discoveredColumns = ['ID', 'Column1', 'Column2', 'Column3'];
          parsedRows = [
            { ID: '1', Column1: 'Sample Row A', Column2: '100', Column3: 'Test' },
            { ID: '2', Column1: 'Sample Row B', Column2: '200', Column3: 'Demo' }
          ];
        }

        const newFile: UploadedFile = {
          id: `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          time: `今天, ${new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' })}`,
          status: 'pending',
          progress: 0,
          columns: discoveredColumns,
          originalData: parsedRows
        };

        processedNewFiles.push(newFile);
        if (processedNewFiles.length === fileList.length) {
          onAddFiles(processedNewFiles);
        }
      };

      reader.readAsText(file);
    });
  };

  // Pre-load mock template options from Screenshot 3
  const handleLoadMockTemplate = (template: UploadedFile) => {
    if (!isProUser && files.some(f => f.id === template.id)) {
      setAlertMsg("该文件模板已经存在在处理队列中。");
      return;
    }
    // Perform copy
    const copy: UploadedFile = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      status: 'pending',
      progress: 0
    };
    onAddFiles([copy]);
    setAlertMsg(`成功载入预设文件：${template.name}`);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  return (
    <div id="upload-screen-container" className="flex flex-col gap-6 animate-fadeIn pb-24">
      
      {/* Brand Header */}
      <div className="pt-4 text-center flex flex-col gap-1.5 items-center">
        <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">上传数据</h1>
        <p className="text-[14px] text-white/60 max-w-[280px]">
          选择或拖入 Excel/CSV 文件，以开始执行批量排序、替换和净化规则。
        </p>
      </div>

      {/* Drag & Drop Box layout (Aura Creative Glass Style) */}
      <div
        id="file-dropzone"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full aspect-square md:aspect-[16/10] rounded-3xl border border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer ${
          isDragging 
            ? 'border-indigo-400 bg-white/10 shadow-[0_0_20px_rgba(129,140,248,0.15)] scale-[1.01]' 
            : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/20'
        } frosted-card`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          multiple
          accept=".csv,.json,.txt,.xlsx"
          className="hidden" 
        />

        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/15 shadow-inner transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-2xl font-light">add</span>
        </div>
        
        <div className="text-center">
          <span className="block font-semibold text-[16px] text-white">批量上传 Excel 或 CSV 文件</span>
          <span className="block text-[12px] text-white/50 mt-1">点击浏览或拖拽文件至此区域内</span>
        </div>
      </div>

      {/* Alert toast notification */}
      {alertMsg && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[13px] px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold underline text-[11px] text-indigo-400 hover:text-indigo-300">关闭</button>
        </div>
      )}

      {/* Quick Load Mock Templates to play around */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-widest">模板载入区 (双击/点击直接加入)</h2>
          {!isProUser && (
            <span className="text-[10px] bg-white/12 text-white/80 px-2.5 py-0.5 rounded-full font-black tracking-wider border border-white/10">免费版: 最多3条</span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mockFiles.map((mockF) => (
            <button
              key={mockF.id}
              onClick={() => handleLoadMockTemplate(mockF)}
              className="p-4 rounded-xl text-left flex flex-col gap-1.5 shadow-md hover:bg-white/12 active:scale-95 transition-all frosted-card cursor-pointer border border-white/5"
            >
              <div className="flex items-center gap-1.5 text-white/90">
                <span className="material-symbols-outlined text-lg text-indigo-400">border_all</span>
                <span className="font-semibold text-[13px] truncate">{mockF.name}</span>
              </div>
              <span className="text-[11px] text-white/40">
                {mockF.columns.length} 列 • {mockF.originalData.length} 行
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected files stack */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h2 className="text-[14px] font-bold text-white/60 uppercase tracking-widest">已选定待处理队列 ({files.length})</h2>
          
          <div className="flex flex-col rounded-2xl overflow-hidden shadow-lg frosted-card">
            {files.map((item, index) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3.5 ${
                  index !== files.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="material-symbols-outlined text-slate-400 text-2xl">description</span>
                  <div className="flex flex-col truncate">
                    <span className="text-[14px] font-medium text-white truncate">{item.name}</span>
                    <span className="text-[11px] text-white/40 mt-0.5">
                      {item.size} • {item.originalData?.length || 0} 行 • {item.time}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onRemoveFile(item.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                  title="删除"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Sticky CTA (Frosted support) */}
      <div className="fixed bottom-16 left-0 w-full px-4 pb-4 bg-gradient-to-t from-[#080a10] via-[#080a10]/85 to-transparent pt-8 z-40">
        <button
          onClick={onStartProcessing}
          disabled={files.length === 0}
          className={`w-full max-w-2xl mx-auto h-14 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-xl ${
            files.length > 0 
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white hover:opacity-95 shadow-indigo-500/20 cursor-pointer font-semibold text-[15px]' 
              : 'bg-white/5 text-white/20 cursor-not-allowed opacity-40 border border-white/5 text-[15px]'
          }`}
        >
          <span>开始处理 ({files.length} 个文件)</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

    </div>
  );
}
