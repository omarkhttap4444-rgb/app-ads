'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Heart, 
  UserPlus, 
  Star, 
  MessageSquare, 
  CheckCheck, 
  Clock, 
  Trash2,
  AlertCircle 
} from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // 1. Check user auth
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/notifications');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  // 2. Fetch notifications list
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (notifs) {
        setNotifications(notifs);

        // Fetch sender profiles
        const senderIds = Array.from(
          new Set(
            notifs
              .map((n) => n.sender_id)
              .filter((id) => id !== null)
          )
        );

        if (senderIds.length > 0) {
          const { data: userProfiles, error: profileErr } = await supabase
            .from('users')
            .select('id, name, profile_image_url')
            .in('id', senderIds);

          if (!profileErr && userProfiles) {
            const profilesMap: { [key: string]: any } = {};
            userProfiles.forEach((p) => {
              profilesMap[p.id] = p;
            });
            setProfiles((prev) => ({ ...prev, ...profilesMap }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // 3. Subscribe to new notifications in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);

          // Fetch new sender profile if missing
          if (newNotif.sender_id && !profiles[newNotif.sender_id]) {
            const { data: senderProfile } = await supabase
              .from('users')
              .select('id, name, profile_image_url')
              .eq('id', newNotif.sender_id)
              .single();
            if (senderProfile) {
              setProfiles((prev) => ({ ...prev, [senderProfile.id]: senderProfile }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profiles]);

  // 4. Mark all as read
  const handleMarkAllRead = async () => {
    if (!user || markingAll) return;
    setMarkingAll(true);
    try {
      const { data, error } = await supabase.rpc('mark_all_notifications_as_read');
      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  // 5. Handle click (Mark as read + navigate)
  const handleNotificationClick = async (notif: any) => {
    // 1. Mark as read in DB if it's unread
    if (!notif.is_read) {
      try {
        await supabase.rpc('mark_notification_as_read', {
          p_notification_id: notif.id,
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }

    // 2. Navigate based on type and reference_id
    if (!notif.reference_id) return;

    try {
      if (notif.type === 'message') {
        // Find conversation ID for this message
        const { data: msg } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('id', notif.reference_id)
          .single();

        if (msg) {
          router.push(`/chat?id=${msg.conversation_id}`);
        } else {
          router.push('/chat');
        }
      } else if (notif.type === 'like' || notif.type === 'product') {
        // Get product slug
        const { data: prod } = await supabase
          .from('products')
          .select('slug')
          .eq('id', notif.reference_id)
          .single();

        if (prod) {
          router.push(`/mobiles/${prod.slug}`);
        }
      } else if (notif.type === 'follow') {
        // Navigate to follower profile page
        router.push(`/store/${notif.reference_id}`);
      } else if (notif.type === 'rating') {
        // Navigate to own profile
        router.push(`/store/${user.id}`);
      }
    } catch (err) {
      console.error('Redirection error:', err);
    }
  };

  // Delete individual notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from triggering parent handleNotificationClick
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Icon selector helper
  const renderIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-teal-600" />;
      case 'rating':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-cyan-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        جاري تحميل الإشعارات...
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-68px)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 py-8 md:py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6 flex items-center justify-between gap-4 transition-colors">
          <div>
            <h1 className="text-2xl font-black text-slate-808 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-teal-600 animate-swing" />
              مركز الإشعارات
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">تابع التفاعلات، الإعجابات والمتابعات لحسابك</p>
          </div>
          
          {notifications.some((n) => !n.is_read) && (
            <button 
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 text-xs font-bold px-4 py-2.5 rounded-2xl border border-teal-100/50 dark:border-teal-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? 'جاري التحديث...' : 'تحديد الكل كمقروء'}
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notif) => {
            const sender = notif.sender_id ? profiles[notif.sender_id] : null;
            return (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white dark:bg-slate-900 p-4 rounded-3xl border shadow-sm transition-all flex items-start gap-4 cursor-pointer relative group ${
                  notif.is_read 
                    ? 'border-slate-100/70 dark:border-slate-800/80 hover:border-slate-205 dark:hover:border-slate-700' 
                    : 'border-teal-100 dark:border-teal-900/40 bg-teal-50/10 dark:bg-teal-950/10 hover:bg-teal-50/20 dark:hover:bg-teal-950/20'
                }`}
              >
                {/* Indicator dot */}
                {!notif.is_read && (
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-teal-600 rounded-full"></span>
                )}

                {/* Icon wrapper */}
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-inner">
                  {renderIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{notif.title}</h3>
                  <p className="text-slate-600 dark:text-slate-305 text-xs mt-1 leading-relaxed font-medium">{notif.body}</p>
                  
                  {/* Sender & Time metadata */}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    {sender && (
                      <span className="flex items-center gap-1">
                        <div className="w-4.5 h-4.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-[9px] font-black flex items-center justify-center overflow-hidden border border-teal-100 dark:border-teal-850/50">
                          {sender.profile_image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={sender.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            sender.name.charAt(0)
                          )}
                        </div>
                        <span className="text-slate-500 dark:text-slate-400">{sender.name}</span>
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                      {new Date(notif.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Delete button (displays on hover) */}
                <button 
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-650 rounded-xl transition-all cursor-pointer absolute bottom-4 left-4"
                  title="حذف الإشعار"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-slate-400 transition-colors">
              <span className="text-5xl block mb-4">🔔</span>
              <p className="text-lg font-bold text-slate-755 dark:text-slate-300">لا توجد إشعارات حالياً</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">عند تلقي إعجاب أو متابعة أو رسالة ستظهر هنا فوراً</p>
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
