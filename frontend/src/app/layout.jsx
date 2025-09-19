import './globals.css';
import ReduxProvider from './ReduxProvider';
import { Toaster } from 'sonner';
import UserProfileHydrator from './components/UserProfileHydrator';
import NotificationWrapper from '../components/NotificationWrapper';

export const metadata = {
  title: 'Best Wishes',
  description: 'Make your loved ones happy',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <ReduxProvider>
          <UserProfileHydrator />
          <NotificationWrapper>
            {children}
            <Toaster position="top-center" richColors />
          </NotificationWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
