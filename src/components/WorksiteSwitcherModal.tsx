import React, { useState } from 'react';
import { Worksite, AppSettings, Labour } from '../types';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Check, 
  X, 
  Layers, 
  Users, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface WorksiteSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  labourers: Labour[];
  onSelectWorksite: (worksiteId: string, worksiteName: string) => void;
  onAddWorksite: (newWorksite: Worksite) => void;
  onOpenSettingsWorksites?: () => void;
}

export const WorksiteSwitcherModal: React.FC<WorksiteSwitcherModalProps> = ({
  isOpen,
  onClose,
  settings,
  labourers,
  onSelectWorksite,
  onAddWorksite,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newSupervisor, setNewSupervisor] = useState(settings.userSession?.userName || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateWorksite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Please provide a worksite or project name');
      return;
    }
    if (!newLocation.trim()) {
      setError('Please provide site location/city');
      return;
    }

    const newSite: Worksite = {
      id: `site_${Date.now()}`,
      name: newName.trim(),
      location: newLocation.trim(),
      clientName: newClient.trim() || undefined,
      supervisorName: newSupervisor.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddWorksite(newSite);
    onSelectWorksite(newSite.id, newSite.name);
    setIsAddingNew(false);
    setNewName('');
    setNewLocation('');
    setNewClient('');
    setError('');
    onClose();
  };

  const getWorkerCountForSite = (siteId: string) => {
    return labourers.filter((l) => l.worksiteId === siteId && l.status === 'active').length;
  };

  const totalWorkers = labourers.filter((l) => l.status === 'active').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl border border-purple-100 shadow-2xl overflow-hidden flex flex-col max-h-[90%] pb-[max(8px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#5C2D91] via-[#4D227E] to-[#381461] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                {isAddingNew ? 'Add New Worksite' : 'Switch Active Worksite'}
              </h2>
              <p className="text-[11px] text-purple-200 mt-0.5">
                {isAddingNew 
                  ? 'Register a new construction or project site' 
                  : 'Manage workers, attendance & wages per site'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {isAddingNew ? (
            <form onSubmit={handleCreateWorksite} className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Worksite / Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu Metro Rail - Phase 2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Location / City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kalanki, Kathmandu"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Client / Developer
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Site Supervisor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Er. Rajesh"
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-purple-50/40 border border-purple-100 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#5C2D91] hover:bg-[#4E247D] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save &amp; Switch</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Option 1: All Worksites Option */}
              <button
                type="button"
                onClick={() => {
                  onSelectWorksite('all', 'All Worksites');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  settings.activeWorksiteId === 'all'
                    ? 'bg-purple-50/80 border-[#5C2D91] shadow-xs'
                    : 'bg-white hover:bg-purple-50/30 border-purple-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    settings.activeWorksiteId === 'all'
                      ? 'bg-[#5C2D91] text-white shadow-xs'
                      : 'bg-purple-100 text-[#5C2D91]'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">
                        All Worksites
                      </span>
                      {settings.activeWorksiteId === 'all' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5C2D91] text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Consolidated view across all projects
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-500" />
                    <span>{totalWorkers}</span>
                  </span>
                  {settings.activeWorksiteId === 'all' && (
                    <Check className="w-4 h-4 text-[#5C2D91]" />
                  )}
                </div>
              </button>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Individual Worksites ({settings.worksites?.length || 0})
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">
                  Tap to switch
                </span>
              </div>

              {/* Worksites List */}
              <div className="space-y-2">
                {(settings.worksites || []).map((site) => {
                  const isActive = settings.activeWorksiteId === site.id;
                  const workerCount = getWorkerCountForSite(site.id);

                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        onSelectWorksite(site.id, site.name);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-purple-50/90 border-[#5C2D91] shadow-xs ring-1 ring-[#5C2D91]/20'
                          : 'bg-white hover:bg-purple-50/30 border-purple-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isActive
                            ? 'bg-[#5C2D91] text-white shadow-xs'
                            : 'bg-purple-100 text-[#5C2D91]'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {site.name}
                            </span>
                            {isActive && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#5C2D91] text-white">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span className="truncate">{site.location}</span>
                            </span>
                            {site.supervisorName && (
                              <>
                                <span className="text-neutral-300">•</span>
                                <span className="truncate hidden sm:inline text-neutral-500">
                                  {site.supervisorName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3 text-neutral-500" />
                          <span>{workerCount}</span>
                        </span>
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-[#5C2D91] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add New Worksite Action Button */}
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-2xl border border-dashed border-[#5C2D91]/40 bg-purple-50/50 hover:bg-purple-100/60 text-[#5C2D91] text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Worksite / Project</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
