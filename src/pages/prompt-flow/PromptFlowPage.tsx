import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { 
  Menu,
  AlertTriangle,
  Plus, 
  Settings,
  Edit,
  Play, 
  Save, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Copy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '../../components/ui/Toast';
import { BoltBadge } from '../../components/ui/BoltBadge';
import { SideNavbar } from '../../components/navigation/SideNavbar';
import { PromptSelectionModal } from '../../components/prompts/PromptSelectionModal';
import { FlowApiSettingsModal } from '../../components/prompt-flow/FlowApiSettingsModal';
import { FlowManagementModal } from '../../components/prompt-flow/FlowManagementModal';
import { FlowStepItem } from '../../components/prompt-flow/FlowStepItem';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { CustomSelect, SelectOption } from '../../components/ui/CustomSelect';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuthStore } from '../../store/authStore';
import { useFlowStore, FlowStep } from '../../store/flowStore';
import { UpgradeMessage } from '../../components/subscription/UpgradeMessage';

export const PromptFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [showUnsetVariablesConfirmModal, setShowUnsetVariablesConfirmModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const { isProOrHigher, loading: subscriptionLoading } = useSubscription();
  const [showFlowManagementModal, setShowFlowManagementModal] = useState(false);
  
  const { user, loading: authLoading } = useAuthStore();
  const { 
    flows, 
    selectedFlow,
    loading, 
    executing,
    apiSettings,
    fetchFlows, 
    selectFlow,
    createFlow,
    addStep,
    deleteStep,
    reorderStep,
    executeFlow,
    executeStep,
    clearOutputs,
    updateApiSettings
  } = useFlowStore();

  // Load flows on mount
  useEffect(() => {
    if (user) {
      fetchFlows();
    }
  }, [user, fetchFlows]);

  // Select first flow if none selected
  useEffect(() => {
    if (!loading && flows.length > 0 && !selectedFlow) {
      // Find flows that belong to the current user
      const userFlows = flows.filter(flow => flow.user_id === user?.id)
      
      if (userFlows.length > 0) {
        selectFlow(userFlows[0].id)
        setSelectedFlowId(userFlows[0].id)
      }
    }
  }, [loading, flows, selectedFlow, selectFlow, user])

  // Update selectedFlowId when selectedFlow changes
  useEffect(() => {
    if (selectedFlow) {
      setSelectedFlowId(selectedFlow.id);
    }
  }, [selectedFlow]);

  // Reset selected flow when user changes
  useEffect(() => {
    if (user && selectedFlow && selectedFlow.user_id !== user.id) {
      // Reset selection if the current flow doesn't belong to the user
      setSelectedFlowId(null)
    }
  }, [user, selectedFlow])

  // Helper function to extract variables from content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, ''));
  };

  // Check if a step has unset variables
  const hasUnsetVariables = (step: FlowStep): boolean => {
    const content = step.custom_content || step.prompt_content || '';
    const variables = extractVariables(content);
    
    if (variables.length === 0) return false;
    
    return variables.some(variable => {
      return !step.variables || !step.variables[variable] || step.variables[variable].trim() === '';
    });
  };

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    
    setIsCreating(true);
    try {
      const flow = await createFlow(
        newFlowName.trim(), 
        newFlowDescription.trim() || undefined
      );
      setShowCreateFlow(false);
      setNewFlowName('');
      setNewFlowDescription('');
      setToast({ message: 'Flow created successfully', type: 'success' });
      
      // Select the new flow
      selectFlow(flow.id);
      setSelectedFlowId(flow.id);
    } catch (error) {
      console.error('Failed to create flow:', error);
      setToast({ message: 'Failed to create flow', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFlowChange = (flowId: string) => {
    selectFlow(flowId);
    setSelectedFlowId(flowId);
    clearOutputs();
  };

  const handleAddPrompt = async (prompt: any) => {
    if (!selectedFlow) return;
    
    try {
      await addStep(
        selectedFlow.id,
        prompt.id,
        prompt.title || 'Untitled Prompt',
        prompt.content
      );
      setToast({ message: 'Step added successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to add step:', error);
      setToast({ message: 'Failed to add step', type: 'error' });
    }
  };

  const handleExecuteFlow = async () => {
    if (!selectedFlow) return;

    // Check if any step has unset variables
    const stepsWithUnsetVariables = selectedFlow.steps.filter(hasUnsetVariables);
    
    if (stepsWithUnsetVariables.length > 0) {
      // Show confirmation modal instead of blocking execution
      setShowUnsetVariablesConfirmModal(true);
      return;
    }
    
    try {
      await executeFlow(selectedFlow.id);
      setToast({ message: 'Flow executed successfully', type: 'success' });
    } catch (error: any) {
      console.error('Failed to execute flow:', error);
      setToast({ message: error.message || 'Failed to execute flow', type: 'error' });
    }
  };

  // Handle confirmation to run flow anyway with unset variables
  const handleConfirmRunAnyway = async () => {
    setShowUnsetVariablesConfirmModal(false);
    if (selectedFlow) {
      await executeFlow(selectedFlow.id);
    }
  };

  const handleExecuteStep = async (stepId: string) => {
    try {
      const step = selectedFlow?.steps.find(s => s.id === stepId);
      if (!step) throw new Error('Step not found');
      
      // Mark step as running
      const updatedSteps = selectedFlow?.steps.map(s => 
        s.id === stepId ? { ...s, isRunning: true, output: undefined } : s
      );
      
      if (selectedFlow && updatedSteps) {
        useFlowStore.setState({
          selectedFlow: { ...selectedFlow, steps: updatedSteps }
        });
      }
      
      const output = await executeStep(stepId, '');
      
      // Update step with output
      const finalSteps = selectedFlow?.steps.map(s => 
        s.id === stepId ? { ...s, output, isRunning: false, isExpanded: true } : s
      );
      
      if (selectedFlow && finalSteps) {
        useFlowStore.setState({
          selectedFlow: { ...selectedFlow, steps: finalSteps }
        });
      }
      
      setToast({ message: 'Step executed successfully', type: 'success' });
    } catch (error: any) {
      console.error('Failed to execute step:', error);
      setToast({ message: error.message || 'Failed to execute step', type: 'error' });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!selectedFlow) return;
    
    if (!confirm('Are you sure you want to delete this step?')) {
      return;
    }
    
    try {
      await deleteStep(stepId);
      setToast({ message: 'Step deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to delete step:', error);
      setToast({ message: 'Failed to delete step', type: 'error' });
    }
  };

  const handleToggleExpand = (stepId: string) => {
    if (!selectedFlow) return;
    
    const updatedSteps = selectedFlow.steps.map(step => 
      step.id === stepId ? { ...step, isExpanded: !step.isExpanded } : step
    );
    
    useFlowStore.setState({
      selectedFlow: { ...selectedFlow, steps: updatedSteps }
    });
  };

  const handleMoveStep = async (stepId: string, direction: 'up' | 'down') => {
    if (!selectedFlow) return;
    
    const steps = [...selectedFlow.steps].sort((a, b) => a.order_index - b.order_index);
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) return;
    
    if (direction === 'up' && stepIndex > 0) {
      const newIndex = steps[stepIndex - 1].order_index;
      await reorderStep(stepId, newIndex);
    } else if (direction === 'down' && stepIndex < steps.length - 1) {
      const newIndex = steps[stepIndex + 1].order_index;
      await reorderStep(stepId, newIndex);
    }
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      await updateApiSettings(settings);
      setToast({ message: 'Settings saved successfully', type: 'success' });
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setToast({ message: 'Failed to save settings', type: 'error' });
    }
  };

  // Loading state
  if (authLoading || loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <span>Loading prompt flows...</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has required subscription for Prompt Flow
  if (!isProOrHigher()) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="flex min-h-screen lg:pl-64">
          {/* Side Navbar */}
          <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Mobile Header */}
            <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <button
                    data-menu-button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <Menu size={20} />
                  </button>
                  
                  <h1 className="text-lg font-semibold text-white">
                    Prompt Flow
                  </h1>
                  
                  <div className="w-6" />
                </div>
              </div>
            </header>

            {/* Upgrade Message */}
            <UpgradeMessage feature="prompt-flow" minPlan="pro" />
          </div>
        </div>
        
        <BoltBadge />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white relative">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Access Required
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Please sign in to access prompt flows
            </p>
          </div>
        </div>
        
        <BoltBadge />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* Layout Container */}
      <div className="flex min-h-screen lg:pl-64">
        {/* Side Navbar */}
        <SideNavbar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="lg:hidden relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  data-menu-button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                >
                  <Menu size={20} />
                </button>
                
                <h1 className="text-lg font-semibold text-white">
                  Prompt Flow
                </h1>
                
                <div className="w-6" />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="relative z-10 flex-1">
            <div className="w-full max-w-7xl px-6 mx-auto py-8">
              {/* Page Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Prompt Flow
                  </h1>
                  <p className="text-zinc-400">
                    Create and run sequential prompt chains
                  </p>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Enhanced Flow Selection */}
                  <div className="flex items-center gap-2">
                    {flows.length > 0 ? (
                      <>
                        <CustomSelect
                          options={flows
                            .filter(flow => flow.user_id === user?.id)
                            .map(flow => ({
                              value: flow.id,
                              label: flow.name
                            }))}
                          value={selectedFlowId || ''}
                          onChange={handleFlowChange}
                          placeholder="Select a flow"
                          className="w-56"
                        />
                        
                        {selectedFlow && (
                          <button
                            onClick={() => setShowFlowManagementModal(true)}
                            className="flex items-center justify-center p-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all duration-200 transform hover:scale-105"
                            title="Edit flow settings"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-zinc-500 text-sm italic">No flows available</div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Settings size={16} />
                    <span>API Settings</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCreateFlow(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    <Plus size={16} />
                    <span>New Flow</span>
                  </button>
                </div>
              </div>

              {/* Main Content */}
              {selectedFlow ? (
                <div className="space-y-6">
                  {/* Flow Details */}
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {selectedFlow.name}
                    </h2>
                    {selectedFlow.description && (
                      <p className="text-zinc-400 mb-4">
                        {selectedFlow.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowPromptModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all duration-200"
                      >
                        <Plus size={16} />
                        <span>Add Step</span>
                      </button>
                      
                      <button
                        onClick={handleExecuteFlow}
                        disabled={executing || selectedFlow.steps.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-105 shadow-md hover:shadow-lg hover:shadow-emerald-500/20"
                      >
                        {executing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            <span>Run Flow</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={clearOutputs}
                        disabled={executing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 disabled:bg-zinc-800/30 disabled:text-zinc-500 text-zinc-300 rounded-xl transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        <Trash2 size={16} />
                        <span>Clear Outputs</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Variables Section */}
                  
                  {/* Steps List */}
                  <div className="space-y-2 mb-8">
                    <h3 className="text-lg font-semibold text-white">
                      Flow Steps
                    </h3>
                    
                    {selectedFlow.steps.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-8 text-center">
                        <p className="text-zinc-400 mb-4">
                          No steps have been added to this flow yet
                        </p>
                        <button
                          onClick={() => setShowPromptModal(true)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 mx-auto transform hover:scale-105 shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
                        >
                          <Plus size={16} />
                          <span>Add First Step</span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        {/* Sort steps by order_index */}
                        {[...selectedFlow.steps]
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((step, index) => (
                            <div key={step.id} className="relative">
                              {/* Step reordering buttons */}
                              {selectedFlow.steps.length > 1 && (
                                <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
                                  {index > 0 && (
                                    <button
                                      onClick={() => handleMoveStep(step.id, 'up')}
                                      className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded transition-colors"
                                      title="Move up"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                  )}
                                  {index < selectedFlow.steps.length - 1 && (
                                    <button
                                      onClick={() => handleMoveStep(step.id, 'down')}
                                      className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded transition-colors"
                                      title="Move down"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              {/* Step Item */}
                              <FlowStepItem
                                step={step}
                                isExecuting={executing}
                                onExecute={handleExecuteStep}
                                onDelete={handleDeleteStep}
                                onToggleExpand={handleToggleExpand}
                              />
                              
                              {/* Connection line between steps */}
                              {index < selectedFlow.steps.length - 1 && (
                                <div className="flex justify-center my-2">
                                  <ArrowDown className="text-indigo-500" size={20} />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Final Output Section - Standalone */}
                  {selectedFlow.steps.length > 0 && (
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="text-indigo-400" size={20} />
                        Final Flow Output
                      </h3>
                      
                      {(() => {
                        // Get the last step based on order_index
                        const sortedSteps = [...selectedFlow.steps].sort((a, b) => a.order_index - b.order_index);
                        const lastStep = sortedSteps[sortedSteps.length - 1];
                        
                        if (!lastStep || !lastStep.output) {
                          return (
                            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-6 text-center">
                              <p className="text-zinc-500 mb-4">Run the flow to see the final output here</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-emerald-300">Result</h4>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(lastStep.output || '');
                                    setToast({ message: 'Output copied to clipboard', type: 'success' });
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded transition-colors"
                                  title="Copy output"
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                              <div 
                                className="text-zinc-300 text-sm bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/30 max-h-[400px] overflow-y-auto prose prose-invert prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: marked(lastStep.output || '') }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-end">
                              <button
                                onClick={handleExecuteFlow}
                                disabled={executing}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                              >
                                {executing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Running...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={16} />
                                    <span>Run Again</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : flows.length > 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">
                    Select a flow from the dropdown above
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8">
                    <Zap className="mx-auto text-zinc-500 mb-4" size={48} />
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      No Flows Yet
                    </h3>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                      Create your first prompt flow to get started
                    </p>
                    <button
                      onClick={() => setShowCreateFlow(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 mx-auto shadow-md hover:shadow-lg hover:shadow-indigo-500/20"
                    >
                      <Plus size={16} />
                      <span>Create First Flow</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Flow Modal */}
      <AnimatePresence>
        {showCreateFlow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateFlow(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-white">
                  Create New Flow
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Flow Name *
                  </label>
                  <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="Enter flow name"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newFlowDescription}
                    onChange={(e) => setNewFlowDescription(e.target.value)}
                    placeholder="Enter flow description (optional)"
                    rows={3}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowCreateFlow(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFlow}
                  disabled={isCreating || !newFlowName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Flow</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Selection Modal */}
      <PromptSelectionModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSelectPrompt={handleAddPrompt}
      />

      {/* API Settings Modal */}
      <FlowApiSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={apiSettings}
        onSave={handleSaveSettings}
      />

      {/* Flow Management Modal */}
      {selectedFlow && (
        <FlowManagementModal
          isOpen={showFlowManagementModal}
          onClose={() => setShowFlowManagementModal(false)}
          flowId={selectedFlow.id}
        />
      )}

      {/* Confirmation Modal for Unset Variables */}
      <ConfirmationModal
        isOpen={showUnsetVariablesConfirmModal}
        onClose={() => setShowUnsetVariablesConfirmModal(false)}
        onConfirm={handleConfirmRunAnyway}
        title="Unset Variables Detected"
        message={
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="mb-2">Some steps in this flow have variables that haven't been set.</p>
                <p>Running the flow with unset variables may result in unexpected output or errors.</p>
              </div>
            </div>
          </div>
        }
        confirmText="Run Anyway"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BoltBadge />
    </div>
  );
};

// Helper component for the arrow between steps
const ArrowDown: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);