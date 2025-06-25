import { marked } from 'marked';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, Play, Copy, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowStep } from '../../store/flowStore';
import { FlowStepEditor } from './FlowStepEditor';

interface FlowStepItemProps {
  step: FlowStep;
  isExecuting: boolean;
  onExecute: (stepId: string) => void;
  onDelete: (stepId: string) => void;
  onToggleExpand: (stepId: string) => void;
}

export const FlowStepItem: React.FC<FlowStepItemProps> = ({
  step,
  isExecuting,
  onExecute,
  onDelete,
  onToggleExpand
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine if we should show the custom content or original content
  const displayContent = step.custom_content || step.prompt_content || '';
  
  // Check if content has variables
  const hasVariables = /\{\{([^}]+)\}\}/.test(displayContent);
  
  // Check if variables are filled
  const allVariablesFilled = !hasVariables || 
    (step.variables && Object.keys(step.variables).length > 0 && 
     Object.values(step.variables).every(v => v !== ''));

  const copyToClipboard = async () => {
    try {
      // Apply variables to content if they exist
      let contentToCopy = displayContent;
      if (step.variables) {
        Object.entries(step.variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          contentToCopy = contentToCopy.replace(regex, value);
        });
      }
      
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => onToggleExpand(step.id)}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded transition-colors"
          >
            {step.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm truncate">{step.step_title}</h3>
            <p className="text-zinc-500 text-xs">{step.prompt_title || 'Untitled Prompt'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={() => setShowEditor(true)}
            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
            title="Edit content"
          >
            <Edit3 size={16} />
          </button>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(step.id)}
            disabled={isExecuting}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
            title="Delete step"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Content (expanded) */}
      <AnimatePresence>
        {step.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Content */}
              <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-300">Content</h4>
                  {hasVariables && !allVariablesFilled && (
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Wand2 size={12} />
                      <span>Variables need values</span>
                    </div>
                  )}
                </div>
                <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-mono">
                  {displayContent}
                </pre>
              </div>
              
              {/* Variables (if any) */}
              {hasVariables && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-indigo-300 mb-2">Variables</h4>
                  <div className="space-y-2">
                    {Array.from(new Set(displayContent.match(/\{\{([^}]+)\}\}/g) || []))
                      .map(variable => {
                        const varName = variable.replace(/[{}]/g, '');
                        const value = step.variables?.[varName] || '';
                        return (
                          <div key={varName} className="flex items-center gap-2">
                            <span className="text-xs text-indigo-400 font-mono">{variable}</span>
                            <span className="text-xs text-zinc-500">→</span>
                            <span className="text-xs text-white bg-zinc-800/50 px-2 py-1 rounded">
                              {value || '(not set)'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              
              {/* Output (if any) */}
              {step.output && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-emerald-300 mb-2">Output</h4>
                    <div className="text-zinc-300 text-sm bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/30 max-h-[400px] overflow-y-auto prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(step.output || '') }}
                     />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl">
            <FlowStepEditor
              stepId={step.id}
              initialContent={displayContent}
              initialVariables={step.variables}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};