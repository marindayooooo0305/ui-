import { useState, useId } from 'react';
import { Rule } from '../types';

interface RulesScreenProps {
  rules: Rule[];
  onUpdateRules: (newRules: Rule[]) => void;
  availableColumns: string[]; 
  isProUser: boolean;
  onOpenSubscription: () => void;
}

export default function RulesScreen({
  rules,
  onUpdateRules,
  availableColumns,
  isProUser,
  onOpenSubscription,
}: RulesScreenProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRuleType, setNewRuleType] = useState<Rule['type']>('replace');
  const [ruleAssistantPrompt, setRuleAssistantPrompt] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);

  // Form states for manual addition
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCol, setNewRuleCol] = useState('DateCreated');

  const ruleFormTargetColId = useId();
  const ruleFormFindTextId = useId();
  const ruleFormReplaceTextId = useId();
  const ruleFormFormatTypeId = useId();
  const ruleFormWatermarkTextId = useId();
  const ruleFormWatermarkPositionId = useId();

  const handleToggleRule = (id: string) => {
    // Pro limit check: Let free users toggle only the default active rules. Adding/enabling the rest requires premium.
    const rule = rules.find(r => r.id === id);
    if (!isProUser && rule && !rule.enabled && (id === 'add_watermark' || id === 'strip_html' || id.startsWith('custom_'))) {
      onOpenSubscription();
      return;
    }

    const updated = rules.map(r => {
      if (r.id === id) {
        return { ...r, enabled: !r.enabled };
      }
      return r;
    });
    onUpdateRules(updated);
  };

  const handleUpdateRuleConfig = (id: string, updatedConfig: any) => {
    const updated = rules.map(r => {
      if (r.id === id) {
        // Formulate dynamic summary text description
        let desc = r.description;
        if (r.type === 'replace') {
          desc = `目标: "${updatedConfig.findText || ''}", 替换为: "${updatedConfig.replaceText || ''}"`;
        } else if (r.type === 'format') {
          const typeLabel = updatedConfig.formatType === 'date-iso' ? 'ISO-8601' : updatedConfig.formatType;
          desc = `将 '${updatedConfig.targetCol || 'DateCreated'}' 转换为 ${typeLabel}`;
        } else if (r.type === 'watermark') {
          desc = `文本: "${updatedConfig.watermarkText || ''}", 位置: ${updatedConfig.watermarkPosition}`;
        } else if (r.type === 'html') {
          desc = `清洗: <HTML> 标签, 目标: ${updatedConfig.targetCol || 'Description'}`;
        } else if (r.type === 'ai') {
          desc = `AI精算: ${updatedConfig.aiPrompt || '智能重写'}`;
        }
        return { 
          ...r, 
          description: desc,
          config: { ...r.config, ...updatedConfig } 
        };
      }
      return r;
    });
    onUpdateRules(updated);
  };

  const handleSaveNewRule = () => {
    if (!isProUser && rules.length >= 4) {
      onOpenSubscription();
      return;
    }

    const name = newRuleName.trim() || getDefaultNameForType(newRuleType);
    let desc = '';
    let initialConfig: any = { targetCol: newRuleCol };

    if (newRuleType === 'replace') {
      initialConfig = { ...initialConfig, findText: '', replaceText: '', regexEnabled: false };
      desc = `查找与替换`;
    } else if (newRuleType === 'format') {
      initialConfig = { ...initialConfig, formatType: 'date-iso' };
      desc = `列格式化`;
    } else if (newRuleType === 'watermark') {
      initialConfig = { ...initialConfig, watermarkText: '审核章', watermarkOpacity: 0.15, watermarkPosition: 'suffix' };
      desc = `添加数字尾缀`;
    } else if (newRuleType === 'html') {
      initialConfig = { ...initialConfig, htmlStripCols: [newRuleCol] };
      desc = `清洗标签`;
    } else if (newRuleType === 'ai') {
      initialConfig = { ...initialConfig, aiPrompt: '智能核算并提取数值' };
      desc = `AI精算并且归一化`;
    }

    const newRule: Rule = {
      id: `custom_${Date.now()}`,
      type: newRuleType,
      name,
      description: desc,
      enabled: true,
      config: initialConfig
    };

    onUpdateRules([...rules, newRule]);
    setShowAddForm(false);
    // Expand configuration instantly
    setEditingRuleId(newRule.id);
  };

  const handleAiRuleAssistant = async () => {
    if (!ruleAssistantPrompt.trim()) return;
    setAssistantLoading(true);
    setAssistantMessage(null);

    try {
      const response = await fetch('/api/rule-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: ruleAssistantPrompt }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add rule discovered by AI Assistant
      const suggestion: Rule = {
        id: `custom_ai_${Date.now()}`,
        type: data.recommendedType,
        name: `AI 智荐: ${data.name}`,
        description: data.description,
        enabled: true,
        config: {
          targetCol: data.targetColHint || availableColumns[0] || 'Notes',
          ...data.config
        }
      };

      onUpdateRules([...rules, suggestion]);
      setAssistantMessage(`✨ Gemini 智能生成成功！已为您创建并开启 "${suggestion.name}" 规则。`);
      setRuleAssistantPrompt('');
    } catch (e: any) {
      setAssistantMessage(`⚠️ 无法调用规则生成助手: ${e.message}. 已为您切换为普通自定义规则。`);
    } finally {
      setAssistantLoading(false);
    }
  };

  const getDefaultNameForType = (type: Rule['type']): string => {
    switch (type) {
      case 'replace': return '自定义替换';
      case 'format': return '格式化特定列';
      case 'watermark': return '特定列附加文本';
      case 'html': return '清洗标签代码';
      case 'ai': return 'Gemini 智能AI精析';
    }
  };

  const getIconForType = (type: Rule['type']) => {
    switch (type) {
      case 'replace': return 'find_replace';
      case 'format': return 'view_column';
      case 'watermark': return 'branding_watermark';
      case 'html': return 'code_off';
      case 'ai': return 'psychology';
    }
  };

  return (
    <div id="rules-screen-container" className="flex flex-col gap-6 animate-fadeIn pb-24">
      
      {/* Rules Title Header */}
      <div className="px-1 flex flex-col gap-1.5">
        <h2 className="text-[28px] font-bold text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight">执行规则</h2>
        <p className="text-[14px] text-white/60">配置将按顺序、从上至下应用于当前批量选择的数据格操作中。</p>
      </div>

      {/* Rules list */}
      <div className="rounded-[20px] overflow-hidden flex flex-col frosted-card">
        {rules.map((rule, idx) => {
          const isEditing = editingRuleId === rule.id;
          return (
            <div 
              key={rule.id}
              className={`flex flex-col border-b border-white/5 last:border-none transition-colors hover:bg-white/4 ${
                !rule.enabled ? 'opacity-60' : ''
              }`}
            >
              {/* Row header layout */}
              <div className="flex items-center gap-4 p-4 cursor-pointer">
                
                {/* Rule Icon */}
                <button 
                  onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 hover:scale-105 border border-white/10 transition-transform"
                >
                  <span className="material-symbols-outlined font-light text-xl text-indigo-300">
                    {getIconForType(rule.type)}
                  </span>
                </button>
 
                {/* Content details */}
                <div 
                  onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                  className="flex-1 flex flex-col justify-center select-none truncate"
                >
                  <span className="text-[15px] font-semibold text-white flex items-center gap-1.5">
                    {rule.name}
                    {isEditing && <span className="text-[9px] bg-indigo-600/90 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">配置中</span>}
                  </span>
                  <span className="text-[12px] text-white/50 mt-0.5 font-mono truncate max-w-[280px]">
                    {rule.description}
                  </span>
                </div>

                {/* Switch toggler (iPhone standard feel - Glow upgraded) */}
                <button
                  id={`toggle-${rule.id}`}
                  onClick={() => handleToggleRule(rule.id)}
                  className={`w-[48px] h-[28px] rounded-full relative transition-all duration-300 focus:outline-none shrink-0 border cursor-pointer ${
                    rule.enabled 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                      : 'bg-white/10 border-white/5'
                  }`}
                >
                  <div className={`w-[24px] h-[24px] bg-white rounded-full absolute top-[1px] shadow-md transition-all duration-300 ${
                    rule.enabled ? 'right-[1px]' : 'left-[1px]'
                  }`} />
                </button>
              </div>

              {/* Editing details panel */}
              {isEditing && (
                <div className="bg-white/4 p-5 px-6 border-t border-white/5 flex flex-col gap-4 animate-slideDown">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Common target column selector */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={ruleFormTargetColId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                        目标列 / Column
                      </label>
                      <select
                        id={ruleFormTargetColId}
                        value={rule.config.targetCol || ''}
                        onChange={(e) => handleUpdateRuleConfig(rule.id, { targetCol: e.target.value })}
                        className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none cursor-pointer"
                      >
                        <option value="*">所有可作用文本列 (*)</option>
                        {availableColumns.length > 0 ? (
                          availableColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))
                        ) : (
                          <>
                            <option value="DateCreated">DateCreated</option>
                            <option value="Notes">Notes</option>
                            <option value="Description">Description</option>
                            <option value="Revenue">Revenue</option>
                            <option value="Warehouse">Warehouse</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Specific type configurations */}
                    {rule.type === 'replace' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={ruleFormFindTextId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                            目标字符串 / Find
                          </label>
                          <input 
                            id={ruleFormFindTextId}
                            type="text" 
                            placeholder="如: \n"
                            value={rule.config.findText || ''}
                            onChange={(e) => handleUpdateRuleConfig(rule.id, { findText: e.target.value })}
                            className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={ruleFormReplaceTextId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                            替换为 / Replace With
                          </label>
                          <input 
                            id={ruleFormReplaceTextId}
                            type="text" 
                            placeholder="如: 空格, 逗号"
                            value={rule.config.replaceText || ''}
                            onChange={(e) => handleUpdateRuleConfig(rule.id, { replaceText: e.target.value })}
                            className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2.5 pt-4 sm:col-span-2">
                          <input 
                            type="checkbox"
                            checked={rule.config.regexEnabled || false}
                            onChange={(e) => handleUpdateRuleConfig(rule.id, { regexEnabled: e.target.checked })}
                            className="h-5 w-5 accent-indigo-500 rounded border-white/10 bg-white/5 cursor-pointer"
                            id={`regex-chk-${rule.id}`}
                          />
                          <label htmlFor={`regex-chk-${rule.id}`} className="text-[13px] font-medium text-white/80 cursor-pointer">
                            启用正则转义/正则匹配 (高级)
                          </label>
                        </div>
                      </>
                    )}

                    {rule.type === 'format' && (
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={ruleFormFormatTypeId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                          标准格式化类型 / Format Scheme
                        </label>
                        <select
                          id={ruleFormFormatTypeId}
                          value={rule.config.formatType || 'date-iso'}
                          onChange={(e) => handleUpdateRuleConfig(rule.id, { formatType: e.target.value })}
                          className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none cursor-pointer"
                        >
                          <option value="date-iso">YYYY-MM-DD (ISO 8601 标准日期)</option>
                          <option value="uppercase">大写字母转换 (UPPERCASE)</option>
                          <option value="lowercase">小写字母转换 (lowercase)</option>
                          <option value="trim">去除前后空格 (Trim Spaces)</option>
                          <option value="number-std">提取数字 / 去除货币符号 (e.g. $4.99 和 4.99)</option>
                        </select>
                      </div>
                    )}

                    {rule.type === 'watermark' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={ruleFormWatermarkTextId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                            数字水印/附加尾缀字符
                          </label>
                          <input 
                            id={ruleFormWatermarkTextId}
                            type="text" 
                            placeholder="如: [已校对]"
                            value={rule.config.watermarkText || ''}
                            onChange={(e) => handleUpdateRuleConfig(rule.id, { watermarkText: e.target.value })}
                            className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={ruleFormWatermarkPositionId} className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                            添加位置 / Wrap Position
                          </label>
                          <select
                            id={ruleFormWatermarkPositionId}
                            value={rule.config.watermarkPosition || 'suffix'}
                            onChange={(e) => handleUpdateRuleConfig(rule.id, { watermarkPosition: e.target.value })}
                            className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white focus:bg-[#0a0c14]/80 outline-none cursor-pointer"
                          >
                            <option value="suffix">数字单元格尾缀附加 (如: $50 [审核员章])</option>
                            <option value="top-left">加在段落头部 (如: [审核员章] $50)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {rule.type === 'ai' && (
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[12px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-indigo-400">auto_awesome</span>
                          Gemini AI 修改指示 (请输入翻译/清洗/内容智能处理要求)
                        </label>
                        <input 
                          type="text" 
                          placeholder="例如: 将此列文本统一翻译成英文 / 分离出联系方式 / 提取首字母"
                          value={rule.config.aiPrompt || ''}
                          onChange={(e) => handleUpdateRuleConfig(rule.id, { aiPrompt: e.target.value })}
                          className="h-11 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[14px] text-white w-full focus:bg-[#0a0c14]/80 outline-none"
                        />
                        <span className="text-[11px] text-white/40 leading-relaxed mt-0.5">
                          说明：处理时系统将把该列值打包发送至 Gemini 生成，实现零规则、全智能内容洗涤与映射。
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Smart Rule Designer Tool */}
      <div className="rounded-2xl p-5 border border-white/5 shadow-inner flex flex-col gap-3 frosted-card">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-400">auto_awesome</span>
          <span className="text-[14px] font-bold text-white/90 uppercase tracking-wider">Gemini AI 智能规则助理</span>
        </div>
        
        <div className="flex gap-2.5">
          <input 
            type="text" 
            placeholder="告诉助理你想怎么处理数据，例如: '帮我清洗掉 notes 里的换行并翻译成英文'"
            value={ruleAssistantPrompt}
            onChange={(e) => setRuleAssistantPrompt(e.target.value)}
            disabled={assistantLoading}
            className="flex-1 h-11 px-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 text-[13px] focus:bg-white/10 focus:border-white/20 outline-none"
          />
          <button 
            onClick={handleAiRuleAssistant}
            disabled={assistantLoading || !ruleAssistantPrompt.trim()}
            className="bg-indigo-600 border border-indigo-500/20 text-white px-4 h-11 rounded-xl text-[13px] font-semibold hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 cursor-pointer"
          >
            {assistantLoading ? '设计中...' : '生成规则'}
          </button>
        </div>

        {assistantMessage && (
          <p className="text-[12px] font-medium text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 leading-relaxed mt-1 animate-fadeIn">
            {assistantMessage}
          </p>
        )}
      </div>

      {/* Option to Add simple rule manually */}
      {showAddForm ? (
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/40 flex flex-col gap-4 animate-slideDown frosted-card">
          <h3 className="text-[16px] font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">新增规则模板</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-wider">配置名称 / Rule Name (选填)</label>
              <input 
                type="text" 
                placeholder="如: 去除不规则空格"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[13px] text-white focus:bg-[#0a0c14]/80 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-wider">规则类型 / Action Type</label>
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value as any)}
                className="h-10 px-3 bg-[#0a0c14]/40 border border-white/10 rounded-xl text-[13px] text-white focus:bg-[#0a0c14]/80 outline-none cursor-pointer"
              >
                <option value="replace">查找与替换 (Find & Replace)</option>
                <option value="format">特定列格式化 (Date / Format)</option>
                <option value="watermark">附加上下文/后缀 (Append Suffix)</option>
                <option value="html">清除 HTML 标记 (Strip Tags)</option>
                <option value="ai">Gemini 智能精算操作 (Smart AI Process)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-white/60 text-[13px] px-4 py-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            >
              取消
            </button>
            <button 
              onClick={handleSaveNewRule}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
            >
              确定加入
            </button>
          </div>
        </div>
      ) : (
        /* Floating Action style trigger */
        <div className="flex justify-center w-full px-1">
          <button
            id="add-rule-btn"
            onClick={() => {
              if (!isProUser && rules.length >= 4) {
                onOpenSubscription();
              } else {
                setShowAddForm(true);
              }
            }}
            className="w-full h-14 rounded-full border border-white/10 bg-white/7 hover:bg-white/12 text-white font-semibold text-[15px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            添加新规则
          </button>
        </div>
      )}

    </div>
  );
}
