import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface PenjelasanAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  placeholder?: string;
}

const PenjelasanAutocomplete: React.FC<PenjelasanAutocompleteProps> = ({
  id,
  value,
  onChange,
  onKeyDown,
  className = "",
  placeholder = "Masukkan penjelasan..."
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Standard penjelasan options
  const penjelasanOptions = [
    'Sangat Baik',
    'Baik', 
    'Cukup Baik',
    'Kurang Baik',
    'Tidak Baik'
  ];

  // Filter suggestions based on input value
  useEffect(() => {
    if (!isFocused) {
      setShowSuggestions(false);
      return;
    }

    // Show all options when focused, filter if user has typed something
    const filtered = value.trim() === '' 
      ? penjelasanOptions // Show all when empty
      : penjelasanOptions.filter(option => 
          option.toLowerCase().includes(value.toLowerCase())
        );

    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Get filtered suggestions for keyboard navigation
    const filtered = value.trim() === '' 
      ? penjelasanOptions 
      : penjelasanOptions.filter(option => 
          option.toLowerCase().includes(value.toLowerCase())
        );

    // Handle autocomplete-specific keys first
    if (showSuggestions && filtered.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSelectedIndex(prev => 
              prev < filtered.length - 1 ? prev + 1 : 0
            );
            return;
          }
          break;
        case 'ArrowUp':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSelectedIndex(prev => 
              prev > 0 ? prev - 1 : filtered.length - 1
            );
            return;
          }
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filtered.length) {
            e.preventDefault();
            handleSuggestionClick(filtered[selectedIndex]);
            return;
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          return;
      }
    }
    
    // Call parent onKeyDown for table navigation
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Don't immediately hide on blur - let click outside handle it
    // This allows clicking on suggestions
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Get color class based on penjelasan value
  const getColorClass = (penjelasan: string) => {
    switch (penjelasan) {
      case 'Sangat Baik': return 'bg-green-100 text-green-800';
      case 'Baik': return 'bg-blue-100 text-blue-800';
      case 'Cukup Baik': return 'bg-yellow-100 text-yellow-800';
      case 'Kurang Baik': return 'bg-orange-100 text-orange-800';
      case 'Tidak Baik': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get filtered suggestions for rendering
  const filteredSuggestions = value.trim() === '' 
    ? penjelasanOptions 
    : penjelasanOptions.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
      );

  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleInternalKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        placeholder={showSuggestions ? '' : placeholder}
        autoComplete="off"
        style={{ position: 'relative', zIndex: 1 }}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-[99999] max-h-48 overflow-y-auto shadow-xl border border-gray-200 bg-white min-w-[200px]" style={{ backgroundColor: 'white', position: 'relative', zIndex: 99999 }}>
          {filteredSuggestions.map((option, index) => (
            <div
              key={option}
              ref={el => suggestionRefs.current[index] = el}
              className={`p-2 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSuggestionClick(option)}
            >
              <div className="flex items-center justify-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClass(option)}`}>
                  {option}
                </span>
              </div>
            </div>
          ))}
          <div className="p-2 text-xs text-gray-500 text-center border-t bg-gray-50">
            ↑↓ navigasi, Enter pilih, Esc tutup
          </div>
        </Card>
      )}
    </div>
  );
};

export default PenjelasanAutocomplete;