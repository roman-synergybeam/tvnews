import './globals.css';
import NgrokPatch from '@/components/NgrokPatch.jsx';

export const metadata = {
  title: 'News Control Center',
  description: 'Manage news pages and assign them to TVs across departments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NgrokPatch />
        {children}
      </body>
    </html>
  );
}
