import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Eye, 
  Search, 
  Filter,
  RotateCcw,
  Save,
  X,
  Check,
  Clock,
  AlertTriangle,
  Info,
  Mail,
  Copy,
  Share,
  Star,
  Heart,
  Bookmark,
  Settings,
  User,
  Users,
  Building2,
  FileText,
  Folder,
  Calendar,
  BarChart3,
  TrendingUp,
  Zap
} from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  tooltip?: string;
}

interface IconButtonProps extends ActionButtonProps {
  action: 'add' | 'edit' | 'delete' | 'download' | 'upload' | 'view' | 'search' | 'filter' | 'reset' | 'save' | 'close' | 'check' | 'pending' | 'warning' | 'info' | 'mail' | 'copy' | 'share' | 'star' | 'heart' | 'bookmark' | 'settings' | 'user' | 'users' | 'building' | 'file' | 'folder' | 'calendar' | 'chart' | 'trend' | 'zap' | 'custom';
  label?: string;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(({
  onClick,
  variant = 'default',
  size = 'default',
  disabled = false,
  isLoading = false,
  loadingText = 'Memproses...',
  type = 'button',
  className = '',
  children,
  icon,
  iconPosition = 'left',
  tooltip
}, ref) => {
  const buttonContent = (
    <>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </div>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      title={tooltip}
    >
      {buttonContent}
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';

const IconButton: React.FC<IconButtonProps> = ({
  action,
  label,
  onClick,
  variant = 'default',
  size = 'icon',
  disabled = false,
  isLoading = false,
  loadingText = 'Memproses...',
  type = 'button',
  className = '',
  icon: customIcon,
  tooltip
}) => {
  const getActionIcon = () => {
    if (customIcon) return customIcon;
    
    switch (action) {
      case 'add':
        return <Plus className="w-4 h-4" />;
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;

      case 'search':
        return <Search className="w-4 h-4" />;
      case 'filter':
        return <Filter className="w-4 h-4" />;
      case 'reset':
        return <RotateCcw className="w-4 h-4" />;
      case 'save':
        return <Save className="w-4 h-4" />;
      case 'close':
        return <X className="w-4 h-4" />;
      case 'check':
        return <Check className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'mail':
        return <Mail className="w-4 h-4" />;
      case 'copy':
        return <Copy className="w-4 h-4" />;
      case 'share':
        return <Share className="w-4 h-4" />;
      case 'star':
        return <Star className="w-4 h-4" />;
      case 'heart':
        return <Heart className="w-4 h-4" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'users':
        return <Users className="w-4 h-4" />;
      case 'building':
        return <Building2 className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'folder':
        return <Folder className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'chart':
        return <BarChart3 className="w-4 h-4" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'zap':
        return <Zap className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getDefaultVariant = () => {
    switch (action) {
      case 'delete':
        return 'destructive';
      case 'add':
        return 'default';
      case 'edit':
        return 'outline';

      default:
        return variant;
    }
  };

  const getDefaultTooltip = () => {
    if (tooltip) return tooltip;
    
    switch (action) {
      case 'add':
        return 'Tambah Baru';
      case 'edit':
        return 'Edit';
      case 'delete':
        return 'Hapus';
      case 'download':
        return 'Download';
      case 'upload':
        return 'Upload';

      case 'search':
        return 'Cari';
      case 'filter':
        return 'Filter';
      case 'reset':
        return 'Reset';
      case 'save':
        return 'Simpan';
      case 'close':
        return 'Tutup';
      case 'check':
        return 'Centang';
      case 'pending':
        return 'Menunggu';
      case 'warning':
        return 'Peringatan';
      case 'info':
        return 'Informasi';
      case 'mail':
        return 'Email';
      case 'copy':
        return 'Salin';
      case 'share':
        return 'Bagikan';
      case 'star':
        return 'Favorit';
      case 'heart':
        return 'Suka';
      case 'bookmark':
        return 'Bookmark';
      case 'settings':
        return 'Pengaturan';
      case 'user':
        return 'User';
      case 'users':
        return 'Users';
      case 'building':
        return 'Building';
      case 'file':
        return 'File';
      case 'folder':
        return 'Folder';
      case 'calendar':
        return 'Kalender';
      case 'chart':
        return 'Chart';
      case 'trend':
        return 'Trend';
      case 'zap':
        return 'Zap';
      default:
        return label || 'Aksi';
    }
  };

  return (
    <ActionButton
      onClick={onClick}
      variant={getDefaultVariant()}
      size={size}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      type={type}
      className={className}
      icon={getActionIcon()}
      tooltip={getDefaultTooltip()}
    >
      {label}
    </ActionButton>
  );
};

export { ActionButton, IconButton };
export default ActionButton; 