import { useState, useMemo } from 'react';
import { UploadedFile, Rule, SubscriptionState } from './types';
import { defaultRules } from './mockData';
import UploadScreen from './components/UploadScreen';
import RulesScreen from './components/RulesScreen';
import ProgressScreen from './components/ProgressScreen';
import PreviewTable from './components/PreviewTable';
import SubscriptionScreen from './components/SubscriptionScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<'files' | 'rules' | 'batch' | 'settings'>('files');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isPro: false,
    plan: null
  });
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  // Settings state controls
  const [proToast, setProToast] = useState<string | null>(null);

  // Extract all available columns from active loaded files to dynamically auto-configure selectors
  const allDiscoveredColumns = useMemo(() => {
    const cols = new Set<string>();
    files.forEach(f => {
      f.columns.forEach(c => cols.add(c));
    });
    return Array.from(cols);
  }, [files]);

  // Event handlers
  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleStartProcessing = () => {
    setActiveTab('batch');
  };

  const handleProcessingFinished = (updated: UploadedFile[]) => {
    setFiles(updated);
  };

  const handleSubscribe = (subState: SubscriptionState) => {
    setSubscription(subState);
    triggerProToast(`✨ 恭喜升级专业版成功！按${subState.plan === 'annual' ? '年' : '月'}订阅已激活。`);
  };

  const triggerProToast = (msg: string) => {
    setProToast(msg);
    setTimeout(() => setProToast(null), 5000);
  };

  const handleResetQueue = () => {
    setFiles([]);
    setActiveTab('files');
  };

  return (
    <div className="min-h-screen text-white/95 flex flex-col font-sans select-none overflow-x-hidden pb-safe">
      
      {/* Top App Header bar - matches Screen 2 & 3 with Frosted Glass look */}
      <header className="fixed top-0 left-0 w-full z-40 bg-white/5 backdrop-blur-xl border-b border-white/8 pt-safe transition-all shadow-lg">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Grid visual button */}
          <button 
            id="header-grid-btn"
            onClick={() => setActiveTab('settings')}
            className="text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all p-2 -ml-2 rounded-full"
            title="面板设置"
          >
            <span className="material-symbols-outlined text-2xl font-light">grid_view</span>
          </button>
          
          {/* Logo Title (Screen 3 style) */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[17px] tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
              Aura Batch Edit
              {subscription.isPro ? (
                <span className="text-[9px] bg-indigo-600/90 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90">
                  PRO
                </span>
              ) : (
                <span className="text-[9px] text-white/40 font-normal leading-none">(免费版)</span>
              )}
            </span>
          </div>

          {/* Account profile launch screen overlay */}
          <button 
            id="header-acc-btn"
            onClick={() => setShowSubModal(true)}
            className="relative text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all p-2 -mr-2 rounded-full"
            title="会员服务"
          >
            <span className="material-symbols-outlined text-2xl font-light">account_circle</span>
            {!subscription.isPro && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#080a10] animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 pt-20 pb-32">
        
        {/* Dynamic content rendering based on active view tab */}
        {activeTab === 'files' && (
          <UploadScreen
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onStartProcessing={handleStartProcessing}
            isProUser={subscription.isPro}
            onOpenSubscription={() => setShowSubModal(true)}
          />
        )}

        {activeTab === 'rules' && (
          <RulesScreen
            rules={rules}
            onUpdateRules={setRules}
            availableColumns={allDiscoveredColumns}
            isProUser={subscription.isPro}
            onOpenSubscription={() => setShowSubModal(true)}
          />
        )}

        {activeTab === 'batch' && (
          <ProgressScreen
            files={files}
            rules={rules}
            isProUser={subscription.isPro}
            onOpenPreview={setPreviewFile}
            onProcessingFinished={handleProcessingFinished}
            onReset={handleResetQueue}
          />
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 animate-fadeIn pb-16">
            <div className="text-center pt-4 flex flex-col gap-1 items-center">
              <h2 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">工作区设置</h2>
              <p className="text-[14px] text-white/60 max-w-[280px]">管理您的数据处理规则和专业版高级账户信息。</p>
            </div>

            {/* Profile state */}
            <div className="frosted-card rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/8">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white/50 tracking-wider uppercase">当前计划</span>
                  <span className="text-[17px] font-semibold text-white mt-0.5">
                    {subscription.isPro 
                      ? `商务专业版 (${subscription.plan === 'annual' ? '按年' : '按月'}已订阅)` 
                      : '基础免费版 (Basic Free)'
                    }
                  </span>
                </div>
                {!subscription.isPro ? (
                  <button
                    onClick={() => setShowSubModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-all shadow-md"
                  >
                    解锁专业版
                  </button>
                ) : (
                  <span className="text-green-400 flex items-center gap-1.5 text-[13px] font-semibold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <span className="material-symbols-outlined text-lg">verified</span> PRO 尊享中
                  </span>
                )}
              </div>

              {/* Stats information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/4 p-4 rounded-xl flex flex-col gap-0.5 border border-white/5">
                  <span className="text-[11px] text-white/50">待处理文件数</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1">{files.length}</span>
                </div>
                <div className="bg-white/4 p-4 rounded-xl flex flex-col gap-0.5 border border-white/5">
                  <span className="text-[11px] text-white/50">激活的操作规则</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1">
                    {rules.filter(r => r.enabled).length}
                  </span>
                </div>
              </div>
            </div>

            {/* System specification instructions */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[14px] font-bold text-white/70 uppercase tracking-widest px-1">关于 Precision Spreadsheet Utility</h3>
              <div className="frosted-card rounded-2xl p-5 text-[13px] text-white/70 flex flex-col gap-3 leading-relaxed">
                <p>
                  1. <b>本地零散数据沙盒：</b>本处理程序所有 CSV 甚至 Excel 行的常规数据清洗、替换、合并均在本地内存中完成，确保绝对的企业商业机密安全。
                </p>
                <p>
                  2. <b>Gemini 智能算子：</b>应用对接了先进的 Google Gemini 模型，可以实现将特定非结构化 Notes/Description 智能转换为归一化文本。
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Pro congratulations Toast Alert */}
      {proToast && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-[#0a0c14]/90 backdrop-blur-xl text-white px-5 py-4 rounded-2xl shadow-xl border border-white/12 flex items-center justify-between gap-4 animate-slideDown">
          <span className="text-[13px] font-semibold">{proToast}</span>
          <button onClick={() => setProToast(null)} className="text-[11px] bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 font-bold uppercase tracking-wider transition-colors">
            确认
          </button>
        </div>
      )}

      {/* Screen 1 Overlaid Modal */}
      {showSubModal && (
        <SubscriptionScreen
          currentState={subscription}
          onSubscribe={handleSubscribe}
          onClose={() => setShowSubModal(false)}
        />
      )}

      {/* Difference Preview dialog */}
      {previewFile && (
        <PreviewTable
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Bottom responsive menu navigation bar - Screen 2 / 3 details with Frosted Glass look */}
      <nav className="fixed bottom-0 left-0 w-full z-40 pb-safe bg-[#080a10]/50 backdrop-blur-xl border-t border-white/8 transition-all">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
          
          {/* Tab Files */}
          <button
            id="nav-tab-files"
            onClick={() => setActiveTab('files')}
            className={`flex flex-col items-center justify-center w-20 h-13 rounded-xl transition-all ${
              activeTab === 'files'
                ? 'text-white bg-white/10 font-semibold'
                : 'text-white/50 hover:text-white/85 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeTab === 'files' ? "'FILL' 1" : "'FILL' 0" }}>
              description
            </span>
            <span className="text-[11px] select-none tracking-tight">文件</span>
          </button>

          {/* Tab Rules */}
          <button
            id="nav-tab-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center w-20 h-13 rounded-xl transition-all ${
              activeTab === 'rules'
                ? 'text-white bg-white/10 font-semibold'
                : 'text-white/50 hover:text-white/85 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeTab === 'rules' ? "'FILL' 1" : "'FILL' 0" }}>
              rule
            </span>
            <span className="text-[11px] select-none tracking-tight">规则</span>
          </button>

          {/* Tab Batch logs queue */}
          <button
            id="nav-tab-batch"
            onClick={() => {
              if (files.length === 0) {
                // Shake or show file warning
                triggerProToast("⚠️ 待处理队列为空，请先添加需要计算格式的文件。");
              } else {
                setActiveTab('batch');
              }
            }}
            className={`flex flex-col items-center justify-center w-20 h-13 rounded-xl transition-all relative ${
              activeTab === 'batch'
                ? 'text-white bg-white/10 font-semibold'
                : 'text-white/50 hover:text-white/85 hover:bg-white/5'
            }`}
          >
            {files.length > 0 && activeTab !== 'batch' && (
              <span className="absolute top-1.5 right-6 w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            )}
            <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeTab === 'batch' ? "'FILL' 1" : "'FILL' 0" }}>
              layers
            </span>
            <span className="text-[11px] select-none tracking-tight">批量</span>
          </button>

          {/* Tab Settings */}
          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-20 h-13 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-white bg-white/10 font-semibold'
                : 'text-white/50 hover:text-white/85 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined mb-1 text-[22px]" style={{ fontVariationSettings: activeTab === 'settings' ? "'FILL' 1" : "'FILL' 0" }}>
              settings
            </span>
            <span className="text-[11px] select-none tracking-tight">设置</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
