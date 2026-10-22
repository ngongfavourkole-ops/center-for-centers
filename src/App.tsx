import { useState, useEffect, useRef, ReactElement } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import { AppRole, isUserAdmin, resolveRole } from './lib/auth';
import { fetchApprovedOrganizations, fetchApprovedOpportunities, fetchUserProfile } from './lib/firestoreService';
import { Organization, Opportunity, NavFilters, UserProfile } from './types';
import { useLanguage } from './context/LanguageContext';
import { Logo } from './components/Logo';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { HomeView } from './views/HomeView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { OpportunityDetailView } from './views/OpportunityDetailView';
import { OrganizationsView } from './views/OrganizationsView';
import { OrganizationProfileView } from './views/OrganizationProfileView';
import { OrganizationDashboardView } from './views/OrganizationDashboardView';
import { StudentDashboardView } from './views/StudentDashboardView';
import { AdminView } from './views/AdminView';
import {
  Compass,
  Sparkles,
  Building2,
  LogIn,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Home,
  WifiOff,
  Lock,
} from 'lucide-react';

type ActiveTab = 'home' | 'opportunities' | 'organizations' | 'dashboard';
type ProfileStatus = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

// Offline cache of approved listings. Storage can be unavailable (private mode), so failures are ignored.
function writeCache(key: string, items: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore: the cache is only a convenience
  }
}

