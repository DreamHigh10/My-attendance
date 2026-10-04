export type AppView = 'student' | 'admin';
export type AdminTab = 'classes' | 'attendance' | 'emails' | 'roster' | 'cohorts';

export interface RouteState {
  view: AppView;
  adminTab?: AdminTab;
  cohortId?: string;
}

export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { view: 'student', adminTab: 'classes' };
  }

  const path = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const cohortId = searchParams.get('cohort') || undefined;

  if (path.startsWith('/admin')) {
    let tab: AdminTab = 'classes';
    if (path.includes('/attendance') || path.includes('/live')) {
      tab = 'attendance';
    } else if (path.includes('/roster') || path.includes('/students')) {
      tab = 'roster';
    } else if (path.includes('/email') || path.includes('/broadcast')) {
      tab = 'emails';
    } else if (path.includes('/cohort') || path.includes('/setting')) {
      tab = 'cohorts';
    }
    return { view: 'admin', adminTab: tab, cohortId };
  }

  return { view: 'student', cohortId };
}

export function buildRouteUrl(view: AppView, adminTab?: AdminTab, cohortId?: string): string {
  let path = '/';
  if (view === 'admin') {
    if (adminTab && adminTab !== 'classes') {
      path = `/admin/${adminTab}`;
    } else {
      path = '/admin';
    }
  }

  const queryParams = new URLSearchParams();
  if (cohortId && cohortId !== 'dtp-cohort-2') {
    queryParams.set('cohort', cohortId);
  }

  const qs = queryParams.toString();
  return qs ? `${path}?${qs}` : path;
}

export function navigateTo(view: AppView, adminTab?: AdminTab, cohortId?: string, replace = false) {
  if (typeof window === 'undefined') return;

  const url = buildRouteUrl(view, adminTab, cohortId);
  const state: RouteState = { view, adminTab, cohortId };

  if (replace) {
    window.history.replaceState(state, '', url);
  } else {
    // Only push if different from current
    if (window.location.pathname + window.location.search !== url) {
      window.history.pushState(state, '', url);
    }
  }
}
