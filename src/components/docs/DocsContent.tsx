import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check,
  Wand2,
  GitBranch,
  Play,
  Folder,
  Layers,
  Users
} from 'lucide-react'

interface DocsContentProps {
  section: string
}

export const DocsContent: React.FC<DocsContentProps> = ({ section }) => {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const renderCodeBlock = (code: string, language: string = 'jsx') => {
    return (
      <div className="relative group">
        <pre className={`language-${language} bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto`}>
          <code className="text-zinc-300 text-sm">{code}</code>
        </pre>
        <button
          onClick={() => copyToClipboard(code)}
          className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    )
  }

  const renderNextPrevButtons = (prev?: { path: string; title: string }, next?: { path: string; title: string }) => {
    return (
      <div className="flex flex-col sm:flex-row justify-between mt-12 pt-6 border-t border-zinc-800">
        {prev ? (
          <Link
            to={`/docs/${prev.path}`}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors mb-4 sm:mb-0"
          >
            <ArrowLeft size={16} />
            <span>{prev.title}</span>
          </Link>
        ) : (
          <div></div>
        )}
        
        {next && (
          <Link
            to={`/docs/${next.path}`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-colors ml-auto"
          >
            <span>{next.title}</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (section) {
      case 'introduction':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Welcome to promptby.me</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                <strong className="text-white">promptby.me</strong> is a modern platform for creating, managing, and sharing AI prompts. 
                Whether you're a prompt engineer, content creator, or AI enthusiast, our platform provides powerful tools to 
                design, version, and collaborate on prompts.
              </p>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Key Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Prompt Management</strong>
                      <p className="text-zinc-400">Create, edit, and organize AI prompts with markdown support and dynamic variables.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <GitBranch size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Version Control</strong>
                      <p className="text-zinc-400">Track changes with Git-like versioning, allowing you to revert to previous versions.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Dynamic Variables</strong>
                      <p className="text-zinc-400">Create templates with variables that can be filled before use.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Play size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">AI Playground</strong>
                      <p className="text-zinc-400">Test your prompts with various AI models directly in the platform.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Folder size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Prompt Flows</strong>
                      <p className="text-zinc-400">Create sequential chains of prompts for complex AI interactions.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Layers size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Project Space</strong>
                      <p className="text-zinc-400">Visually design prompt flows with a node-based interface.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Users size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Team Collaboration</strong>
                      <p className="text-zinc-400">Share projects with team members and collaborate in real-time.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <p>
                This documentation will guide you through all the features of promptby.me, from basic prompt creation to 
                advanced team collaboration. Use the sidebar to navigate through different sections.
              </p>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Getting Started</h3>
                <p className="mb-4">Ready to dive in? Here are some quick links to get you started:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/docs/getting-started"
                    className="flex items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Rocket size={20} className="text-indigo-400" />
                    <span>Getting Started Guide</span>
                  </Link>
                  <Link
                    to="/docs/prompt-management"
                    className="flex items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <FileText size={20} className="text-indigo-400" />
                    <span>Prompt Management</span>
                  </Link>
                  <Link
                    to="/docs/variables"
                    className="flex items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Wand2 size={20} className="text-indigo-400" />
                    <span>Using Variables</span>
                  </Link>
                  <Link
                    to="/docs/playground"
                    className="flex items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Play size={20} className="text-indigo-400" />
                    <span>AI Playground</span>
                  </Link>
                </div>
              </div>
            </div>
            
            {renderNextPrevButtons(undefined, { path: 'getting-started', title: 'Getting Started' })}
          </>
        )
      
      case 'getting-started':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Getting Started</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                Welcome to promptby.me! This guide will help you get started with the platform and introduce you to its core features.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating an Account</h2>
              <p>
                To use promptby.me, you'll need to create an account. Click the "Sign In" button in the top-right corner of the homepage 
                and select "Create account" to get started.
              </p>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-4">
                <h4 className="text-lg font-medium text-white mb-2">Account Benefits</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Save and manage your prompts</li>
                  <li>Track version history</li>
                  <li>Create prompt flows and projects</li>
                  <li>Collaborate with team members</li>
                  <li>Access the AI playground</li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">The Dashboard</h2>
              <p>
                After signing in, you'll be taken to the homepage where you can create your first prompt. The main navigation 
                sidebar provides access to all the key features:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Home</strong> - Create new prompts and access recent items</li>
                <li><strong className="text-white">Gallery</strong> - Browse and manage your saved prompts</li>
                <li><strong className="text-white">Project Space</strong> - Visual prompt design with node-based interface</li>
                <li><strong className="text-white">Prompt Flow</strong> - Create sequential chains of prompts</li>
                <li><strong className="text-white">Playground</strong> - Test prompts with AI models</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating Your First Prompt</h2>
              <p>
                To create your first prompt:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Go to the <strong className="text-white">Home</strong> page</li>
                <li>Enter your prompt content in the editor</li>
                <li>Add a title (optional)</li>
                <li>Select visibility (private or public)</li>
                <li>Click "Save Prompt"</li>
              </ol>
              <p>
                Your prompt will be saved to your gallery, where you can manage, edit, and organize it later.
              </p>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Pro Tips</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Wand2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Use Variables</strong>
                      <p className="text-zinc-400">Add dynamic elements to your prompts with {{variable_name}} syntax.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <GitBranch size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Version Your Prompts</strong>
                      <p className="text-zinc-400">Each edit creates a new version, allowing you to track changes and revert if needed.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Folder size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Organize with Folders</strong>
                      <p className="text-zinc-400">Create folders in your gallery to keep your prompts organized.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Next Steps</h2>
              <p>
                Now that you've created your first prompt, explore these features:
              </p>
              <ul className="space-y-4 my-4">
                <li>
                  <Link to="/docs/prompt-management" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <span>Learn about prompt management</span>
                    <ArrowRight size={14} />
                  </Link>
                </li>
                <li>
                  <Link to="/docs/variables" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <span>Discover how to use variables</span>
                    <ArrowRight size={14} />
                  </Link>
                </li>
                <li>
                  <Link to="/docs/playground" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <span>Test your prompts in the playground</span>
                    <ArrowRight size={14} />
                  </Link>
                </li>
              </ul>
            </div>
            
            {renderNextPrevButtons(
              { path: 'introduction', title: 'Introduction' },
              { path: 'prompt-management', title: 'Prompt Management' }
            )}
          </>
        )
      
      case 'prompt-management':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Management</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                promptby.me provides powerful tools for creating, editing, and organizing your prompts. This section covers the 
                basics of prompt management, including the prompt editor, gallery, and organization features.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">The Prompt Editor</h2>
              <p>
                The prompt editor is where you create and edit your prompts. It supports markdown formatting, allowing you to 
                create rich, structured prompts with headings, lists, code blocks, and more.
              </p>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-4">
                <h4 className="text-lg font-medium text-white mb-2">Editor Features</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-white">Markdown Support</strong> - Use markdown syntax for formatting</li>
                  <li><strong className="text-white">Variable Placeholders</strong> - Add {{variable_name}} for dynamic content</li>
                  <li><strong className="text-white">Version History</strong> - Track changes and revert when needed</li>
                  <li><strong className="text-white">Public/Private Toggle</strong> - Control who can see your prompts</li>
                  <li><strong className="text-white">Folder Organization</strong> - Assign prompts to folders</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Markdown Formatting</h3>
              <p>
                The editor supports standard markdown syntax:
              </p>
              
              {renderCodeBlock(`# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

\`\`\`
Code block for technical content
\`\`\`

> Blockquote for important notes

Use {{variable_name}} for dynamic content`)}
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">The Gallery</h2>
              <p>
                The Gallery is where all your saved prompts are stored. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>View all your prompts in one place</li>
                <li>Filter by visibility (public/private)</li>
                <li>Search for specific prompts</li>
                <li>Switch between grid and list views</li>
                <li>Organize prompts into folders</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Prompt Cards</h3>
              <p>
                Each prompt in the gallery is displayed as a card with the following features:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Title and Preview</strong> - Quick view of the prompt content</li>
                <li><strong className="text-white">Visibility Indicator</strong> - Shows if the prompt is public or private</li>
                <li><strong className="text-white">Version Badge</strong> - Displays the current version number</li>
                <li><strong className="text-white">Stats</strong> - For public prompts: views and forks</li>
                <li><strong className="text-white">Quick Actions</strong> - Copy, view, edit, and delete</li>
                <li><strong className="text-white">Context Menu</strong> - Right-click for additional options</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Organizing Prompts</h2>
              <p>
                Keep your prompts organized with these features:
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Folders</h3>
              <p>
                Create folders to categorize your prompts:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click "New Folder" in the Gallery</li>
                <li>Enter a name and optional description</li>
                <li>Choose a color for visual organization</li>
                <li>Assign prompts to folders via the context menu</li>
              </ol>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Tags</h3>
              <p>
                Add tags to your prompts to indicate which AI tools they're designed for:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Select an app tag when creating or editing a prompt</li>
                <li>Tags help identify which AI tool the prompt is optimized for</li>
                <li>Some tags enable direct "Run in App" functionality</li>
              </ul>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 my-6">
                <h4 className="flex items-center gap-2 text-lg font-medium text-amber-400 mb-2">
                  <AlertTriangle size={20} />
                  <span>Important Note</span>
                </h4>
                <p className="text-zinc-300">
                  Public prompts are visible to anyone with the link. Be careful not to include sensitive information 
                  in public prompts. You can always change a prompt's visibility from public to private.
                </p>
              </div>
            </div>
            
            {renderNextPrevButtons(
              { path: 'getting-started', title: 'Getting Started' },
              { path: 'prompt-versioning', title: 'Prompt Versioning' }
            )}
          </>
        )
      
      case 'prompt-versioning':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Versioning</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                promptby.me includes a powerful version control system for your prompts, similar to Git. This allows you to track changes, 
                compare versions, and revert to previous versions when needed.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How Versioning Works</h2>
              <p>
                Every time you edit a prompt and save changes, a new version is automatically created. Each version includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Version Number</strong> - Incremental number (v1, v2, v3, etc.)</li>
                <li><strong className="text-white">Timestamp</strong> - When the version was created</li>
                <li><strong className="text-white">Content</strong> - The prompt content at that version</li>
                <li><strong className="text-white">Title</strong> - The prompt title at that version</li>
                <li><strong className="text-white">Commit Message</strong> - Optional description of changes</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Accessing Version History</h2>
              <p>
                To view a prompt's version history:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Open the prompt in the editor or modal view</li>
                <li>Click the "History" button</li>
                <li>Browse through all versions in the Version History panel</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Comparing Versions</h2>
              <p>
                You can compare any two versions to see exactly what changed:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>In the Version History panel, select two versions by clicking the checkboxes</li>
                <li>Click "Compare" to see a side-by-side diff view</li>
                <li>Added content is highlighted in green, removed content in red</li>
              </ol>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Diff View Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-green-500/20 p-1 rounded mt-0.5">
                      <Plus size={16} className="text-green-400" />
                    </div>
                    <div>
                      <strong className="text-white">Additions</strong>
                      <p className="text-zinc-400">New content highlighted in green</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-red-500/20 p-1 rounded mt-0.5">
                      <Minus size={16} className="text-red-400" />
                    </div>
                    <div>
                      <strong className="text-white">Deletions</strong>
                      <p className="text-zinc-400">Removed content highlighted in red</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-zinc-500/20 p-1 rounded mt-0.5">
                      <Copy size={16} className="text-zinc-400" />
                    </div>
                    <div>
                      <strong className="text-white">Copy Content</strong>
                      <p className="text-zinc-400">Copy the content of either version</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Reverting to Previous Versions</h2>
              <p>
                If you need to go back to a previous version:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Select the version you want to revert to in the Version History panel</li>
                <li>Click the "Revert" button</li>
                <li>A new version will be created with the content from the selected version</li>
                <li>The revert action is recorded in the version history</li>
              </ol>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Pro Tip: Meaningful Commit Messages</h3>
                <p className="mb-4">
                  When making significant changes to a prompt, consider adding a descriptive commit message to help you 
                  remember what changed and why.
                </p>
                <p>
                  Good commit messages might include:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>"Added temperature parameter instructions"</li>
                  <li>"Improved clarity of output format requirements"</li>
                  <li>"Fixed typos and grammar issues"</li>
                  <li>"Complete rewrite for better results"</li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Version History Best Practices</h2>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Iterative Improvements</strong> - Make incremental changes to track what works</li>
                <li><strong className="text-white">A/B Testing</strong> - Create different versions to test which performs better</li>
                <li><strong className="text-white">Documentation</strong> - Use commit messages to document why changes were made</li>
                <li><strong className="text-white">Collaboration</strong> - Version history helps team members understand the evolution of a prompt</li>
              </ul>
            </div>
            
            {renderNextPrevButtons(
              { path: 'prompt-management', title: 'Prompt Management' },
              { path: 'variables', title: 'Using Variables' }
            )}
          </>
        )
      
      case 'variables':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Using Variables</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                Variables are one of the most powerful features of promptby.me, allowing you to create reusable prompt templates 
                with dynamic content. This guide explains how to use variables effectively in your prompts.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What Are Variables?</h2>
              <p>
                Variables are placeholders in your prompts that can be replaced with different values each time you use the prompt. 
                They make your prompts more flexible and reusable.
              </p>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-4">
                <h4 className="text-lg font-medium text-white mb-2">Variable Syntax</h4>
                <p className="mb-4">Variables use double curly braces syntax:</p>
                {renderCodeBlock('{{variable_name}}')}
                <p className="mt-4">For example, a prompt with variables might look like:</p>
                {renderCodeBlock(`Write a ${'{'}${'{'}tone${'}'}${'}'} email to ${'{'}${'{'}recipient${'}'}${'}'} about ${'{'}${'{'}topic${'}'}${'}'}.`)}
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating Prompts with Variables</h2>
              <p>
                To add variables to your prompts:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Open the prompt editor</li>
                <li>Type your prompt content</li>
                <li>Add variables using the {{variable_name}} syntax</li>
                <li>Use descriptive variable names that indicate their purpose</li>
              </ol>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Example Prompt with Variables</h3>
              {renderCodeBlock(`# {{language}} Code Generator

Please write a {{language}} function that {{functionality}}.

Requirements:
- The function should be named {{function_name}}
- Include proper error handling
- Add comments explaining the code
- Optimize for {{optimization_priority}}

Additional context: {{context}}`)}
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Using Prompts with Variables</h2>
              <p>
                When you use a prompt that contains variables, you'll be prompted to fill in values for each variable:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click "Copy" on a prompt with variables</li>
                <li>The Variable Fill modal will appear</li>
                <li>Enter values for each variable</li>
                <li>See a live preview of your filled prompt</li>
                <li>Click "Copy Customized Prompt" when done</li>
              </ol>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Variable Fill Modal Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Eye size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Live Preview</strong>
                      <p className="text-zinc-400">See how your prompt looks as you fill in variables</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Save size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Progress Tracking</strong>
                      <p className="text-zinc-400">Visual indicator shows how many variables have been filled</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Copy size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Copy Options</strong>
                      <p className="text-zinc-400">Copy the original prompt with variables or the filled version</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Variable Best Practices</h2>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Descriptive Names</strong> - Use clear, descriptive variable names (e.g., {{customer_name}} instead of {{name}})</li>
                <li><strong className="text-white">Consistent Formatting</strong> - Use snake_case or camelCase consistently for variable names</li>
                <li><strong className="text-white">Documentation</strong> - Include examples or descriptions of expected values in your prompt</li>
                <li><strong className="text-white">Default Values</strong> - In your prompt, suggest default values where appropriate</li>
                <li><strong className="text-white">Reusability</strong> - Design variables to make your prompts as reusable as possible</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Advanced Variable Usage</h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Variables in Prompt Flows</h3>
              <p>
                Variables are especially powerful in Prompt Flows, where you can:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Set variable values at the flow level</li>
                <li>Pass outputs from one step as variables to the next</li>
                <li>Create complex, multi-step interactions with dynamic content</li>
              </ul>
              <p>
                Learn more in the <Link to="/docs/prompt-flow" className="text-indigo-400 hover:text-indigo-300">Prompt Flow</Link> section.
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Variables in Project Space</h3>
              <p>
                In the Project Space, variables can be used to connect nodes and create dynamic flows:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Define variables in input nodes</li>
                <li>Process variables through prompt nodes</li>
                <li>Use condition nodes to create branching logic based on variable values</li>
                <li>Output final results with formatted variables</li>
              </ul>
              <p>
                Learn more in the <Link to="/docs/project-space" className="text-indigo-400 hover:text-indigo-300">Project Space</Link> section.
              </p>
            </div>
            
            {renderNextPrevButtons(
              { path: 'prompt-versioning', title: 'Prompt Versioning' },
              { path: 'playground', title: 'AI Playground' }
            )}
          </>
        )
      
      case 'playground':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">AI Playground</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                The AI Playground allows you to test your prompts with various AI models directly within promptby.me. 
                This guide explains how to use the playground effectively.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Accessing the Playground</h2>
              <p>
                To access the AI Playground:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click on "Playground" in the main navigation sidebar</li>
                <li>Or click the "Use in Playground" button on any prompt card</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Playground Interface</h2>
              <p>
                The playground interface consists of three main sections:
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1. Settings Panel</h3>
              <p>
                The settings panel allows you to configure the AI model and parameters:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Model Selection</strong> - Choose from available AI models</li>
                <li><strong className="text-white">Temperature</strong> - Control randomness (lower for focused, higher for creative)</li>
                <li><strong className="text-white">Max Tokens</strong> - Set the maximum length of the response</li>
                <li><strong className="text-white">Save Settings</strong> - Save your preferences for future sessions</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2. Prompt Input</h3>
              <p>
                This is where you enter or select the prompt to test:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Select Prompt</strong> - Choose from your saved prompts</li>
                <li><strong className="text-white">Fill Variables</strong> - If your prompt contains variables, you'll be prompted to fill them</li>
                <li><strong className="text-white">Generate Button</strong> - Send the prompt to the AI model</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3. AI Response</h3>
              <p>
                This section displays the AI's response to your prompt:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Response Text</strong> - The AI's generated output</li>
                <li><strong className="text-white">Copy Button</strong> - Copy the response to clipboard</li>
                <li><strong className="text-white">Download Button</strong> - Save the response as a text file</li>
                <li><strong className="text-white">Clear Button</strong> - Clear the current response</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Using the Playground</h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Selecting a Prompt</h3>
              <p>
                You can use the playground in two ways:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li><strong className="text-white">Select an existing prompt</strong> - Click "Select Prompt" to choose from your saved prompts</li>
                <li><strong className="text-white">Create a new prompt</strong> - Enter your prompt directly in the input area</li>
              </ol>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Adjusting Parameters</h3>
              <p>
                Fine-tune the AI's behavior with these parameters:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>
                  <strong className="text-white">Temperature (0.0 - 2.0):</strong>
                  <ul className="pl-6 mt-1">
                    <li><strong className="text-white">Low (0.1 - 0.5):</strong> More focused, deterministic responses</li>
                    <li><strong className="text-white">Medium (0.6 - 1.0):</strong> Balanced creativity and coherence</li>
                    <li><strong className="text-white">High (1.1 - 2.0):</strong> More creative, varied, and unpredictable</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-white">Max Tokens:</strong> Limits the length of the response. Higher values allow for longer outputs but may increase processing time.
                </li>
              </ul>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Pro Tip: Iterative Testing</h3>
                <p className="mb-4">
                  The playground is perfect for iterative prompt development:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Start with a basic prompt</li>
                  <li>Test it and analyze the response</li>
                  <li>Refine the prompt based on results</li>
                  <li>Adjust parameters to fine-tune the output</li>
                  <li>Save the best version to your gallery</li>
                </ol>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Working with Variables</h2>
              <p>
                When using prompts with variables in the playground:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Select a prompt that contains variables</li>
                <li>The Variable Fill modal will appear</li>
                <li>Enter values for each variable</li>
                <li>Preview how the filled prompt will look</li>
                <li>Click "Apply to Playground" to use the filled prompt</li>
                <li>Generate the response with your customized prompt</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Saving and Sharing Results</h2>
              <p>
                After generating a response, you can:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Copy to Clipboard</strong> - Copy the response for use elsewhere</li>
                <li><strong className="text-white">Download as Text</strong> - Save the response as a .txt file</li>
                <li><strong className="text-white">Run Again</strong> - Generate a new response with the same prompt</li>
                <li><strong className="text-white">Clear All</strong> - Reset the playground for a new session</li>
              </ul>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 my-6">
                <h4 className="flex items-center gap-2 text-lg font-medium text-amber-400 mb-2">
                  <AlertTriangle size={20} />
                  <span>API Key Security</span>
                </h4>
                <p className="text-zinc-300">
                  Your API keys are stored securely in your browser's local storage and are never sent to our servers. 
                  For maximum security, we recommend using environment-specific API keys with appropriate usage limits.
                </p>
              </div>
            </div>
            
            {renderNextPrevButtons(
              { path: 'variables', title: 'Using Variables' },
              { path: 'prompt-flow', title: 'Prompt Flow' }
            )}
          </>
        )
      
      case 'prompt-flow':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Prompt Flow</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                Prompt Flow is a powerful feature that allows you to create sequential chains of prompts. This enables complex 
                AI interactions where the output of one prompt becomes the input for the next.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">What is a Prompt Flow?</h2>
              <p>
                A Prompt Flow is a sequence of prompt steps that are executed in order. Each step can:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Use the output from previous steps as input</li>
                <li>Contain variables that can be filled at runtime</li>
                <li>Process and transform content through multiple AI interactions</li>
                <li>Produce a final output that represents the combined intelligence of the entire flow</li>
              </ul>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Example Use Cases</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Content Creation Pipeline</strong>
                      <p className="text-zinc-400">Generate ideas → Outline → Draft → Edit → Polish</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Code size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Code Generation</strong>
                      <p className="text-zinc-400">Requirements → Architecture → Implementation → Tests → Documentation</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <MessageSquare size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Customer Support</strong>
                      <p className="text-zinc-400">Issue classification → Solution lookup → Response generation → Satisfaction check</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating a Prompt Flow</h2>
              <p>
                To create a new Prompt Flow:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Navigate to the "Prompt Flow" section in the sidebar</li>
                <li>Click "New Flow"</li>
                <li>Enter a name and optional description</li>
                <li>Click "Create Flow"</li>
              </ol>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Adding Steps to Your Flow</h3>
              <p>
                Once you've created a flow, you can add steps:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click "Add Step" in your flow</li>
                <li>Select a prompt from your gallery</li>
                <li>The prompt will be added as a step in your flow</li>
                <li>Repeat to add more steps</li>
                <li>Reorder steps by using the up/down arrows</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Customizing Steps</h2>
              <p>
                Each step in your flow can be customized:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Edit Content</strong> - Modify the prompt content for this specific step</li>
                <li><strong className="text-white">Fill Variables</strong> - Set values for variables in the prompt</li>
                <li><strong className="text-white">Reference Previous Steps</strong> - Use output from previous steps in your prompt</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Working with Variables in Flows</h3>
              <p>
                Variables are especially powerful in Prompt Flows:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Each step can have its own set of variables</li>
                <li>Variables can be filled before running the flow</li>
                <li>You can reference the output of previous steps using special syntax</li>
              </ul>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Pro Tip: Step References</h3>
                <p className="mb-4">
                  When editing a step, you can reference the output from previous steps automatically. The system will 
                  add "Reference from previous step" content at the beginning of your prompt.
                </p>
                <p>
                  This allows each step to build upon the results of previous steps, creating a cohesive flow.
                </p>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Running a Flow</h2>
              <p>
                To execute your Prompt Flow:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Configure API settings (provider, model, temperature, etc.)</li>
                <li>Click "Run Flow" to execute all steps in sequence</li>
                <li>Watch as each step is processed and generates output</li>
                <li>View the final result at the bottom of the page</li>
              </ol>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Running Individual Steps</h3>
              <p>
                You can also run steps individually:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Click the "Run" button on a specific step</li>
                <li>Only that step will be executed</li>
                <li>Useful for testing and debugging specific parts of your flow</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Managing Flows</h2>
              <p>
                Your Prompt Flows can be managed from the Prompt Flow dashboard:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Edit Flow</strong> - Modify flow name, description, or steps</li>
                <li><strong className="text-white">Delete Flow</strong> - Remove flows you no longer need</li>
                <li><strong className="text-white">Switch Between Flows</strong> - Select different flows from the dropdown</li>
              </ul>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 my-6">
                <h4 className="flex items-center gap-2 text-lg font-medium text-amber-400 mb-2">
                  <AlertTriangle size={20} />
                  <span>API Key Requirements</span>
                </h4>
                <p className="text-zinc-300">
                  To run Prompt Flows, you'll need to configure API settings with a valid API key for your chosen provider 
                  (OpenAI, Anthropic, Google, etc.). These keys are stored securely in your browser and never sent to our servers.
                </p>
              </div>
            </div>
            
            {renderNextPrevButtons(
              { path: 'playground', title: 'AI Playground' },
              { path: 'project-space', title: 'Project Space' }
            )}
          </>
        )
      
      case 'project-space':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Project Space</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                Project Space is a visual environment for designing complex prompt systems using a node-based interface. 
                It allows you to create, connect, and manage different types of prompt nodes in a flexible, visual way.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Understanding Project Space</h2>
              <p>
                Project Space uses a node-based approach where:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Nodes</strong> represent different components (inputs, prompts, conditions, outputs)</li>
                <li><strong className="text-white">Connections</strong> define how data flows between nodes</li>
                <li><strong className="text-white">Projects</strong> organize related nodes and connections</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating a Project</h2>
              <p>
                To create a new project:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Navigate to the "Project Space" section in the sidebar</li>
                <li>Click "New Project"</li>
                <li>Enter a name and optional description</li>
                <li>Select visibility (private, team, or public)</li>
                <li>Click "Create Project"</li>
              </ol>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Project Visibility Options</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-amber-500/20 p-1 rounded mt-0.5">
                      <EyeOff size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <strong className="text-white">Private</strong>
                      <p className="text-zinc-400">Only you can access the project</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-blue-500/20 p-1 rounded mt-0.5">
                      <Users size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <strong className="text-white">Team</strong>
                      <p className="text-zinc-400">You and invited team members can access</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-emerald-500/20 p-1 rounded mt-0.5">
                      <Globe size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <strong className="text-white">Public</strong>
                      <p className="text-zinc-400">Anyone can view (but only you and team members can edit)</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Working with Nodes</h2>
              <p>
                Project Space supports four types of nodes:
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Input Nodes</h3>
              <p>
                Input nodes define the starting points and parameters for your flow:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Define input variables and their descriptions</li>
                <li>Set default values or examples</li>
                <li>Provide context for how inputs should be formatted</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Prompt Nodes</h3>
              <p>
                Prompt nodes contain the actual prompts that will be sent to AI models:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Write custom prompt content</li>
                <li>Import existing prompts from your gallery</li>
                <li>Include variables that can be filled from input nodes or other sources</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Condition Nodes</h3>
              <p>
                Condition nodes allow for branching logic in your flows:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Define conditions based on input values or previous outputs</li>
                <li>Create different paths for different scenarios</li>
                <li>Implement if/then/else logic in your prompt systems</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Output Nodes</h3>
              <p>
                Output nodes define the final results of your flow:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Format and structure the final output</li>
                <li>Combine results from multiple prompt nodes</li>
                <li>Specify output requirements and formats</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Creating and Connecting Nodes</h2>
              <p>
                To build your project:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click the node type buttons in the top toolbar to add nodes</li>
                <li>Position nodes by dragging them on the canvas</li>
                <li>Edit node content by clicking on a node and selecting "Edit"</li>
                <li>Connect nodes by clicking on a node's output handle and dragging to another node's input handle</li>
              </ol>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Pro Tip: Node Organization</h3>
                <p className="mb-4">
                  For complex projects with many nodes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Arrange nodes in a logical flow from top to bottom or left to right</li>
                  <li>Group related nodes together visually</li>
                  <li>Use descriptive titles for each node</li>
                  <li>Add comments in node content to explain their purpose</li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Importing Prompts</h2>
              <p>
                You can import existing prompts from your gallery into your project:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Click the "Import" button in the toolbar</li>
                <li>Select a prompt from your gallery</li>
                <li>The prompt will be added as a new prompt node</li>
                <li>You can then edit and connect it like any other node</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Managing Projects</h2>
              <p>
                The Project Space dashboard allows you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Create New Projects</strong> - Start fresh with new ideas</li>
                <li><strong className="text-white">Open Existing Projects</strong> - Continue working on previous projects</li>
                <li><strong className="text-white">Edit Project Settings</strong> - Change name, description, or visibility</li>
                <li><strong className="text-white">Delete Projects</strong> - Remove projects you no longer need</li>
                <li><strong className="text-white">Share Projects</strong> - Invite team members to collaborate</li>
              </ul>
              
              <p>
                Learn more about team collaboration in the <Link to="/docs/team-collaboration" className="text-indigo-400 hover:text-indigo-300">Team Collaboration</Link> section.
              </p>
            </div>
            
            {renderNextPrevButtons(
              { path: 'prompt-flow', title: 'Prompt Flow' },
              { path: 'team-collaboration', title: 'Team Collaboration' }
            )}
          </>
        )
      
      case 'team-collaboration':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Team Collaboration</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                promptby.me includes powerful collaboration features that allow teams to work together on projects. 
                This guide explains how to invite team members, manage permissions, and collaborate effectively.
              </p>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Project Sharing</h2>
              <p>
                You can share your projects with team members to collaborate:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Open a project in Project Space</li>
                <li>Click the "Invite" button in the top toolbar</li>
                <li>Enter the email address of the person you want to invite</li>
                <li>Select their role (viewer, editor, or admin)</li>
                <li>Click "Send Invitation"</li>
              </ol>
              
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Team Member Roles</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-green-500/20 p-1 rounded mt-0.5">
                      <Eye size={16} className="text-green-400" />
                    </div>
                    <div>
                      <strong className="text-white">Viewer</strong>
                      <p className="text-zinc-400">Can view the project but cannot make changes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-blue-500/20 p-1 rounded mt-0.5">
                      <Edit size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <strong className="text-white">Editor</strong>
                      <p className="text-zinc-400">Can view and edit nodes and connections, but cannot manage team members</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-purple-500/20 p-1 rounded mt-0.5">
                      <Settings size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <strong className="text-white">Admin</strong>
                      <p className="text-zinc-400">Full access including member management and project settings</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Managing Invitations</h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">For Project Owners/Admins</h3>
              <p>
                As a project owner or admin, you can manage team members:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">View Members</strong> - See all current members and pending invitations</li>
                <li><strong className="text-white">Change Roles</strong> - Update a member's role as needed</li>
                <li><strong className="text-white">Remove Members</strong> - Remove members from the project</li>
                <li><strong className="text-white">Resend Invitations</strong> - Resend invitations that haven't been accepted</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">For Invitees</h3>
              <p>
                When you're invited to a project:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>You'll receive a notification in the app</li>
                <li>Click on the notification icon in the sidebar to view invitations</li>
                <li>Choose to accept or decline each invitation</li>
                <li>Accepted projects will appear in your Project Space dashboard</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Collaborative Editing</h2>
              <p>
                When multiple team members work on the same project:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Real-time Updates</strong> - Changes made by one user are visible to others</li>
                <li><strong className="text-white">Node Ownership</strong> - See who created or last modified each node</li>
                <li><strong className="text-white">Activity Tracking</strong> - View when members were last active in the project</li>
              </ul>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                <h3 className="text-xl font-semibold text-white mb-4">Collaboration Best Practices</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <MessageSquare size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Clear Communication</strong>
                      <p className="text-zinc-400">Use descriptive node titles and comments to explain your thinking</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Users size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Role Assignment</strong>
                      <p className="text-zinc-400">Assign appropriate roles based on team members' responsibilities</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Layout size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Organized Layout</strong>
                      <p className="text-zinc-400">Keep the node layout clean and logical for better team understanding</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Project Visibility</h2>
              <p>
                Project visibility determines who can access your project:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li><strong className="text-white">Private</strong> - Only you and invited team members can access</li>
                <li><strong className="text-white">Team</strong> - All team members can access, but not the public</li>
                <li><strong className="text-white">Public</strong> - Anyone can view the project, but only team members can edit</li>
              </ul>
              <p>
                To change a project's visibility:
              </p>
              <ol className="list-decimal pl-6 space-y-2 my-4">
                <li>Open the project</li>
                <li>Click on the project settings icon</li>
                <li>Select the desired visibility option</li>
                <li>Save changes</li>
              </ol>
              
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Audit Logs</h2>
              <p>
                Project admins can view audit logs to track team activity:
              </p>
              <ul className="list-disc pl-6 space-y-2 my-4">
                <li>Member additions and removals</li>
                <li>Role changes</li>
                <li>Project setting updates</li>
                <li>Major node and connection changes</li>
              </ul>
              <p>
                This helps maintain accountability and track the evolution of your project over time.
              </p>
            </div>
            
            {renderNextPrevButtons(
              { path: 'project-space', title: 'Project Space' },
              { path: 'faq', title: 'FAQ' }
            )}
          </>
        )
      
      case 'faq':
        return (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h1>
            
            <div className="text-zinc-300 space-y-6">
              <p>
                Find answers to common questions about promptby.me and its features.
              </p>
              
              <div className="space-y-8 mt-8">
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">General Questions</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">What is promptby.me?</h4>
                      <p>
                        promptby.me is a platform for creating, managing, and sharing AI prompts. It includes features for prompt versioning, 
                        variable templates, visual prompt design, and team collaboration.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Is promptby.me free to use?</h4>
                      <p>
                        promptby.me offers both free and premium tiers. The free tier includes basic prompt management, 
                        while premium features include team collaboration, advanced prompt flows, and more.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Which AI models does promptby.me support?</h4>
                      <p>
                        In the Playground and Prompt Flow features, promptby.me supports various AI models from providers 
                        including OpenAI, Anthropic, Google, Llama, and Groq. You'll need your own API keys to use these models.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Account & Security</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">How do I change my password?</h4>
                      <p>
                        You can change your password in the Profile settings. Navigate to your profile by clicking on your 
                        avatar in the sidebar, then select the security tab.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Is my data secure?</h4>
                      <p>
                        Yes, promptby.me takes security seriously. Your prompts are stored securely, and API keys are stored 
                        only in your browser's local storage, never on our servers. Private prompts are only visible to you.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">How do I delete my account?</h4>
                      <p>
                        You can delete your account from the Profile settings. This will permanently remove all your data, 
                        including prompts, projects, and account information.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Prompts & Variables</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">What's the difference between public and private prompts?</h4>
                      <p>
                        Private prompts are only visible to you, while public prompts can be viewed by anyone with the link. 
                        Public prompts can also be forked by other users.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">How do I use variables in my prompts?</h4>
                      <p>
                        Variables are added using double curly braces syntax: {{variable_name}}. When you use a prompt with 
                        variables, you'll be prompted to fill in values for each variable.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Can I import prompts from other sources?</h4>
                      <p>
                        Currently, you can create prompts directly in promptby.me or copy-paste from other sources. 
                        We're working on an import feature for future releases.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">What happens when I fork a prompt?</h4>
                      <p>
                        Forking creates a copy of a public prompt in your gallery. You can then edit and modify this copy 
                        without affecting the original. The original creator gets credit via a "forked from" attribution.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Prompt Flows & Projects</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">What's the difference between Prompt Flow and Project Space?</h4>
                      <p>
                        Prompt Flow is a linear, sequential chain of prompts where each step is executed in order. 
                        Project Space is a more flexible, node-based environment where you can create complex flows with 
                        branching logic and multiple paths.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Do I need API keys to use these features?</h4>
                      <p>
                        Yes, to execute Prompt Flows or test nodes in Project Space, you'll need API keys for the AI provider 
                        you want to use (e.g., OpenAI, Anthropic, etc.). These keys are stored securely in your browser.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">How many team members can I invite to a project?</h4>
                      <p>
                        The number of team members depends on your subscription tier. Free accounts have limited collaboration 
                        capabilities, while premium tiers allow for larger teams.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Troubleshooting</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">I'm getting API errors when running prompts</h4>
                      <p>
                        This is usually due to invalid API keys or reaching usage limits. Check that your API keys are correct 
                        and that you have sufficient credits with your AI provider.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">My changes aren't saving</h4>
                      <p>
                        Make sure you're clicking the Save button after making changes. If problems persist, try refreshing 
                        the page or checking your internet connection.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">I can't see my team member's changes</h4>
                      <p>
                        Refresh the page to see the latest changes. If you still don't see updates, check that both you and 
                        your team member have the correct permissions for the project.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Getting Help</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">How do I contact support?</h4>
                      <p>
                        You can reach our support team by emailing support@promptby.me or by using the Help button in the 
                        bottom-right corner of the application.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Are there video tutorials available?</h4>
                      <p>
                        Yes, we have a YouTube channel with tutorial videos covering all major features. You can find the 
                        link in the Help section.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Where can I request new features?</h4>
                      <p>
                        We welcome feature requests! You can submit them through the Feedback form in the Help section or 
                        by emailing features@promptby.me.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-8">
                <h3 className="text-xl font-semibold text-white mb-4">Still Have Questions?</h3>
                <p className="mb-4">
                  If you couldn't find the answer you're looking for, there are several ways to get help:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <Mail size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Email Support</strong>
                      <p className="text-zinc-400">Contact our support team at support@promptby.me</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <MessageSquare size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Community Forum</strong>
                      <p className="text-zinc-400">Join our community forum to connect with other users</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-indigo-500/20 p-1 rounded mt-0.5">
                      <BookOpen size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <strong className="text-white">Documentation</strong>
                      <p className="text-zinc-400">Explore our detailed documentation (you're here!)</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {renderNextPrevButtons(
              { path: 'team-collaboration', title: 'Team Collaboration' },
              undefined
            )}
          </>
        )
      
      default:
        return (
          <div className="text-center py-12">
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8">
              <FileQuestion className="mx-auto text-zinc-500 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">
                Page Not Found
              </h3>
              <p className="text-zinc-400 mb-6">
                The documentation section you're looking for doesn't exist or has been moved.
              </p>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                <ArrowLeft size={16} />
                <span>Back to Documentation</span>
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {renderContent()}
    </div>
  )
}

// Import missing components
import { 
  FileQuestion, 
  AlertTriangle, 
  Rocket, 
  Plus, 
  Minus, 
  FileText, 
  Layout, 
  Mail, 
  MessageSquare, 
  Globe, 
  Edit, 
  Save, 
  EyeOff,
  Code
} from 'lucide-react'