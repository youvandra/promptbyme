import React, { useState, useEffect } from 'react';
import { Save, X, Wand2 } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

interface FlowStepEditorProps {
  stepId: string;
  initialContent: string;
  initialVariables?: Record<string, string>;
  onClose: () => void;
}

export const FlowStepEditor: React.FC<FlowStepEditorProps> = ({
  stepId,
  initialContent,
  initialVariables = {},
  onClose
}) => {
  const [content, setContent] = useState(initialContent);
  const [variables, setVariables] = useState<Record<string, string>>(initialVariables);
  const [extractedVars, setExtractedVars] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateFlowStepContent } = useFlowStore();

  // Extract variables from content when it changes
  useEffect(() => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    const vars = matches.map(match => match.replace(/[{}]/g, ''));
    setExtractedVars([...new Set(vars)]);
    
    // Initialize any new variables that don't exist in the state
    const newVars = { ...variables };
    vars.forEach(v => {
      if (!newVars[v]) {
        newVars[v] = '';
      }
    });
    setVariables(newVars);
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateFlowStepContent(stepId, content, variables);
      onClose();
    } catch (error) {
      console.error('Failed to save flow step content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wand2 className="text-indigo-400" size={20} />
          Edit Flow Step
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[200px] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-y font-mono text-sm"
        />
      </div>

      {/* Variables Section */}
      {extractedVars.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-300 mb-3">
            Variables
          </h4>
          <div className="space-y-3 bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
            {extractedVars.map((varName) => (
              <div key={varName} className="flex flex-col">
                <label className="text-xs text-zinc-400 mb-1">
                  {`{{${varName}}}`}
                </label>
                <input
                  type="text"
                  value={variables[varName] || ''}
                  onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                  placeholder={`Enter value for ${varName}`}
                  className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};