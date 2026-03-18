import type { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Public pages share a simple layout */}
      {/* Navigation can be added here */}
      {children}
    </div>
  );
}
