# promptby.me

**Design before you prompt** — A modern platform for mapping, structuring, and sharing AI prompts with your team.

![promptby.me](https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-blue)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC)
![Framer Motion](https://img.shields.io/badge/Animations-Framer%20Motion-FF0055)

## ✨ Features

### 🎯 **Prompt Management**
- Create, edit, and organize AI prompts with markdown support
- Public/private visibility controls
- Rich text formatting with code blocks and syntax highlighting
- Tagging and categorization system

### 🔄 **Collaboration & Sharing**
- Fork prompts to create your own variations
- Like and bookmark community prompts
- Share prompts via direct links
- Team collaboration features

### 📊 **Analytics & Insights**
- View counts and engagement metrics
- Fork tracking for prompt evolution
- Personal gallery with filtering and search
- Usage statistics and trends

### 🎨 **Modern UI/UX**
- Cinematic scroll-based landing page
- Liquid glass morphism design
- Fully responsive across all devices (mobile to ultrawide)
- Dark theme with subtle neon accents
- Smooth animations and micro-interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/promptby-me.git
   cd promptby-me
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   ```bash
   # If using Supabase CLI
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Secure data access policies
- **Real-time subscriptions** - Live updates across clients

### State Management
- **Zustand** - Lightweight state management
- **React Query patterns** - Server state synchronization

### UI Components
- **Lucide React** - Beautiful icon library
- **Marked** - Markdown parsing and rendering
- **Custom glass morphism components** - Unique visual design

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── PromptCard.tsx  # Prompt display component
│   ├── SideNavbar.tsx  # Navigation sidebar
│   └── ...
├── pages/              # Main application pages
│   ├── HomePage.tsx    # Landing and prompt creation
│   ├── GalleryPage.tsx # User's prompt collection
│   ├── ProfilePage.tsx # User profile management
│   └── SharedPromptPage.tsx # Public prompt viewing
├── store/              # State management
│   ├── authStore.ts    # Authentication state
│   ├── promptStore.ts  # Prompt data management
│   └── likeStore.ts    # Like/bookmark functionality
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client setup
└── styles/             # Global styles and themes
```

## 🗄️ Database Schema

### Core Tables

**prompts**
- `id` - Unique identifier
- `user_id` - Creator reference
- `title` - Optional prompt title
- `content` - Prompt text (markdown)
- `access` - public/private visibility
- `tags` - Categorization array
- `views`, `like_count`, `fork_count` - Engagement metrics
- `original_prompt_id` - For forked prompts

**users**
- `id` - User identifier (linked to auth.users)
- `email`, `display_name`, `role` - Profile information
- `avatar_url` - Profile image
- `created_at`, `updated_at` - Timestamps

**likes**
- `user_id`, `prompt_id` - Like relationships
- Unique constraint prevents duplicate likes

## 🎨 Design System

### Color Palette
- **Primary**: Indigo/Purple gradients
- **Background**: Zinc-950 to Zinc-900
- **Glass Effects**: Semi-transparent whites with blur
- **Accents**: Emerald (success), Red (danger), Amber (warning)

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: 5xl/4xl/3xl for headings, base/sm for body
- **Code**: SF Mono, Monaco, Cascadia Code

### Components
- **Glass Panels**: Backdrop blur with subtle borders
- **Buttons**: Hover animations with scale transforms
- **Cards**: Floating shadows with glass morphism
- **Forms**: Focus states with color transitions

## 🔐 Security Features

### Authentication
- Email/password authentication via Supabase Auth
- Secure session management
- Password strength validation

### Authorization
- Row Level Security (RLS) policies
- User-scoped data access
- Public/private content controls

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection via Supabase

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (stack layout, touch-optimized)
- **Tablet**: 640px - 1024px (adaptive grid)
- **Desktop**: 1024px - 1440px (standard layout)
- **Ultrawide**: > 1440px (expanded with background elements)

### Features
- Mobile-first CSS approach
- Touch-friendly interactions
- Collapsible navigation
- Optimized typography scaling

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality
- **ESLint** - Code linting with React rules
- **TypeScript** - Static type checking
- **Prettier** - Code formatting (recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure responsive design across all breakpoints
- Test authentication flows
- Maintain accessibility standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - For the excellent backend infrastructure
- **Tailwind CSS** - For the utility-first CSS framework
- **Framer Motion** - For smooth animations
- **Lucide** - For the beautiful icon set
- **Linear, Notion, macOS** - Design inspiration

## 📞 Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues](https://github.com/yourusername/promptby-me/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/promptby-me/discussions)

---

**Built with ❤️ by the promptby.me team**

*Design before you prompt — Map your next build with structured, reusable prompts.*