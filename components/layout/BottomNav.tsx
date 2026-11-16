'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Today', icon: '🏠' },
  { href: '/plan', label: 'Plan', icon: '📋' },
  { href: '/what-if', label: 'What-if', icon: '⚖️' },
  { href: '/community', label: 'Community', icon: '👥' },
  { href: '/ask', label: 'Ask', icon: '💬' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-normal'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-sky-600 dark:bg-sky-400 rounded-b-full shadow-xs" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
