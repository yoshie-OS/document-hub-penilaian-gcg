import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface GCGMappingItem {
  level: string;
  type: string;
  section: string;
  no: string;
  deskripsi: string;
  jumlah_parameter: string;
  bobot: string;
}

interface DeskripsiAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  placeholder?: string;
  filterType?: 'header' | 'indicator' | 'all';
}

const DeskripsiAutocomplete: React.FC<DeskripsiAutocompleteProps> = ({
  id,
  value,
  onChange,
  onKeyDown,
  className = "",
  placeholder = "Deskripsi penilaian...",
  filterType = 'all'
}) => {
  const [suggestions, setSuggestions] = useState<GCGMappingItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gcgData, setGcgData] = useState<GCGMappingItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load GCG mapping data on mount
  useEffect(() => {
    const loadGCGData = async () => {
      try {
        const response = await fetch('/api/gcg-mapping');
        if (!response.ok) {
          console.warn('GCG mapping API not available, using fallback data');
          setFallbackData();
          return;
        }
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
          setGcgData(apiResponse.data);
        } else {
          console.warn('GCG mapping API returned error:', apiResponse.error);
          setFallbackData();
        }
      } catch (error) {
        console.warn('Failed to load GCG mapping data:', error);
        setFallbackData();
      }
    };

    const setFallbackData = () => {
      // Fallback data - headers and indicators
      setGcgData([
        // Headers
        { level: '1', type: 'header', section: 'I', no: '0', deskripsi: 'KOMITMEN TERHADAP PENERAPAN TATA KELOLA PERUSAHAAN YANG BAIK SECARA BERKELANJUTAN', jumlah_parameter: '', bobot: '' },
        { level: '1', type: 'header', section: 'II', no: '0', deskripsi: 'PEMEGANG SAHAM DAN RUPS/PEMILIK MODAL', jumlah_parameter: '', bobot: '' },
        { level: '1', type: 'header', section: 'III', no: '0', deskripsi: 'DEWAN KOMISARIS/DEWAN PENGAWAS', jumlah_parameter: '', bobot: '' },
        { level: '1', type: 'header', section: 'IV', no: '0', deskripsi: 'DIREKSI', jumlah_parameter: '', bobot: '' },
        { level: '1', type: 'header', section: 'V', no: '0', deskripsi: 'PENGUNGKAPAN INFORMASI DAN TRANSPARANSI', jumlah_parameter: '', bobot: '' },
        { level: '1', type: 'header', section: 'VI', no: '0', deskripsi: 'PELAKSANAAN TANGGUNG JAWAB SOSIAL PERUSAHAAN', jumlah_parameter: '', bobot: '' },
        // Indicators
        { level: '2', type: 'indicator', section: 'I', no: '1', deskripsi: 'Perusahaan memiliki Pedoman Tata Kelola Perusahaan yang Baik (GCG Code) dan pedoman perilaku (code of conduct ).', jumlah_parameter: '2', bobot: '1.218' },
        { level: '2', type: 'indicator', section: 'I', no: '2', deskripsi: 'Perusahaan melaksanakan Pedoman Tata Kelola Perusahaan yang Baik dan Pedoman Perilaku secara konsisten.', jumlah_parameter: '2', bobot: '1.217' },
        { level: '2', type: 'indicator', section: 'I', no: '3', deskripsi: 'Perusahaan melakukan pengukuran terhadap penerapan Tata Kelola Perusahaan yang Baik.', jumlah_parameter: '2', bobot: '0.608' },
        { level: '2', type: 'indicator', section: 'II', no: '7', deskripsi: 'RUPS/Pemilik Modal melakukan pengangkatan dan pemberhentian Direksi .', jumlah_parameter: '6', bobot: '2.423' },
        { level: '2', type: 'indicator', section: 'III', no: '13', deskripsi: 'Dewan Komisaris/Dewan Pengawas melaksanakan program pelatihan/pembelajaran secara berkelanjutan.', jumlah_parameter: '2', bobot: '1.348' },
        { level: '2', type: 'indicator', section: 'IV', no: '25', deskripsi: 'Direksi melaksanakan program pelatihan/pembelajaran secara berkelanjutan.', jumlah_parameter: '2', bobot: '1.089' }
      ]);
    };

    loadGCGData();
  }, []);

  // Filter suggestions based on input value
  useEffect(() => {
    // Only show suggestions if the input is focused AND has 2+ characters
    if (!isFocused || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = gcgData
      .filter(item => {
        // Filter by type based on filterType parameter
        const typeMatch = filterType === 'all' || item.type === filterType;
        // Filter by search text
        const textMatch = item.deskripsi.toLowerCase().includes(value.toLowerCase());
        return typeMatch && textMatch;
      })
      .slice(0, 8); // Limit to 8 suggestions

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 && value.trim() !== '');
    setSelectedIndex(-1);
  }, [value, gcgData, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };


  const handleSuggestionClick = (suggestion: GCGMappingItem) => {
    onChange(suggestion.deskripsi);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle autocomplete-specific keys first
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          if (!e.ctrlKey && !e.metaKey) {  // Only if not part of navigation
            e.preventDefault();
            setSelectedIndex(prev => 
              prev < suggestions.length - 1 ? prev + 1 : 0
            );
            return; // Don't call parent onKeyDown
          }
          break;
        case 'ArrowUp':
          if (!e.ctrlKey && !e.metaKey) {  // Only if not part of navigation
            e.preventDefault();
            setSelectedIndex(prev => 
              prev > 0 ? prev - 1 : suggestions.length - 1
            );
            return; // Don't call parent onKeyDown
          }
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            handleSuggestionClick(suggestions[selectedIndex]);
            return; // Don't call parent onKeyDown
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          return; // Don't call parent onKeyDown
      }
    }
    
    // Call parent onKeyDown for navigation
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
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-[99999] max-h-64 overflow-y-auto shadow-xl border border-gray-200 bg-white min-w-[400px]" style={{ backgroundColor: 'white', position: 'relative', zIndex: 99999 }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.section}-${suggestion.no}`}
              ref={el => suggestionRefs.current[index] = el}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {suggestion.section}.{suggestion.no}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-tight">
                    {suggestion.deskripsi}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      Bobot: {suggestion.bobot}
                    </span>
                    <span className="text-xs text-gray-500">
                      Parameter: {suggestion.jumlah_parameter}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="p-2 text-xs text-gray-500 text-center border-t bg-gray-50">
            Gunakan ↑↓ untuk navigasi, Enter untuk pilih, Esc untuk tutup
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeskripsiAutocomplete;