import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface AIWriterProps {
  caseData?: {
    id: string;
    title: string;
    findings?: string[];
    recommendation?: string;
  };
  onInsert?: (text: string) => void;
}

const SAMPLE_PROMPTS = [
  "Generate executive summary",
  "Summarize key findings",
  "List red flags detected",
  "Draft conclusion paragraph",
  "Create timeline narrative",
];

const AIWriter: React.FC<AIWriterProps> = ({ caseData, onInsert }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandPrompts, setExpandPrompts] = useState(false);

  const generateNarrative = async () => {
    setIsGenerating(true);
    setGeneratedText("");

    // Simulate AI generation with streaming effect
    const sampleOutput = `## Executive Summary

Based on the investigation of Case #${caseData?.id || "492"}, the following key findings were identified:

### Red Flags Detected
1. **Layered Transactions**: Multiple transfers between shell companies within 24-hour periods
2. **Unusual Patterns**: Transaction amounts consistently just below reporting thresholds ($9,800-$9,950)
3. **Geographic Anomalies**: IP addresses from high-risk jurisdictions accessing the primary account

### Timeline
- **November 15, 2023**: Initial suspicious activity detected by automated monitoring
- **November 18, 2023**: Secondary entity "Shell Corp LLC" identified through transaction analysis
- **November 22, 2023**: Connection to offshore banking established via wire records

### Recommendation
Based on the evidence gathered, this case warrants **escalation to compliance** for further regulatory review. The pattern of activity suggests potential structuring violations under BSA/AML guidelines.

---
*This narrative was AI-generated. Please review and edit as needed.*`;

    // Simulate streaming
    for (let i = 0; i <= sampleOutput.length; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setGeneratedText(sampleOutput.slice(0, i));
    }
    setGeneratedText(sampleOutput);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePromptClick = (p: string) => {
    setPrompt(p);
    setExpandPrompts(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          AI Narrative Writer
        </h3>
        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
          Beta
        </span>
      </div>

      {/* Input */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate, or choose from suggestions below..."
            className="w-full h-24 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white dark:bg-slate-800 text-sm"
          />
        </div>

        {/* Quick Prompts */}
        <div className="mt-3">
          <button
            onClick={() => setExpandPrompts(!expandPrompts)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-2"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${expandPrompts ? "rotate-180" : ""}`}
            />
            Quick prompts
          </button>
          {expandPrompts && (
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(p)}
                  className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={generateNarrative}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Narrative
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      {(generatedText || isGenerating) && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Generated Output
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!generatedText}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => onInsert?.(generatedText)}
                disabled={!generatedText}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                <FileText size={12} />
                Insert
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto prose prose-sm dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white">
            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {generatedText}
              {isGenerating && <span className="animate-pulse">▌</span>}
            </div>
          </div>

          {generatedText && !isGenerating && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
              <AlertTriangle
                size={14}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                AI-generated content should be reviewed for accuracy before
                inclusion in official reports.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIWriter;
