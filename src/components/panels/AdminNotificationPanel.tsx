import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Notification } from '@/types/admin';

interface AdminNotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: number) => void;
  onMarkAllAsRead: () => void;
  className?: string;
}

const AdminNotificationPanel: React.FC<AdminNotificationPanelProps> = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  className = ""
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      case 'feedback':
        return <CheckCircle className="w-4 h-4" />;
      case 'support':
        return <MessageSquare className="w-4 h-4" />;
      case 'system':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50 border-red-200';
    if (priority === 'high') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (priority === 'medium') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  if (notifications.length === 0) {
    return (
      <Card className={`mb-6 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Bell className="h-5 w-5" />
            <span>Notifikasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada notifikasi</p>
            <p className="text-sm text-gray-500 mt-1">
              Notifikasi akan muncul di sini saat ada update
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Bell className="h-5 w-5" />
            <span>Notifikasi</span>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white">
                {unreadCount} baru
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-sm"
            >
              Tandai semua sudah dibaca
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                ${notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}
                ${getNotificationColor(notification.type, notification.priority)}
              `}
              onClick={() => onNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(notification.priority)}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="text-xs h-6 px-2"
                      >
                        Tandai dibaca
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {notifications.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="text-sm">
              Lihat semua notifikasi ({notifications.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminNotificationPanel;
