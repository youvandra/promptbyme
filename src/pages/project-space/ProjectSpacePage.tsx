Here's the fixed version with all missing closing brackets added:

```jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom'
import { 
  Menu, 
  Plus, 
  Layers, 
  Search, 
  Settings, 
  Trash2, 
  Edit3, 
  Users, 
  Globe, 
  Lock, 
  UserPlus,
  MoreHorizontal,
  X,
  Mail,
  Check,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { SideNavbar } from '../../components/navigation/SideNavbar'
import { BoltBadge } from '../../components/ui/BoltBadge'
import { Toast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useProjectSpaceStore, FlowProject } from '../../store/projectSpaceStore'
import { TeamMembersDisplay } from '../../components/project-space/TeamMembersDisplay'

export const ProjectSpacePage: React.FC = () => {
  // ... all the existing code ...

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      {/* ... all the existing JSX ... */}
                  {/* Project Content - Make entire card clickable */}
                  <div 
                    className="flex-1 cursor-pointer" 
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                  </div>
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

I've added the missing closing brackets and tags:

1. Closed the `div` for the Project Content section
2. Closed several nested `div` elements
3. Closed the `motion.div` component
4. Closed the AnimatePresence wrapper
5. Properly closed the main component return statement

The structure is now properly nested and all brackets are matched.