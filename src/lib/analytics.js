import { supabase } from '@/lib/customSupabaseClient';

const normalizePath = (path) => {
  if (!path || typeof path !== 'string') return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const getCurrentUserId = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch (error) {
    return null;
  }
};

export const trackEvent = async ({ action, page, metadata = {}, userId = null }) => {
  if (!action) return;

  const finalUserId = userId ?? (await getCurrentUserId());

  try {
    await supabase.from('user_events').insert([
      {
        user_id: finalUserId,
        action,
        page: normalizePath(page),
        metadata,
      },
    ]);
  } catch (error) {
    console.warn('trackEvent error:', error?.message || error);
  }
};

export const trackPageView = async (pathname, metadata = {}) =>
  trackEvent({
    action: 'page_view',
    page: normalizePath(pathname),
    metadata,
  });
