Here's the fixed version with all missing closing brackets added:

```jsx
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        projectId={selectedProject?.id || ''}
        currentUserRole={currentUserRole}
      />

      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        projectId={selectedProject?.id || ''}
        currentUserRole={currentUserRole}
      />

      <AnimatePresence>
        {(selectedNodeForToolbar || selectedNode) && (
          <NodeDetailsToolbar
            selectedNode={selectedNodeForToolbar || selectedNode}
            onEdit={(nodeId) => {
              const node = selectedProject?.nodes?.find(n => n.id === nodeId);
              if (node) {
                setSelectedNode(node);
                setShowNodeEditor(true);
              }
            }}
            onDelete={handleNodeDelete}
            onViewDetails={(nodeId) => {
              const node = selectedProject?.nodes?.find(n => n.id === nodeId);
              if (node && !isConnectingNodes) {
                setSelectedNode(node);
                setShowNodeDetails(true);
              }
            }}
            onConnect={handleConnectStart}
            onClose={() => {
              setSelectedNodeForToolbar(null);
              setActiveNodeId(null);
              setIsConnectingNodes(false);
              setSourceNodeId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Node Editor Modal */}
      <NodeEditorModal
        isOpen={showNodeEditor}
        onClose={() => {
          setShowNodeEditor(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        onSave={handleNodeSave}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        isOpen={showNodeDetails}
        onClose={() => {
          setShowNodeDetails(false)
          setSelectedNode(null)
        }}
        node={selectedNode}
        onEdit={(nodeId) => {
          const node = selectedProject?.nodes?.find(n => n.id === nodeId)
          if (node) {
            setSelectedNode(node)
            setShowNodeEditor(true)
          }
        }}
      />

      {/* Prompt Import Modal */}
      <PromptImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSelectPrompt={handlePromptSelected}
      />
    
      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            
            <motion.div 
              className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <UserPlus className="text-indigo-400" size={20} />
                  <h2 className="text-xl font-semibold text-white">
                    Invite Team Member
                  </h2>
                </div>
                
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInviteRole('viewer')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'viewer' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Eye size={18} />
                      <span className="text-sm font-medium">Viewer</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('editor')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'editor' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Edit size={18} />
                      <span className="text-sm font-medium">Editor</span>
                    </button>
                    
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        inviteRole === 'admin' 
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                          : 'bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Settings size={18} />
                      <span className="text-sm font-medium">Admin</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-zinc-500">
                    <p><strong>Viewer:</strong> Can view but not edit the project</p>
                    <p><strong>Editor:</strong> Can edit nodes and connections</p>
                    <p><strong>Admin:</strong> Full access including member management</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800/50 bg-zinc-900/30">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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