import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Filter,
  Search,
  RotateCcw
} from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

interface PageHeaderPanelProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: ActionButton[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  showFilters?: boolean;
  onFilterClick?: () => void;
  className?: string;
  sticky?: boolean;
  stickyOffset?: number;
}

const PageHeaderPanel: React.FC<PageHeaderPanelProps> = ({
  title,
  subtitle,
  badge,
  actions = [],
  showSearch = false,
  searchPlaceholder = "Cari...",
  onSearch,
  showFilters = false,
  onFilterClick,
  className = "",
  sticky = false,
  stickyOffset = 80
}) => {
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  const getDefaultIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('tambah') || lowerLabel.includes('add') || lowerLabel.includes('baru')) return <Plus className="w-4 h-4" />;
    if (lowerLabel.includes('download')) return <Download className="w-4 h-4" />;
    if (lowerLabel.includes('upload')) return <Upload className="w-4 h-4" />;
    if (lowerLabel.includes('setting') || lowerLabel.includes('atur')) return <Settings className="w-4 h-4" />;
    if (lowerLabel.includes('reset') || lowerLabel.includes('atur ulang')) return <RotateCcw className="w-4 h-4" />;
    return null;
  };

  return (
    <div className={`mb-8 ${className} ${sticky ? 'sticky bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm' : ''}`} 
         style={sticky ? { top: `${stickyOffset}px`, zIndex: 50 } : {}}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-600 mt-2">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Filter Button */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          )}

          {/* Action Buttons */}
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex items-center gap-2"
            >
              {action.icon || getDefaultIcon(action.label)}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageHeaderPanel; 