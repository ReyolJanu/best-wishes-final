'use client';

import { NotificationProvider } from '@/contexts/NotificationContext';

export default function NotificationWrapper({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}