import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, User } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  avatarUrl?: string | null;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white hover:border-zinc-600/50 transition-all duration-200"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.avatarUrl ? (
                <img 
                  src={selectedOption.avatarUrl} 
                  alt={selectedOption.label}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-indigo-600/20 rounded-full flex items-center justify-center">
                  <User size={14} className="text-indigo-400" />
                </div>
              )}
              <span className="text-sm truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-sm text-zinc-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-full max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              {/* Unassigned option */}
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                  value === '' 
                    ? 'bg-indigo-600/20 text-indigo-300' 
                    : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <div className="w-6 h-6 bg-zinc-800/50 rounded-full flex items-center justify-center">
                  <User size={14} className="text-zinc-400" />
                </div>
                <span className="text-sm">Unassigned</span>
                {value === '' && (
                  <Check size={14} className="ml-auto text-indigo-400" />
                )}
              </button>
              
              {/* Member options */}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    value === option.value 
                      ? 'bg-indigo-600/20 text-indigo-300' 
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  {option.avatarUrl ? (
                    <img 
                      src={option.avatarUrl} 
                      alt={option.label}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-indigo-600/20 rounded-full flex items-center justify-center">
                      <User size={14} className="text-indigo-400" />
                    </div>
                  )}
                  <span className="text-sm truncate">{option.label}</span>
                  {value === option.value && (
                    <Check size={14} className="ml-auto text-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};