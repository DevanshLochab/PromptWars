'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Calendar, GitCompare, Users, MessageCircle, Settings, MapPin } from 'lucide-react';
import { useProfile } from '@/lib/store/ProfileProvider';

const NAV = [
  { href: '/', label: 'Today', icon: Sun },
  { href: '/plan', label: 'Plan', icon: Calendar },
  { href: '/what-if', label: 'Compare', icon: GitCompare },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/ask', label: 'Ask', icon: MessageCircle },
];

export default function SidebarNav() {
  const path = usePathname();
  const { openSettings, profile } = useProfile();

  const cityName = profile?.location.placeName
    ? profile.location.placeName.split(',')[0].trim()
    : 'New Delhi';

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-0 h-dvh border-r border-[var(--border)] bg-[var(--surface)] flex flex-col p-4 justify-between">
      <div>
        <div className="mb-6 px-2">
          <span className="text-xl font-bold text-[var(--text)]">
            सांस <span className="text-[var(--primary)]">Saans</span>
          </span>
          <p className="text-xs text-[var(--muted)] mt-0.5">Your family air coach</p>
        </div>

        {/* Location badge in desktop sidebar */}
        <button
          type="button"
          onClick={openSettings}
          className="w-full mb-4 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-left flex items-center justify-between text-xs hover:border-[var(--muted)] transition-colors cursor-pointer group"
          title="Click to change city & location"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin size={14} className="text-[var(--primary)] shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-[var(--muted)] block uppercase font-bold tracking-wider">
                City / Airshed
              </span>
              <span className="font-semibold text-[var(--text)] truncate block">
                {cityName}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[var(--primary)] group-hover:underline shrink-0">
            Change
          </span>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] font-medium text-sm transition-colors ${
                  active
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-card)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] text-sm font-medium w-full text-left transition-colors cursor-pointer"
        >
          <Settings size={18} />
          <span>Settings & Preferences</span>
        </button>
      </div>
    </aside>
  );
}

export { SidebarNav };
