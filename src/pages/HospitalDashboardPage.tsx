import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Hospital,
  HospitalResource,
  HospitalConfirmation,
  AuditLog,
  AvailabilityStatus,
} from '../types';
import {
  Sliders,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  Edit2,
  AlertTriangle,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';

export const HospitalDashboardPage: React.FC = () => {
  const currentUser = apiClient.getCurrentUser();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    currentUser.hospital_id || 'hosp-001'
  );
  const [resources, setResources] = useState<HospitalResource[]>([]);
  const [confirmations, setConfirmations] = useState<HospitalConfirmation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'confirmations' | 'audit'>('inventory');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | 'fresh' | 'stale'>('all');

  // Edit resource modal
  const [editingResource, setEditingResource] = useState<HospitalResource | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<AvailabilityStatus>('available');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reject confirmation modal
  const [rejectingConfId, setRejectingConfId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Emergency department at surge capacity');

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const hList = await apiClient.getHospitals();
      setHospitals(hList);
      await refreshHospitalData(selectedHospitalId);
    }
    loadData();
  }, [selectedHospitalId]);

  const refreshHospitalData = async (hId: string) => {
    try {
      const [resList, confList, logs] = await Promise.all([
        apiClient.getHospitalResources(hId),
        apiClient.getConfirmations(hId),
        apiClient.getAuditLogs(),
      ]);
      setResources(resList);
      setConfirmations(confList);
      setAuditLogs(logs);
    } catch (err: any) {
      setNotification(`Failed to load hospital data: ${err.message}`);
    }
  };

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Summary counts
  const freshCount = resources.filter((r) => r.is_fresh).length;
  const staleCount = resources.filter((r) => !r.is_fresh).length;
  const unknownCount = resources.filter((r) => r.availability_status === 'unknown').length;
  const unavailableCount = resources.filter((r) => r.availability_status === 'unavailable').length;

  const pendingConfirmations = confirmations.filter((c) => c.status === 'pending');
  const acceptedConfirmations = confirmations.filter((c) => c.status === 'accepted');

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.resource_name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesFresh =
      freshnessFilter === 'all' ||
      (freshnessFilter === 'fresh' && r.is_fresh) ||
      (freshnessFilter === 'stale' && !r.is_fresh);
    return matchesSearch && matchesCategory && matchesFresh;
  });

  const categories = Array.from(new Set(resources.map((r) => r.category)));

  const handleSaveResource = async () => {
    if (!editingResource) return;
    setIsSaving(true);
    try {
      await apiClient.updateResource(selectedHospitalId, editingResource.id, {
        available_quantity: editQty,
        availability_status: editStatus,
      });
      setNotification(`Resource ${editingResource.resource_name} inventory updated and verified.`);
      setEditingResource(null);
      await refreshHospitalData(selectedHospitalId);
    } catch (err: any) {
      setNotification(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecision = async (confId: string, status: 'accepted' | 'rejected', reason?: string) => {
    try {
      await apiClient.decideConfirmation(confId, status, reason);
      setNotification(`Emergency request marked as ${status.toUpperCase()}.`);
      setRejectingConfId(null);
      await refreshHospitalData(selectedHospitalId);
    } catch (err: any) {
      setNotification(`Error recording decision: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#707070] uppercase tracking-wider font-mono">
              <span>HOSPITAL STAFF PORTAL</span>
              <span>/</span>
              <span className="text-[#F5F5F5]">{currentUser.full_name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#F5F5F5]">
              {currentHospital?.name || 'Facility Dashboard'}
            </h1>
            <p className="text-xs text-[#A0A0A0] font-light">
              Code: {currentHospital?.code} · Tier: {currentHospital?.tier} · Contact: {currentHospital?.contact_phone}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-[#242424] border border-[#383838] p-1.5 text-xs">
              <span className="text-[10px] text-[#707070] uppercase block px-1.5 font-medium">FACILITY:</span>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="bg-transparent text-[#F5F5F5] px-1.5 py-1 text-xs uppercase font-medium focus:outline-none"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} className="bg-[#1B1B1B]">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => refreshHospitalData(selectedHospitalId)}
              className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-3.5 py-2.5 text-xs font-bold uppercase flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="bg-[#1B1B1B] border border-[#383838] p-3 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-[#F5F5F5]" />
              <span className="text-[#F5F5F5]">{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-[#707070] hover:text-[#F5F5F5]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Structured Grid: 4 Large Stat Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#707070] block font-medium">
              FRESH TELEMETRY (&le;10M)
            </span>
            <span className="text-3xl font-light text-[#F5F5F5] font-mono">{freshCount}</span>
            <span className="text-[11px] text-[#A0A0A0] block font-light">Verified Stock Items</span>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#707070] block font-medium">
              STALE TELEMETRY (&gt;10M)
            </span>
            <span className="text-3xl font-light text-[#F5F5F5] font-mono">{staleCount}</span>
            <span className="text-[11px] text-[#A0A0A0] block font-light">Requires Timestamp Update</span>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#707070] block font-medium">
              PENDING INTAKE REQUESTS
            </span>
            <span className="text-3xl font-light text-[#F5F5F5] font-mono">
              {pendingConfirmations.length}
            </span>
            <span className="text-[11px] text-[#A0A0A0] block font-light">Awaiting Staff Decision</span>
          </div>

          <div className="bg-[#1B1B1B] border border-[#383838] p-5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#707070] block font-medium">
              CONFIRMED ACCEPTANCES
            </span>
            <span className="text-3xl font-light text-[#F5F5F5] font-mono">
              {acceptedConfirmations.length}
            </span>
            <span className="text-[11px] text-[#A0A0A0] block font-light">Inbound Patient Cases</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="border-b border-[#383838] flex space-x-2 text-xs uppercase font-medium">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-[#F5F5F5] text-[#F5F5F5] font-semibold'
                : 'border-transparent text-[#707070] hover:text-[#A0A0A0]'
            }`}
          >
            RESOURCE INVENTORY ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'confirmations'
                ? 'border-[#F5F5F5] text-[#F5F5F5] font-semibold'
                : 'border-transparent text-[#707070] hover:text-[#A0A0A0]'
            }`}
          >
            ADMISSION CONFIRMATIONS ({confirmations.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-[#F5F5F5] text-[#F5F5F5] font-semibold'
                : 'border-transparent text-[#707070] hover:text-[#A0A0A0]'
            }`}
          >
            AUDIT TRAIL ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-[#1B1B1B] border border-[#383838] p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#707070]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter resource name..."
                  className="w-full bg-[#242424] border border-[#383838] pl-9 pr-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#242424] border border-[#383838] px-2.5 py-1.5 text-xs uppercase text-[#F5F5F5] focus:outline-none"
                >
                  <option value="all">ALL CATEGORIES</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  value={freshnessFilter}
                  onChange={(e) => setFreshnessFilter(e.target.value as any)}
                  className="bg-[#242424] border border-[#383838] px-2.5 py-1.5 text-xs uppercase text-[#F5F5F5] focus:outline-none"
                >
                  <option value="all">ALL FRESHNESS</option>
                  <option value="fresh">FRESH ONLY (&le;10m)</option>
                  <option value="stale">STALE ONLY (&gt;10m)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#1B1B1B] border border-[#383838] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#242424] border-b border-[#383838] text-[#707070] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Resource</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 font-mono">Available / Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Verified</th>
                    <th className="py-2.5 px-3">Freshness</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]">
                  {filteredResources.map((r) => (
                    <tr key={r.id} className="hover:bg-[#242424]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#F5F5F5]">{r.resource_name}</td>
                      <td className="py-3 px-3 uppercase text-[#A0A0A0] text-[11px]">{r.category}</td>
                      <td className="py-3 px-3 font-mono text-[#F5F5F5]">
                        {r.available_quantity} / {r.total_quantity} {r.unit}
                      </td>
                      <td className="py-3 px-3 uppercase">
                        <span className={`px-2 py-0.5 text-[10px] font-medium border ${
                          r.availability_status === 'available'
                            ? 'bg-[#2D2D2D] text-[#F5F5F5] border-[#707070]'
                            : r.availability_status === 'limited'
                            ? 'bg-[#242424] text-[#A0A0A0] border-[#383838]'
                            : 'bg-[#1B1B1B] text-[#707070] border-[#383838]'
                        }`}>
                          {r.availability_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#A0A0A0] text-[11px] font-mono">
                        {new Date(r.last_verified_at).toLocaleTimeString()} ({r.freshness_age_minutes}m ago)
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-medium ${
                          r.is_fresh ? 'text-[#F5F5F5]' : 'text-[#707070]'
                        }`}>
                          {r.is_fresh ? 'FRESH' : 'STALE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingResource(r);
                            setEditQty(r.available_quantity);
                            setEditStatus(r.availability_status);
                          }}
                          className="bg-[#242424] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-2.5 py-1 text-[11px] uppercase tracking-wider inline-flex items-center space-x-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>UPDATE</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Incoming Admission Requests */}
        {activeTab === 'confirmations' && (
          <div className="space-y-4">
            {confirmations.length === 0 ? (
              <div className="bg-[#1B1B1B] border border-[#383838] p-12 text-center text-xs text-[#707070]">
                NO ACTIVE INCOMING ADMISSION REQUESTS RECORDED FOR THIS FACILITY.
              </div>
            ) : (
              confirmations.map((c) => (
                <div key={c.id} className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#2D2D2D] pb-3">
                    <div>
                      <span className="text-[10px] text-[#707070] uppercase block font-mono">
                        CONFIRMATION ID: {c.id}
                      </span>
                      <h3 className="font-semibold text-sm uppercase text-[#F5F5F5]">
                        Emergency Incident: {c.emergency_id}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs uppercase font-medium self-start sm:self-auto border ${
                      c.status === 'accepted'
                        ? 'bg-[#F5F5F5] text-[#111111] border-[#F5F5F5]'
                        : c.status === 'rejected'
                        ? 'bg-[#2D2D2D] text-[#707070] border-[#383838]'
                        : 'bg-[#242424] text-[#F5F5F5] border-[#383838]'
                    }`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#707070] uppercase block text-[10px]">RESERVED RESOURCES</span>
                      <span className="text-[#F5F5F5]">
                        {c.reserved_resources?.join(', ') || 'Initial Resuscitation Bay'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#707070] uppercase block text-[10px]">REQUEST TIME</span>
                      <span className="text-[#A0A0A0]">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {c.rejection_reason && (
                    <div className="bg-[#242424] border border-[#383838] p-3 text-xs text-[#A0A0A0]">
                      <strong className="text-[#F5F5F5]">DECLINE REASON:</strong> {c.rejection_reason}
                    </div>
                  )}

                  {c.status === 'pending' && (
                    <div className="pt-3 border-t border-[#2D2D2D] flex items-center space-x-3">
                      <button
                        onClick={() => handleDecision(c.id, 'accepted')}
                        className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2 text-xs uppercase font-bold tracking-wider flex items-center space-x-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ACCEPT ADMISSION</span>
                      </button>

                      <button
                        onClick={() => setRejectingConfId(c.id)}
                        className="bg-[#242424] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-[#F5F5F5] border border-[#383838] px-4 py-2 text-xs uppercase font-medium tracking-wider flex items-center space-x-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>DECLINE / REJECT</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-[#1B1B1B] border border-[#383838] p-6 space-y-4">
            <h3 className="font-semibold uppercase text-xs tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
              System Operations &amp; Update Log
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#707070]">No audit events recorded.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-[#242424] border border-[#383838] p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#F5F5F5] uppercase">{log.action}</span>
                      <span className="text-[10px] text-[#707070] font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[#A0A0A0]">
                      Entity: {log.entity_type} ({log.entity_id}) · Actor: {log.actor_id || 'System'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Update Resource Modal */}
        {editingResource && (
          <div className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1B1B1B] border border-[#383838] max-w-md w-full p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-2">
                <h3 className="font-semibold uppercase tracking-wider text-[#F5F5F5]">Update Resource Stock</h3>
                <button onClick={() => setEditingResource(null)} className="text-[#707070] hover:text-[#F5F5F5]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[#707070] uppercase block text-[10px]">RESOURCE:</span>
                  <span className="font-medium text-[#F5F5F5]">{editingResource.resource_name}</span>
                </div>

                <div>
                  <label className="text-[#A0A0A0] uppercase block mb-1">Available Quantity:</label>
                  <input
                    type="number"
                    min={0}
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full bg-[#242424] border border-[#383838] p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                  />
                </div>

                <div>
                  <label className="text-[#A0A0A0] uppercase block mb-1">Availability Status:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-[#242424] border border-[#383838] p-2 text-xs uppercase text-[#F5F5F5] focus:outline-none"
                  >
                    <option value="available">AVAILABLE</option>
                    <option value="limited">LIMITED</option>
                    <option value="unavailable">UNAVAILABLE</option>
                    <option value="unknown">UNKNOWN</option>
                  </select>
                </div>

                <p className="text-[11px] text-[#707070]">
                  * Saving will reset telemetry timestamp to NOW and record an immutable audit entry.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#2D2D2D]">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="bg-[#242424] hover:bg-[#2D2D2D] text-[#A0A0A0] px-4 py-2 uppercase font-medium"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveResource}
                  disabled={isSaving}
                  className="bg-[#F5F5F5] text-[#111111] hover:bg-[#FFFFFF] px-4 py-2 uppercase font-bold"
                >
                  {isSaving ? 'SAVING...' : 'SAVE & VERIFY NOW'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectingConfId && (
          <div className="fixed inset-0 z-50 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1B1B1B] border border-[#383838] max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="font-semibold uppercase tracking-wider text-[#F5F5F5] border-b border-[#2D2D2D] pb-2">
                Decline Admission Request
              </h3>
              <div className="space-y-2">
                <label className="text-[#A0A0A0] uppercase block">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#242424] border border-[#383838] p-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingConfId(null)}
                  className="bg-[#242424] hover:bg-[#2D2D2D] text-[#A0A0A0] px-4 py-2 font-medium uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(rejectingConfId, 'rejected', rejectionReason)}
                  className="bg-[#F5F5F5] text-[#111111] hover:bg-[#FFFFFF] px-4 py-2 font-bold uppercase"
                >
                  CONFIRM REJECTION
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
