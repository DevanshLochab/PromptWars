'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Calendar, GitCompare, Users, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const NAV = [
  { href: '/', labelKey: 'nav.today', icon: Sun },
  { href: '/plan', labelKey: 'nav.plan', icon: Calendar },
  { href: '/what-if', labelKey: 'nav.what_if', icon: GitCompare },
  { href: '/community', labelKey: 'nav.community', icon: Users },
  { href: '/ask', labelKey: 'nav.ask', icon: MessageCircle },
] as const;

export default function BottomNav() {
  const path = usePathname();
  const { t } = useTranslation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex h-[var(--nav-h)] items-stretch">
        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium transition-colors ${
                active ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
