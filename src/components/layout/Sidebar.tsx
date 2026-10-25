import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { NavItemKey, NAV_ITEMS, NAV_GROUPS } from '../../services/rbac';
import { RoleCode } from '../../types';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  userRole: RoleCode;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCounts?: Partial<Record<NavItemKey, number>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  userRole,
  isOpenMobile,
  onCloseMobile,
  pendingCounts = {},
}) => {
  // Only one accordion group open at a time as requested in 6.4:
  // "Khi mở một nhóm sidebar, nhóm khác tự đóng. Không hiển thị tất cả các nhóm mở cùng lúc."
  const [activeGroup, setActiveGroup] = useState<string>('CORE');

  // Filter items allowed for this role
  const allowedItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  // Find groups that have at least one allowed item
  const availableGroups = (Object.keys(NAV_GROUPS) as (keyof typeof NAV_GROUPS)[]).filter(
    (gKey) => allowedItems.some((item) => item.group === gKey)
  );

  const toggleGroup = (groupKey: string) => {
    setActiveGroup((prev) => (prev === groupKey ? '' : groupKey));
  };

  const handleItemClick = (key: NavItemKey) => {
    onSelectView(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 shadow-sm flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-wide">BATT PPMS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-medium">
                  v6.1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px] font-medium">Năng lượng tái tạo</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {availableGroups.map((gKey) => {
            const groupConfig = NAV_GROUPS[gKey];
            const groupItems = allowedItems.filter((i) => i.group === gKey);
            const isGroupOpen = activeGroup === gKey;

            return (
              <div key={gKey} className="space-y-1">
                {/* Group Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(gKey)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{groupConfig.title}</span>
                  <Icons.ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isGroupOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Group Items (auto collapsed if another opened) */}
                {isGroupOpen && (
                  <div className="space-y-1 pt-0.5 animate-in slide-in-from-top-1 duration-150">
                    {groupItems.map((item) => {
                      const IconComp =
                        (Icons[item.icon as keyof typeof Icons] as React.ComponentType<{
                          className?: string;
                        }>) || Icons.Circle;
                      const isActive = currentView === item.key;
                      const pending = pendingCounts[item.key] || 0;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleItemClick(item.key)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComp
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {pending > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {pending}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info: Wood Pellet Factory */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-500 shadow-2xs">
            <p className="font-semibold text-slate-800 truncate">Nhà máy Viên nén Gỗ BATT</p>
            <p className="text-[10px] text-slate-500 truncate">Hàm Kiệm, Bình Thuận</p>
          </div>
        </div>
      </aside>
    </>
  );
};
