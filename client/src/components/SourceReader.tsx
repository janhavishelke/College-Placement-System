import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem, PageItem } from '../types';
import { api } from '../services/api';

interface SourceReaderProps {
  documents: DocumentItem[];
  selectedDocId: number;
  currentPageNo: number;
  highlightExcerpt?: string | null;
  onPageChange: (pageNo: number) => void;
  onDocChange: (docId: number) => void;
  onUploadSuccess: (newDoc: DocumentItem) => void;
  onAskAboutSelection?: (selectedText: string) => void;
  theme?: 'light' | 'dark';
}

export const SourceReader: React.FC<SourceReaderProps> = ({
  documents,
  selectedDocId,
  currentPageNo,
  highlightExcerpt,
  onPageChange,
  onDocChange,
  onUploadSuccess,
  onAskAboutSelection,
  theme = 'light'
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [userHighlights, setUserHighlights] = useState<string[]>([]);
  const [uploadNotification, setUploadNotification] = useState<{
    reused: boolean;
    message: string;
    sha256?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadPages(selectedDocId);
  }, [selectedDocId]);

  const loadPages = async (docId: number) => {
    setIsLoading(true);
    try {
      const res = await api.getDocumentPages(docId);
      setPages(res.pages || []);
    } catch (err) {
      console.error('Failed to load document pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newDoc = await api.uploadDocument(file);
      onUploadSuccess(newDoc);
      onDocChange(newDoc.id);
      onPageChange(1);

      if (newDoc.fingerprint) {
        setUploadNotification({
          reused: newDoc.fingerprint.reused,
          message: newDoc.fingerprint.message,
          sha256: newDoc.fingerprint.sha256
        });
        setTimeout(() => setUploadNotification(null), 6000);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 5) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText('');
    }
  };

  const handleAddHighlight = () => {
    if (selectedText && !userHighlights.includes(selectedText)) {
      setUserHighlights([...userHighlights, selectedText]);
      setSelectedText('');
    }
  };

  const currentPage = pages.find(p => p.page_no === currentPageNo) || pages[0];
  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const isDark = theme === 'dark';

  // Helper to render text with highlight sweeps and user highlights
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;

    if (highlightExcerpt && text.includes(highlightExcerpt)) {
      const parts = text.split(highlightExcerpt);
      return (
        <span>
          {parts[0]}
          <mark className="citation-highlight-sweep font-medium text-inherit rounded px-1 bg-[#FDE68A] text-[#1E293B]">
            {highlightExcerpt}
          </mark>
          {parts.slice(1).join(highlightExcerpt)}
        </span>
      );
    }

    return text;
  };

  return (
    <div className={`w-full rounded-3xl border p-4 shadow-sm flex flex-col h-full transition-colors ${
      isDark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#F2ECE4]'
    }`}>
      {/* Top Document Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 ${
        isDark ? 'border-[#334155]' : 'border-[#F2ECE4]'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <h3 className="font-bold text-sm text-inherit">
              Source Reader
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] font-bold">
              Feature 1
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Strict Source Grounding • Interactive Excerpt Highlighting
          </p>
        </div>

        {/* Document Switcher & Upload */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDocId}
            onChange={e => {
              const id = parseInt(e.target.value, 10);
              onDocChange(id);
              onPageChange(1);
            }}
            className={`px-3 py-1.5 text-xs rounded-full border outline-none font-medium ${
              isDark ? 'bg-[#0F172A] border-[#334155] text-white' : 'bg-[#FAF7F2] border-[#D8CEBE] text-[#27211E]'
            }`}
          >
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.page_count} p.)
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.docx,.pptx,.png,.jpg,.jpeg"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            title="Upload PDF, DOCX, PPTX, or Notes"
          >
            <span>{isUploading ? '⚙️' : '+'}</span>
            <span>{isUploading ? 'Hashing...' : 'Upload Notes'}</span>
          </button>
        </div>
      </div>

      {/* Universal Fingerprint Reuse Toast Notification */}
      {uploadNotification && (
        <div className={`mb-3 p-3 rounded-2xl border text-xs font-medium animate-fadeIn ${
          uploadNotification.reused
            ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
            : 'bg-[#06B6D4]/15 border-[#06B6D4]/30 text-[#06B6D4]'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <span>{uploadNotification.reused ? '⚡ Artifact Reuse' : '🔐 Content Indexed'}</span>
              <span className="text-[10px] font-mono opacity-80 font-normal">
                ({uploadNotification.sha256?.slice(0, 10)}...)
              </span>
            </span>
            <button onClick={() => setUploadNotification(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
          <p className="mt-1 leading-snug">{uploadNotification.message}</p>
        </div>
      )}

      {/* Page Navigation Toolbar */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border mb-3 text-xs ${
        isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FAF7F2] border-[#F2ECE4]'
      }`}>
        <span className="font-semibold truncate max-w-[220px]">
          {currentDoc?.title || 'Lecture Notes'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPageNo - 1))}
            disabled={currentPageNo <= 1}
            className={`px-2 py-0.5 rounded border disabled:opacity-30 transition-colors font-medium ${
              isDark ? 'border-[#334155] hover:bg-[#1E293B]' : 'border-[#D8CEBE] hover:bg-[#F2ECE4]'
            }`}
          >
            ← Prev
          </button>
          <span className="font-mono font-bold text-[#FF5E4D]">
            Page {currentPageNo} / {pages.length || 1}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pages.length, currentPageNo + 1))}
            disabled={currentPageNo >= pages.length}
            className={`px-2 py-0.5 rounded border disabled:opacity-30 transition-colors font-medium ${
              isDark ? 'border-[#334155] hover:bg-[#1E293B]' : 'border-[#D8CEBE] hover:bg-[#F2ECE4]'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Floating Selection Tooltip when student highlights text */}
      {selectedText && (
        <div className="mb-2 p-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl flex items-center justify-between text-xs animate-fadeIn text-[#92400E]">
          <span className="truncate max-w-[240px] font-medium">
            Highlighted: "{selectedText.slice(0, 36)}..."
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddHighlight}
              className="px-2.5 py-1 rounded-xl bg-[#FDE047] text-[#854D0E] font-bold hover:bg-[#FACC15] transition-colors"
            >
              Highlight
            </button>
            {onAskAboutSelection && (
              <button
                onClick={() => {
                  onAskAboutSelection(selectedText);
                  setSelectedText('');
                }}
                className="px-2.5 py-1 rounded-xl bg-[#FF5E4D] text-white font-bold hover:bg-[#E84D3C] transition-colors shadow-sm"
              >
                Ask Tutor About This
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page Content Reader */}
      <div
        onMouseUp={handleMouseUp}
        className={`flex-1 rounded-2xl p-4 border overflow-y-auto leading-relaxed text-xs sm:text-sm select-text min-h-[300px] font-sans ${
          isDark ? 'bg-[#0F172A] border-[#334155] text-[#CBD5E1]' : 'bg-[#FAF7F2] border-[#F2ECE4] text-[#27211E]'
        }`}
      >
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-[#64748B]">
            Loading page text...
          </div>
        ) : currentPage ? (
          <div className="whitespace-pre-wrap">
            {renderHighlightedContent(currentPage.text)}
          </div>
        ) : (
          <div className="text-[#64748B] italic text-center py-8">
            No page text available.
          </div>
        )}
      </div>

      {/* Excerpt Callout if highlighted by citation click */}
      {highlightExcerpt && (
        <div className={`mt-3 p-3 rounded-2xl border-l-4 border-[#FF5E4D] text-xs transition-colors ${
          isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#FAF3EC] border-[#F2ECE4]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[#FF5E4D] flex items-center gap-1">
              <span>📍</span> Active Verified Citation Excerpt:
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">Page {currentPageNo}</span>
          </div>
          <span className="italic font-serif leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
            "{highlightExcerpt}"
          </span>
        </div>
      )}
    </div>
  );
};
