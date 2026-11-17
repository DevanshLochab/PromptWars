'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Calendar, GitCompare, Users, MessageCircle, Settings } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/plan', label: 'Plan', icon: Calendar },
  { href: '/what-if', label: 'Compare', icon: GitCompare },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
];

export default function SidebarNav() {
  const path = usePathname();
  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-0 h-dvh border-r border-[var(--border)] bg-[var(--surface)] flex flex-col p-4">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-[var(--text)]">सांस <span className="text-[var(--primary)]">Saans</span></span>
        <p className="text-xs text-[var(--muted)] mt-0.5">Your family air coach</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] font-medium text-sm transition-colors ${
                active
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <Link href="#settings" className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] text-[var(--muted)] hover:bg-[var(--surface-2)] text-sm font-medium">
        <Settings size={18} /> Settings
      </Link>
    </aside>
  );
}

export { SidebarNav };
