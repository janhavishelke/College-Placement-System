import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Upload, 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  X,
  FileCode,
  Download,
  Play
} from 'lucide-react';
import { DocumentMeta, Chunk } from '../types';
import { api } from '../services/api';
import { Screen } from '../components/LMSSidebar';

interface DocumentLibraryProps {
  onNavigate: (screen: Screen) => void;
  onOpenInWorkspace: (docId: string) => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  onNavigate,
  onOpenInWorkspace
}) => {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectingDoc, setInspectingDoc] = useState<DocumentMeta | null>(null);
  const [inspectingChunks, setInspectingChunks] = useState<Chunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgressStep('Extracting digital text and page numbers...');

    try {
      setTimeout(() => {
        setUploadProgressStep('Chunking semantic passages & indexing token keywords...');
      }, 700);

      const res = await api.uploadDocument(selectedFile);
      if (res.success) {
        setUploadProgressStep('Document indexed and locked into knowledge memory.');
        setSelectedFile(null);
        await loadDocs();
      } else {
        setUploadError('Failed to parse document: ' + (res as any).error);
      }
    } catch (err: any) {
      setUploadError('Upload error: ' + err.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgressStep('');
      }, 1000);
    }
  };

  const handleInspectDoc = async (doc: DocumentMeta) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await api.getDocumentDetails(doc.id);
      setInspectingChunks(res.chunks || []);
    } catch (e) {
      console.error('Failed to load chunks:', e);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to remove this document and its indexed passages?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto bg-[#070A12] text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg font-bold">
              <FileText className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white">
              My Notes &amp; Study Materials
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Source-locked academic notes. UNERA extracts digital text, preserves page numbers, and divides notes into searchable passages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {documents.length} Source-Locked Materials
          </span>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div 
        onDragOver={e => e.preventDefault()}
        onDrop={handleFileDrop}
        className="rounded-2xl border-2 border-dashed border-slate-800 bg-[#0C1222] p-8 text-center transition-all hover:border-violet-500/50 hover:bg-[#0E1528]"
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30 mx-auto">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Upload Course Notes or Lecture Slides
          </h3>
          <p className="text-xs text-slate-400">
            Drag and drop your PDF, DOCX, or TXT file here, or click to browse. (Max 25MB)
          </p>

          <input
            type="file"
            id="file-upload-input"
            accept=".pdf,.txt,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="pt-2 flex justify-center">
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-violet-500 hover:to-cyan-500 transition-all inline-block"
            >
              Select File to Index
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 rounded-xl bg-slate-900 p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                {uploading ? 'Processing...' : 'Start Extraction & Indexing'}
              </button>
            </div>
          )}

          {uploadProgressStep && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-cyan-400 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{uploadProgressStep}</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 text-xs text-red-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH AND DOCUMENTS DATA TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-[#0C1222] p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search uploaded documents..."
              className="w-full rounded-xl bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-violet-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredDocs.length} of {documents.length} materials
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Document Title</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Pages</th>
                <th className="py-2.5 px-3">Passages</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-violet-400 shrink-0" />
                      <div>
                        <p className="truncate max-w-sm">{doc.title}</p>
                        <p className="text-[10px] text-slate-400 font-normal line-clamp-1">{doc.summary}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 uppercase text-slate-300 font-mono">{doc.fileType}</td>
                  <td className="py-3.5 px-3 text-slate-300">{doc.pageCount}</td>
                  <td className="py-3.5 px-3 text-slate-300">{doc.chunkCount}</td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                      Indexed &amp; Ready
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleInspectDoc(doc)}
                        title="Inspect Passage Chunks"
                        className="rounded-lg bg-slate-900 p-1.5 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenInWorkspace(doc.id)}
                        className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 shadow-sm cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Learn</span>
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete Document"
                        className="rounded-lg p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* INSPECTOR MODAL */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white truncate max-w-lg">
                  {inspectingDoc.title} — Indexed Chunks
                </h3>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {loadingChunks ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading passages...</div>
              ) : inspectingChunks.length > 0 ? (
                inspectingChunks.map(chunk => (
                  <div key={chunk.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">Page {chunk.pageNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {chunk.id}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      "{chunk.text}"
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {chunk.keywords.map((k, kIdx) => (
                        <span key={kIdx} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">No passages found.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  const id = inspectingDoc.id;
                  setInspectingDoc(null);
                  onOpenInWorkspace(id);
                }}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 shadow-lg cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Open in AI Workspace</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
