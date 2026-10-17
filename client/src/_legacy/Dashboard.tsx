import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Play, 
  FileText, 
  TrendingUp, 
  GraduationCap, 
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Flame,
  Award,
  CalendarCheck,
  Compass,
  Cpu,
  BookCheck,
  Zap
} from 'lucide-react';
import { DocumentMeta, DoubtRecord, AssessmentRecord, AcademicCourse, AcademicExam, AssignmentDeadline } from '../types';
import { Screen } from '../components/LMSSidebar';
import { CalendarWidget } from '../components/CalendarWidget';
import { ProgressDonutWidget } from '../components/ProgressDonutWidget';
import { RevisionScheduleWidget } from '../components/RevisionScheduleWidget';
import { api } from '../services/api';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onOpenDocument: (docId: string) => void;
  onStartQuizForConcept: (conceptName: string, docId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenDocument,
  onStartQuizForConcept
}) => {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [doubts, setDoubts] = useState<DoubtRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [academicData, setAcademicData] = useState<{
    courses: AcademicCourse[];
    upcomingExams: AcademicExam[];
    assignmentDeadlines: AssignmentDeadline[];
  } | null>(null);
  const [academicTier, setAcademicTier] = useState<'University' | 'Junior College' | 'Senior High'>('University');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, doubtsRes, assessRes, acadRes] = await Promise.all([
        api.getDocuments(),
        api.getDoubts(),
        api.getAssessmentHistory(),
        api.getAcademicOverview()
      ]);
      setDocuments(docsRes.documents || []);
      setDoubts(doubtsRes.doubts || []);
      setAssessments(assessRes.assessments || []);
      setAcademicData(acadRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const needsReviewCount = doubts.filter(d => d.status === 'Needs Review').length;
  const demonstratedCount = doubts.filter(d => d.status === 'Demonstrated').length;
  const learningCount = doubts.filter(d => d.status === 'Learning').length;

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#070A12] text-slate-100 min-h-screen">
      
      {/* 1. Academic Header & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-r from-[#0E1528] via-[#131D38] to-[#0D182E] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                <span>UNERA Institute of Science &amp; Technology</span>
              </span>

              {/* Tier Switcher for School / Junior College / University */}
              <div className="inline-flex items-center rounded-lg bg-slate-900/80 p-0.5 border border-slate-700/80 text-[11px]">
                {(['University', 'Junior College', 'Senior High'] as const).map(tier => (
                  <button
                    key={tier}
                    onClick={() => setAcademicTier(tier)}
                    className={`px-2.5 py-0.5 rounded-md transition-all ${
                      academicTier === tier
                        ? 'bg-violet-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, Alex Rivera
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {academicTier === 'University' && 'Senior Term • B.Tech Computer Science & Engineering (Semester 5). GPA: 3.88'}
              {academicTier === 'Junior College' && 'Advanced Placement & College Prep • STEM Core Track'}
              {academicTier === 'Senior High' && 'Senior High Honours • Accelerated Science & Mathematics Program'}
              <br />
              <span className="text-cyan-400 font-semibold">{demonstratedCount} verified concepts mastered</span> across your syllabus. <strong className="text-amber-400">{needsReviewCount} doubts</strong> due for active recall today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('workspace')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-cyan-500 transition-all hover:scale-102 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume AI Workspace</span>
            </button>
            <button
              onClick={() => onNavigate('verification')}
              className="flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-3 text-xs font-semibold text-slate-200 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Practice Exam Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Academic KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div 
          onClick={() => onNavigate('documents')}
          className="cursor-pointer rounded-2xl border border-violet-500/20 bg-[#0C1222]/90 p-5 backdrop-blur-md transition-all hover:border-violet-500/40 hover:-translate-y-0.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses &amp; Materials</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{academicData?.courses.length || 5}</span>
            <span className="text-xs text-slate-400">Courses • {documents.length} Docs</span>
          </div>
          <p className="mt-2 text-[11px] text-cyan-400 flex items-center gap-1 font-semibold">
            <span>All notes source-locked</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => onNavigate('progress')}
          className="cursor-pointer rounded-2xl border border-emerald-500/20 bg-[#0C1222]/90 p-5 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:-translate-y-0.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mastery Demonstrated</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{demonstratedCount}</span>
            <span className="text-xs text-slate-400">/ {doubts.length} Concepts</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-400 font-semibold">
            86% syllabus retention rate
          </p>
        </div>

        {/* KPI 3 */}
        <div 
          onClick={() => onNavigate('doubts')}
          className="cursor-pointer rounded-2xl border border-amber-500/20 bg-[#0C1222]/90 p-5 backdrop-blur-md transition-all hover:border-amber-500/40 hover:-translate-y-0.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doubt Memory</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30">
              <BrainCircuit className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{needsReviewCount}</span>
            <span className="text-xs text-slate-400">Needs Review</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-400 font-semibold">
            {needsReviewCount > 0 ? 'Scheduled for review today' : 'All doubts resolved!'}
          </p>
        </div>

        {/* KPI 4 */}
        <div 
          onClick={() => onNavigate('study_planner')}
          className="cursor-pointer rounded-2xl border border-cyan-500/20 bg-[#0C1222]/90 p-5 backdrop-blur-md transition-all hover:border-cyan-500/40 hover:-translate-y-0.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Examination</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400 ring-1 ring-cyan-500/30">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">4</span>
            <span className="text-xs text-slate-400">Days Remaining</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            CS301: OS &amp; Concurrency Mid-Term
          </p>
        </div>

      </div>

      {/* 3. Main Dashboard Grid: Courses & Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Columns: Courses, Upcoming Exams, and Recent Sessions */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Courses & Subjects Overview (Requirement 4) */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookCheck className="h-5 w-5 text-violet-400" />
                <h2 className="text-base font-bold text-white">
                  My Courses &amp; Subjects
                </h2>
              </div>
              <span className="text-xs text-slate-400">Semester 5 • 18.0 Credits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(academicData?.courses || []).map(course => (
                <div
                  key={course.code}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        {course.code}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{course.instructor}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-300">{course.credits} Credits</span>
                  </div>

                  {/* Syllabus Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Syllabus Mastery</span>
                      <span className="font-semibold text-white">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-800/60">
                    <span className="text-slate-400">Exam in <strong className="text-white">{course.daysUntilExam}d</strong></span>
                    {course.documentId ? (
                      <button
                        onClick={() => onOpenDocument(course.documentId!)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Notes</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-slate-500 italic">No notes attached</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Examinations & Assignment Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upcoming Examinations */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Upcoming Examinations
                  </h3>
                </div>
                <button onClick={() => onNavigate('study_planner')} className="text-[11px] text-violet-400 hover:underline">
                  Planner →
                </button>
              </div>

              <div className="space-y-2.5">
                {(academicData?.upcomingExams || []).map(exam => (
                  <div key={exam.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{exam.courseCode}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        exam.daysLeft <= 4 
                          ? 'bg-red-950/60 text-red-400 border-red-800/40 animate-pulse' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {exam.daysLeft} Days Left
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">{exam.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{exam.type}</span>
                      <span>Weight: {exam.weight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Deadlines */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Assignment Deadlines
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Academic Term</span>
              </div>

              <div className="space-y-2.5">
                {(academicData?.assignmentDeadlines || []).map(asgn => (
                  <div key={asgn.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{asgn.courseCode}</span>
                      <span className="text-[10px] text-amber-400 font-semibold">{asgn.dueDate}</span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{asgn.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Status: {asgn.status}</span>
                      <span className="text-slate-300">{asgn.priority} Priority</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Uploaded Study Documents Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Uploaded Study Materials
                </h3>
              </div>
              <button
                onClick={() => onNavigate('documents')}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                Manage Library ({documents.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Document Title</th>
                    <th className="py-2.5 px-3">Pages</th>
                    <th className="py-2.5 px-3">Passages</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <FileText className="h-4 w-4 text-violet-400 shrink-0" />
                          <span className="truncate max-w-xs">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{doc.pageCount}</td>
                      <td className="py-3 px-3 text-slate-300">{doc.chunkCount}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                          Source-Locked
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenDocument(doc.id)}
                          className="rounded-lg bg-violet-600/30 px-3 py-1.5 text-[11px] font-bold text-violet-300 border border-violet-500/30 hover:bg-violet-600 hover:text-white transition-all cursor-pointer"
                        >
                          Learn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 4 Columns: Interactive Widgets & Tools */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Shortcuts */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] p-5 shadow-xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Interactive Tools
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('knowledge_graph')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 text-center transition-all cursor-pointer group"
              >
                <BrainCircuit className="h-5 w-5 text-violet-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Knowledge Graph</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Explore Nodes</span>
              </button>

              <button
                onClick={() => onNavigate('study_planner')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-center transition-all cursor-pointer group"
              >
                <Compass className="h-5 w-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">AI Study Plan</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Countdown</span>
              </button>

              <button
                onClick={() => onNavigate('voice_tutor')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 text-center transition-all cursor-pointer group"
              >
                <Zap className="h-5 w-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Voice Classroom</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Live Waveform</span>
              </button>

              <button
                onClick={() => onNavigate('verification')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-center transition-all cursor-pointer group"
              >
                <Award className="h-5 w-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">Smart Quiz</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Rubric Tests</span>
              </button>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-4 shadow-xl">
            <CalendarWidget onSelectDate={(date) => console.log('Selected date:', date)} />
          </div>

          {/* Mastery Donut Widget */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-4 shadow-xl">
            <ProgressDonutWidget
              demonstrated={demonstratedCount}
              developing={learningCount}
              needsReview={needsReviewCount}
              onNavigate={onNavigate}
            />
          </div>

          {/* Revision Checklist */}
          <div className="rounded-2xl border border-slate-800 bg-[#0C1222]/90 p-4 shadow-xl">
            <RevisionScheduleWidget
              doubts={doubts}
              onStartQuiz={(concept, docId) => onStartQuizForConcept(concept, docId)}
              onNavigate={onNavigate}
            />
          </div>

        </div>

      </div>

    </div>
  );
};
