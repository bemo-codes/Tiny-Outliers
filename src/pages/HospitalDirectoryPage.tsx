import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { Hospital } from '../types';
import {
  Building2,
  Search,
  PhoneCall,
  MapPin,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface HospitalDirectoryPageProps {
  onNavigate: (path: string) => void;
}

export const HospitalDirectoryPage: React.FC<HospitalDirectoryPageProps> = ({ onNavigate }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const list = await apiClient.getHospitals();
      setHospitals(list);
    }
    load();
  }, []);

  const filtered = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || h.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || h.operational_status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const tiers = ['all', 'Trauma Level 1', 'Tertiary', 'Secondary', 'Primary'];

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#383838] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#707070] mb-2 font-mono">
              <span className="w-2 h-2 bg-[#F5F5F5] inline-block" />
              <span>REGIONAL HEALTHCARE REGISTRY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5]">
              Hospital Directory <span className="font-semibold">&amp; Capabilities</span>
            </h1>
          </div>
          <button
            onClick={() => onNavigate('/emergency/new')}
            className="bg-[#F5F5F5] hover:bg-[#FFFFFF] text-[#111111] px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 self-start md:self-auto transition-colors"
          >
            <span>START EMERGENCY SEARCH</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#1B1B1B] border border-[#383838] p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#707070]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by facility name, city, or code..."
              className="w-full bg-[#242424] border border-[#383838] pl-9 pr-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F5F5F5]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#707070] uppercase text-[11px]">TIER:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-[#242424] border border-[#383838] px-2.5 py-1.5 text-xs uppercase text-[#F5F5F5] focus:outline-none"
              >
                {tiers.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[#707070] uppercase text-[11px]">STATUS:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#242424] border border-[#383838] px-2.5 py-1.5 text-xs uppercase text-[#F5F5F5] focus:outline-none"
              >
                <option value="all">ALL STATUSES</option>
                <option value="active">ACTIVE</option>
                <option value="diverted">DIVERTED</option>
                <option value="at_capacity">AT CAPACITY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="bg-[#1B1B1B] border border-[#383838] hover:border-[#707070] p-6 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="bg-[#242424] border border-[#383838] text-[#F5F5F5] px-2 py-0.5 font-semibold uppercase">
                    {h.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium uppercase border ${
                      h.operational_status === 'active'
                        ? 'bg-[#111111] text-[#F5F5F5] border-[#707070]'
                        : 'bg-[#242424] text-[#707070] border-[#383838]'
                    }`}
                  >
                    {h.operational_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-base uppercase text-[#F5F5F5] tracking-wide">
                    {h.name}
                  </h3>
                  <span className="text-xs text-[#707070] uppercase block">{h.tier}</span>
                  <p className="text-xs text-[#A0A0A0] mt-1 flex items-start space-x-1 font-light">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#707070]" />
                    <span>{h.address}</span>
                  </p>
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(h.capabilities || []).slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="bg-[#242424] border border-[#383838] px-2 py-0.5 text-[10px] text-[#A0A0A0] uppercase"
                    >
                      {c.capability_name}
                    </span>
                  ))}
                </div>

                {/* Capacity stats */}
                <div className="bg-[#242424] p-2.5 border border-[#383838] text-xs flex justify-between font-mono">
                  <span className="text-[#707070]">OCCUPANCY:</span>
                  <span className="font-medium text-[#F5F5F5]">
                    {h.current_occupancy} / {h.total_capacity} BEDS
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#2D2D2D] flex items-center justify-between">
                <a
                  href={`tel:${h.contact_phone}`}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-[#F5F5F5] hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#A0A0A0]" />
                  <span>{h.contact_phone}</span>
                </a>
                <button
                  onClick={() => onNavigate(`/hospitals/${h.id}`)}
                  className="bg-[#242424] hover:bg-[#2D2D2D] text-[#F5F5F5] border border-[#383838] px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors"
                >
                  DETAILS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
