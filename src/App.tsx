import { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from './lib/firebase';
import { isUserAdmin } from './lib/auth';
import { fetchApprovedOrganizations, fetchApprovedOpportunities } from './lib/firestoreService';
import { SAMPLE_ORGANIZATIONS, SAMPLE_OPPORTUNITIES } from './data/sampleData';
import { Organization, Opportunity, NavFilters } from './types';
import { useLanguage } from './context/LanguageContext';
import { Logo } from './components/Logo';
import { HomeView } from './views/HomeView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { OpportunityDetailView } from './views/OpportunityDetailView';
import { OrganizationsView } from './views/OrganizationsView';
import { OrganizationProfileView } from './views/OrganizationProfileView';
import { OrganizationDashboardView } from './views/OrganizationDashboardView';
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
} from 'lucide-react';

type ActiveTab = 'home' | 'opportunities' | 'organizations' | 'dashboard' | 'admin';

export default function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  // Auth Listener
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
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

  // Fetch approved data (with fallback to built-in sample data and localStorage cache)
  const loadContent = async () => {
    setDataLoading(true);
    try {
      const [remoteOrgs, remoteOpps] = await Promise.all([
        fetchApprovedOrganizations(),
        fetchApprovedOpportunities(),
      ]);

      if (remoteOrgs.length > 0) {
        setOrganizations(remoteOrgs);
        localStorage.setItem('c4c_orgs_cache', JSON.stringify(remoteOrgs));
      } else {
        // Fallback to built-in verified sample dataset so initial state is never blank
        const sampleOrgsWithIds: Organization[] = SAMPLE_ORGANIZATIONS.map((o) => ({
          ...o,
          id: o.ownerUid,
        }));
        setOrganizations(sampleOrgsWithIds);
      }

      if (remoteOpps.length > 0) {
        setOpportunities(remoteOpps);
        localStorage.setItem('c4c_opps_cache', JSON.stringify(remoteOpps));
      } else {
        const sampleOppsWithIds: Opportunity[] = SAMPLE_OPPORTUNITIES.map((o, idx) => ({
          ...o,
          id: `sample_opp_${idx + 1}`,
        }));
        setOpportunities(sampleOppsWithIds);
      }
    } catch {
      // Offline / cached recovery
      const cachedOrgs = localStorage.getItem('c4c_orgs_cache');
      const cachedOpps = localStorage.getItem('c4c_opps_cache');
      if (cachedOrgs) setOrganizations(JSON.parse(cachedOrgs));
      else {
        setOrganizations(
          SAMPLE_ORGANIZATIONS.map((o) => ({
            ...o,
            id: o.ownerUid,
          }))
        );
      }

      if (cachedOpps) setOpportunities(JSON.parse(cachedOpps));
      else {
        setOpportunities(
          SAMPLE_OPPORTUNITIES.map((o, idx) => ({
            ...o,
            id: `sample_opp_${idx + 1}`,
          }))
        );
      }
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
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

  const isAdmin = isUserAdmin(user);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#1C211E]">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-[#1C211E] text-white text-xs px-4 py-2 flex items-center justify-center gap-2 border-b border-[#2B352E]">
          <WifiOff size={14} className="text-[#D95D39]" />
          <span>You are currently offline. Viewing cached centers and opportunities.</span>
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
              className={`px-3 py-2 rounded-sm border transition-colors ${
                activeTab === 'home' && !selectedOpportunity && !selectedOrganization
                  ? 'bg-[#16402E] text-white border-[#16402E]'
                  : 'bg-transparent text-[#1C211E] border-transparent hover:bg-[#F8F5EE]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNavigateTab('opportunities')}
              className={`px-3 py-2 rounded-sm border transition-colors flex items-center gap-1.5 ${
                activeTab === 'opportunities' && !selectedOpportunity && !selectedOrganization
                  ? 'bg-[#16402E] text-white border-[#16402E]'
                  : 'bg-transparent text-[#1C211E] border-transparent hover:bg-[#F8F5EE]'
              }`}
            >
              <Sparkles size={14} />
              <span>Opportunities</span>
            </button>

            <button
              onClick={() => handleNavigateTab('organizations')}
              className={`px-3 py-2 rounded-sm border transition-colors flex items-center gap-1.5 ${
                activeTab === 'organizations' && !selectedOpportunity && !selectedOrganization
                  ? 'bg-[#16402E] text-white border-[#16402E]'
                  : 'bg-transparent text-[#1C211E] border-transparent hover:bg-[#F8F5EE]'
              }`}
            >
              <Building2 size={14} />
              <span>Centers & Hubs</span>
            </button>

            {user && (
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className={`px-3 py-2 rounded-sm border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-[#16402E] text-white border-[#16402E]'
                    : 'bg-transparent text-[#1C211E] border-transparent hover:bg-[#F8F5EE]'
                }`}
              >
                <LayoutDashboard size={14} />
                <span>My Organization</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNavigateTab('admin')}
                className={`px-3 py-2 rounded-sm border transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-[#D95D39] text-white border-[#D95D39]'
                    : 'bg-[#FBECE7] text-[#D95D39] border-[#D95D39]/30 hover:bg-[#D95D39] hover:text-white'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* User Sign In / Profile Action */}
          <div className="flex items-center gap-2">
            {!authLoading && !user && (
              <button
                onClick={handleGoogleSignIn}
                className="px-3.5 py-2 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm border border-[#0F2D20] flex items-center gap-1.5 transition-colors"
                title="Sign in with Google to manage your center or post opportunities"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Organization Sign In</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}

            {!authLoading && user && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#1C211E] max-w-[140px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-[#555E57]">{isAdmin ? 'Admin' : 'Organization'}</div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="p-2 border border-[#E2DDD5] text-[#555E57] hover:text-[#A51D24] hover:border-[#F5C2C7] rounded-sm bg-[#F8F5EE] transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
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
              <Compass size={28} className="animate-spin text-[#16402E]" />
            </div>
            <p className="font-heading font-bold text-lg text-[#1C211E]">
              Loading verified centers and opportunities...
            </p>
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
          />
        ) : activeTab === 'home' ? (
          <HomeView
            opportunities={opportunities}
            organizations={organizations}
            onSelectOpportunity={handleSelectOpportunity}
            onSelectOrganization={handleSelectOrganization}
            onNavigateTab={handleNavigateTab}
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
        ) : activeTab === 'dashboard' && user ? (
          <OrganizationDashboardView
            user={user}
            onNavigateHome={() => handleNavigateTab('home')}
          />
        ) : activeTab === 'admin' && user && isAdmin ? (
          <AdminView user={user} onRefreshData={loadContent} />
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

      {/* Mobile Bottom Navigation Bar (Fixed for quick 1-tap navigation on 360px screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-[#16402E] py-1 px-2 flex items-center justify-around">
        <button
          onClick={() => handleNavigateTab('home')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === 'home' && !selectedOpportunity && !selectedOrganization
              ? 'text-[#16402E]'
              : 'text-[#777E79]'
          }`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleNavigateTab('opportunities')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === 'opportunities' && !selectedOpportunity && !selectedOrganization
              ? 'text-[#16402E]'
              : 'text-[#777E79]'
          }`}
        >
          <Sparkles size={18} />
          <span>Opportunities</span>
        </button>

        <button
          onClick={() => handleNavigateTab('organizations')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === 'organizations' && !selectedOpportunity && !selectedOrganization
              ? 'text-[#16402E]'
              : 'text-[#777E79]'
          }`}
        >
          <Building2 size={18} />
          <span>Centers</span>
        </button>

        {user ? (
          <button
            onClick={() => handleNavigateTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
              activeTab === 'dashboard' ? 'text-[#16402E]' : 'text-[#777E79]'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>My Hub</span>
          </button>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="flex flex-col items-center py-1 px-2 text-[10px] font-bold text-[#16402E]"
          >
            <LogIn size={18} />
            <span>Sign In</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNavigateTab('admin')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
              activeTab === 'admin' ? 'text-[#D95D39]' : 'text-[#777E79]'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Admin</span>
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
