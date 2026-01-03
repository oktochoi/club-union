'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'reservation_approved' | 'reservation_rejected' | 'new_notice' | 'suggestion_replied' | 'rental_approved' | 'rental_rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 실시간 알림 확인
  useEffect(() => {
    const interval = setInterval(() => {
      const userNotifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
      
      if (userNotifications.length > 0) {
        const newNotifications = userNotifications.map((notif: any) => {
          let title = '';
          let message = '';
          
          switch (notif.type) {
            case 'reservation_approved':
              title = '예약 승인됨';
              message = `${notif.data.facility} 예약이 승인되었습니다 (${notif.data.date} ${notif.data.time})`;
              break;
            case 'reservation_rejected':
              title = '예약 거절됨';
              message = `${notif.data.facility} 예약이 거절되었습니다. 사유: ${notif.data.rejectionReason}`;
              break;
            case 'rental_approved':
              title = '대여 승인됨';
              message = `${notif.data.item} 대여가 승인되었습니다`;
              break;
            case 'rental_rejected':
              title = '대여 거절됨';
              message = `${notif.data.item} 대여가 거절되었습니다. 사유: ${notif.data.rejectionReason}`;
              break;
            case 'new_notice':
              title = '새 공지사항';
              message = notif.data.title;
              break;
            case 'suggestion_replied':
              title = '건의사항 답변';
              message = `"${notif.data.title}" 건의사항에 답변이 등록되었습니다`;
              break;
            default:
              title = '알림';
              message = '새로운 알림이 있습니다';
          }
          
          return {
            id: `${notif.type}_${notif.timestamp}`,
            type: notif.type,
            title,
            message,
            timestamp: notif.timestamp,
            read: false,
            data: notif.data
          };
        });
        
        setNotifications(prev => {
          const existingIds = prev.map(n => n.id);
          const filteredNew = newNotifications.filter((n: Notification) => !existingIds.includes(n.id));
          
          if (filteredNew.length > 0) {
            // 브라우저 알림 표시
            if (Notification.permission === 'granted') {
              filteredNew.forEach((notif: Notification) => {
                new Notification(notif.title, {
                  body: notif.message,
                  icon: '/favicon.ico'
                });
              });
            }
            
            return [...filteredNew, ...prev].slice(0, 50); // 최대 50개만 유지
          }
          
          return prev;
        });
        
        // 처리된 알림 제거
        localStorage.removeItem('userNotifications');
      }
    }, 2000);

    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  // 읽지 않은 알림 수 계산
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation_approved':
        return 'ri-check-line text-green-600';
      case 'reservation_rejected':
        return 'ri-close-line text-red-600';
      case 'rental_approved':
        return 'ri-tools-line text-green-600';
      case 'rental_rejected':
        return 'ri-tools-line text-red-600';
      case 'new_notice':
        return 'ri-notification-3-line text-blue-600';
      case 'suggestion_replied':
        return 'ri-chat-3-line text-purple-600';
      default:
        return 'ri-information-line text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="relative">
      <button
        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">알림</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  모두 읽음
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  모두 삭제
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <i className="ri-notification-off-line text-4xl mb-2"></i>
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 ml-2 flex-shrink-0"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button 
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                알림창 닫기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}