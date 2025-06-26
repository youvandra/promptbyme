import React from 'react'
import { Link } from 'react-router-dom'
import { marked } from 'marked'
import { 
  ArrowRight, 
  Wand2, 
  Play, 
  Folder, 
  Layers, 
  Users, 
  FileText, 
  History, 
  Eye, 
  EyeOff, 
  GitFork, 
  Copy, 
  Save,
  Cpu,
  Thermometer,
  Zap,
  Plus,
  Edit3,
  GitBranch,
  Target,
  Upload,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react'

interface DocsContentProps {
  section: string
}

export const DocsContent: React.FC<DocsContentProps> = ({ section }) => {
  // Scroll to top when section changes
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [section])

  const renderContent = () => {
    switch (section) {
      case 'introduction':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Welcome to promptby.me</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                <strong>promptby.me</strong> is a modern platform for designing, managing, and sharing AI prompts. Our philosophy is simple: <em>Design before you prompt</em>. By structuring and organizing your prompts, you can create more effective AI interactions and collaborate seamlessly with your team.
              </p>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Wand2 className="text-indigo-400" size={20} />
                  Core Features
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-indigo-400" />
                      Prompt Management
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Create, edit, and organize AI prompts with markdown support, version control, and folder organization.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Play size={16} className="text-emerald-400" />
                      AI Playground
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Test your prompts with various AI models and see results in real-time.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Folder size={16} className="text-amber-400" />
                      Prompt Flows
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Create sequential chains of prompts that build upon each other's outputs.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" />
                      Project Space
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Visually map and connect prompts in a flowchart-like interface for complex prompt systems.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Users size={16} className="text-purple-400" />
                      Team Collaboration
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Share projects with team members and collaborate with role-based permissions.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                      <Wand2 size={16} className="text-pink-400" />
                      Dynamic Variables
                    </h3>
                    <p className="text-zinc-300 text-sm">
                      Create reusable prompts with variables that can be filled at runtime.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Why promptby.me?</h2>
              
              <p className="text-zinc-300 mb-4">
                As AI becomes more integrated into our workflows, the quality of our prompts becomes increasingly important. promptby.me provides a structured approach to prompt engineering, allowing you to:
              </p>
              
              <ul className="list-disc pl-6 space-y-2 text-zinc-300 mb-6">
                <li>Organize your prompts in a central repository</li>
                <li>Track changes with version history</li>
                <li>Reuse prompts across different projects</li>
                <li>Collaborate with team members</li>
                <li>Test and iterate on prompts before deployment</li>
                <li>Create complex prompt systems with visual tools</li>
              </ul>
              
              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Ready to get started?</h3>
                <p className="text-zinc-300 mb-4">
                  Explore our documentation to learn how to make the most of promptby.me's features.
                </p>
                <Link
                  to="/docs/getting-started"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Getting Started Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'getting-started':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Getting Started</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Welcome to promptby.me! This guide will help you get started with our platform and introduce you to the core features.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Creating an Account</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Sign Up:</strong> Click the "Sign in" button in the top-right corner of the landing page.
                  </li>
                  <li>
                    <strong>Create Account:</strong> Click "Don't have an account? Sign up" and enter your email and password.
                  </li>
                  <li>
                    <strong>Complete Profile:</strong> After signing up, you can update your profile information in the Profile page.
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Navigating the Interface</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  The promptby.me interface consists of several key sections, accessible from the sidebar:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Home size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Home</h3>
                      <p className="text-zinc-400 text-sm">Create new prompts and access the main dashboard.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Gallery</h3>
                      <p className="text-zinc-400 text-sm">Browse, search, and manage your prompt collection.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Play size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Playground</h3>
                      <p className="text-zinc-400 text-sm">Test prompts with AI models and see results in real-time.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Layers size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Project Space</h3>
                      <p className="text-zinc-400 text-sm">Create visual prompt projects with connected nodes.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Folder size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Prompt Flow</h3>
                      <p className="text-zinc-400 text-sm">Create sequential chains of prompts.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Your First Prompt</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Let's create your first prompt:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Navigate to Home:</strong> Click on the Home icon in the sidebar.
                  </li>
                  <li>
                    <strong>Enter Prompt Content:</strong> In the editor, type your prompt text. You can use markdown formatting for better structure.
                  </li>
                  <li>
                    <strong>Add a Title (Optional):</strong> Give your prompt a descriptive title.
                  </li>
                  <li>
                    <strong>Set Visibility:</strong> Choose between Private (only you can see it) or Public (visible to everyone).
                  </li>
                  <li>
                    <strong>Save Your Prompt:</strong> Click the "Save Prompt" button.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> Use variables in your prompts by enclosing them in double curly braces, like <code>{{variable_name}}</code>. This allows you to reuse the same prompt with different values.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Next Steps</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link
                  to="/docs/prompt-management"
                  className="bg-zinc-800/30 border border-zinc-700/30 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/50"
                >
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" />
                    Prompt Management
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Learn how to organize, edit, and manage your prompts.
                  </p>
                </Link>
                
                <Link
                  to="/docs/variables"
                  className="bg-zinc-800/30 border border-zinc-700/30 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/50"
                >
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Wand2 size={16} className="text-indigo-400" />
                    Using Variables
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Create dynamic prompts with customizable variables.
                  </p>
                </Link>
                
                <Link
                  to="/docs/playground"
                  className="bg-zinc-800/30 border border-zinc-700/30 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/50"
                >
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Play size={16} className="text-indigo-400" />
                    AI Playground
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Test your prompts with different AI models.
                  </p>
                </Link>
                
                <Link
                  to="/docs/prompt-flow"
                  className="bg-zinc-800/30 border border-zinc-700/30 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:bg-zinc-800/50"
                >
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Folder size={16} className="text-indigo-400" />
                    Prompt Flows
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    Create sequential chains of prompts for complex tasks.
                  </p>
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'prompt-management':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Management</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Effective prompt management is at the core of promptby.me. This guide covers how to create, edit, organize, and share your prompts.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Creating a Prompt</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  You can create a new prompt from the Home page:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Navigate to Home:</strong> Click on the Home icon in the sidebar.
                  </li>
                  <li>
                    <strong>Prompt Title (Optional):</strong> Enter a descriptive title for your prompt.
                  </li>
                  <li>
                    <strong>App Tag (Optional):</strong> Select an app tag to associate your prompt with a specific AI tool.
                  </li>
                  <li>
                    <strong>Prompt Content:</strong> Write your prompt in the main editor. You can use markdown formatting for better structure.
                  </li>
                  <li>
                    <strong>Variables (Optional):</strong> Include variables using the <code>{{variable_name}}</code> syntax.
                  </li>
                  <li>
                    <strong>Visibility:</strong> Choose between Private (only you can see it) or Public (visible to everyone).
                  </li>
                  <li>
                    <strong>Folder (Optional):</strong> Organize your prompt by placing it in a folder.
                  </li>
                  <li>
                    <strong>Save:</strong> Click the "Save Prompt" button.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> Use markdown formatting in your prompts for better structure. You can use <code>**bold**</code>, <code>*italic*</code>, <code>- lists</code>, and more.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Prompt Gallery</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  The Gallery is where all your prompts are stored and organized:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Browsing Prompts</h3>
                      <p className="text-zinc-400 text-sm">View all your prompts in a grid or list layout. Toggle between views using the grid/list buttons.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Eye size={16} className="text-emerald-400" />
                      <EyeOff size={16} className="text-amber-400 mt-2" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Visibility Filtering</h3>
                      <p className="text-zinc-400 text-sm">Filter prompts by visibility (All, Public, Private) using the dropdown menu.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Folder size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Folder Organization</h3>
                      <p className="text-zinc-400 text-sm">Create folders to organize your prompts. Click the "New Folder" button to create a folder, then drag prompts into it.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <GitFork size={16} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Forking Prompts</h3>
                      <p className="text-zinc-400 text-sm">Create a copy of a public prompt by clicking the "Fork" button. The forked prompt will appear in your gallery.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Prompt Actions</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Each prompt card in the gallery has several actions available:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Edit3 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Edit</h3>
                      <p className="text-zinc-400 text-sm">Modify the prompt's title, content, visibility, or folder. Changes are saved as new versions.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Copy size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Copy</h3>
                      <p className="text-zinc-400 text-sm">Copy the prompt content to your clipboard. If the prompt contains variables, you'll be prompted to fill them first.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <History size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Version History</h3>
                      <p className="text-zinc-400 text-sm">View and restore previous versions of your prompt.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <ExternalLink size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Share</h3>
                      <p className="text-zinc-400 text-sm">Get a shareable link for public prompts that you can send to others.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Version History</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to track changes to your prompts and revert to previous versions.
                </p>
                <Link
                  to="/docs/prompt-versioning"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Version History Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'prompt-versioning':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Version History</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                promptby.me includes a powerful version control system for your prompts, similar to Git. This allows you to track changes, compare versions, and revert to previous states when needed.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">How Versioning Works</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Every time you edit a prompt, a new version is automatically created:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <GitBranch size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Automatic Versioning</h3>
                      <p className="text-zinc-400 text-sm">When you edit and save a prompt, a new version is created automatically. The original version is preserved.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <History size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Version History</h3>
                      <p className="text-zinc-400 text-sm">Access the version history by clicking the "History" button on a prompt card or in the prompt editor.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <GitBranch size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Commit Messages</h3>
                      <p className="text-zinc-400 text-sm">Each version includes a commit message describing the changes made. This helps you track the purpose of each update.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Viewing Version History</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  To view the version history of a prompt:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Open the Prompt:</strong> Click on a prompt card in your gallery to open it.
                  </li>
                  <li>
                    <strong>Access History:</strong> Click the "History" button in the prompt actions.
                  </li>
                  <li>
                    <strong>Browse Versions:</strong> You'll see a list of all versions on the left side, with the most recent at the top.
                  </li>
                  <li>
                    <strong>View Details:</strong> Click on a version to see its content on the right side.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> You can select two versions and click "Compare" to see a side-by-side diff view highlighting the changes between them.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Reverting to Previous Versions</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  If you need to go back to a previous version:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Open Version History:</strong> Access the version history as described above.
                  </li>
                  <li>
                    <strong>Select Version:</strong> Click on the version you want to revert to.
                  </li>
                  <li>
                    <strong>Revert:</strong> Click the "Revert" button.
                  </li>
                  <li>
                    <strong>Confirm:</strong> A new version will be created with the content from the selected version.
                  </li>
                </ol>
                
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm">
                    <strong>Note:</strong> Reverting creates a new version rather than deleting history. This ensures you can always go back to any version.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Using Variables</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to create dynamic prompts with customizable variables.
                </p>
                <Link
                  to="/docs/variables"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Variables Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'variables':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Using Variables</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Variables are a powerful feature in promptby.me that allow you to create reusable prompt templates. By defining variables in your prompts, you can customize them at runtime without changing the original template.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Variable Syntax</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Variables in promptby.me use the double curly brace syntax:
                </p>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 font-mono text-sm mb-4">
                  <p className="text-zinc-300">
                    Write a <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{{tone}}</span> email to <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{{recipient}}</span> about <span className=\"text-indigo-400 bg-indigo-500/10 px-1 rounded">{{topic}}</span>.
                  </p>
                </div>
                
                <p className="text-zinc-300">
                  In this example, <code>{{tone}}</code>, <code>{{recipient}}</code>, and <code>{{topic}}</code> are variables that can be filled with different values each time you use the prompt.
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Benefits of Using Variables</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Reusability</h3>
                      <p className="text-zinc-400 text-sm">Create a single prompt template that can be used for multiple scenarios by changing variable values.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Consistency</h3>
                      <p className="text-zinc-400 text-sm">Maintain consistent prompt structure while allowing for customization.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Efficiency</h3>
                      <p className="text-zinc-400 text-sm">Save time by not having to rewrite similar prompts for different contexts.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Using Variables in Practice</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-medium text-white mb-4">When Copying a Prompt</h3>
                
                <p className="text-zinc-300 mb-4">
                  When you copy a prompt containing variables:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Click Copy:</strong> Click the copy button on a prompt card or in the prompt viewer.
                  </li>
                  <li>
                    <strong>Variable Fill Modal:</strong> If the prompt contains variables, a modal will appear asking you to fill in values.
                  </li>
                  <li>
                    <strong>Enter Values:</strong> Enter values for each variable.
                  </li>
                  <li>
                    <strong>Preview:</strong> See a live preview of your prompt with the variables filled in.
                  </li>
                  <li>
                    <strong>Copy Customized Prompt:</strong> Click "Copy Customized Prompt" to copy the filled prompt to your clipboard.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> You can also choose to copy the original prompt with the variable placeholders intact by clicking "Copy Original" instead.
                  </p>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-medium text-white mb-4">In the Playground</h3>
                
                <p className="text-zinc-300 mb-4">
                  When using a prompt with variables in the Playground:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Select Prompt:</strong> Choose a prompt with variables from your gallery.
                  </li>
                  <li>
                    <strong>Fill Variables:</strong> The Variable Fill modal will appear automatically.
                  </li>
                  <li>
                    <strong>Enter Values:</strong> Fill in the values for each variable.
                  </li>
                  <li>
                    <strong>Apply to Playground:</strong> Click "Apply to Playground" to use the filled prompt.
                  </li>
                  <li>
                    <strong>Generate:</strong> Click "Generate" to run the prompt with the AI model.
                  </li>
                </ol>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-medium text-white mb-4">In Prompt Flows</h3>
                
                <p className="text-zinc-300 mb-4">
                  Variables are especially powerful in Prompt Flows:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Create a Flow:</strong> Set up a sequence of prompt steps.
                  </li>
                  <li>
                    <strong>Edit Step:</strong> Click the edit button on a step containing variables.
                  </li>
                  <li>
                    <strong>Fill Variables:</strong> Enter values for the variables in that step.
                  </li>
                  <li>
                    <strong>Save Changes:</strong> The variables will be stored with the flow step.
                  </li>
                  <li>
                    <strong>Run Flow:</strong> When you run the flow, the saved variable values will be used.
                  </li>
                </ol>
                
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm">
                    <strong>Note:</strong> In Prompt Flows, you can also pass outputs from previous steps as inputs to later steps, creating a chain of dependent prompts.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Variable Best Practices</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ul className="list-disc pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Use Descriptive Names:</strong> Choose variable names that clearly indicate what should be filled in (e.g., <code>{{customer_name}}</code> instead of <code>{{name}}</code>).
                  </li>
                  <li>
                    <strong>Add Context:</strong> Include instructions or examples near variables to guide users on what to enter.
                  </li>
                  <li>
                    <strong>Consistent Naming:</strong> Use a consistent naming convention for variables across your prompts.
                  </li>
                  <li>
                    <strong>Don't Overuse:</strong> Too many variables can make a prompt cumbersome to use. Focus on the most important customization points.
                  </li>
                </ul>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: AI Playground</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to test your prompts with different AI models in the Playground.
                </p>
                <Link
                  to="/docs/playground"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Playground Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'playground':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">AI Playground</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                The AI Playground allows you to test your prompts with various AI models and see results in real-time. It's a powerful tool for iterating on your prompts before using them in production.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Playground Interface</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  The Playground is divided into three main sections:
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Cpu size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">API Settings Panel</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Configure the AI model and parameters for your prompt.
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                        <li><strong>Model:</strong> Select the AI model to use (e.g., Llama 3, Mixtral, Gemma).</li>
                        <li><strong>Temperature:</strong> Adjust the creativity level (lower for more focused, higher for more creative responses).</li>
                        <li><strong>Max Tokens:</strong> Set the maximum length of the generated response.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Prompt Input</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Select and customize the prompt you want to test.
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                        <li><strong>Select Prompt:</strong> Choose a prompt from your gallery.</li>
                        <li><strong>Fill Variables:</strong> If your prompt contains variables, you'll be prompted to fill them.</li>
                        <li><strong>Generate:</strong> Run the prompt with the selected AI model.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Zap size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">AI Response</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        View the generated response from the AI model.
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                        <li><strong>Copy:</strong> Copy the response to your clipboard.</li>
                        <li><strong>Download:</strong> Save the response as a text file.</li>
                        <li><strong>Clear:</strong> Reset the response area.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Using the Playground</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Navigate to Playground:</strong> Click on the Playground icon in the sidebar.
                  </li>
                  <li>
                    <strong>Configure API Settings:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li>Select your preferred model from the dropdown.</li>
                      <li>Adjust the temperature slider (0.1-1.0).</li>
                      <li>Set the maximum tokens for the response.</li>
                      <li>Click "Save Settings" to store your preferences.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Select a Prompt:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li>Click "Select Prompt" to open the prompt selection modal.</li>
                      <li>Browse or search for a prompt from your gallery.</li>
                      <li>Click on a prompt to select it.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Fill Variables (if applicable):</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li>If your prompt contains variables, the Variable Fill modal will appear.</li>
                      <li>Enter values for each variable.</li>
                      <li>Click "Apply to Playground" to use the filled prompt.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Generate Response:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li>Click the "Generate" button to send the prompt to the AI model.</li>
                      <li>Wait for the response to appear in the AI Response section.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Work with the Response:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li>Copy the response to your clipboard using the Copy button.</li>
                      <li>Download the response as a text file using the Download button.</li>
                      <li>Clear the response and start over using the Clear button.</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Tips for Effective Testing</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ul className="list-disc pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Iterate Quickly:</strong> Use the Playground to rapidly test and refine your prompts.
                  </li>
                  <li>
                    <strong>Test Different Models:</strong> Try the same prompt with different models to see how responses vary.
                  </li>
                  <li>
                    <strong>Experiment with Temperature:</strong> Adjust the temperature to find the right balance between creativity and focus for your use case.
                  </li>
                  <li>
                    <strong>Save Successful Prompts:</strong> When you find a prompt that works well, save it to your gallery for future use.
                  </li>
                </ul>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> For complex tasks, consider breaking them down into multiple prompts and connecting them in a Prompt Flow.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Prompt Flows</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to create sequential chains of prompts for complex tasks.
                </p>
                <Link
                  to="/docs/prompt-flow"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Prompt Flows Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'prompt-flow':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Flows</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Prompt Flows allow you to create sequential chains of prompts that build upon each other. This is useful for complex tasks that require multiple steps or for breaking down a large task into smaller, more manageable pieces.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Understanding Prompt Flows</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  A Prompt Flow consists of:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Folder size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Flow Container</h3>
                      <p className="text-zinc-400 text-sm">The overall flow with a name and description.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Steps</h3>
                      <p className="text-zinc-400 text-sm">Individual prompts arranged in a specific order. Each step can be customized with its own variables.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <ArrowRight size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Sequential Execution</h3>
                      <p className="text-zinc-400 text-sm">Steps are executed in order, with each step potentially using the output from previous steps.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Creating a Prompt Flow</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Navigate to Prompt Flow:</strong> Click on the Prompt Flow icon in the sidebar.
                  </li>
                  <li>
                    <strong>Create New Flow:</strong> Click the "New Flow" button.
                  </li>
                  <li>
                    <strong>Name Your Flow:</strong> Enter a name and optional description for your flow.
                  </li>
                  <li>
                    <strong>Add Steps:</strong> Click "Add Step" to add prompts to your flow.
                  </li>
                  <li>
                    <strong>Select Prompts:</strong> Choose prompts from your gallery to add as steps.
                  </li>
                  <li>
                    <strong>Arrange Order:</strong> Use the up/down arrows to reorder steps as needed.
                  </li>
                  <li>
                    <strong>Customize Steps:</strong> Click the edit button on each step to customize its content and variables.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> Start with simple flows of 2-3 steps before creating more complex sequences.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Customizing Flow Steps</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Each step in a flow can be customized:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Edit3 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Edit Content</h3>
                      <p className="text-zinc-400 text-sm">Modify the prompt content specifically for this flow without affecting the original prompt.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Fill Variables</h3>
                      <p className="text-zinc-400 text-sm">Set values for variables that will be used when the flow runs.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Play size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Test Individual Steps</h3>
                      <p className="text-zinc-400 text-sm">Run a single step to test its output before running the entire flow.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Running a Prompt Flow</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Configure API Settings:</strong> Click the "API Settings" button to configure the AI model and parameters.
                  </li>
                  <li>
                    <strong>Run Flow:</strong> Click the "Run Flow" button to execute all steps in sequence.
                  </li>
                  <li>
                    <strong>View Progress:</strong> Each step will show its status as it runs.
                  </li>
                  <li>
                    <strong>Examine Results:</strong> After execution, each step will display its output.
                  </li>
                  <li>
                    <strong>Final Output:</strong> The output of the last step is considered the final result of the flow.
                  </li>
                </ol>
                
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm">
                    <strong>Note:</strong> If a step has unfilled variables, you'll be prompted to fill them before the flow runs.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Example Use Cases</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">Content Creation Pipeline</h3>
                    <ol className="list-decimal pl-6 space-y-2 text-zinc-400 text-sm">
                      <li>Step 1: Generate content ideas based on a topic</li>
                      <li>Step 2: Outline the structure for the chosen idea</li>
                      <li>Step 3: Write a draft based on the outline</li>
                      <li>Step 4: Edit and polish the draft</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium mb-2">Code Development Assistant</h3>
                    <ol className="list-decimal pl-6 space-y-2 text-zinc-400 text-sm">
                      <li>Step 1: Define requirements for a function</li>
                      <li>Step 2: Generate pseudocode based on requirements</li>
                      <li>Step 3: Convert pseudocode to actual code</li>
                      <li>Step 4: Write unit tests for the code</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium mb-2">Research Analysis</h3>
                    <ol className="list-decimal pl-6 space-y-2 text-zinc-400 text-sm">
                      <li>Step 1: Summarize research findings</li>
                      <li>Step 2: Identify key insights and patterns</li>
                      <li>Step 3: Generate recommendations based on insights</li>
                      <li>Step 4: Create a presentation outline</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Project Space</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to create visual prompt projects with connected nodes.
                </p>
                <Link
                  to="/docs/project-space"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Project Space Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'project-space':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Project Space</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Project Space is a visual environment for creating complex prompt systems. It allows you to connect different types of nodes in a flowchart-like interface, creating sophisticated prompt architectures.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Understanding Project Space</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Project Space consists of:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Layers size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Projects</h3>
                      <p className="text-zinc-400 text-sm">Containers for your prompt nodes and connections. Each project has a name, description, and visibility setting.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <div className="flex space-x-2">
                        <Upload size={16} className="text-purple-400" />
                        <Edit3 size={16} className="text-blue-400" />
                        <GitBranch size={16} className="text-yellow-400" />
                        <Target size={16} className="text-green-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Nodes</h3>
                      <p className="text-zinc-400 text-sm">Different types of components that can be connected together:</p>
                      <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400 text-sm">
                        <li><strong className="text-purple-400">Input Nodes:</strong> Define input parameters and variables</li>
                        <li><strong className="text-blue-400">Prompt Nodes:</strong> Contain AI prompts with instructions</li>
                        <li><strong className="text-yellow-400">Condition Nodes:</strong> Define conditional logic and branching</li>
                        <li><strong className="text-green-400">Output Nodes:</strong> Specify output format and requirements</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <LinkIcon size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Connections</h3>
                      <p className="text-zinc-400 text-sm">Links between nodes that define the flow of information.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Creating a Project</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Navigate to Project Space:</strong> Click on the Project Space icon in the sidebar.
                  </li>
                  <li>
                    <strong>Create New Project:</strong> Click the "New Project" button.
                  </li>
                  <li>
                    <strong>Enter Details:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li><strong>Name:</strong> Give your project a descriptive name.</li>
                      <li><strong>Description (Optional):</strong> Add details about the project's purpose.</li>
                      <li><strong>Visibility:</strong> Choose between Private, Team, or Public.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Create Project:</strong> Click the "Create Project" button.
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Working with Nodes</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-medium text-white mb-4">Adding Nodes</h3>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Open Your Project:</strong> Select a project from the dropdown or create a new one.
                  </li>
                  <li>
                    <strong>Add Node:</strong> Use the toolbar at the top of the canvas to add different types of nodes:
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li><strong className="text-purple-400">Input:</strong> Click "Input" to add an input node.</li>
                      <li><strong className="text-blue-400">Prompt:</strong> Click "Prompt" to add a prompt node.</li>
                      <li><strong className="text-blue-400">Import:</strong> Click "Import" to add a prompt from your gallery.</li>
                      <li><strong className="text-yellow-400">Condition:</strong> Click "Condition" to add a condition node.</li>
                      <li><strong className="text-green-400">Output:</strong> Click "Output" to add an output node.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Position Node:</strong> The node will be added to the canvas. You can drag it to position it where you want.
                  </li>
                </ol>
                
                <h3 className="text-xl font-medium text-white mt-6 mb-4">Editing Nodes</h3>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Select Node:</strong> Click on a node to select it.
                  </li>
                  <li>
                    <strong>Edit:</strong> Click the edit button in the toolbar that appears.
                  </li>
                  <li>
                    <strong>Modify Content:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-400">
                      <li><strong>Title:</strong> Change the node's title.</li>
                      <li><strong>Content:</strong> Edit the node's content (prompt text, conditions, etc.).</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Save Changes:</strong> Click "Save Changes" to update the node.
                  </li>
                </ol>
                
                <h3 className="text-xl font-medium text-white mt-6 mb-4">Connecting Nodes</h3>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Select Source Node:</strong> Click on the node you want to connect from.
                  </li>
                  <li>
                    <strong>Initiate Connection:</strong> Click the "Connect" button in the toolbar.
                  </li>
                  <li>
                    <strong>Select Target Node:</strong> Click on the node you want to connect to.
                  </li>
                  <li>
                    <strong>Alternative Method:</strong> You can also click and drag from a node's output handle to another node's input handle.
                  </li>
                </ol>
                
                <div className="mt-4 bg-indigo-600/10 border border-indigo-500/30 rounded-lg p-4">
                  <p className="text-indigo-300 text-sm">
                    <strong>Tip:</strong> Connections define the flow of information in your project. For example, an input node might connect to a prompt node, which then connects to an output node.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Node Types in Detail</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <Upload size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Input Nodes</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Define input parameters and variables for your project.
                      </p>
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 text-zinc-300 text-sm">
                        <p className="font-mono">Example content:</p>
                        <pre className="mt-2 text-xs">
                          Input variables:<br/>
                          - {{user_name}}: The name of the user<br/>
                          - {{topic}}: The main topic to discuss<br/>
                          - {{tone}}: The tone of the response (formal/casual)
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <Edit3 size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Prompt Nodes</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Contain AI prompts with instructions and context.
                      </p>
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 text-zinc-300 text-sm">
                        <p className="font-mono">Example content:</p>
                        <pre className="mt-2 text-xs">
                          Write a {{tone}} email to {{user_name}} about {{topic}}.<br/>
                          Include a greeting, 3-4 paragraphs of content, and a<br/>
                          professional sign-off.
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <GitBranch size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Condition Nodes</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Define conditional logic and branching paths.
                      </p>
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 text-zinc-300 text-sm">
                        <p className="font-mono">Example content:</p>
                        <pre className="mt-2 text-xs">
                          If {{tone}} equals "formal":<br/>
                          - Use professional language<br/>
                          - Include company letterhead<br/>
                          Else:<br/>
                          - Use conversational language<br/>
                          - Include personal anecdotes
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <Target size={16} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Output Nodes</h3>
                      <p className="text-zinc-400 text-sm mb-2">
                        Specify output format and requirements.
                      </p>
                      <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3 text-zinc-300 text-sm">
                        <p className="font-mono">Example content:</p>
                        <pre className="mt-2 text-xs">
                          Format the final output as:<br/>
                          - Subject line: Clear and concise<br/>
                          - Body: Well-structured paragraphs<br/>
                          - Closing: Include call to action<br/>
                          - Signature: Name and position
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Team Collaboration</h3>
                <p className="text-zinc-300 mb-4">
                  Learn how to collaborate with team members on your projects.
                </p>
                <Link
                  to="/docs/team-collaboration"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>Team Collaboration Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'team-collaboration':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Team Collaboration</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                promptby.me allows you to collaborate with team members on your projects. You can invite others to view or edit your projects, assign roles, and work together in real-time.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">Project Visibility</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Projects can have different visibility settings:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <EyeOff size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Private</h3>
                      <p className="text-zinc-400 text-sm">Only you and invited team members can access the project.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Users size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Team</h3>
                      <p className="text-zinc-400 text-sm">All members of your team can access the project.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Eye size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Public</h3>
                      <p className="text-zinc-400 text-sm">Anyone with the link can view the project, but only team members can edit.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Team Member Roles</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  Team members can have different roles with varying permissions:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Users size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Admin</h3>
                      <p className="text-zinc-400 text-sm mb-2">Full access to the project, including:</p>
                      <ul className="list-disc pl-6 space-y-1 text-zinc-400 text-sm">
                        <li>View, edit, and delete the project</li>
                        <li>Add, edit, and delete nodes and connections</li>
                        <li>Invite and manage team members</li>
                        <li>Change project settings</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Edit3 size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Editor</h3>
                      <p className="text-zinc-400 text-sm mb-2">Can edit the project content, including:</p>
                      <ul className="list-disc pl-6 space-y-1 text-zinc-400 text-sm">
                        <li>View the project</li>
                        <li>Add, edit, and delete nodes and connections</li>
                        <li>Cannot invite or manage team members</li>
                        <li>Cannot change project settings</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                      <Eye size={16} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Viewer</h3>
                      <p className="text-zinc-400 text-sm mb-2">Read-only access to the project:</p>
                      <ul className="list-disc pl-6 space-y-1 text-zinc-400 text-sm">
                        <li>View the project</li>
                        <li>Cannot make any changes</li>
                        <li>Cannot invite or manage team members</li>
                        <li>Cannot change project settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Inviting Team Members</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Open Your Project:</strong> Select a project from the Project Space.
                  </li>
                  <li>
                    <strong>Invite Members:</strong> Click the "Invite" button in the project header.
                  </li>
                  <li>
                    <strong>Enter Email:</strong> Enter the email address of the person you want to invite.
                  </li>
                  <li>
                    <strong>Assign Role:</strong> Select a role (Viewer, Editor, or Admin) for the invitee.
                  </li>
                  <li>
                    <strong>Send Invitation:</strong> Click "Send Invitation" to invite the user.
                  </li>
                </ol>
                
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-amber-300 text-sm">
                    <strong>Note:</strong> The invitee must have a promptby.me account to accept the invitation. If they don't have an account, they'll need to create one with the email address you invited.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Managing Team Members</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  As a project owner or admin, you can manage team members:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>View Team Members:</strong> Click on the team members indicator in the project header.
                  </li>
                  <li>
                    <strong>Change Roles:</strong> Use the role dropdown to change a member's role.
                  </li>
                  <li>
                    <strong>Remove Members:</strong> Click the remove button next to a member to remove them from the project.
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Accepting Invitations</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <p className="text-zinc-300 mb-4">
                  If you've been invited to a project:
                </p>
                
                <ol className="list-decimal pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Check Notifications:</strong> Click the notification bell in the sidebar to see pending invitations.
                  </li>
                  <li>
                    <strong>Review Invitation:</strong> See details about the project and your assigned role.
                  </li>
                  <li>
                    <strong>Accept or Decline:</strong> Click "Accept" to join the project or "Decline" to reject the invitation.
                  </li>
                  <li>
                    <strong>Access Project:</strong> After accepting, the project will appear in your Project Space.
                  </li>
                </ol>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">Collaboration Best Practices</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 mb-8">
                <ul className="list-disc pl-6 space-y-4 text-zinc-300">
                  <li>
                    <strong>Clear Node Naming:</strong> Use descriptive titles for nodes so team members understand their purpose.
                  </li>
                  <li>
                    <strong>Document Your Work:</strong> Add comments and descriptions to explain complex parts of your project.
                  </li>
                  <li>
                    <strong>Organize Visually:</strong> Arrange nodes in a logical flow from left to right or top to bottom.
                  </li>
                  <li>
                    <strong>Assign Appropriate Roles:</strong> Give team members the minimum permissions they need to do their work.
                  </li>
                  <li>
                    <strong>Communicate Changes:</strong> Let team members know when you make significant changes to the project.
                  </li>
                </ul>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Next: Frequently Asked Questions</h3>
                <p className="text-zinc-300 mb-4">
                  Find answers to common questions about promptby.me.
                </p>
                <Link
                  to="/docs/faq"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span>FAQ</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )
      
      case 'faq':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h1>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-zinc-300 mb-6">
                Find answers to common questions about promptby.me and its features.
              </p>

              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">General Questions</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">What is promptby.me?</h3>
                      <p className="text-zinc-300">
                        promptby.me is a platform for designing, managing, and sharing AI prompts. It provides tools for creating, versioning, and organizing prompts, as well as testing them with various AI models.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Is promptby.me free to use?</h3>
                      <p className="text-zinc-300">
                        promptby.me offers both free and premium tiers. The free tier includes basic prompt management and testing features, while premium tiers offer additional features like team collaboration and advanced analytics.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Do I need my own API keys?</h3>
                      <p className="text-zinc-300">
                        Yes, to use the AI Playground and Prompt Flows features, you'll need to provide your own API keys for the AI providers you want to use (e.g., OpenAI, Anthropic, Google). These keys are stored securely in your browser and are never sent to our servers.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Account & Privacy</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">How do I delete my account?</h3>
                      <p className="text-zinc-300">
                        You can delete your account from the Profile page. Click on your profile in the sidebar, then scroll to the bottom and click "Delete Account". This will permanently remove all your data from our servers.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Are my prompts private?</h3>
                      <p className="text-zinc-300">
                        By default, all prompts are created as private and are only visible to you. You can choose to make individual prompts public, which allows others to view and fork them. Your private prompts will never be visible to others unless you explicitly share them.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Can I make my profile private?</h3>
                      <p className="text-zinc-300">
                        Yes, you can toggle your profile visibility in the Profile settings. When your profile is private, your public prompts will still be accessible via direct links, but your profile page will not be visible to others.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Features & Functionality</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">What AI models are supported in the Playground?</h3>
                      <p className="text-zinc-300">
                        The Playground currently supports models from several providers, including OpenAI (GPT models), Anthropic (Claude models), Google (Gemini models), Llama models, and Groq. We regularly add support for new models and providers.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">How do variables work?</h3>
                      <p className="text-zinc-300">
                        Variables allow you to create dynamic prompts with placeholders that can be filled at runtime. Use the syntax <code>{{variable_name}}</code> in your prompt, and you'll be prompted to fill in values when you use the prompt. This makes prompts more reusable and flexible.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">What's the difference between Prompt Flows and Project Space?</h3>
                      <p className="text-zinc-300">
                        Prompt Flows are linear sequences of prompts that execute in order, with each step potentially using the output of previous steps. Project Space is a more flexible, visual environment where you can create complex prompt systems with different types of nodes and non-linear connections between them.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Can I export my prompts?</h3>
                      <p className="text-zinc-300">
                        Yes, you can copy individual prompts to your clipboard or download AI responses from the Playground. We're also working on a feature to export entire projects or prompt collections in various formats.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">How many team members can I invite to a project?</h3>
                      <p className="text-zinc-300">
                        The number of team members you can invite depends on your subscription tier. Free accounts can invite up to 3 members per project, while premium tiers allow for more team members and additional collaboration features.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Troubleshooting</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">I can't generate responses in the Playground</h3>
                      <p className="text-zinc-300">
                        This is usually due to API key issues. Make sure you've entered a valid API key in the API Settings panel and that you have sufficient credits with the AI provider. Also check that you've selected a prompt and the correct model for your API key.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">My team member can't see my project</h3>
                      <p className="text-zinc-300">
                        Check that you've invited them with the correct email address and that they've accepted the invitation. Also verify that the project visibility is set appropriately (Private or Team). If they still can't access it, try removing them and sending a new invitation.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-white mb-2">Variables aren't working in my prompt</h3>
                      <p className="text-zinc-300">
                        Make sure you're using the correct syntax: <code>{{variable_name}}</code> with double curly braces. Check for typos or spaces within the variable name. Also, ensure you're using the same variable name consistently if you reference it multiple times.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-indigo-300 mb-4">Still Have Questions?</h2>
                  <p className="text-zinc-300 mb-4">
                    If you couldn't find the answer to your question, please contact our support team. We're here to help!
                  </p>
                  <a
                    href="mailto:support@promptby.me"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Contact Support</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </>
        )
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
            <p className="text-zinc-400 mb-6">The documentation section you're looking for doesn't exist.</p>
            <Link
              to="/docs/introduction"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <span>Go to Documentation Home</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      {renderContent()}
    </div>
  )
}