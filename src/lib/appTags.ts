import { 
  Bot, 
  MessageSquare, 
  Image, 
  Code, 
  Palette, 
  Music, 
  Video, 
  FileText, 
  Search, 
  Zap,
  Brain,
  Sparkles,
  Camera,
  Mic,
  Globe,
  Database,
  Terminal,
  Layers,
  PenTool,
  Wand2
} from 'lucide-react'

export interface AppTag {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  category: 'ai-chat' | 'image' | 'code' | 'design' | 'content' | 'other'
  runUrl?: string
}

export const APP_TAGS: AppTag[] = [
  // AI Chat & Assistants
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: MessageSquare,
    color: '#10a37f',
    category: 'ai-chat',
    runUrl: 'https://chat.openai.com/?q='
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: Bot,
    color: '#d97706',
    category: 'ai-chat',
    runUrl: 'https://claude.ai/new?q='
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: Sparkles,
    color: '#4285f4',
    category: 'ai-chat',
    runUrl: 'https://gemini.google.com/'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: Search,
    color: '#20b2aa',
    category: 'ai-chat',
    runUrl: 'https://www.perplexity.ai/search?q='
  },
  
  // Development & Code
  {
    id: 'bolt',
    name: 'Bolt',
    icon: Zap,
    color: '#6366f1',
    category: 'code',
    runUrl: 'https://bolt.new/'
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: Terminal,
    color: '#000000',
    category: 'code',
    runUrl: 'https://cursor.sh/'
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    icon: Code,
    color: '#24292e',
    category: 'code',
    runUrl: 'https://github.com/features/copilot'
  },
  {
    id: 'replit',
    name: 'Replit',
    icon: Layers,
    color: '#f26207',
    category: 'code',
    runUrl: 'https://replit.com/'
  },
  
  // Image & Visual AI
  {
    id: 'midjourney',
    name: 'Midjourney',
    icon: Image,
    color: '#000000',
    category: 'image',
    runUrl: 'https://www.midjourney.com/'
  },
  {
    id: 'dall-e',
    name: 'DALL-E',
    icon: Palette,
    color: '#10a37f',
    category: 'image',
    runUrl: 'https://openai.com/dall-e-2/'
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    icon: Camera,
    color: '#7c3aed',
    category: 'image',
    runUrl: 'https://stability.ai/'
  },
  {
    id: 'leonardo',
    name: 'Leonardo AI',
    icon: PenTool,
    color: '#8b5cf6',
    category: 'image',
    runUrl: 'https://leonardo.ai/'
  },
  
  // Design Tools
  {
    id: 'figma',
    name: 'Figma',
    icon: PenTool,
    color: '#f24e1e',
    category: 'design',
    runUrl: 'https://www.figma.com/'
  },
  {
    id: 'canva',
    name: 'Canva',
    icon: Palette,
    color: '#00c4cc',
    category: 'design',
    runUrl: 'https://www.canva.com/'
  },
  
  // Content & Writing
  {
    id: 'notion',
    name: 'Notion AI',
    icon: FileText,
    color: '#000000',
    category: 'content',
    runUrl: 'https://www.notion.so/'
  },
  {
    id: 'jasper',
    name: 'Jasper',
    icon: Wand2,
    color: '#8b5cf6',
    category: 'content',
    runUrl: 'https://www.jasper.ai/'
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    icon: FileText,
    color: '#6366f1',
    category: 'content',
    runUrl: 'https://www.copy.ai/'
  },
  
  // Audio & Video
  {
    id: 'suno',
    name: 'Suno',
    icon: Music,
    color: '#ff6b6b',
    category: 'other',
    runUrl: 'https://suno.ai/'
  },
  {
    id: 'runway',
    name: 'Runway',
    icon: Video,
    color: '#000000',
    category: 'other',
    runUrl: 'https://runwayml.com/'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    icon: Mic,
    color: '#000000',
    category: 'other',
    runUrl: 'https://elevenlabs.io/'
  },
  
  // Other
  {
    id: 'custom',
    name: 'Custom',
    icon: Globe,
    color: '#6b7280',
    category: 'other',
    runUrl: undefined
  }
]

export const getAppTagById = (id: string): AppTag | undefined => {
  return APP_TAGS.find(tag => tag.id === id)
}

export const getAppTagsByCategory = (category: AppTag['category']): AppTag[] => {
  return APP_TAGS.filter(tag => tag.category === category)
}

export const APP_TAG_CATEGORIES = [
  { id: 'ai-chat', name: 'AI Chat & Assistants' },
  { id: 'code', name: 'Development & Code' },
  { id: 'image', name: 'Image & Visual AI' },
  { id: 'design', name: 'Design Tools' },
  { id: 'content', name: 'Content & Writing' },
  { id: 'other', name: 'Other Tools' }
] as const