import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CostDashboardData } from '../types';

interface CostIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const CostIntelligenceModal: React.FC<CostIntelligenceModalProps> = ({
  isOpen,
  onClose,
  theme = 'light'
}) => {
  const [data, setData] = useState<CostDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCacheEnabled, setIsCacheEnabled] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDashboard();
    }
  }, [isOpen]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCostDashboard();
      setData(res);
      const cacheStat = await api.getCacheStatus();
      setIsCacheEnabled(cacheStat.cacheEnabled);
    } catch (err) {
      console.error('Failed to load cost dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCache = async () => {
    try {
      const res = await api.toggleCache();
      setIsCacheEnabled(res.cacheEnabled);
      setActionMessage(res.message);
      setTimeout(() => setActionMessage(null), 3500);
      loadDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl flex flex-col transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10 ${
          isDark ? 'bg-[#0F172A]/95 border-[#334155]' : 'bg-white/95 border-[#F1F5F9]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Cost Intelligence & Model Gateway
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                  Feature 11 & 12
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Enterprise-grade token budgeting, layered response cache, and universal fingerprint reuse metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-[#1E293B] hover:bg-[#334155] text-white' : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B]'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {actionMessage && (
            <div className="p-3 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-bold flex items-center justify-between">
              <span>{actionMessage}</span>
              <span className="text-xs">Live Status Updated</span>
            </div>
          )}

          {isLoading || !data ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#64748B]">Calculating avoided cost baseline & token metrics...</p>
            </div>
          ) : (
            <>
              {/* Organization & Budget Bar */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? 'bg-[#1E293B]/60 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#06B6D4]">
                    Tenant: {data.organization.name}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold">
                      Monthly AI Budget: <span className="font-extrabold font-mono">${data.organization.monthlyBudgetUsd.toFixed(2)}</span>
                    </span>
                    <span className="text-xs text-[#64748B]">•</span>
                    <span className="text-sm font-semibold">
                      Current Spend: <span className="font-extrabold font-mono text-[#F43F5E]">${data.organization.currentSpendUsd.toFixed(2)}</span>
                    </span>
                    <span className="text-xs text-[#64748B]">•</span>
                    <span className="text-sm font-semibold">
                      Remaining: <span className="font-extrabold font-mono text-[#10B981]">${data.organization.remainingBudgetUsd.toFixed(2)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Answer Cache</span>
                    <div className="text-xs font-bold">
                      {isCacheEnabled ? (
                        <span className="text-[#10B981] flex items-center gap-1">● Active (Layers A, B, C)</span>
                      ) : (
                        <span className="text-[#F43F5E] flex items-center gap-1">○ Disabled (Model Calls Only)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleCache}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      isCacheEnabled
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25'
                        : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30 hover:bg-[#F43F5E]/25'
                    }`}
                  >
                    {isCacheEnabled ? 'Disable Cache' : 'Enable Cache'}
                  </button>
                </div>
              </div>

              {/* 4 Big KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Total AI Requests
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono">{data.kpis.totalRequests}</span>
                    <span className="text-[10px] text-[#10B981] font-bold">Live telemetry</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#64748B]">
                    In: <span className="font-mono">{data.kpis.totalTokensIn.toLocaleString()}</span> tokens | Out: <span className="font-mono">{data.kpis.totalTokensOut.toLocaleString()}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Model Expenditure
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-[#F43F5E]">
                      ${data.kpis.modelExpenditureUsd.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-[#64748B]">actual spend</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#64748B]">
                    Cost per active student: <span className="font-mono font-bold">${data.kpis.costPerActiveLearnerUsd.toFixed(4)}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[#10B981]/5 border-[#10B981]/20'
                }`}>
                  <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">
                    Avoided AI Expenditure
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-[#10B981]">
                      ${data.kpis.avoidedExpenditureUsd.toFixed(4)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                      +{data.kpis.netSavingsPercent}% saved
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#10B981]/80">
                    Calculated from documented baseline
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30' : 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                }`}>
                  <span className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider">
                    Cache Hit Rate
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-[#06B6D4]">
                      {data.cachePerformance.overallCacheHitRatePercent}%
                    </span>
                    <span className="text-[10px] text-[#06B6D4] font-bold">overall reuse</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#06B6D4]/80">
                    Exact: <span className="font-mono">{data.cachePerformance.exactCacheHitRatePercent}%</span> | Semantic: <span className="font-mono">{data.cachePerformance.semanticCacheHitRatePercent}%</span>
                  </div>
                </div>
              </div>

              {/* Latency Comparison: Cached vs Generative Model */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <h3 className="text-sm font-extrabold flex items-center justify-between">
                  <span>⚡ Latency & User Experience Impact</span>
                  <span className="text-xs font-mono font-semibold text-[#06B6D4]">
                    190x Faster Response on Cache Hit
                  </span>
                </h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#10B981]">Layer A Exact Cache Hit: {data.kpis.avgCachedLatencyMs}ms (Instant return)</span>
                      <span className="font-mono text-[#10B981]">$0.000 spent</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] dark:bg-[#334155] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#10B981] h-full rounded-full" style={{ width: '4%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#F43F5E]">Model Reasoning Miss: {data.kpis.avgModelLatencyMs}ms (Gemini / LLM generation)</span>
                      <span className="font-mono text-[#F43F5E]">$0.0035 spent</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] dark:bg-[#334155] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#F43F5E] h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Universal Document Fingerprint Section (Feature 8) */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔐</span>
                    <h3 className="text-sm font-extrabold">Universal Document Fingerprint (Content-Addressed Indexing)</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold">
                    SHA-256 Content-Addressing
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                  When two students upload the same lecture PDF or book, UNERA detects the matching SHA-256 fingerprint. Extracted text, 10 pages, OCR and embeddings are reused instantaneously—eliminating duplicate ingestion cost.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Unique Fingerprints</span>
                    <div className="text-xl font-black font-mono mt-0.5">{data.fingerprintReuseStats.uniqueDocumentsIndexed}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Artifact Reuse Events</span>
                    <div className="text-xl font-black font-mono text-[#10B981] mt-0.5">{data.fingerprintReuseStats.artifactReuseEvents}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Avoided Processing USD</span>
                    <div className="text-xl font-black font-mono text-[#10B981] mt-0.5">${data.fingerprintReuseStats.avoidedProcessingUsd}</div>
                  </div>
                </div>
              </div>

              {/* Recent Live Request Telemetry Logs */}
              <div className={`p-5 rounded-2xl border overflow-hidden ${
                isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <h3 className="text-sm font-extrabold mb-3">Live Telemetry & Cache Resolution Feed</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-[#334155] text-[#64748B] font-bold">
                        <th className="pb-2">Request Type</th>
                        <th className="pb-2">Model / Cache Layer</th>
                        <th className="pb-2">Latency</th>
                        <th className="pb-2">Cost</th>
                        <th className="pb-2">Avoided</th>
                        <th className="pb-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                      {data.recentLogs.map(log => (
                        <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-mono font-medium">{log.request_type}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              log.cache_layer_hit === 'A_EXACT'
                                ? 'bg-[#10B981]/15 text-[#10B981]'
                                : log.cache_layer_hit === 'B_SEMANTIC'
                                ? 'bg-[#06B6D4]/15 text-[#06B6D4]'
                                : log.cache_layer_hit === 'FINGERPRINT_REUSE'
                                ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]'
                                : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                            }`}>
                              {log.cache_layer_hit}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono">{log.latency_ms}ms</td>
                          <td className="py-2.5 font-mono text-[#F43F5E]">${log.cost_usd.toFixed(4)}</td>
                          <td className="py-2.5 font-mono text-[#10B981]">
                            {log.avoided_cost_usd > 0 ? `+$${log.avoided_cost_usd.toFixed(4)}` : '$0.0000'}
                          </td>
                          <td className="py-2.5 text-[#64748B]">{new Date(log.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between text-xs text-[#64748B] ${
          isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#F1F5F9]'
        }`}>
          <span>Baseline document cost: $0.015/page extraction + embedding | Baseline query: $0.0035/answer</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-xl bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors shadow-sm"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
