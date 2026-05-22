import { motion } from 'motion/react';
import { useState } from 'react';
import { SubscriptionState } from '../types';

interface SubscriptionScreenProps {
  onClose: () => void;
  onSubscribe: (state: SubscriptionState) => void;
  currentState: SubscriptionState;
}

export default function SubscriptionScreen({ onClose, onSubscribe, currentState }: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>(
    currentState.plan || 'annual'
  );

  const handleSubscribe = () => {
    onSubscribe({
      isPro: true,
      plan: selectedPlan
    });
    // Trigger callback closure
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#070912] text-white overflow-y-auto">
      {/* Top Header Navigation */}
      <header className="sticky top-0 w-full z-50 bg-[#080a10]/60 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="flex items-center justify-between px-4 h-14 w-full">
          <button 
            id="sub-close-btn"
            onClick={onClose}
            className="flex items-center justify-center p-2 -ml-2 text-white hover:opacity-75 transition-opacity active:scale-95 duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined font-light text-2xl">close</span>
          </button>
          <h1 className="font-bold text-[16px] tracking-tight text-white/80">解锁专业版功能</h1>
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-6 pb-36">
        
        {/* Pro Badge */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <span className="inline-flex items-center justify-center bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 px-3.5 py-1 rounded-full text-[11px] font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            PRO ACCESS
          </span>
          <h2 className="text-[34px] font-bold leading-[41px] tracking-tight text-white mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            解锁精准处理
          </h2>
          <p className="text-[14px] leading-relaxed text-white/60 max-w-[280px]">
            提升您的工作流，享受无限量处理和高级规则集。
          </p>
        </div>

        {/* Feature List */}
        <div className="rounded-2xl p-6 mb-8 shadow-xl border border-white/5 frosted-card">
          <ul className="flex flex-col gap-6">
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-indigo-400 font-semibold text-2xl">check_circle</span>
              <div>
                <h3 className="text-[16px] font-bold text-white/95">无限文件数量</h3>
                <p className="text-[13px] text-white/50 mt-1 leading-relaxed">
                  处理任意大小的目录与工作表，批量运行不受限制。
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-indigo-400 font-semibold text-2xl">check_circle</span>
              <div>
                <h3 className="text-[16px] font-bold text-white/95">高级规则与AI精算</h3>
                <p className="text-[13px] text-white/50 mt-1 leading-relaxed">
                  支持自定义正则表达式、复杂多步宏及Gemini智能内容转换。
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="material-symbols-outlined text-indigo-400 font-semibold text-2xl">check_circle</span>
              <div>
                <h3 className="text-[16px] font-bold text-white/95">云端同步</h3>
                <p className="text-[13px] text-white/50 mt-1 leading-relaxed">
                  直接集成 Google Drive、Dropbox 及企业安全云端数据。
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Pricing Tiers Selection */}
        <div className="flex flex-col gap-4">
          
          {/* Annual Card */}
          <button
            id="plan-annual-btn"
            onClick={() => setSelectedPlan('annual')}
            className={`relative w-full text-left rounded-2xl p-5 transition-all duration-300 active:scale-[0.98] cursor-pointer ${
              selectedPlan === 'annual'
                ? 'bg-indigo-600/10 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                : 'bg-white/4 border border-white/5 hover:bg-white/7'
            }`}
          >
            <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-md shadow-indigo-500/25">
              节省 33%
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[16px] font-bold text-white flex items-center gap-1.5">
                  按年订阅
                  {selectedPlan === 'annual' && (
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  )}
                </h4>
                <p className="text-[12px] text-white/40 mt-1">每年账单 $59.99</p>
              </div>
              <div className="text-right">
                <span className="text-[26px] font-extrabold text-white">$4.99</span>
                <span className="text-[13px] text-white/40"> /月</span>
              </div>
            </div>
          </button>

          {/* Monthly Card */}
          <button
            id="plan-monthly-btn"
            onClick={() => setSelectedPlan('monthly')}
            className={`w-full text-left rounded-2xl p-5 transition-all duration-300 active:scale-[0.98] cursor-pointer ${
              selectedPlan === 'monthly'
                ? 'bg-indigo-600/10 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                : 'bg-white/4 border border-white/5 hover:bg-white/7'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[16px] font-bold text-white flex items-center gap-1.5">
                  按月订阅
                  {selectedPlan === 'monthly' && (
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  )}
                </h4>
                <p className="text-[12px] text-white/40 mt-1">随时取消，无合约负担</p>
              </div>
              <div className="text-right">
                <span className="text-[26px] font-extrabold text-white">$7.49</span>
                <span className="text-[13px] text-white/40"> /月</span>
              </div>
            </div>
          </button>

        </div>

      </main>

      {/* Bottom Action Area (Sticky) */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#080a10] via-[#080a10]/85 to-transparent pt-8 pb-6 px-6 z-40">
        <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
          
          {/* Subscribe Action Button */}
          <button
            id="subscribe-pay-btn"
            onClick={handleSubscribe}
            className="w-full h-14 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white hover:opacity-95 active:scale-[0.97] transition-all duration-300 shadow-xl shadow-indigo-500/20 font-bold text-[16px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">lock</span>
            立即订阅 {selectedPlan === 'annual' ? '$4.99/月' : '$7.49/月'}
          </button>

          {/* Utility Support Links */}
          <div className="flex justify-center items-center gap-4 text-[12px] text-white/40">
            <button className="hover:text-white transition-colors cursor-pointer">恢复购买</button>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <button className="hover:text-white transition-colors cursor-pointer">条款与隐私</button>
          </div>
        </div>
      </div>
    </div>
  );
}
