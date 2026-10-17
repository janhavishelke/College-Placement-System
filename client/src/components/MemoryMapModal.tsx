import React, { useRef } from 'react';
import { downloadPngFromDataUrl, downloadPdfFile } from '../utils/downloadHelpers';

interface MindmapNode {
  id: string;
  name: string;
  pageNo: number;
  status: 'red' | 'green' | 'grey'; // red: needs review, green: mastered, grey: unvisited
  note: string;
  children?: MindmapNode[];
}

const MINDMAP_DATA: MindmapNode = {
  id: 'root',
  name: 'Program Execution & Recursion',
  pageNo: 1,
  status: 'green',
  note: 'Mastery overview',
  children: [
    {
      id: 'fn',
      name: 'Functions & Scope (p.1)',
      pageNo: 1,
      status: 'green',
      note: 'Mastered'
    },
    {
      id: 'stack',
      name: 'The Call Stack (p.4)',
      pageNo: 4,
      status: 'green',
      note: 'LIFO Structure',
      children: [
        {
          id: 'frame',
          name: 'Stack Frame (p.5)',
          pageNo: 5,
          status: 'grey',
          note: 'Parameters & local state'
        },
        {
          id: 'overflow',
          name: 'Stack Overflow (p.6)',
          pageNo: 6,
          status: 'red',
          note: 'Needs review: memory bounds'
        }
      ]
    },
    {
      id: 'rec',
      name: 'Recursion (p.2)',
      pageNo: 2,
      status: 'green',
      note: 'Calls smaller subproblems',
      children: [
        {
          id: 'base',
          name: 'Base Case (p.3)',
          pageNo: 3,
          status: 'red',
          note: 'Needs review: terminating condition'
        },
        {
          id: 'trace',
          name: 'Factorial(3) Trace (p.7)',
          pageNo: 7,
          status: 'green',
          note: 'Stack unwinding'
        }
      ]
    }
  ]
};

export const MemoryMapModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage: (pageNo: number) => void;
}> = ({ isOpen, onClose, onJumpToPage }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    // Render tree to canvas
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, 900, 540);

    ctx.fillStyle = '#27211E';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('UNERA — Memory Map & Topic Mindmap', 40, 50);

    ctx.fillStyle = '#6B625E';
    ctx.font = '13px sans-serif';
    ctx.fillText('Red = Needs Review  |  Green = Mastered  |  Grey = Unvisited', 40, 80);

    // Draw tree boxes
    function drawNode(x: number, y: number, text: string, status: string) {
      ctx!.fillStyle = status === 'green' ? '#E9F7F0' : status === 'red' ? '#FEE2E2' : '#F3F4F6';
      ctx!.strokeStyle = status === 'green' ? '#10B981' : status === 'red' ? '#EF4444' : '#9CA3AF';
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.roundRect(x, y, 220, 50, 10);
      ctx!.fill();
      ctx!.stroke();

      ctx!.fillStyle = '#27211E';
      ctx!.font = 'bold 12px sans-serif';
      ctx!.fillText(text, x + 15, y + 30);
    }

    drawNode(340, 120, 'Recursion & Call Stack (p.1-10)', 'green');
    drawNode(80, 240, 'Call Stack (p.4)', 'green');
    drawNode(80, 320, 'Stack Frame (p.5)', 'grey');
    drawNode(80, 400, 'Stack Overflow (p.6)', 'red');

    drawNode(600, 240, 'Recursion (p.2)', 'green');
    drawNode(600, 320, 'Base Case (p.3)', 'red');
    drawNode(600, 400, 'Factorial Trace (p.7)', 'green');

    const dataUrl = canvas.toDataURL('image/png');
    downloadPngFromDataUrl(dataUrl, 'Unera_Memory_Map.png');
  };

  const handleDownloadPdf = () => {
    const html = `
      <div class="card">
        <h3>Topic Hierarchy & Mastery State</h3>
        <p><strong>Color Legend:</strong> <span style="color:#065f46">Green: Mastered</span> | <span style="color:#991b1b">Red: Needs Review</span> | <span>Grey: Unvisited</span></p>
        <ul>
          <li><strong>Recursion (p.2)</strong> — <span style="color:#065f46">Mastered</span>
            <ul>
              <li><strong>Base Case (p.3)</strong> — <span style="color:#991b1b">Needs Review (Unresolved Doubt)</span></li>
              <li><strong>Factorial Trace (p.7-8)</strong> — <span style="color:#065f46">Mastered</span></li>
            </ul>
          </li>
          <li><strong>The Call Stack (p.4)</strong> — <span style="color:#065f46">Mastered</span>
            <ul>
              <li><strong>Stack Frame (p.5)</strong> — <span>Unvisited</span></li>
              <li><strong>Stack Overflow (p.6)</strong> — <span style="color:#991b1b">Needs Review</span></li>
            </ul>
          </li>
        </ul>
      </div>
    `;
    downloadPdfFile("UNERA Concept Memory Map", html, "Unera_Memory_Map.pdf");
  };

  const renderNode = (node: MindmapNode) => {
    const statusBg =
      node.status === 'green'
        ? 'bg-[#E9F7F0] border-[#A7F3D0] text-[#065F46]'
        : node.status === 'red'
        ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
        : 'bg-[#F3F4F6] border-[#D1D5DB] text-[#4B5563]';

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          onClick={() => {
            onJumpToPage(node.pageNo);
            onClose();
          }}
          className={`px-4 py-3 rounded-2xl border shadow-sm cursor-pointer hover:scale-105 transition-all text-xs font-semibold ${statusBg}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                node.status === 'green' ? 'bg-[#10B981]' : node.status === 'red' ? 'bg-[#EF4444]' : 'bg-[#9CA3AF]'
              }`}
            />
            <span>{node.name}</span>
          </div>
          <span className="text-[10px] opacity-80 block mt-0.5">{node.note}</span>
        </div>

        {node.children && (
          <div className="flex gap-6 mt-6 relative">
            {node.children.map(c => renderNode(c))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-4xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <h3 className="font-bold text-sm text-[#27211E]">
              Memory Map / Topic Mindmap (Feature 8)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              className="px-3 py-1 text-xs rounded-full bg-white border border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4] font-medium"
            >
              🖼 Download PNG
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1 text-xs rounded-full bg-white border border-[#D8CEBE] text-[#27211E] hover:bg-[#F2ECE4] font-medium"
            >
              📄 Download PDF
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100">
              ✕
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-2 bg-[#FAF7F2] border-b border-[#F2ECE4] flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-[#065F46]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Green: Mastered
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#991B1B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Red: Needs Review
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#6B7280]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]" /> Grey: Unvisited
          </span>
          <span className="ml-auto text-[10px] text-[#8C827A]">
            Click any node to jump to note passage
          </span>
        </div>

        {/* Mindmap Interactive Canvas */}
        <div
          ref={mapContainerRef}
          className="flex-1 overflow-auto p-8 bg-[#FAF7F2] flex items-center justify-center min-h-[400px]"
        >
          {renderNode(MINDMAP_DATA)}
        </div>
      </div>
    </div>
  );
};
