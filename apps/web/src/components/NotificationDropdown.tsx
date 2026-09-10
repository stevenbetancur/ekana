import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, X, Star, Trophy, Users, MessageSquare, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification, NotificationType } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'POINTS_EARNED':
      return <Star className="h-4 w-4 text-yellow-500" />;
    case 'BADGE_EARNED':
      return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'TEAM_INVITE':
      return <Users className="h-4 w-4 text-blue-500" />;
    case 'NEW_MESSAGE':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'GOAL_COMPLETED':
      return <Target className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const NotificationItem = ({
  notification,
  onDelete,
  onClick,
}: {
  notification: Notification;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}) => {
  const isGamification = notification.type === 'POINTS_EARNED' || notification.type === 'BADGE_EARNED';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group',
        'bg-card/80 hover:bg-card',
        !notification.read && 'border-l-2 border-l-primary',
        isGamification && 'bg-secondary/10 hover:bg-secondary/20'
      )}
      onClick={() => onClick(notification)}
    >
      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', !notification.read && 'text-foreground')}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-ekana-white hover:bg-ekana-purple-light relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-popover border shadow-lg z-50">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-1">
            {notifications.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}

            {unreadNotifications.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">New</p>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </>
            )}

            {readNotifications.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2">Earlier</p>
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDelete={deleteNotification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </>
            )}

            {hasMore && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
