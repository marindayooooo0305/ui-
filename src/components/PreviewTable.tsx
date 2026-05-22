import { useState } from 'react';
import { UploadedFile } from '../types';

interface PreviewTableProps {
  file: UploadedFile;
  onClose: () => void;
}

export default function PreviewTable({ file, onClose }: PreviewTableProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'processed'>('processed');
  
  const headers = file.columns;
  const dataToDisplay = activeTab === 'processed' 
    ? (file.processedData || file.originalData) 
    : file.originalData;

  const getColDiffers = (rowIndex: number, colName: string, originalVal: string) => {
    if (activeTab === 'original' || !file.processedData) return false;
    const processedVal = file.processedData[rowIndex]?.[colName] || '';
    return originalVal !== processedVal;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10 bg-[#0a0c14]/95 backdrop-blur-xl">
        
        {/* Header controller block */}
        <header className="p-5 border-b border-white/5 bg-[#0a0c16]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-indigo-400 font-semibold text-2xl">table_chart</span>
            <div className="flex flex-col">
              <h3 className="font-bold text-[18px] text-white bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent shrink-0">{file.name} - 处理预览</h3>
              <span className="text-[12px] text-white/50 truncate max-w-[280px]">
                共 {dataToDisplay.length} 行数据 • {headers.length} 项属性
              </span>
            </div>
          </div>

          {/* Toggle between original & processed */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'original'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              原始数据 (Original)
            </button>
            <button
              onClick={() => setActiveTab('processed')}
              className={`px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'processed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              已处理结果 (Processed)
            </button>
          </div>
        </header>

        {/* Dynamic Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto p-4 max-w-full">
          <table className="w-full text-left border-collapse rounded-xl overflow-hidden border border-white/5 bg-[#0a0c16]/20">
            {/* Headers row */}
            <thead>
              <tr className="bg-white/8 border-b border-white/5">
                <th className="p-3 pl-4 text-[11px] font-bold text-white/50 font-mono tracking-wider w-12 text-center select-none">
                  #
                </th>
                {headers.map(header => (
                  <th 
                    key={header} 
                    className="p-3 text-[11px] font-bold text-white/60 font-mono tracking-wider select-none min-w-[120px]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cell contents */}
            <tbody>
              {dataToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="p-8 text-center text-[13px] text-white/40">
                    无可作用的数据
                  </td>
                </tr>
              ) : (
                dataToDisplay.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="border-b border-white/5 opacity-95 hover:opacity-100 hover:bg-white/4 transition-colors"
                  >
                    {/* Index row */}
                    <td className="p-3 pl-4 text-center font-mono text-[10px] text-white/40 bg-white/4 border-r border-white/5 select-none">
                      {rowIndex + 1}
                    </td>

                    {/* Header items mapping */}
                    {headers.map(header => {
                      const text = row[header] || '';
                      
                      // Highlight differs
                      const originalValue = file.originalData[rowIndex]?.[header] || '';
                      const isChanged = getColDiffers(rowIndex, header, originalValue);

                      return (
                        <td 
                          key={header} 
                          className="p-3 text-[13px] font-medium transition-colors"
                        >
                          {isChanged ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] text-rose-400/70 line-through font-mono">
                                {originalValue}
                              </span>
                              <span className="text-[12.5px] text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 max-w-fit block font-mono">
                                {text}
                              </span>
                            </div>
                          ) : (
                            <span className="text-white/80 font-mono leading-relaxed truncate block max-w-xs" title={text}>
                              {text}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls */}
        <footer className="p-5 border-t border-white/5 bg-[#0a0c16]/30 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white text-[13px] font-bold active:scale-95 transition-all outline-none cursor-pointer shadow-md shadow-indigo-500/15"
          >
            确认返回
          </button>
        </footer>

      </div>
    </div>
  );
}
