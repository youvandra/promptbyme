import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap } from 'lucide-react';

interface NavbarProps {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  isScrolled, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}) => {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Navigation items with dropdowns
  const navItems = [
    { 
      name: 'Home', 
      path: '/' 
    },
    { 
      name: 'Features', 
      path: '/features',
      dropdown: [
        { name: 'Core Features', path: '/features#core' },
        { name: 'Integrations', path: '/features#integrations' },
        { name: 'Enterprise', path: '/features#enterprise' },
      ]
    },
    { 
      name: 'Pricing', 
      path: '/pricing' 
    },
    { 
      name: 'About', 
      path: '/about',
      dropdown: [
        { name: 'Our Story', path: '/about#story' },
        { name: 'Team', path: '/about#team' },
        { name: 'Careers', path: '/about#careers' },
      ]
    },
    { 
      name: 'Contact', 
      path: '/contact' 
    },
  ];

  const toggleDropdown = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-zinc-900/80 backdrop-blur-lg border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              Glassmorphic
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                {item.dropdown ? (
                  <button
                    onClick={(e) => toggleDropdown(e, item.name)}
                    className={`px-3 py-2 rounded-lg text-sm lg:text-base font-medium flex items-center gap-1 transition-all duration-200 ${
                      location.pathname === item.path || activeDropdown === item.name
                        ? 'text-white bg-white/10'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.name}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'text-white bg-white/10'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {item.dropdown && activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-48 rounded-xl bg-zinc-800/90 backdrop-blur-lg border border-white/10 shadow-xl overflow-hidden z-50"
                    >
                      <div className="py-1">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            to={dropdownItem.path}
                            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-indigo-600/20 hover:text-white transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              to="/contact"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};