function readCache<T extends { isSample?: boolean }>(key: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item: T) => !item.isSample) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  // Guards against a slow profile fetch for a previous account landing after sign-out
  const currentUidRef = useRef<string | null>(null);

  // App Data State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [navFilters, setNavFilters] = useState<NavFilters>({});
  // Bumped on every navigation so list views remount and pick up new filters
  const [navKey, setNavKey] = useState(0);

  // Admins come from the email list and need no profile; everyone else needs a role on /users/{uid}
  const loadProfile = async (currentUser: User | null) => {
    currentUidRef.current = currentUser?.uid || null;
    if (!currentUser || isUserAdmin(currentUser)) {
      setUserProfile(null);
      setProfileStatus(currentUser ? 'ready' : 'idle');
      return;
    }
    setProfileStatus('loading');
    try {
      const profile = await fetchUserProfile(currentUser.uid);
      if (currentUidRef.current !== currentUser.uid) return;
      setUserProfile(profile);
      setProfileStatus(profile ? 'ready' : 'missing');
    } catch {
      if (currentUidRef.current !== currentUser.uid) return;
      setUserProfile(null);
      setProfileStatus('error');
    }
  };

  // Auth Listener
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      loadProfile(currentUser);
    });

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch approved data, falling back to the last cached copy when offline
  const loadContent = async () => {
    setDataLoading(true);
    try {
      const [remoteOrgs, remoteOpps] = await Promise.all([
        fetchApprovedOrganizations(),
        fetchApprovedOpportunities(),
      ]);
      setOrganizations(remoteOrgs);
      setOpportunities(remoteOpps);
      writeCache('c4c_orgs_cache', remoteOrgs);
      writeCache('c4c_opps_cache', remoteOpps);
    } catch {
      setOrganizations(readCache<Organization>('c4c_orgs_cache'));
      setOpportunities(readCache<Opportunity>('c4c_opps_cache'));
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Google Sign In, then open the dashboard (first-time users choose a role there)
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      handleNavigateTab('dashboard');
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  // Sign in without leaving the current page (e.g. to claim a place)
  const handleSignInInPlace = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      handleNavigateTab('home');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Opportunity Selection
  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setSelectedOrganization(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Organization Selection
  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setSelectedOpportunity(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch Tab
  const handleNavigateTab = (
    tab: ActiveTab,
    filters?: NavFilters
  ) => {
    setSelectedOpportunity(null);
    setSelectedOrganization(null);
    setNavFilters(filters || {});
    setNavKey((k) => k + 1);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const role: AppRole | null = resolveRole(user, userProfile);
  const roleLabel = role === 'admin' ? t.adminRole : role === 'organization' ? t.organization : role === 'student' ? t.student : '';
  const dashboardLabel = role === 'admin' ? t.adminDashboard : t.myDashboard;
  const DashboardIcon = role === 'admin' ? ShieldCheck : LayoutDashboard;
  const onListPage = !selectedOpportunity && !selectedOrganization;

  // Each dashboard only renders for its own role; anything else gets a sign-in prompt or "access restricted".
  const renderProtected = (allowed: AppRole, view: () => ReactElement) => {
    if (!user) {
      return (
        <GateMessage
          icon={<LogIn size={28} className="text-[#16402E]" />}
          title={t.signInToContinue}
          description={t.signInToContinueDesc}
          actionLabel={t.signIn}
          onAction={handleGoogleSignIn}
        />
      );
    }
    if (role !== 'admin' && (profileStatus === 'loading' || profileStatus === 'idle')) {
      return <GateMessage icon={<Compass size={28} className="animate-spin text-[#16402E]" />} title={t.loadingAccount} />;
    }
    if (role !== 'admin' && profileStatus === 'error') {
      return (
        <GateMessage
          icon={<WifiOff size={28} className="text-[#D95D39]" />}
          title={t.accountLoadError}
          actionLabel={t.tryAgain}
          onAction={() => loadProfile(user)}
        />
      );
    }
    if (role !== allowed) {
      return (
        <GateMessage
          icon={<Lock size={28} className="text-[#D95D39]" />}
          title={t.accessDenied}
          description={t.accessDeniedDesc}
          actionLabel={t.backToHome}
          onAction={() => handleNavigateTab('home')}
        />
      );
    }
    return view();
  };

  const renderDashboard = () => {
    if (role === 'admin') {
      return renderProtected('admin', () => <AdminView user={user!} onRefreshData={loadContent} />);
    }
    if (role === 'organization') {
      return renderProtected('organization', () => (
        <OrganizationDashboardView user={user!} userRole="organization" onNavigateHome={() => handleNavigateTab('home')} />
      ));
    }
    return renderProtected('student', () => (
      <StudentDashboardView
        user={user!}
        userProfile={userProfile}
        onProfileUpdated={setUserProfile}
        onNavigateTab={(tab) => handleNavigateTab(tab)}
      />
    ));
  };

  const desktopNavClass = (active: boolean) =>
    `px-3 py-2 rounded-sm border transition-colors flex items-center gap-1.5 ${
      active
        ? 'bg-[#16402E] text-white border-[#16402E]'
        : 'bg-transparent text-[#1C211E] border-transparent hover:bg-[#F8F5EE]'
    }`;

  const mobileNavClass = (active: boolean) =>
    `flex flex-col items-center py-1 px-2 text-[10px] font-bold min-w-0 ${active ? 'text-[#16402E]' : 'text-[#5F6661]'}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#1C211E]">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-[#1C211E] text-white text-xs px-4 py-2 flex items-center justify-center gap-2 border-b border-[#2B352E]">
          <WifiOff size={14} className="text-[#D95D39]" aria-hidden="true" />
          <span>{t.offlineNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-[#16402E]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={() => handleNavigateTab('home')}
            className="flex items-center text-left focus:outline-none"
          >
            <Logo size="md" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => handleNavigateTab('home')}
              className={desktopNavClass(activeTab === 'home' && onListPage)}
            >
              {t.home}
            </button>

            <button
              onClick={() => handleNavigateTab('opportunities')}
              className={desktopNavClass(activeTab === 'opportunities' && onListPage)}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>{t.opportunities}</span>
            </button>

            <button
              onClick={() => handleNavigateTab('organizations')}
              className={desktopNavClass(activeTab === 'organizations' && onListPage)}
            >
              <Building2 size={14} aria-hidden="true" />
              <span>{t.places}</span>
            </button>

            {user && (
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className={desktopNavClass(activeTab === 'dashboard' && onListPage)}
              >
                <DashboardIcon size={14} aria-hidden="true" />
                <span>{dashboardLabel}</span>
              </button>
            )}
          </nav>

          {/* User Sign In / Profile Action */}
          <div className="flex items-center gap-2">
            {!authLoading && !user && (
              <button
                onClick={handleGoogleSignIn}
                className="px-3.5 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center gap-1.5 transition-colors"
              >
                <LogIn size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{t.signIn}</span>
                <span className="sm:hidden">{t.signInShort}</span>
              </button>
            )}

            {!authLoading && user && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#1C211E] max-w-[140px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  {roleLabel && <div className="text-[10px] text-[#555E57]">{roleLabel}</div>}
                </div>

                <button
                  onClick={handleSignOut}
                  className="p-2 border border-[#E2DDD5] text-[#555E57] hover:text-[#A51D24] hover:border-[#F5C2C7] rounded-sm bg-[#F8F5EE] transition-colors"
                  title={t.signOut}
                  aria-label={t.signOut}
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 pb-20 md:pb-12">
        {dataLoading ? (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="inline-block p-4 bg-white border-2 border-[#16402E] rounded-sm mb-3">
              <Compass size={28} className="animate-spin text-[#16402E]" aria-hidden="true" />
            </div>
            <p className="font-heading font-bold text-lg text-[#1C211E]">{t.loading}</p>
            <p className="text-xs text-[#555E57] mt-1">{t.connecting}</p>
          </div>
        ) : selectedOpportunity ? (
          <OpportunityDetailView
            opportunity={selectedOpportunity}
            organization={
              organizations.find(
                (o) => o.id === selectedOpportunity.orgId || o.ownerUid === selectedOpportunity.orgId
              ) || null
            }
            onBack={() => setSelectedOpportunity(null)}
            onSelectOrganization={handleSelectOrganization}
          />
        ) : selectedOrganization ? (
          <OrganizationProfileView
            organization={selectedOrganization}
            opportunities={opportunities}
            onBack={() => setSelectedOrganization(null)}
            onSelectOpportunity={handleSelectOpportunity}
            user={user}
            onSignIn={handleSignInInPlace}
          />
        ) : activeTab === 'opportunities' ? (
          <OpportunitiesView
            key={navKey}
            opportunities={opportunities}
            onSelectOpportunity={handleSelectOpportunity}
            initialFilters={navFilters}
            onSearchPlaces={(query) => handleNavigateTab('organizations', { query })}
          />
        ) : activeTab === 'organizations' ? (
          <OrganizationsView
            key={navKey}
            organizations={organizations}
            opportunities={opportunities}
            onSelectOrganization={handleSelectOrganization}
            initialFilters={navFilters}
            onSearchOpportunities={(query) => handleNavigateTab('opportunities', { query })}
          />
        ) : activeTab === 'dashboard' ? (
          renderDashboard()
        ) : (
          <HomeView
            opportunities={opportunities}
            organizations={organizations}
            onSelectOpportunity={handleSelectOpportunity}
            onSelectOrganization={handleSelectOrganization}
            onNavigateTab={handleNavigateTab}
          />
        )}
      </main>

      {/* First sign-in: choose student or organization (admins skip this) */}
      {user && profileStatus === 'missing' && (
        <RoleSelectionModal
          user={user}
          onRoleSelected={(profile) => {
            setUserProfile(profile);
            setProfileStatus('ready');
            handleNavigateTab('dashboard');
          }}
          onSignOut={handleSignOut}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#16402E] py-1 px-1 grid grid-cols-4">
        <button onClick={() => handleNavigateTab('home')} className={mobileNavClass(activeTab === 'home' && onListPage)}>
          <Home size={18} aria-hidden="true" />
          <span className="truncate max-w-full">{t.home}</span>
        </button>

        <button
          onClick={() => handleNavigateTab('opportunities')}
          className={mobileNavClass(activeTab === 'opportunities' && onListPage)}
        >
          <Sparkles size={18} aria-hidden="true" />
          <span className="truncate max-w-full">{t.opportunities}</span>
        </button>

        <button
          onClick={() => handleNavigateTab('organizations')}
          className={mobileNavClass(activeTab === 'organizations' && onListPage)}
        >
          <Building2 size={18} aria-hidden="true" />
          <span className="truncate max-w-full">{t.places}</span>
        </button>

        {user ? (
          <button onClick={() => handleNavigateTab('dashboard')} className={mobileNavClass(activeTab === 'dashboard' && onListPage)}>
            <DashboardIcon size={18} aria-hidden="true" />
            <span className="truncate max-w-full">{dashboardLabel}</span>
          </button>
        ) : (
          <button onClick={handleGoogleSignIn} className={mobileNavClass(true)}>
            <LogIn size={18} aria-hidden="true" />
            <span className="truncate max-w-full">{t.signInShort}</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <footer className="bg-[#16402E] text-[#F8F5EE] border-t-4 border-[#D95D39] py-8 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
            </div>
            <p className="text-[11px] text-[#C4C0B6]">
              {t.footerTagline}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-[11px] text-[#E2DDD5]">
            <span>Volcanic Charcoal & Forest Green Design</span>
            <span className="hidden sm:inline">•</span>
            <span>Zero login walls for students</span>
            <span className="hidden sm:inline">•</span>
            <span>Mobile-First PWA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Centered card used for the sign-in prompt, loading, errors and "access restricted".
function GateMessage({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactElement;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="inline-block p-4 bg-white border-2 border-[#16402E] rounded-sm mb-3" aria-hidden="true">
        {icon}
      </div>
      <h1 className="font-heading font-bold text-lg text-[#1C211E]">{title}</h1>
      {description && <p className="text-sm text-[#555E57] mt-2">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-sm font-bold rounded-sm border border-[#0F2D20]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
