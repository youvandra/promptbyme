import React from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  Rocket, 
  FileText, 
  History, 
  Play, 
  Folder, 
  Layers, 
  Users, 
  Wand2, 
  HelpCircle,
  Menu,
  X
} from 'lucide-react'

interface DocsSidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentPath: string
}

interface DocSection {
  id: string
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  subsections?: { id: string; title: string }[]
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ isOpen, onToggle, currentPath }) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['prompt-management', 'prompt-flow', 'project-space']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections: DocSection[] = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: BookOpen
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket
    },
    {
      id: 'prompt-management',
      title: 'Prompt Management',
      icon: FileText,
      subsections: [
        { id: 'prompt-management', title: 'Creating & Editing' },
        { id: 'prompt-versioning', title: 'Version History' }
      ]
    },
    {
      id: 'variables',
      title: 'Using Variables',
      icon: Wand2
    },
    {
      id: 'playground',
      title: 'AI Playground',
      icon: Play
    },
    {
      id: 'prompt-flow',
      title: 'Prompt Flow',
      icon: Folder,
      subsections: [
        { id: 'prompt-flow', title: 'Creating Flows' },
        { id: 'prompt-flow-execution', title: 'Executing Flows' }
      ]
    },
    {
      id: 'project-space',
      title: 'Project Space',
      icon: Layers,
      subsections: [
        { id: 'project-space', title: 'Creating Projects' },
        { id: 'team-collaboration', title: 'Team Collaboration' }
      ]
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: HelpCircle
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}
    
      {/* Sidebar */}
      <div 
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50 z-50 w-64 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Documentation</h2>
          </div>
          <button
            onClick={onToggle}
            className="md:hidden p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile toggle button - fixed to the side when sidebar is closed */}
        <button
          onClick={onToggle}
          className={`md:hidden fixed top-20 left-0 bg-indigo-600 text-white p-2 rounded-r-lg shadow-lg z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Menu size={20} />
        </button>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                {section.subsections ? (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        currentPath === section.id
                          ? 'bg-indigo-600/20 text-indigo-300'
                          : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <section.icon size={16} />
                        <span>{section.title}</span>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    
                    {expandedSections.has(section.id) && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <li key={subsection.id}>
                            <Link
                              to={`/docs/${subsection.id}`}
                              onClick={() => {
                                if (window.innerWidth < 768) {
                                  onToggle();
                                }
                              }}
                              className={`block p-2 rounded-lg transition-colors ${
                                currentPath === subsection.id
                                  ? 'bg-indigo-600/20 text-indigo-300'
                                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                              }`}
                            >
                              {subsection.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/docs/${section.id}`}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        onToggle();
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      currentPath === section.id
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <section.icon size={16} />
                    <span>{section.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};