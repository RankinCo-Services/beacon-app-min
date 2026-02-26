/**
 * PSA v2 route registry.
 * Shell builds: <Route path={`psa/${def.path}`} element={<def.component />} />
 * Paths are relative to the app base (e.g. '' = root, 'sales' = /sales).
 */
import type { ComponentType } from 'react';

// Analytics
import AnalyticsHomePage   from './pages/analytics/AnalyticsHomePage';
import ReportsPage         from './pages/analytics/ReportsPage';

// Sales
import SalesHomePage       from './pages/sales/SalesHomePage';
import PipelinePage        from './pages/sales/PipelinePage';
import CompaniesPage       from './pages/sales/CompaniesPage';
import SalesContractsPage  from './pages/sales/SalesContractsPage';

// Operations
import OperationsHomePage  from './pages/operations/OperationsHomePage';
import ProjectsPage        from './pages/operations/ProjectsPage';
import ProjectDetailPage   from './pages/operations/ProjectDetailPage';
import TeamPage            from './pages/operations/TeamPage';
import TimesheetsPage      from './pages/operations/TimesheetsPage';

// Finance
import FinanceHomePage     from './pages/finance/FinanceHomePage';
import InvoicingPage       from './pages/finance/InvoicingPage';
import ExpensesPage        from './pages/finance/ExpensesPage';
import LedgerPage          from './pages/finance/LedgerPage';

// Settings
import CompanySettingsPage from './pages/settings/CompanySettingsPage';
import TeamSettingsPage    from './pages/settings/TeamSettingsPage';
import TemplatesPage       from './pages/settings/TemplatesPage';
import IntegrationsPage    from './pages/settings/IntegrationsPage';
import BillingPage         from './pages/settings/BillingPage';

// Help
import HelpPage            from './pages/help/HelpPage';

export interface AppRouteDef {
  path: string;
  component: ComponentType;
}

export const routeDefinitions: AppRouteDef[] = [
  // Analytics (root)
  { path: '',                        component: AnalyticsHomePage },
  { path: 'reports',                 component: ReportsPage },

  // Sales
  { path: 'sales',                   component: SalesHomePage },
  { path: 'sales/pipeline',          component: PipelinePage },
  { path: 'sales/companies',         component: CompaniesPage },
  { path: 'sales/contracts',         component: SalesContractsPage },

  // Operations
  { path: 'operations',              component: OperationsHomePage },
  { path: 'operations/projects',     component: ProjectsPage },
  { path: 'operations/projects/:id', component: ProjectDetailPage },
  { path: 'operations/team',         component: TeamPage },
  { path: 'operations/timesheets',   component: TimesheetsPage },

  // Finance
  { path: 'finance',                 component: FinanceHomePage },
  { path: 'finance/invoicing',       component: InvoicingPage },
  { path: 'finance/expenses',        component: ExpensesPage },
  { path: 'finance/ledger',          component: LedgerPage },

  // Settings
  { path: 'settings/company',        component: CompanySettingsPage },
  { path: 'settings/team',           component: TeamSettingsPage },
  { path: 'settings/templates',      component: TemplatesPage },
  { path: 'settings/integrations',   component: IntegrationsPage },
  { path: 'settings/billing',        component: BillingPage },

  // Help
  { path: 'help',                    component: HelpPage },

  // Catch-all
  { path: '*',                       component: AnalyticsHomePage },
];
