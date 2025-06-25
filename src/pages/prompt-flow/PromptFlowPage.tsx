Here's the fixed version with all missing closing brackets and tags added:

```jsx
// ... (previous code remains the same until the MoreVertical menu)

                                                      <Trash2 size={14} />
                                                      <span>Delete</span>
                                                    </button>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <AnimatePresence>
                                        {step.isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="p-3 bg-zinc-800/50 border-t border-zinc-700/30">
                                              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                                                {step.prompt_content || "No content available"}
                                              </pre>
                                              
                                              {/* Output display */}
                                              {step.output && (
                                                <div className="mt-3 pt-3 border-t border-zinc-700/30">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-medium text-emerald-400">Output</h4>
                                                    <button
                                                      onClick={() => copyToClipboard(step.output || '')}
                                                      className="p-1 text-zinc-500 hover:text-white transition-colors"
                                                      title="Copy output"
                                                    >
                                                      <Copy size={12} />
                                                    </button>
                                                  </div>
                                                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-2 text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                                                    {step.output}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Output Panel */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                          <h2 className="text-lg font-semibold text-white mb-4">Flow Output</h2>
                          
                          {selectedFlow.steps.some(step => step.output) ? (
                            <div className="space-y-4">
                              {selectedFlow.steps
                                .filter(step => step.output)
                                .map((step, index) => (
                                  <div key={step.id} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                                        <span className="w-5 h-5 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 text-xs">
                                          {step.order_index + 1}
                                        </span>
                                        {step.step_title}
                                      </h3>
                                      <button
                                        onClick={() => copyToClipboard(step.output || '')}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all duration-200"
                                        title="Copy to clipboard"
                                      >
                                        <Copy size={14} />
                                      </button>
                                    </div>
                                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                                      {step.output}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="bg-zinc-800/20 border border-zinc-800/50 rounded-lg p-8 text-center">
                              <Play className="mx-auto text-zinc-600 mb-3" size={32} />
                              <p className="text-zinc-500 mb-4">Run the flow to see output here</p>
                              <button
                                onClick={handleRunFlow}
                                disabled={isRunningFlow || selectedFlow.steps.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-lg transition-all duration-200 text-sm"
                              >
                                <Play size={14} />
                                <span>Run Flow</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Folder size={32} className="text-indigo-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-2">
                        No Flow Selected
                      </h2>
                      <p className="text-zinc-400 mb-6">
                        Select an existing flow or create a new one to get started.
                      </p>
                      <button
                        onClick={() => setShowCreateFlow(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 mx-auto"
                      >
                        <Plus size={16} />
                        <span>Create Flow</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
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
                
                <button
                  onClick={() => setShowCreateFlow(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
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
                  disabled={isCreatingFlow || !newFlowName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isCreatingFlow ? (
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
        onSelectPrompt={handlePromptSelected}
      />

      {/* API Settings Modal */}
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
  )
}
```