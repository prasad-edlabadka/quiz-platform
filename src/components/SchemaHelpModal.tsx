import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface SchemaHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaHelpModal: React.FC<SchemaHelpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const exampleJson = `{
  "id": "quiz_01",
  "title": "My Quiz",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "content": "Question text...",
      "options": [
        { "id": "o1", "content": "Option A", "isCorrect": true },
        { "id": "o2", "content": "Option B", "isCorrect": false }
      ]
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exampleJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quiz JSON Schema</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>Structure your JSON file according to the schema below. The <code>questions</code> array is required.</p>

              <h4 className="text-gray-900 font-semibold mt-4 mb-2">Required Fields</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>id</code> (string): Unique identifier</li>
                <li><code>title</code> (string): Quiz title</li>
                <li><code>questions</code> (array): List of Question objects</li>
              </ul>

              <h4 className="text-gray-900 font-semibold mt-4 mb-2">Question Object</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>type</code>: "single_choice" | "multiple_choice"</li>
                <li><code>content</code>: Question text (supports Markdown)</li>
                <li><code>options</code>: Array of options having <code>id</code>, <code>content</code>, and <code>isCorrect</code></li>
                <li><code>imageUrl</code> (optional): URL string for image</li>
                <li><code>justification</code> (optional): Explanation text</li>
              </ul>

              <div className="mt-6">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="text-gray-900 font-semibold m-0">Minimal Example</h4>
                    <button 
                        onClick={handleCopy}
                        className={clsx(
                            "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors border",
                            copied ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy JSON"}
                    </button>
                 </div>
                 <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {exampleJson}
                 </pre>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
