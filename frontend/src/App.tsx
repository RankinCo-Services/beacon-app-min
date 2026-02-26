import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TenantAuthGuard } from '@beacon/tenant-ui';
import { NavigationProvider, AppLayout } from '@beacon/app-layout';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { navigation, level2Navigation, level3Navigation } from './config/navigation';
import { TenantSelectionPage, SignInPage, SignUpPage } from '@beacon/tenant-ui';

// Analytics
import AnalyticsHomePage   from '@psa/pages/analytics/AnalyticsHomePage';
import ReportsPage         from '@psa/pages/analytics/ReportsPage';

// Sales
import SalesHomePage       from '@psa/pages/sales/SalesHomePage';
import PipelinePage        from '@psa/pages/sales/PipelinePage';
import CompaniesPage       from '@psa/pages/sales/CompaniesPage';
import SalesContractsPage  from '@psa/pages/sales/SalesContractsPage';

// Operations
import OperationsHomePage  from '@psa/pages/operations/OperationsHomePage';
import ProjectsPage        from '@psa/pages/operations/ProjectsPage';
import ProjectDetailPage   from '@psa/pages/operations/ProjectDetailPage';
import TeamPage            from '@psa/pages/operations/TeamPage';
import TimesheetsPage      from '@psa/pages/operations/TimesheetsPage';

// Finance
import FinanceHomePage     from '@psa/pages/finance/FinanceHomePage';
import InvoicingPage       from '@psa/pages/finance/InvoicingPage';
import ExpensesPage        from '@psa/pages/finance/ExpensesPage';
import LedgerPage          from '@psa/pages/finance/LedgerPage';

// Settings
import CompanySettingsPage from '@psa/pages/settings/CompanySettingsPage';
import TeamSettingsPage    from '@psa/pages/settings/TeamSettingsPage';
import TemplatesPage       from '@psa/pages/settings/TemplatesPage';
import IntegrationsPage    from '@psa/pages/settings/IntegrationsPage';
import BillingPage         from '@psa/pages/settings/BillingPage';

// Help
import HelpPage            from '@psa/pages/help/HelpPage';

function App() {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <Routes>
        {/* Auth */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route
          path="/tenants"
          element={
            <ProtectedRoute>
              <TenantSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* App — requires auth + tenant */}
        <Route
          element={
            <ProtectedRoute>
              <TenantAuthGuard>
                <Outlet />
              </TenantAuthGuard>
            </ProtectedRoute>
          }
        >
          <Route
            element={
              <NavigationProvider
                navigation={navigation}
                level2Navigation={level2Navigation}
                level3Navigation={level3Navigation}
              >
                <AppLayout />
              </NavigationProvider>
            }
          >
            {/* Analytics */}
            <Route index element={<AnalyticsHomePage />} />
            <Route path="reports" element={<ReportsPage />} />

            {/* Sales */}
            <Route path="sales" element={<SalesHomePage />} />
            <Route path="sales/pipeline" element={<PipelinePage />} />
            <Route path="sales/companies" element={<CompaniesPage />} />
            <Route path="sales/contracts" element={<SalesContractsPage />} />

            {/* Operations */}
            <Route path="operations" element={<OperationsHomePage />} />
            <Route path="operations/projects" element={<ProjectsPage />} />
            <Route path="operations/projects/:id" element={<ProjectDetailPage />} />
            <Route path="operations/team" element={<TeamPage />} />
            <Route path="operations/timesheets" element={<TimesheetsPage />} />

            {/* Finance */}
            <Route path="finance" element={<FinanceHomePage />} />
            <Route path="finance/invoicing" element={<InvoicingPage />} />
            <Route path="finance/expenses" element={<ExpensesPage />} />
            <Route path="finance/ledger" element={<LedgerPage />} />

            {/* Settings */}
            <Route path="settings" element={<Navigate to="/settings/company" replace />} />
            <Route path="settings/company" element={<CompanySettingsPage />} />
            <Route path="settings/team" element={<TeamSettingsPage />} />
            <Route path="settings/templates" element={<TemplatesPage />} />
            <Route path="settings/integrations" element={<IntegrationsPage />} />
            <Route path="settings/billing" element={<BillingPage />} />

            {/* Help */}
            <Route path="help" element={<HelpPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
