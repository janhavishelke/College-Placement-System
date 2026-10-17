import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ClassroomIntelligenceData, CorporateModeData, OrgSummaryData } from '../types';

interface InstitutionHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const InstitutionHubModal: React.FC<InstitutionHubModalProps> = ({
  isOpen,
  onClose,
  theme = 'light'
}) => {
  const [activeTab, setActiveTab] = useState<'classroom' | 'corporate' | 'courses'>('classroom');
  const [classroomData, setClassroomData] = useState<ClassroomIntelligenceData | null>(null);
  const [corporateData, setCorporateData] = useState<CorporateModeData | null>(null);
  const [orgData, setOrgData] = useState<OrgSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classRes, corpRes, orgRes] = await Promise.all([
        api.getClassroomIntelligence(1),
        api.getCorporateMode(),
        api.getOrgSummary(1)
      ]);
      setClassroomData(classRes);
      setCorporateData(corpRes);
      setOrgData(orgRes);
    } catch (err) {
      console.error('Failed to load institution data:', err);
    } finally {
      setIsLoading(false);
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
            <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center text-xl font-bold">
              🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Institution & Organization Intelligence Hub
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  Feature 13, 14 & 15
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Multi-tenant academic & corporate analytics with strict individual student privacy isolation
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

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex gap-2 border-b border-[#E2E8F0] dark:border-[#334155]">
          <button
            onClick={() => setActiveTab('classroom')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'classroom'
                ? 'border-[#8B5CF6] text-[#8B5CF6]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B] dark:hover:text-white'
            }`}
          >
            <span>📊</span> Classroom Intelligence (Teacher View)
          </button>
          <button
            onClick={() => setActiveTab('corporate')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'corporate'
                ? 'border-[#06B6D4] text-[#06B6D4]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B] dark:hover:text-white'
            }`}
          >
            <span>💼</span> Corporate Training & SOPs
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B] dark:hover:text-white'
            }`}
          >
            <span>📚</span> Course Packs & Shared Knowledge
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#64748B]">Aggregating classroom outcomes & privacy boundaries...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: CLASSROOM INTELLIGENCE */}
              {activeTab === 'classroom' && classroomData && (
                <div className="space-y-6">
                  {/* Privacy Safeguard Alert */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    isDark ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30' : 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                  }`}>
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#06B6D4] tracking-wider">
                          Privacy Safeguard Active (k-Anonymity = {classroomData.privacySafeguard.kAnonymityThreshold})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4]">
                          Zero Individual Surveillance
                        </span>
                      </div>
                      <p className="text-xs mt-1 text-[#64748B] dark:text-[#94A3B8]">
                        {classroomData.privacySafeguard.message} Teachers view aggregated concept bottlenecks, never raw private chat transcripts.
                      </p>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Active Course Cohort</span>
                      <div className="text-xl font-black mt-1 font-mono">{classroomData.cohortSize} Learners</div>
                      <span className="text-xs text-[#10B981] font-semibold">{classroomData.activeParticipationRatePercent}% participation</span>
                    </div>

                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Mastery Distribution</span>
                      <div className="text-sm font-bold mt-1 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#10B981]">Demonstrated:</span>
                          <span className="font-mono">{classroomData.masteryDistribution.demonstratedUnderstanding}%</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#06B6D4]">Improving:</span>
                          <span className="font-mono">{classroomData.masteryDistribution.improving}%</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#F43F5E]">Needs Practice:</span>
                          <span className="font-mono">{classroomData.masteryDistribution.needsPractice}%</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-[#64748B]">Top High-Priority Gap</span>
                      <div className="text-base font-extrabold mt-1 text-[#F43F5E]">Base Case & Termination</div>
                      <span className="text-xs text-[#F43F5E] font-semibold">68% of cohort struggled</span>
                    </div>
                  </div>

                  {/* Misunderstood Concepts Heatmap */}
                  <div className={`p-5 rounded-2xl border ${
                    isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <h3 className="text-sm font-extrabold mb-3">
                      Frequently Misunderstood Concepts & Recommended Teacher Interventions
                    </h3>
                    <div className="space-y-3">
                      {classroomData.misunderstoodConcepts.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-[#E2E8F0]'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm">{item.conceptName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.revisionPriority === 'HIGH'
                                  ? 'bg-[#F43F5E]/15 text-[#F43F5E]'
                                  : item.revisionPriority === 'MEDIUM'
                                  ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                                  : 'bg-[#10B981]/15 text-[#10B981]'
                              }`}>
                                {item.revisionPriority} PRIORITY
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                              <span className="font-semibold text-inherit">Common Error:</span> {item.commonError}
                            </p>
                            <p className="text-xs text-[#8B5CF6]">
                              <span className="font-semibold">Suggested Remedial Action:</span> {item.recommendedRemedy}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-2xl font-black font-mono text-[#F43F5E]">
                              {item.strugglingLearnersPercent}%
                            </span>
                            <div className="text-[10px] text-[#64748B] uppercase font-bold">Struggling</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CORPORATE TRAINING & SOP MODE */}
              {activeTab === 'corporate' && corporateData && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30' : 'bg-[#06B6D4]/5 border-[#06B6D4]/20'
                  }`}>
                    <div>
                      <span className="text-xs font-black uppercase text-[#06B6D4]">Corporate Compliance & SOP Hub</span>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        Internal Standard Operating Procedures, onboarding manuals, and knowledge-check completion rates
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#10B981] font-mono">
                        +${corporateData.aiCostAvoidance.totalAvoidedThroughSOPReuseUsd.toFixed(2)} Avoided
                      </span>
                      <div className="text-[10px] text-[#64748B]">SOP Answer Cache Hit Rate: {corporateData.aiCostAvoidance.cacheHitRateOnSOPQueriesPercent}%</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {corporateData.sops.map(sop => (
                      <div
                        key={sop.id}
                        className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm">{sop.title}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#334155] text-white">
                                {sop.version}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-1">
                              Most queried section: <span className="text-[#06B6D4] font-medium">{sop.mostQueriedSection}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold">
                            <div>
                              <span className="text-[#64748B]">Completion: </span>
                              <span className="text-[#10B981] font-mono font-black">{sop.completionRatePercent}%</span>
                            </div>
                            <div>
                              <span className="text-[#64748B]">Knowledge Score: </span>
                              <span className="text-[#8B5CF6] font-mono font-black">{sop.avgKnowledgeCheckScore}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: COURSE PACKS & SHARED KNOWLEDGE */}
              {activeTab === 'courses' && orgData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {orgData.courses.map(course => (
                      <div
                        key={course.id}
                        className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#8B5CF6]">{course.code}</span>
                          <span className="text-[11px] text-[#64748B]">{course.instructor_name || 'Faculty Member'}</span>
                        </div>
                        <h4 className="font-black text-sm mt-1">{course.name}</h4>
                        <p className="text-xs text-[#64748B] mt-2 line-clamp-2">{course.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-[#1E293B]/40 border-[#334155]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase text-[#64748B] mb-2">Organization Document Library</h4>
                    <div className="space-y-2">
                      {orgData.sharedDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E2E8F0] dark:border-[#334155] last:border-none">
                          <span className="font-semibold">{doc.title}</span>
                          <span className="font-mono text-[#64748B]">{doc.page_count} pages • Shared</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between text-xs text-[#64748B] ${
          isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F8FAFC] border-[#F1F5F9]'
        }`}>
          <span>Protected under FERPA / Educational Privacy & Corporate Confidentiality Standards</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors shadow-sm"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
