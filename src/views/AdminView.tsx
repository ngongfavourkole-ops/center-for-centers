import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Organization, Opportunity, Report, ApprovalStatus, Claim, PlaceEdit, UserProfile, UserRole } from '../types';
import {
  fetchAllOrganizationsForAdmin,
  fetchAllOpportunitiesForAdmin,
  updateOrganizationStatus,
  updateOpportunityStatus,
  fetchClaimsForAdmin,
  approveClaim,
  rejectClaim,
  adminDeletePlace,
  fetchPendingPlaceEditsForAdmin,
  approvePlaceEdit,
  rejectPlaceEdit,
  fetchAllUsersForAdmin,
  updateUserRoleByAdmin,
  fetchReportsForAdmin,
} from '../lib/firestoreService';
import { StatusBadge, SampleDataBadge, FreeBadge, PaidBadge, TeamManagedBadge } from '../components/Badges';
import { AdminPlaceEditor } from '../components/AdminPlaceEditor';
import { placeTypeLabel, isTeamManaged } from '../lib/places';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';
import { ShieldCheck, Check, X, AlertCircle, RefreshCw, EyeOff, FileText, Building2, Sparkles, MessageSquare, Plus, Edit3, Trash2, BadgeCheck } from 'lucide-react';

interface AdminViewProps {
  user: User;
  onRefreshData: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onRefreshData }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pending' | 'add-place' | 'claims' | 'all-orgs' | 'all-opps' | 'reports' | 'users'>('pending');
  const [editingPlace, setEditingPlace] = useState<Organization | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [placeEdits, setPlaceEdits] = useState<PlaceEdit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [allOpps, setAllOpps] = useState<Opportunity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [orgs, opps, reps, cls, edits, usrs] = await Promise.all([
        fetchAllOrganizationsForAdmin(),
        fetchAllOpportunitiesForAdmin(),
        fetchReportsForAdmin(),
        fetchClaimsForAdmin(),
        fetchPendingPlaceEditsForAdmin(),
        fetchAllUsersForAdmin(),
      ]);
      setAllOrgs(orgs);
      setAllOpps(opps);
      setReports(reps);
      setPlaceEdits(edits);
      setUsers(usrs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setClaims(cls.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch {
      setNotice({ type: 'error', msg: 'Failed to retrieve admin records.' });
    } finally {
      setLoading(false);
    }
  };

  const pendingOrgs = allOrgs.filter(o => o.status === 'pending');
  const pendingOpps = allOpps.filter(o => o.status === 'pending');
  const pendingClaims = claims.filter(c => c.status === 'pending');

  const handleUpdateOrgStatus = async (orgId: string, newStatus: ApprovalStatus) => {
    setStatusActionLoading(orgId);
    try {
      await updateOrganizationStatus(orgId, newStatus);
      setNotice({ type: 'success', msg: `Organization status set to "${newStatus}".` });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: 'Failed to update organization status.' });
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleUpdateOppStatus = async (oppId: string, newStatus: ApprovalStatus) => {
    setStatusActionLoading(oppId);
    try {
      await updateOpportunityStatus(oppId, newStatus);
      setNotice({ type: 'success', msg: `Opportunity status set to "${newStatus}".` });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: 'Failed to update opportunity status.' });
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handlePlaceSaved = async (message: string) => {
    setNotice({ type: 'success', msg: message });
    setEditingPlace(null);
    await loadAdminData();
    await onRefreshData();
  };

  const handleDeletePlace = async (org: Organization) => {
    if (!window.confirm(t.deletePlaceConfirm.replace('{name}', org.name))) return;
    setStatusActionLoading(org.id);
    try {
      await adminDeletePlace(org.id);
      setNotice({ type: 'success', msg: t.placeDeleted });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: t.deleteError });
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleReviewPlaceEdit = async (edit: PlaceEdit, approve: boolean) => {
    setStatusActionLoading(edit.orgId);
    try {
      if (approve) {
        await approvePlaceEdit(edit);
      } else {
        await rejectPlaceEdit(edit.orgId);
      }
      setNotice({ type: 'success', msg: approve ? t.changesApproved : t.changesRejected });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: t.claimReviewError });
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleChangeRole = async (profile: UserProfile, newRole: UserRole) => {
    if (newRole === profile.role || !window.confirm(t.roleChangeConfirm)) return;
    setStatusActionLoading(profile.uid);
    try {
      await updateUserRoleByAdmin(profile.uid, newRole);
      setNotice({ type: 'success', msg: t.roleChangedSuccess });
      await loadAdminData();
    } catch {
      setNotice({ type: 'error', msg: t.roleUpdateError });
    } finally {
      setStatusActionLoading(null);
    }
  };

  const handleReviewClaim = async (claim: Claim, approve: boolean) => {
    if (!claim.id) return;
    setStatusActionLoading(claim.id);
    try {
      if (approve) {
        await approveClaim(claim);
      } else {
        await rejectClaim(claim.id);
      }
      setNotice({ type: 'success', msg: approve ? t.claimApproved : t.claimRejected });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: t.claimReviewError });
    } finally {
      setStatusActionLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-[#16402E] text-white border-2 border-[#16402E] p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D95D39] uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            <span>Admin Center Console</span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
            Review Queue & System Controls
          </h1>
          <p className="text-xs text-[#E2DDD5] mt-0.5">
            Admin authenticated: <span className="font-semibold text-white">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingPlace(null);
              setActiveTab('add-place');
            }}
            className="px-4 py-2.5 bg-[#D95D39] hover:bg-[#B84725] text-white text-xs font-bold rounded-sm border border-[#B84725] flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus size={15} aria-hidden="true" />
            <span>{t.adminAddPlace}</span>
          </button>

          <button
            onClick={loadAdminData}
            className="p-2.5 bg-[#0F2D20] text-white hover:bg-[#215A42] rounded-sm border border-[#215A42] transition-colors"
            title="Refresh database records"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 text-xs font-medium rounded-sm border flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-[#E8EFEA] text-[#16402E] border-[#BACCC0]'
              : 'bg-[#FCE8E6] text-[#A51D24] border-[#F5C2C7]'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{notice.msg}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap border-b-2 border-[#16402E] gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'pending'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>Pending Review Queue</span>
          {(pendingOrgs.length + pendingOpps.length + placeEdits.length) > 0 && (
            <span className="bg-[#D95D39] text-white text-[10px] px-1.5 py-0.2 rounded-sm font-bold">
              {pendingOrgs.length + pendingOpps.length + placeEdits.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'claims'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>{t.claimsTab}</span>
          {pendingClaims.length > 0 && (
            <span className="bg-[#D95D39] text-white text-[10px] px-1.5 rounded-sm font-bold">{pendingClaims.length}</span>
          )}
        </button>

        <button
          onClick={() => {
            setEditingPlace(null);
            setActiveTab('add-place');
          }}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'add-place'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <Plus size={13} aria-hidden="true" />
          <span>{t.adminAddPlace}</span>
        </button>

        <button
          onClick={() => setActiveTab('all-orgs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'all-orgs'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>All Centers ({allOrgs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all-opps')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'all-opps'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>All Opportunities ({allOpps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'reports'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>User Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 rounded-t-sm flex items-center gap-1.5 transition-colors ${
            activeTab === 'users'
              ? 'bg-[#16402E] text-white border-[#16402E]'
              : 'bg-white text-[#555E57] border-[#E2DDD5] hover:text-[#1C211E]'
          }`}
        >
          <span>{t.usersTab} ({users.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm text-xs text-[#555E57]">
          Loading admin databases...
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-2">
              <Edit3 size={16} className="text-[#16402E]" aria-hidden="true" />
              <h2 className="font-heading font-extrabold text-base text-[#1C211E]">
                {t.placeEditsTitle} ({placeEdits.length})
              </h2>
            </div>

            {placeEdits.length > 0 ? (
              <div className="space-y-3">
                {placeEdits.map(edit => {
                  const live = allOrgs.find(o => o.id === edit.orgId);
                  const changed = live ? changedFields(live, edit.changes) : [];
                  return (
                    <div key={edit.orgId} className="bg-white border-2 border-[#16402E]/30 p-4 rounded-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-base text-[#1C211E] break-words">{edit.orgName}</h3>
                          <p className="text-xs text-[#555E57]">{edit.submittedAt?.split('T')[0]}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReviewPlaceEdit(edit, true)}
                            disabled={statusActionLoading === edit.orgId}
                            className="px-3.5 py-1.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm flex items-center gap-1.5"
                          >
                            <Check size={14} aria-hidden="true" />
                            <span>{t.approveChanges}</span>
                          </button>
                          <button
                            onClick={() => handleReviewPlaceEdit(edit, false)}
                            disabled={statusActionLoading === edit.orgId}
                            className="px-3.5 py-1.5 bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7] hover:bg-[#F8D7DA] text-xs font-bold rounded-sm flex items-center gap-1.5"
                          >
                            <X size={14} aria-hidden="true" />
                            <span>{t.rejectChanges}</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs bg-[#FBF9F5] p-3 rounded-sm border border-[#E2DDD5] space-y-1.5">
                        <p className="font-bold text-[#1C211E]">{t.changedFields}</p>
                        {changed.length > 0 ? (
                          <ul className="space-y-1">
                            {changed.map(c => (
                              <li key={c.field} className="break-words">
                                <span className="font-semibold">{c.field}: </span>
                                <span className="text-[#A51D24] line-through">{c.before || '-'}</span>
                                <span aria-hidden="true"> → </span>
                                <span className="text-[#16402E]">{c.after || '-'}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#555E57]">{t.noFieldChanges}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#555E57] italic bg-white p-4 border border-[#E2DDD5] rounded-sm">{t.placeEditsEmpty}</p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-2">
              <Building2 size={16} className="text-[#16402E]" />
              <h2 className="font-heading font-extrabold text-base text-[#1C211E]">
                Pending Organization Submissions ({pendingOrgs.length})
              </h2>
            </div>

            {pendingOrgs.length > 0 ? (
              <div className="space-y-3">
                {pendingOrgs.map(org => (
                  <div key={org.id} className="bg-white border-2 border-[#16402E]/30 p-4 rounded-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={org.status} />
                          <span className="text-xs font-bold text-[#16402E]">{placeTypeLabel(org.type, t)}</span>
                          <span className="text-xs text-[#555E57]">• {formatLocation(org, t)}</span>
                        </div>
                        <h3 className="font-heading font-bold text-base text-[#1C211E]">{org.name}</h3>
                        <p className="text-xs text-[#555E57]">{org.address}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateOrgStatus(org.id, 'approved')}
                          disabled={statusActionLoading === org.id}
                          className="px-3.5 py-1.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateOrgStatus(org.id, 'rejected')}
                          disabled={statusActionLoading === org.id}
                          className="px-3.5 py-1.5 bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7] hover:bg-[#F8D7DA] text-xs font-bold rounded-sm flex items-center gap-1.5"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FBF9F5] p-3 rounded-sm border border-[#E2DDD5]">
                      <div>
                        <span className="font-bold text-[#1C211E]">Access condition: </span>
                        <span>{org.studentAccess || 'Not stated'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#1C211E]">Fees: </span>
                        <span>{org.fees || 'Not stated'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#1C211E]">Power: </span>
                        <span>{org.powerReliability}</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#1C211E]">Internet: </span>
                        <span>{org.internetReliability}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#555E57] italic bg-white p-4 border border-[#E2DDD5] rounded-sm">
                No organizations awaiting review.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-2">
              <Sparkles size={16} className="text-[#D95D39]" />
              <h2 className="font-heading font-extrabold text-base text-[#1C211E]">
                Pending Opportunity Submissions ({pendingOpps.length})
              </h2>
            </div>

            {pendingOpps.length > 0 ? (
              <div className="space-y-3">
                {pendingOpps.map(opp => (
                  <div key={opp.id} className="bg-white border-2 border-[#16402E]/30 p-4 rounded-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={opp.status} />
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#EFE9DC] text-[#1C211E]">
                            {opp.category}
                          </span>
                          {opp.cost === 0 ? <FreeBadge /> : <PaidBadge cost={opp.cost} />}
                        </div>
                        <h3 className="font-heading font-bold text-base text-[#1C211E]">{opp.title}</h3>
                        <p className="text-xs text-[#555E57]">
                          Host: <span className="font-semibold">{opp.orgName || 'Unknown Org'}</span> • Deadline: {opp.deadline}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateOppStatus(opp.id, 'approved')}
                          disabled={statusActionLoading === opp.id}
                          className="px-3.5 py-1.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleUpdateOppStatus(opp.id, 'rejected')}
                          disabled={statusActionLoading === opp.id}
                          className="px-3.5 py-1.5 bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7] hover:bg-[#F8D7DA] text-xs font-bold rounded-sm flex items-center gap-1.5"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#445048] bg-[#FBF9F5] p-3 rounded-sm border border-[#E2DDD5]">
                      {opp.description}
                    </p>

                    {(opp.flyerUrl || opp.imageUrl) && (
                      <div className="flex flex-wrap items-center gap-3 p-2.5 bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm text-xs">
                        {opp.flyerUrl && (
                          <div className="flex items-center gap-2">
                            <img
                              src={opp.flyerUrl}
                              alt="Flyer preview"
                              referrerPolicy="no-referrer"
                              className="w-10 h-14 object-cover rounded-xs border border-[#16402E]"
                            />
                            <div>
                              <span className="font-bold text-[#16402E] block text-xs">Event Flyer</span>
                              <a
                                href={opp.flyerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#D95D39] font-semibold hover:underline"
                              >
                                View full poster
                              </a>
                            </div>
                          </div>
                        )}
                        {opp.imageUrl && opp.imageUrl !== opp.flyerUrl && (
                          <div className="flex items-center gap-2">
                            <img
                              src={opp.imageUrl}
                              alt="Event photo"
                              referrerPolicy="no-referrer"
                              className="w-14 h-10 object-cover rounded-xs border border-[#16402E]"
                            />
                            <div>
                              <span className="font-bold text-[#16402E] block text-xs">Event Picture</span>
                              <a
                                href={opp.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#D95D39] font-semibold hover:underline"
                              >
                                View photo
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#555E57] italic bg-white p-4 border border-[#E2DDD5] rounded-sm">
                No opportunities awaiting review.
              </p>
            )}
          </section>
        </div>
      ) : activeTab === 'add-place' ? (
        <AdminPlaceEditor
          key="new-place"
          user={user}
          existing={null}
          onSaved={handlePlaceSaved}
        />
      ) : activeTab === 'claims' ? (
        <div className="space-y-3">
          {claims.length > 0 ? (
            claims.map(claim => (
              <div key={claim.id} className="bg-white border-2 border-[#16402E]/20 p-4 rounded-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={claim.status} />
                      <span className="text-[11px] text-[#555E57]">{claim.createdAt?.split('T')[0]}</span>
                    </div>
                    <h3 className="font-heading font-bold text-base text-[#1C211E] break-words">{claim.orgName}</h3>
                    <p className="text-xs text-[#445048] break-words">
                      <span className="font-bold">{t.claimedBy}: </span>
                      {claim.claimantName ? `${claim.claimantName} (${claim.claimantEmail})` : claim.claimantEmail}
                    </p>
                  </div>
                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReviewClaim(claim, true)}
                        disabled={statusActionLoading === claim.id}
                        className="px-3.5 py-1.5 bg-[#16402E] hover:bg-[#0F2D20] text-white text-xs font-bold rounded-sm flex items-center gap-1.5"
                      >
                        <BadgeCheck size={14} aria-hidden="true" />
                        <span>{t.approveClaim}</span>
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim, false)}
                        disabled={statusActionLoading === claim.id}
                        className="px-3.5 py-1.5 bg-[#FCE8E6] text-[#A51D24] border border-[#F5C2C7] hover:bg-[#F8D7DA] text-xs font-bold rounded-sm flex items-center gap-1.5"
                      >
                        <X size={14} aria-hidden="true" />
                        <span>{t.rejectClaim}</span>
                      </button>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FBF9F5] p-3 rounded-sm border border-[#E2DDD5]">
                  <div>
                    <dt className="font-bold text-[#1C211E]">{t.claimRoleShort}</dt>
                    <dd className="break-words">{claim.relationship}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#1C211E]">{t.claimPhoneShort}</dt>
                    <dd className="break-words">{claim.phone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-bold text-[#1C211E]">{t.claimEvidenceShort}</dt>
                    <dd className="break-words whitespace-pre-line">{claim.verificationDetails}</dd>
                  </div>
                </dl>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#555E57] bg-white p-4 border border-[#E2DDD5] rounded-sm">{t.claimsEmpty}</p>
          )}
        </div>
      ) : activeTab === 'all-orgs' ? (
        <div className="space-y-3">
          {editingPlace && (
            <AdminPlaceEditor
              key={editingPlace.id}
              user={user}
              existing={editingPlace}
              onSaved={handlePlaceSaved}
              onCancel={() => setEditingPlace(null)}
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555E57] font-medium">
              Manage existing directory records. Unpublishing an approved center removes it from public view.
            </span>
          </div>

          <div className="space-y-3">
            {allOrgs.map(org => (
              <div
                key={org.id}
                className="bg-white border border-[#E2DDD5] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={org.status} />
                    {org.isSample && <SampleDataBadge />}
                    {isTeamManaged(org) && <TeamManagedBadge />}
                    <span className="text-xs font-bold text-[#16402E]">{placeTypeLabel(org.type, t)}</span>
                    <span className="text-xs text-[#555E57]">• {formatLocation(org, t)}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1C211E] break-words">{org.name}</h3>
                  <p className="text-xs text-[#555E57] break-words">{org.address}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingPlace(org);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-white border border-[#16402E] text-[#16402E] hover:bg-[#F8F5EE] text-xs font-bold rounded-sm flex items-center gap-1"
                  >
                    <Edit3 size={13} aria-hidden="true" />
                    <span>{t.editAction}</span>
                  </button>
                  {org.status === 'approved' ? (
                    <button
                      onClick={() => handleUpdateOrgStatus(org.id, 'rejected')}
                      disabled={statusActionLoading === org.id}
                      className="px-3 py-1.5 bg-[#F8F5EE] border border-[#E2DDD5] hover:bg-[#FCE8E6] text-xs font-bold text-[#A51D24] rounded-sm flex items-center gap-1"
                    >
                      <EyeOff size={13} />
                      <span>Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateOrgStatus(org.id, 'approved')}
                      disabled={statusActionLoading === org.id}
                      className="px-3 py-1.5 bg-[#16402E] text-white hover:bg-[#0F2D20] text-xs font-bold rounded-sm flex items-center gap-1"
                    >
                      <Check size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlace(org)}
                    disabled={statusActionLoading === org.id}
                    className="px-3 py-1.5 bg-[#FCE8E6] border border-[#F5C2C7] text-[#A51D24] hover:bg-[#F8D7DA] text-xs font-bold rounded-sm flex items-center gap-1"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span>{t.deleteAction}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'all-opps' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555E57] font-medium">
              Manage opportunities across all centers.
            </span>
          </div>

          <div className="space-y-3">
            {allOpps.map(opp => (
              <div
                key={opp.id}
                className="bg-white border border-[#E2DDD5] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={opp.status} />
                    {opp.isSample && <SampleDataBadge />}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#EFE9DC] text-[#1C211E]">
                      {opp.category}
                    </span>
                    {opp.cost === 0 ? <FreeBadge /> : <PaidBadge cost={opp.cost} />}
                    {opp.flyerUrl && (
                      <a
                        href={opp.flyerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-[#16402E] text-white font-bold px-1.5 py-0.5 rounded-sm hover:bg-[#D95D39] transition-colors"
                      >
                        Flyer Poster ↗
                      </a>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1C211E]">{opp.title}</h3>
                  <p className="text-xs text-[#555E57]">
                    Host: {opp.orgName || 'Unknown'} • Deadline: {opp.deadline}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {opp.status === 'approved' ? (
                    <button
                      onClick={() => handleUpdateOppStatus(opp.id, 'rejected')}
                      disabled={statusActionLoading === opp.id}
                      className="px-3 py-1.5 bg-[#F8F5EE] border border-[#E2DDD5] hover:bg-[#FCE8E6] text-xs font-bold text-[#A51D24] rounded-sm flex items-center gap-1"
                    >
                      <EyeOff size={13} />
                      <span>Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateOppStatus(opp.id, 'approved')}
                      disabled={statusActionLoading === opp.id}
                      className="px-3 py-1.5 bg-[#16402E] text-white hover:bg-[#0F2D20] text-xs font-bold rounded-sm flex items-center gap-1"
                    >
                      <Check size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-3">
          <div className="border-b border-[#E2DDD5] pb-2">
            <h2 className="font-heading font-extrabold text-base text-[#1C211E]">{t.allUsersTitle}</h2>
            <p className="text-xs text-[#555E57] mt-0.5">{t.allUsersSubtitle}</p>
          </div>
          {users.length > 0 ? (
            <ul className="space-y-2">
              {users.map(profile => (
                <li
                  key={profile.uid}
                  className="bg-white border border-[#E2DDD5] p-3 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#1C211E] break-words">{profile.displayName || profile.email}</p>
                    <p className="text-xs text-[#555E57] break-words">
                      {profile.email} • {t.registeredOn} {profile.createdAt?.split('T')[0]}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <label htmlFor={`role-${profile.uid}`} className="sr-only">{t.changeRole}</label>
                    <select
                      id={`role-${profile.uid}`}
                      value={profile.role || ''}
                      disabled={statusActionLoading === profile.uid}
                      onChange={e => handleChangeRole(profile, e.target.value as UserRole)}
                      className="bg-[#F8F5EE] border border-[#E2DDD5] rounded-sm px-2.5 py-1.5 text-xs text-[#1C211E] focus:outline-none focus:border-[#16402E]"
                    >
                      {!profile.role && <option value="">{t.roleNotChosen}</option>}
                      <option value="student">{t.userRoleStudent}</option>
                      <option value="organization">{t.userRoleOrg}</option>
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#555E57] bg-white p-4 border border-[#E2DDD5] rounded-sm">{t.noUsers}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-b border-[#E2DDD5] pb-2">
            <h2 className="font-heading font-extrabold text-base text-[#1C211E] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#D95D39]" />
              <span>Inaccurate Information Reports from Students & Youths</span>
            </h2>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((rep, idx) => (
                <div key={rep.id || idx} className="bg-white border-2 border-[#16402E]/20 p-4 rounded-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#D95D39] uppercase tracking-wider">
                      {rep.targetType}: {rep.targetTitle}
                    </span>
                    <span className="text-[#555E57]">{rep.createdAt?.split('T')[0]}</span>
                  </div>

                  <div className="text-xs font-semibold text-[#1C211E]">
                    Report Reason: <span className="font-bold text-[#A51D24]">{rep.reason}</span>
                  </div>

                  <p className="text-xs text-[#2C332E] bg-[#F8F5EE] p-3 rounded-sm border border-[#E2DDD5]">
                    {rep.details}
                  </p>

                  {rep.reporterEmail && (
                    <p className="text-[11px] text-[#555E57]">
                      Submitted by: <span className="font-semibold">{rep.reporterEmail}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2DDD5] p-8 text-center rounded-sm text-xs text-[#555E57]">
              <FileText size={28} className="mx-auto mb-2 text-[#777E79]" />
              <p className="font-bold text-[#1C211E]">No student issue reports submitted yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EDIT_FIELD_LABELS = [
  'name', 'type', 'region', 'town', 'address', 'contactPhone', 'contactEmail', 'website', 'socialLinks',
  'logoUrl', 'imageUrl', 'description', 'facilities', 'studentAccess', 'fees', 'openingHours',
  'powerReliability', 'internetReliability', 'bookingRequired',
];

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(value);
}

// Fields an owner changed compared with the live place, for the admin review list.
function changedFields(live: Organization, changes: Record<string, unknown>) {
  return EDIT_FIELD_LABELS.filter(field => field in changes)
    .map(field => ({
      field,
      before: displayValue((live as unknown as Record<string, unknown>)[field]),
      after: displayValue(changes[field]),
    }))
    .filter(c => c.before !== c.after);
}
