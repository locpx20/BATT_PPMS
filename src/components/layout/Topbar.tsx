import React, { useState } from 'react';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  KeyRound,
  UserCheck,
  ChevronDown,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { User, RoleCode, ROLES } from '../../types';
import { auth } from '../../services/auth';
import { db } from '../../services/db';
import { NavItemKey, NAV_ITEMS } from '../../services/rbac';

interface TopbarProps {
  currentUser: User;
  currentView: NavItemKey;
  onOpenMobileSidebar: () => void;
  onOpenAccountModal: (tab: 'profile' | 'password') => void;
  onNavigateView: (view: NavItemKey) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  currentView,
  onOpenMobileSidebar,
  onOpenAccountModal,
  onNavigateView,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = db.getSnapshot().notifications;
  // Role-relevant notifications
  const userNotifs = notifications.filter(
    (n) =>
      !n.recipientRole ||
      n.recipientRole === currentUser.role ||
      (n.recipientUserId && n.recipientUserId === currentUser.id)
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  const currentNav = NAV_ITEMS.find((n) => n.key === currentView);

  const handleRoleSwitch = (role: RoleCode) => {
    auth.switchRole(role);
    setShowRoleSwitcher(false);
  };

  const handleNotifClick = (notifId: string, targetView: string) => {
    db.markNotificationAsRead(notifId);
    setShowNotifications(false);
    onNavigateView(targetView as NavItemKey);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left Section: Menu Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800 text-base">{currentNav?.label || 'BATT PPMS'}</span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Right Section: Role Switcher + Notifications + User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fast Actor Switcher (Convenient for evaluators & full actor workflow validation) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowRoleSwitcher(!showRoleSwitcher);
              setShowUserMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            title="Chuyển nhanh vai trò kiểm thử nghiệp vụ"
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Đổi vai trò:</span>
            <span className="font-bold text-indigo-700">{ROLES[currentUser.role]?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Chọn vai trò kiểm thử (8 Actors)
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {(Object.keys(ROLES) as RoleCode[]).map((rKey) => {
                  const roleData = ROLES[rKey];
                  const isCurrent = currentUser.role === rKey;
                  return (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => handleRoleSwitch(rKey)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{roleData.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {rKey}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{roleData.vietnameseTitle}</p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleSwitcher(false);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo nội bộ</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => db.markAllNotificationsAsRead(currentUser.role)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Không có thông báo nào</div>
                ) : (
                  userNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.targetView)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        !n.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <span className="p-1 rounded-md bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleSwitcher(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {currentUser.fullName}
              </p>
              <p className="text-[11px] text-slate-500 leading-none">{ROLES[currentUser.role]?.vietnameseTitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAccountModal('profile');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Hồ sơ cá nhân
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAccountModal('password');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  Đổi mật khẩu
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    auth.logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
