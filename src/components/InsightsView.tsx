import React from 'react';
import { 
  BarChart3, 
  Users, 
  Star, 
  AlertTriangle, 
  Tag, 
  Building2, 
  Clock, 
  Database,
  CheckCircle2
} from 'lucide-react';
import { ManagedProfile, ProfileCategory } from '../types/profile';
import { CATEGORIES, CATEGORY_STYLES } from '../utils/profileHelpers';

interface InsightsViewProps {
  profiles: ManagedProfile[];
  lastSyncTime: Date | null;
  isLive: boolean;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  profiles,
  lastSyncTime,
  isLive
}) => {
  const totalCount = profiles.length;
  const favoriteCount = profiles.filter(p => p.favorite).length;
  const emergencyCount = profiles.filter(p => p.emergencyContact).length;
  const companyCount = new Set(profiles.map(p => p.company).filter(Boolean)).size;

  // Category counts
  const categoryCounts: Record<ProfileCategory, number> = {
    Personal: 0,
    Work: 0,
    Family: 0,
    Emergency: 0,
    Mentorship: 0,
    Network: 0
  };

  profiles.forEach(p => {
    if (categoryCounts[p.category] !== undefined) {
      categoryCounts[p.category]++;
    }
  });

  // Tag frequency
  const tagMap: Record<string, number> = {};
  profiles.forEach(p => {
    (p.tags || []).forEach(t => {
      tagMap[t] = (tagMap[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Database Insights &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry and distribution metrics from your Firestore profile records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Firestore Listener: {isLive ? 'Active' : 'Idle'}</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Profiles</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Managed entries in DB</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Starred Favorites</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{favoriteCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Quick-access priority contacts</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Emergency</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{emergencyCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Designated first responders</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Organizations</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400">{companyCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Distinct institutions &amp; firms</p>
        </div>
      </div>

      {/* Grid: Category distribution & Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Category Distribution
          </h3>

          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat];
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              const catStyle = CATEGORY_STYLES[cat];

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">{cat}</span>
                    <span className="text-slate-400 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: 
                          cat === 'Emergency' ? '#F43F5E' :
                          cat === 'Work' ? '#6366F1' :
                          cat === 'Family' ? '#10B981' :
                          cat === 'Mentorship' ? '#A855F7' :
                          cat === 'Network' ? '#F59E0B' : '#0EA5E9'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Keywords / Tags Cloud */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyan-400" />
              Tag &amp; Keyword Frequency
            </h3>

            {sortedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sortedTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200"
                  >
                    <span>#{tag}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] font-mono text-cyan-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No tags added to profiles yet. Tags added when editing profiles appear here.
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated across all managed cards</span>
            <span>{Object.keys(tagMap).length} total tags</span>
          </div>
        </div>

      </div>

      {/* Real-time sync status panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-none">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Google Cloud Firestore</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Live Sync
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Subscribed to real-time events via snapshot web-channel.
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>Last sync snapshot:</div>
          <div className="font-mono text-cyan-400">
            {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Connecting...'}
          </div>
        </div>
      </div>

    </div>
  );
};
