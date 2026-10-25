import React, { useState, useEffect } from 'react';
import { User } from './types';
import { auth } from './services/auth';
import { db } from './services/db';
import { NavItemKey } from './services/rbac';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AccountModal } from './components/layout/AccountModal';
import { ToastContainer } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';

import { DashboardView } from './components/views/DashboardView';
import { FinanceView } from './components/views/FinanceView';
import { PurchasingView } from './components/views/PurchasingView';
import { RawInventoryView } from './components/views/RawInventoryView';
import { ProductionPlanView } from './components/views/ProductionPlanView';
import { ShiftReportView } from './components/views/ShiftReportView';
import { QualityControlView } from './components/views/QualityControlView';
import { FinishedGoodsView } from './components/views/FinishedGoodsView';
import { OutboundView } from './components/views/OutboundView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { MachineView } from './components/views/MachineView';
import { PartnerView } from './components/views/PartnerView';
import { AuditLogView } from './components/views/AuditLogView';
import { UserAdminView } from './components/views/UserAdminView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.getCurrentUser());
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [accountModalConfig, setAccountModalConfig] = useState<{
    isOpen: boolean;
    initialTab: 'profile' | 'password';
  }>({
    isOpen: false,
    initialTab: 'profile',
  });

  // Database snapshot update listener
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    const unsubAuth = auth.subscribe((u) => {
      setCurrentUser(u);
      // If user switched to Admin, set view to user-admin or dashboard
      if (u?.role === 'A') {
        setCurrentView('user-admin');
      }
    });

    const unsubDb = db.subscribe(() => {
      setDbVersion((v) => v + 1);
    });

    // Browser back/forward navigation support
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view as NavItemKey);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubAuth();
      unsubDb();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigateView = (view: NavItemKey) => {
    setCurrentView(view);
    try {
      window.history.pushState({ view }, '', `#${view}`);
    } catch {
      // fallback
    }
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  // Calculate pending counts for badges
  const snapshot = db.getSnapshot();
  const pendingCounts: Partial<Record<NavItemKey, number>> = {
    finance: snapshot.expenseRecords.filter((e) => e.status === 'PENDING_APPROVAL').length,
    purchasing: snapshot.purchases.filter((p) => p.status === 'SUBMITTED').length,
    'raw-inventory': snapshot.purchases.filter((p) => p.status === 'APPROVED').length,
    'shift-report': snapshot.shiftReports.filter((r) => r.status === 'SUBMITTED').length,
    qc: snapshot.lots.filter((l) => l.qcStatus === 'PENDING' || l.qcStatus === 'IN_TESTING').length,
    'finished-goods': snapshot.lots.filter((l) => l.qcStatus === 'QC_COMPLETED' && !l.isReceivedInWarehouse).length,
    outbound: snapshot.outboundProposals.filter((o) => o.status === 'PENDING_OWNER_APPROVAL').length,
    maintenance: snapshot.failures.filter((f) => f.status === 'REPORTED').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={handleNavigateView}
        userRole={currentUser.role}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingCounts={pendingCounts}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-200">
        {/* Top Header */}
        <Topbar
          currentUser={currentUser}
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAccountModal={(tab) => setAccountModalConfig({ isOpen: true, initialTab: tab })}
          onNavigateView={handleNavigateView}
        />

        {/* View Content Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {currentView === 'dashboard' && (
            <DashboardView currentUser={currentUser} onNavigate={handleNavigateView} />
          )}

          {currentView === 'finance' && <FinanceView currentUser={currentUser} />}

          {currentView === 'purchasing' && <PurchasingView currentUser={currentUser} />}

          {currentView === 'raw-inventory' && <RawInventoryView currentUser={currentUser} />}

          {currentView === 'production-plan' && <ProductionPlanView currentUser={currentUser} />}

          {currentView === 'shift-report' && <ShiftReportView currentUser={currentUser} />}

          {currentView === 'qc' && <QualityControlView currentUser={currentUser} />}

          {currentView === 'finished-goods' && <FinishedGoodsView currentUser={currentUser} />}

          {currentView === 'outbound' && <OutboundView currentUser={currentUser} />}

          {currentView === 'maintenance' && <MaintenanceView currentUser={currentUser} />}

          {currentView === 'machines' && <MachineView currentUser={currentUser} />}

          {currentView === 'partners' && <PartnerView currentUser={currentUser} />}

          {currentView === 'audit-logs' && <AuditLogView currentUser={currentUser} />}

          {currentView === 'user-admin' && <UserAdminView currentUser={currentUser} />}
        </main>
      </div>

      {/* Account Settings / Password Modal */}
      <AccountModal
        isOpen={accountModalConfig.isOpen}
        initialTab={accountModalConfig.initialTab}
        currentUser={currentUser}
        onClose={() => setAccountModalConfig({ ...accountModalConfig, isOpen: false })}
      />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
}
