import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Revenue War Room · OpenRevOps',
  description:
    'Approval-safe revenue agent — detect leakage, recommend a billing action, gate on human approval, and track the KPI impact.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
