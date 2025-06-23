import React from 'react';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { DynamicFlowEditor } from '../../components/flow';
import { SideNavbar } from '../../components/navigation/SideNavbar';
import { BoltBadge } from '../../components/ui/BoltBadge';

export const FlowEditorDemo: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                  Flow Editor Demo
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
                    Dynamic Flow Editor
                  </h1>
                  <p className="text-zinc-400">
                    Create, connect, and edit nodes in this interactive flow editor
                  </p>
                </div>
              </div>

              {/* Flow Editor */}
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <DynamicFlowEditor />
              </div>
              
              {/* Instructions */}
              <div className="mt-8 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">How to Use</h2>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span><strong>Add Nodes:</strong> Click the "Add Node" button in the top-right corner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span><strong>Edit Node Text:</strong> Double-click on any node to edit its label</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span><strong>Connect Nodes:</strong> Drag from the edge of one node to another</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span><strong>Move Nodes:</strong> Click and drag nodes to reposition them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span><strong>Pan & Zoom:</strong> Use the controls in the bottom-right or mouse wheel</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BoltBadge />
    </div>
  );
};

export default FlowEditorDemo;