import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-16">{children}</main>
    </AuthGuard>
  );
}
