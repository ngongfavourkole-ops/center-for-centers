import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Organization, Opportunity, Report, ApprovalStatus } from '../types';
import {
  fetchAllOrganizationsForAdmin,
  fetchAllOpportunitiesForAdmin,
  updateOrganizationStatus,
  updateOpportunityStatus,
  loadSampleDataToFirestore,
  fetchReportsForAdmin,
} from '../lib/firestoreService';
import { StatusBadge, SampleDataBadge, FreeBadge, PaidBadge } from '../components/Badges';
import { useLanguage } from '../context/LanguageContext';
import { formatLocation } from '../lib/regions';
import { ShieldCheck, Check, X, Database, AlertCircle, RefreshCw, EyeOff, FileText, Building2, Sparkles, MessageSquare } from 'lucide-react';

interface AdminViewProps {
  user: User;
  onRefreshData: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onRefreshData }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pending' | 'all-orgs' | 'all-opps' | 'reports'>('pending');
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
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
      const [orgs, opps, reps] = await Promise.all([
        fetchAllOrganizationsForAdmin(),
        fetchAllOpportunitiesForAdmin(),
        fetchReportsForAdmin(),
      ]);
      setAllOrgs(orgs);
      setAllOpps(opps);
      setReports(reps);
    } catch {
      setNotice({ type: 'error', msg: 'Failed to retrieve admin records.' });
    } finally {
      setLoading(false);
    }
  };

  const pendingOrgs = allOrgs.filter(o => o.status === 'pending');
  const pendingOpps = allOpps.filter(o => o.status === 'pending');

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

  const handleLoadSampleData = async () => {
    if (!window.confirm('Populate database with 8 Cameroon organizations and 15 realistic youth opportunities?')) {
      return;
    }
    setLoadingSample(true);
    try {
      const result = await loadSampleDataToFirestore();
      setNotice({
        type: 'success',
        msg: `Loaded ${result.orgsCount} sample organizations and ${result.oppsCount} opportunities successfully!`,
      });
      await loadAdminData();
      await onRefreshData();
    } catch {
      setNotice({ type: 'error', msg: 'Failed to load sample data. Check Firestore rules and connection.' });
    } finally {
      setLoadingSample(false);
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
            onClick={handleLoadSampleData}
            disabled={loadingSample}
            className="px-4 py-2.5 bg-[#D95D39] hover:bg-[#B84725] text-white text-xs font-bold rounded-sm border border-[#B84725] flex items-center gap-2 transition-colors shrink-0"
            title="Adds 8 Cameroon organizations and 15 opportunities into Firestore"
          >
            <Database size={15} />
            <span>{loadingSample ? 'Loading sample data...' : 'Load sample data'}</span>
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
          {(pendingOrgs.length > 0 || pendingOpps.length > 0) && (
            <span className="bg-[#D95D39] text-white text-[10px] px-1.5 py-0.2 rounded-sm font-bold">
              {pendingOrgs.length + pendingOpps.length}
            </span>
          )}
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
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm text-xs text-[#555E57]">
          Loading admin databases...
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-6">
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
                          <span className="text-xs font-bold text-[#16402E]">{org.type}</span>
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
      ) : activeTab === 'all-orgs' ? (
        <div className="space-y-3">
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
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={org.status} />
                    {org.isSample && <SampleDataBadge />}
                    <span className="text-xs font-bold text-[#16402E]">{org.type}</span>
                    <span className="text-xs text-[#555E57]">• {formatLocation(org, t)}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1C211E]">{org.name}</h3>
                  <p className="text-xs text-[#555E57]">{org.address}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
