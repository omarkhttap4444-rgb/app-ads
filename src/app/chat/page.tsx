'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, 
  ArrowRight, 
  MessageSquare, 
  Smartphone, 
  MapPin, 
  Clock, 
  Check, 
  CheckCheck 
} from 'lucide-react';

function ChatRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const activeConvIdFromUrl = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: any }>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(activeConvIdFromUrl);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Get current logged-in user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Redirect if not logged in
        router.push('/login?redirectTo=/chat');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  // 2. Fetch conversations and profiles
  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*, product:products(id, name, specifications, price, slug)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      if (convs && convs.length > 0) {
        setConversations(convs);

        // Extract and resolve other user profiles
        const otherUserIds = Array.from(
          new Set(
            convs.map((c) => (c.user1_id === user.id ? c.user2_id : c.user1_id))
          )
        );

        if (otherUserIds.length > 0) {
          const { data: userProfiles, error: profileErr } = await supabase
            .from('users')
            .select('id, name, profile_image_url')
            .in('id', otherUserIds);

          if (!profileErr && userProfiles) {
            const profilesMap: { [key: string]: any } = {};
            userProfiles.forEach((p) => {
              profilesMap[p.id] = p;
            });
            setProfiles((prev) => ({ ...prev, ...profilesMap }));
          }
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Handle active conversation ID changes from URL
  useEffect(() => {
    if (activeConvIdFromUrl) {
      setActiveConvId(activeConvIdFromUrl);
    }
  }, [activeConvIdFromUrl]);

  // 3. Fetch messages for active conversation
  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && msgs) {
        setMessages(msgs);
        // Mark as read
        await supabase.rpc('mark_messages_read', { p_conversation_id: convId });
        // Refresh conversations list to update local unread counts
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (activeConvId && user) {
      fetchMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, user]);

  // 4. Real-time subscriptions for messages and global conversations
  useEffect(() => {
    if (!user) return;

    // Listen for conversations list changes globally
    const convChannel = supabase
      .channel('chat-conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [user]);

  // Listen to message changes on the active conversation
  useEffect(() => {
    if (!activeConvId || !user) return;

    const msgChannel = supabase
      .channel(`active-conv-${activeConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            // Prevent duplicate message pushes
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          // If receiving message, mark it read
          if (newMsg.sender_id !== user.id) {
            await supabase.rpc('mark_messages_read', { p_conversation_id: activeConvId });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          const updatedMsg = payload.new;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [activeConvId, user]);

  // 5. Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 6. Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvId || sending) return;

    setSending(true);
    const textToSend = messageText.trim();
    setMessageText('');

    try {
      const { data: msgId, error } = await supabase.rpc('send_message', {
        p_conversation_id: activeConvId,
        p_content: textToSend,
      });

      if (error) {
        console.error('Error sending message:', error);
      }
      
      // Re-fetch conversations list to update last message locally
      fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Select conversation helper
  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    router.push(`/chat?id=${convId}`);
  };

  // Go back to list on mobile
  const handleBackToList = () => {
    setActiveConvId(null);
    router.push('/chat');
  };

  if (loadingConvs && conversations.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm">
        جاري تحميل المحادثات...
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv
    ? profiles[activeConv.user1_id === user?.id ? activeConv.user2_id : activeConv.user1_id]
    : null;

  return (
    <main className="min-h-[calc(100vh-68px)] bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4 py-4 md:py-8 flex gap-6 h-[calc(100vh-100px)]">
        
        {/* RIGHT COLUMN: Conversations List (1/3 Width on Desktop, full screen on mobile when no active chat) */}
        <div 
          className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col shrink-0 w-full md:w-80 lg:w-[360px] h-full ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-50 dark:border-slate-850">
            <h1 className="text-xl font-black text-slate-808 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              الرسائل والمحادثات
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">تواصل مباشرة وبأمان مع البائعين والمشترين</p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50/50 dark:divide-slate-850/50">
            {conversations.map((conv) => {
              const otherId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
              const otherUserProfile = profiles[otherId];
              const isActive = conv.id === activeConvId;
              const hasUnread = conv.user1_id === user?.id ? conv.unread_count_user1 > 0 : conv.unread_count_user2 > 0;
              const unreadCount = conv.user1_id === user?.id ? conv.unread_count_user1 : conv.unread_count_user2;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`w-full p-4 flex items-start gap-3 text-right hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-all cursor-pointer ${
                    isActive ? 'bg-teal-50/40 dark:bg-teal-950/20 border-r-4 border-teal-600 dark:border-teal-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-teal-100/85 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-extrabold text-sm flex items-center justify-center overflow-hidden border border-teal-200/50 dark:border-teal-800 shrink-0">
                    {otherUserProfile?.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={otherUserProfile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      otherUserProfile?.name?.charAt(0) || 'م'
                    )}
                  </div>

                  {/* Conv Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                        {otherUserProfile?.name || 'تحميل...'}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {new Date(conv.last_message_at).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-450'}`}>
                      {conv.last_message_text || 'بدء المحادثة...'}
                    </p>

                    {conv.product && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-md mt-2 font-medium max-w-full">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{conv.product.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Unread badge */}
                  {hasUnread && (
                    <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center self-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            {conversations.length === 0 && (
              <div className="text-center py-20 px-6 text-slate-400 dark:text-slate-500">
                <span className="text-4xl block mb-3">💬</span>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد محادثات نشطة</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">تواصل مع البائعين من صفحة تفاصيل المنتج</p>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Chat Thread Area (2/3 Width, full screen on mobile when active chat is selected) */}
        <div 
          className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col flex-1 h-full ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConvId && activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-50 dark:border-slate-850 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Back button on mobile */}
                  <button 
                    onClick={handleBackToList}
                    className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-slate-400"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-350 font-extrabold text-sm flex items-center justify-center overflow-hidden border border-teal-200 dark:border-teal-800">
                    {otherUser?.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={otherUser.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      otherUser?.name?.charAt(0) || 'م'
                    )}
                  </div>

                  <div>
                    <h2 className="font-extrabold text-slate-800 dark:text-white text-sm">
                      {otherUser?.name || 'جاري التحميل...'}
                    </h2>
                    {activeConv.product && (
                      <Link 
                        href={`/mobiles/${activeConv.product.slug}`}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5 mt-0.5"
                      >
                        <span>حول: {activeConv.product.name}</span>
                        <span>({activeConv.product.price.toLocaleString('ar-EG')} جنيه)</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-4">
                {loadingMsgs ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    جاري تحميل الرسائل...
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div 
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                           className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                             isOwn 
                               ? 'bg-teal-600 dark:bg-teal-700 text-white rounded-tl-none font-medium' 
                               : 'bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-205 border border-slate-100 dark:border-slate-850 rounded-tr-none'
                           }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-[9px] block text-left font-medium ${isOwn ? 'text-teal-200 dark:text-teal-400' : 'text-slate-450 dark:text-slate-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOwn && (
                              msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 dark:text-cyan-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-teal-300 dark:text-teal-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-50 dark:border-slate-850 flex gap-3 bg-white dark:bg-slate-900"
              >
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={!messageText.trim() || sending}
                  className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-white p-3.5 rounded-2xl shadow-md shadow-teal-600/10 hover:shadow-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 p-8">
              <span className="text-6xl mb-4 text-slate-300 dark:text-slate-700">💬</span>
              <h2 className="text-lg font-black text-slate-700 dark:text-slate-300">محادثاتك الفورية</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs text-center">
                حدد محادثة من القائمة الجانبية لبدء المراسلة الفورية مع البائعين
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm">جاري التحميل...</div>}>
      <ChatRoom />
    </Suspense>
  );
}
