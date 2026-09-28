import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applySeo, pageTitle, seoFor } from '@/lib/seo';

// Keeps <title>, description, robots and canonical in step with the route.
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    applySeo(seoFor(pathname), pathname);
  }, [pathname]);
  return null;
}

// A page that knows a better name once its data arrives (a challenge's title).
// Runs after RouteSeo, so it wins for as long as the page is open.
export function usePageTitle(name) {
  useEffect(() => {
    if (name) document.title = pageTitle(name);
  }, [name]);
}
