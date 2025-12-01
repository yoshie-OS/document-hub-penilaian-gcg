import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconButton } from './ActionButton';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Copy, 
  Share, 
  Mail,
  Archive,
  Star,
  Bookmark
} from 'lucide-react';

interface TableAction {
  label: string;
  action: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
  separator?: boolean;
}

interface TableActionsProps {
  actions: TableAction[];
  variant?: 'buttons' | 'dropdown' | 'mixed';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TableActions: React.FC<TableActionsProps> = ({
  actions,
  variant = 'dropdown',
  showLabels = false,
  size = 'sm',
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;

      case 'copy':
        return <Copy className="w-4 h-4" />;
      case 'share':
        return <Share className="w-4 h-4" />;
      case 'mail':
        return <Mail className="w-4 h-4" />;
      case 'archive':
        return <Archive className="w-4 h-4" />;
      case 'star':
        return <Star className="w-4 h-4" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'delete':
        return 'destructive';
      case 'edit':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {actions.map((item, index) => (
          <IconButton
            key={index}
            action={item.action as any}
            onClick={item.onClick}
            variant={item.variant || getActionVariant(item.action)}
            size={size}
            disabled={item.disabled}
            label={showLabels ? item.label : undefined}
            tooltip={item.label}
          />
        ))}
      </div>
    );
  }

  if (variant === 'mixed') {
    const primaryActions = actions.slice(0, 2);
    const secondaryActions = actions.slice(2);

    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Primary actions as buttons */}
        {primaryActions.map((item, index) => (
          <IconButton
            key={index}
            action={item.action as any}
            onClick={item.onClick}
            variant={item.variant || getActionVariant(item.action)}
            size={size}
            disabled={item.disabled}
            label={showLabels ? item.label : undefined}
            tooltip={item.label}
          />
        ))}

        {/* Secondary actions in dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((item, index) => (
                <React.Fragment key={index}>
                  {item.separator && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                    disabled={item.disabled}
                    className={item.variant === 'destructive' ? 'text-red-600' : ''}
                  >
                    {item.icon || getActionIcon(item.action)}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`h-8 w-8 p-0 ${className}`}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={item.variant === 'destructive' ? 'text-red-600' : ''}
            >
              {item.icon || getActionIcon(item.action)}
              <span className="ml-2">{item.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableActions; 