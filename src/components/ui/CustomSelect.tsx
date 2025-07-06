import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
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
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border-2 border-black rounded-[28px] text-black hover:bg-gray-100 transition-all duration-200 shadow-neo-brutalism-sm"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className="text-sm truncate text-black">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-sm text-gray-600">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-600 transition-transform duration-200 ${
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
            className="absolute top-full left-0 mt-2 bg-white border-2 border-black rounded-xl shadow-neo-brutalism z-50 w-full max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    value === option.value 
                      ? 'bg-highlight text-black border-2 border-black shadow-neo-brutalism-sm' 
                      : 'text-black hover:bg-gray-200'
                  }`}
                >
                  {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                  <span className="text-sm">{option.label}</span>
                  {value === option.value && (
                    <Check size={14} className="ml-auto text-black" />
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