'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquare, Send } from 'lucide-react';

import { supabase } from '@/lib/supabase';

type CommentUser = {
  name?: string | null;
  profile_image_url?: string | null;
};

type ProductComment = {
  id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  users: CommentUser | CommentUser[] | null;
};

const getCommentUser = (comment: ProductComment) =>
  Array.isArray(comment.users) ? comment.users[0] : comment.users;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function ProductComments({
  productId,
  initialCount = 0,
}: {
  productId: string;
  initialCount?: number;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('comments')
      .select('id,user_id,parent_id,content,created_at,users!comments_user_id_fkey(name,profile_image_url)')
      .eq('product_id', productId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[comments] Could not load comments:', queryError.message);
      setError('تعذر تحميل التعليقات الآن. حاول مرة أخرى.');
    } else {
      setComments((data ?? []) as ProductComment[]);
      setError(null);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => void loadComments(), 0);

    const channel = supabase
      .channel(`web-product-comments-${productId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `product_id=eq.${productId}` },
        () => void loadComments(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialLoadTimer);
      void supabase.removeChannel(channel);
    };
  }, [loadComments, productId]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`${window.location.pathname}#comments`)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('comments').insert({
      product_id: productId,
      user_id: session.user.id,
      parent_id: null,
      content: trimmed,
    });

    if (insertError) {
      console.error('[comments] Could not add comment:', insertError.message);
      setError('لم يتم إرسال التعليق. تأكد من تسجيل الدخول ثم حاول مرة أخرى.');
    } else {
      setContent('');
      await loadComments();
    }
    setSubmitting(false);
  };

  const displayedCount = loading ? initialCount : comments.length;

  return (
    <section id="comments" className="scroll-mt-28 rounded-[22px] border border-[#e7e9ec] bg-white p-4 shadow-sm dark:border-[#343434] dark:bg-[#1f1f1f] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf3] text-[#078b43] dark:bg-[#173323] dark:text-[#54db8d]">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-[#242628] dark:text-white">التعليقات</h2>
          <p className="text-[10px] font-bold text-[#91979b]">{displayedCount} تعليق على الإعلان</p>
        </div>
      </div>

      <form onSubmit={submitComment} className="mt-4 flex items-end gap-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={1_000}
          rows={2}
          placeholder="اكتب تعليقك أو استفسارك للبائع..."
          className="min-h-14 flex-1 resize-none rounded-2xl border border-[#dde2df] bg-[#f7f9f8] px-4 py-3 text-xs font-bold outline-none transition focus:border-[#12b76a] focus:ring-2 focus:ring-[#12b76a]/15 dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-white"
        />
        <button type="submit" disabled={submitting || !content.trim()} aria-label="إرسال التعليق" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#078b43] text-white shadow-lg shadow-green-700/15 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 dark:bg-red-950/30">{error}</p>}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8 text-[#078b43]"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl bg-[#f7f9f8] py-8 text-center dark:bg-[#262626]">
            <MessageSquare className="mx-auto h-8 w-8 text-[#b8bdbb]" />
            <p className="mt-2 text-xs font-black text-[#656b6f] dark:text-[#d0d0d0]">لا توجد تعليقات بعد</p>
            <p className="mt-1 text-[10px] font-bold text-[#9ba09e]">كن أول من يسأل عن هذا المنتج</p>
          </div>
        ) : (
          comments.map((comment) => {
            const user = getCommentUser(comment);
            const name = user?.name?.trim() || 'مستخدم سوق فون';
            return (
              <article key={comment.id} className="flex gap-3 rounded-2xl bg-[#f7f9f8] p-3.5 dark:bg-[#262626]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d9f7e5] text-sm font-black text-[#078b43] dark:bg-[#173323] dark:text-[#54db8d]">
                  {user?.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profile_image_url} alt={name} className="h-full w-full object-cover" />
                  ) : name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-xs font-black text-[#303437] dark:text-white">{name}</p>
                    <time className="text-[9px] font-bold text-[#969c99]">{formatDate(comment.created_at)}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-[#565c60] dark:text-[#d2d2d2]">{comment.content}</p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
