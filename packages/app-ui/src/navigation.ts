/**
 * PSA v2 navigation structure.
 * getManifest() in index.ts calls these and assembles the manifest.
 *
 * Primary sidebar:   NavSection[]        — 6 modules
 * Secondary sidebar: NavSection.tabs     — pages within the active module
 * Content tab bar:   Level3Nav[]         — tabs within a page (e.g. Project Detail)
 */
import {
  BarChart2,
  Briefcase,
  Layers,
  Receipt,
  Settings2,
  HelpCircle,
  LayoutDashboard,
  FileBarChart,
  GitBranch,
  Building2,
  FileText,
  FolderKanban,
  Users,
  Clock,
  BookOpen,
  Building,
  LayoutTemplate,
  Plug,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavTab {
  id: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  activePaths?: string[];
}

export interface NavSection {
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  tabs: NavTab[];
  description?: string;
}

export interface Level2Nav {
  sectionPath: string;
  tabs: NavTab[];
}

export interface Level3Nav {
  parentPath: string;
  tabs: NavTab[];
}

export function getNavigation(basePath: string): NavSection[] {
  const base = basePath.replace(/\/$/, '');
  return [
    {
      id: 'analytics',
      name: 'Analytics',
      path: `${base}/`,
      icon: BarChart2,
      description: 'Dashboards and reports',
      tabs: [
        { id: 'home',    label: 'Home',    path: `${base}/`,        icon: LayoutDashboard },
        { id: 'reports', label: 'Reports', path: `${base}/reports`, icon: FileBarChart },
      ],
    },
    {
      id: 'sales',
      name: 'Sales',
      path: `${base}/sales`,
      icon: Briefcase,
      description: 'Pipeline, companies, contracts',
      tabs: [
        { id: 'home',      label: 'Home',                 path: `${base}/sales`,           icon: LayoutDashboard },
        { id: 'pipeline',  label: 'Pipeline',             path: `${base}/sales/pipeline`,  icon: GitBranch },
        { id: 'companies', label: 'Companies & Contacts', path: `${base}/sales/companies`, icon: Building2 },
        { id: 'contracts', label: 'Sales & Contracts',    path: `${base}/sales/contracts`, icon: FileText },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      path: `${base}/operations`,
      icon: Layers,
      description: 'Projects, team, timesheets',
      tabs: [
        { id: 'home',       label: 'Home',       path: `${base}/operations`,            icon: LayoutDashboard },
        { id: 'projects',   label: 'Projects',   path: `${base}/operations/projects`,   icon: FolderKanban },
        { id: 'team',       label: 'Team',       path: `${base}/operations/team`,       icon: Users },
        { id: 'timesheets', label: 'Timesheets', path: `${base}/operations/timesheets`, icon: Clock },
      ],
    },
    {
      id: 'finance',
      name: 'Finance',
      path: `${base}/finance`,
      icon: Receipt,
      description: 'Invoicing, expenses, ledger',
      tabs: [
        { id: 'home',      label: 'Home',                path: `${base}/finance`,           icon: LayoutDashboard },
        { id: 'invoicing', label: 'Invoicing',           path: `${base}/finance/invoicing`, icon: FileText },
        { id: 'expenses',  label: 'Expenses & Bills',    path: `${base}/finance/expenses`,  icon: Receipt },
        { id: 'ledger',    label: 'Ledger & Statements', path: `${base}/finance/ledger`,    icon: BookOpen },
      ],
    },
    {
      id: 'settings',
      name: 'Settings',
      path: `${base}/settings`,
      icon: Settings2,
      description: 'Company, team, templates, billing',
      tabs: [
        { id: 'company',      label: 'Company',      path: `${base}/settings/company`,      icon: Building },
        { id: 'team',         label: 'Team & Roles', path: `${base}/settings/team`,         icon: Users },
        { id: 'templates',    label: 'Templates',    path: `${base}/settings/templates`,    icon: LayoutTemplate },
        { id: 'integrations', label: 'Integrations', path: `${base}/settings/integrations`, icon: Plug },
        { id: 'billing',      label: 'Billing',      path: `${base}/settings/billing`,      icon: CreditCard },
      ],
    },
    {
      id: 'help',
      name: 'Help',
      path: `${base}/help`,
      icon: HelpCircle,
      description: 'Help and support',
      tabs: [
        { id: 'help', label: 'Help & Support', path: `${base}/help`, icon: HelpCircle },
      ],
    },
  ];
}

export function getLevel2Navigation(basePath: string): Level2Nav[] {
  return getNavigation(basePath).map(section => ({
    sectionPath: section.path,
    tabs: section.tabs,
  }));
}

export function getLevel3Navigation(basePath: string): Level3Nav[] {
  const base = basePath.replace(/\/$/, '');
  return [
    {
      parentPath: `${base}/operations/projects/`,
      tabs: [
        { id: 'overview',  label: 'OVERVIEW',  path: '' },
        { id: 'wbs',       label: 'WBS',       path: 'wbs' },
        { id: 'workplan',  label: 'WORK PLAN', path: 'work-plan' },
        { id: 'team',      label: 'TEAM',      path: 'team' },
        { id: 'risks',     label: 'RISKS',     path: 'risks' },
        { id: 'documents', label: 'DOCUMENTS', path: 'documents' },
      ],
    },
    {
      parentPath: `${base}/operations/team`,
      tabs: [
        { id: 'overview',  label: 'OVERVIEW',  path: `${base}/operations/team` },
        { id: 'roster',    label: 'ROSTER',    path: `${base}/operations/team/roster` },
        { id: 'schedule',  label: 'SCHEDULE',  path: `${base}/operations/team/schedule` },
        { id: 'timeoff',   label: 'TIME OFF',  path: `${base}/operations/team/time-off` },
      ],
    },
    {
      parentPath: `${base}/finance/invoicing`,
      tabs: [
        { id: 'ready',    label: 'READY TO BILL', path: `${base}/finance/invoicing` },
        { id: 'invoices', label: 'INVOICES',      path: `${base}/finance/invoicing/invoices` },
      ],
    },
    {
      parentPath: `${base}/finance/expenses`,
      tabs: [
        { id: 'bills',  label: 'VENDOR BILLS',   path: `${base}/finance/expenses` },
        { id: 'claims', label: 'EXPENSE CLAIMS', path: `${base}/finance/expenses/claims` },
      ],
    },
    {
      parentPath: `${base}/finance/ledger`,
      tabs: [
        { id: 'gl',      label: 'GENERAL LEDGER',   path: `${base}/finance/ledger` },
        { id: 'income',  label: 'INCOME STATEMENT', path: `${base}/finance/ledger/income` },
        { id: 'balance', label: 'BALANCE SHEET',    path: `${base}/finance/ledger/balance` },
      ],
    },
  ];
}
