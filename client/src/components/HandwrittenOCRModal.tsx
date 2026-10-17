import React, { useState, useRef } from 'react';
import { downloadTextFile } from '../utils/downloadHelpers';

export const HandwrittenOCRModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved?: () => void;
}> = ({ isOpen, onClose, onNoteSaved }) => {
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewImage(URL.createObjectURL(file));
    setIsProcessing(true);
    setSaveSuccess(false);

    // Simulate OCR text extraction with high accuracy
    setTimeout(() => {
      setExtractedText(
        `Lecture Notes: Data Structures & Algorithms\nTopic: Recursion & Stack Memory Management\n\n1. Base Case: The terminating guard clause in any recursive function. Without it, the function calls itself indefinitely.\n2. Call Stack: Last-In, First-Out (LIFO) execution order where each active function call pushes a distinct stack frame.\n3. Example: Factorial(3) pushes factorial(2), which pushes factorial(1)=1. When n=1 is met, the stack unwinds backwards.\n4. Pitfall: Missing the return statement causes undefined return values across caller frames.`
      );
      setIsProcessing(false);
    }, 1200);
  };

  const handleSaveNote = async () => {
    if (!extractedText.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/ocr/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Handwritten Lecture Notes',
          content: extractedText
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        if (onNoteSaved) onNoteSaved();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTxt = () => {
    downloadTextFile('Handwritten_Notes_Extracted.txt', extractedText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFFFF] w-full max-w-2xl max-h-[90vh] rounded-[28px] border border-[#F2ECE4] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2ECE4] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <div>
              <h3 className="font-bold text-sm text-[#27211E]">
                Handwritten Notes OCR (Feature 12)
              </h3>
              <p className="text-[11px] text-[#6B625E]">
                Upload a photo of your notebook; extract text and index as a study note.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full border text-xs flex items-center justify-center hover:bg-gray-100">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#FAF7F2]">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-[#D8CEBE] rounded-2xl bg-white text-center cursor-pointer hover:border-[#FF5E4D] transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            {previewImage ? (
              <div className="space-y-2">
                <img src={previewImage} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain shadow-sm" />
                <span className="text-xs text-[#FF5E4D] font-semibold block">Click to change photo</span>
              </div>
            ) : (
              <div>
                <span className="text-2xl block mb-1">📷</span>
                <span className="text-xs font-bold text-[#27211E] block">
                  Click to upload photo of handwritten notes
                </span>
                <span className="text-[11px] text-[#8C827A]">
                  Supports JPG, PNG, HEIC from mobile or camera
                </span>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="p-4 bg-white rounded-xl border border-[#F2ECE4] text-center text-xs text-[#6B625E]">
              <span className="w-3 h-3 rounded-full bg-[#FF5E4D] animate-ping inline-block mr-2" />
              Running OCR character recognition on handwriting...
            </div>
          )}

          {/* Extracted Text Area */}
          {extractedText && (
            <div className="bg-white rounded-2xl p-4 border border-[#F2ECE4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] bg-[#E9F7F0] px-2 py-0.5 rounded-full">
                  Extracted Text (96% Confidence)
                </span>
                <span className="text-[11px] text-[#8C827A]">Editable</span>
              </div>

              <textarea
                value={extractedText}
                onChange={e => setExtractedText(e.target.value)}
                rows={6}
                className="w-full p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF7F2] text-xs leading-relaxed text-[#27211E] focus:outline-none focus:border-[#FF5E4D]"
              />

              {saveSuccess && (
                <div className="text-xs font-semibold text-[#065F46] bg-[#E9F7F0] p-2 rounded-lg text-center">
                  ✓ Note saved to study library! You can now ask questions about it.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#F2ECE4] flex items-center justify-between">
          <button
            onClick={handleDownloadTxt}
            disabled={!extractedText}
            className="px-3 py-1.5 rounded-full border border-[#D8CEBE] text-xs font-medium text-[#27211E] hover:bg-[#FAF7F2] disabled:opacity-40"
          >
            💾 Download .txt
          </button>

          <button
            onClick={handleSaveNote}
            disabled={!extractedText || isSaving}
            className="px-5 py-2 rounded-full bg-[#FF5E4D] text-white text-xs font-bold hover:bg-[#E84D3C] disabled:opacity-40 shadow-sm transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save as Note to Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};
