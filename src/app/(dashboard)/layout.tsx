import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Users,
  FolderOpen,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'My Deal', icon: LayoutDashboard },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/transactions', label: 'All Transactions', icon: FileText },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-secondary-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-secondary-100 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-secondary-100 px-6">
          <Link href="/" className="font-display text-xl font-bold text-primary-600">
            EASE
          </Link>
        </div>

        {/* Active Deal Selector */}
        <div className="border-b border-secondary-100 p-4">
          <div className="rounded-xl bg-primary-50 p-3">
            <p className="text-xs font-medium text-primary-600">Active Transaction</p>
            <p className="mt-1 truncate font-display text-sm font-semibold text-secondary-900">
              123 Queen St W, Toronto
            </p>
            <p className="mt-0.5 text-xs text-secondary-500">Condo · $899,000</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-secondary-100 p-3">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-secondary-900">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-secondary-100 bg-white px-4 lg:hidden">
          <Link href="/" className="font-display text-xl font-bold text-primary-600">
            EASE
          </Link>
          <button className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-50">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container-ease py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
