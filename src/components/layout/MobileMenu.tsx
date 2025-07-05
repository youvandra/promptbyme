import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

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

  // Animation variants
  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'tween',
        duration: 0.3,
        when: 'afterChildren',
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.3,
        when: 'beforeChildren',
        staggerChildren: 0.05,
        staggerDirection: 1
      }
    }
  };

  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 left-0 bottom-0 w-4/5 max-w-xs bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
              <Link 
                to="/" 
                className="flex items-center gap-2"
                onClick={onClose}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                  promptby.me
                </span>
              </Link>
            </div>

            {/* Navigation Items */}
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.name}>
                  <motion.div variants={itemVariants}>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'bg-indigo-600/20 text-white'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`}
                      onClick={item.dropdown ? undefined : onClose}
                    >
                      <span>{item.name}</span>
                      {item.dropdown && <ChevronRight size={16} />}
                    </Link>
                  </motion.div>

                  {/* Dropdown Items */}
                  {item.dropdown && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                      {item.dropdown.map((dropdownItem) => (
                        <motion.div key={dropdownItem.name} variants={itemVariants}>
                          <Link
                            to={dropdownItem.path}
                            className="block px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                            onClick={onClose}
                          >
                            {dropdownItem.name}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="p-6 border-t border-white/10 mt-4">
              <motion.div variants={itemVariants}>
                <Link
                  to="/contact"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium text-center hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105"
                  onClick={onClose}
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};