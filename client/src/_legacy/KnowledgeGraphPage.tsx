import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Search, 
  Filter, 
  CheckCircle2, 
  BrainCircuit, 
  AlertCircle, 
  Play, 
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { KnowledgeGraphNode, KnowledgeGraphLink, MasteryStatus } from '../types';
import { Screen } from '../components/LMSSidebar';
import { api } from '../services/api';

interface KnowledgeGraphPageProps {
  onNavigate: (screen: Screen) => void;
  onOpenInWorkspace: (conceptName: string) => void;
  onStartQuizForConcept: (conceptName: string) => void;
}

export const KnowledgeGraphPage: React.FC<KnowledgeGraphPageProps> = ({
  onNavigate,
  onOpenInWorkspace,
  onStartQuizForConcept
}) => {
  const [nodes, setNodes] = useState<KnowledgeGraphNode[]>([]);
  const [links, setLinks] = useState<KnowledgeGraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeGraphNode | null>(null);
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const res = await api.getKnowledgeGraph();
      if (res.nodes && res.links) {
        setNodes(res.nodes);
        setLinks(res.links);
        setSelectedNode(res.nodes[0]);
      }
    } catch (e) {
      console.error('Failed to load knowledge graph:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = nodes.filter(n => {
    const matchesCourse = activeCourseFilter === 'all' || n.course === activeCourseFilter;
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const getConnectedLinks = (nodeId: string) => {
    return links.filter(l => l.source === nodeId || l.target === nodeId);
  };

  const getMasteryColor = (status: MasteryStatus) => {
    switch (status) {
      case 'Demonstrated': return '#10B981';
      case 'Developing': return '#06B6D4';
      case 'Needs Review': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Academic Knowledge Graph
              </h1>
              <p className="text-xs text-slate-400">
                Multi-subject neural node representation of concepts, invariants, and prerequisites.
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concept nodes..."
              className="rounded-xl bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
            {['all', 'CS301', 'CS201', 'CS401', 'MATH301'].map(course => (
              <button
                key={course}
                onClick={() => setActiveCourseFilter(course)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  activeCourseFilter === course
                    ? 'bg-violet-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {course === 'all' ? 'All' : course}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Graph Canvas + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive SVG Node Visualizer (Left 8 Columns) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Demonstrated</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Developing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Needs Review</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Click node to inspect syllabus links
            </span>
          </div>

          {/* SVG Graph View */}
          <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 780 500">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Links */}
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const isConnected = selectedNode && (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);

                return (
                  <g key={idx}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isConnected ? '#38BDF8' : 'rgba(139, 92, 246, 0.25)'}
                      strokeWidth={isConnected ? 2 : 1}
                      strokeDasharray={isConnected ? 'none' : '4, 4'}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const color = getMasteryColor(node.mastery);
                const radius = isSelected ? 24 : 18;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    {/* Pulsing halo for selected node */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius * 1.6}
                        fill={color}
                        opacity={0.2}
                        className="animate-ping"
                      />
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill="#0C1222"
                      stroke={isSelected ? '#FFFFFF' : color}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Node Core */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius * 0.45}
                      fill={color}
                    />

                    {/* Node Text Label */}
                    <text
                      x={node.x}
                      y={node.y + radius + 14}
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#94A3B8'}
                      fontSize={isSelected ? '11px' : '9.5px'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="system-ui"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

        </div>

        {/* Node Inspector Panel (Right 4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-5">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {selectedNode.course} • {selectedNode.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    {selectedNode.label}
                  </h3>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${getMasteryColor(selectedNode.mastery)}20`,
                    color: getMasteryColor(selectedNode.mastery)
                  }}
                >
                  {selectedNode.mastery}
                </span>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Concept Dependencies &amp; Prerequisites:
                </span>
                <div className="space-y-1.5">
                  {getConnectedLinks(selectedNode.id).map((l, idx) => {
                    const otherId = l.source === selectedNode.id ? l.target : l.source;
                    const otherNode = nodes.find(n => n.id === otherId);
                    if (!otherNode) return null;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedNode(otherNode)}
                        className="cursor-pointer p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="text-slate-200 font-semibold">{otherNode.label}</span>
                        <span className="text-[10px] text-cyan-400 font-mono capitalize">
                          {l.relationship.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => onOpenInWorkspace(selectedNode.label)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-cyan-500 transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Explore "{selectedNode.label}" in AI Workspace</span>
                </button>

                <button
                  onClick={() => onStartQuizForConcept(selectedNode.label)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Verify Understanding with Quiz</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              <Info className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p>Select any concept node in the knowledge network to inspect relationships.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
