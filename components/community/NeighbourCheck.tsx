'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Heart, Plus, Phone, Trash2, ShieldAlert, User, MessageCircle } from 'lucide-react';

export interface NeighbourItem {
  id: string;
  name: string;
  contact: string;
  notes: string;
  tag?: 'elderly' | 'child' | 'asthma' | 'infant' | 'general';
}

const NEIGHBOUR_STORAGE_KEY = 'saans_neighbour_list_v1';

const DEMO_NEIGHBOURS: NeighbourItem[] = [
  {
    id: 'n_1',
    name: 'Sharma Ji (Flat 402)',
    contact: '+919811002233',
    notes: '78yo, lives alone, uses nebulizer & inhaler',
    tag: 'elderly',
  },
  {
    id: 'n_2',
    name: 'Pooja & Baby Aarav (Flat 205)',
    contact: '+919871234567',
    notes: '8-month-old infant, check if air purifier running',
    tag: 'infant',
  },
  {
    id: 'n_3',
    name: 'Gupta Uncle (Flat 108)',
    contact: '+919899123890',
    notes: 'Heart patient, morning walks restricted on bad smog days',
    tag: 'asthma',
  },
];

export function NeighbourCheck() {
  const { t } = useTranslation();
  const [neighbours, setNeighbours] = useState<NeighbourItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState<NeighbourItem['tag']>('elderly');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NEIGHBOUR_STORAGE_KEY);
      if (stored) {
        setNeighbours(JSON.parse(stored));
      } else {
        setNeighbours(DEMO_NEIGHBOURS);
        localStorage.setItem(NEIGHBOUR_STORAGE_KEY, JSON.stringify(DEMO_NEIGHBOURS));
      }
    } catch {
      setNeighbours(DEMO_NEIGHBOURS);
    }
  }, []);

  const saveNeighbours = (list: NeighbourItem[]) => {
    setNeighbours(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem(NEIGHBOUR_STORAGE_KEY, JSON.stringify(list));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: NeighbourItem = {
      id: `neighbour_${Date.now()}`,
      name: name.trim(),
      contact: contact.trim(),
      notes: notes.trim(),
      tag,
    };

    saveNeighbours([...neighbours, newItem]);
    setName('');
    setContact('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    saveNeighbours(neighbours.filter((n) => n.id !== id));
  };

  const getWhatsAppLink = (phone: string, neighbourName: string): string => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Namaste ${neighbourName}! Outdoor AQI is severe today. Just checking in from next door to see if you are doing okay, have clean drinking water, your inhaler/medicines, and whether you need any groceries or help with air filters. Stay safe indoors!`
    );
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
  };

  const isVulnerable = (itemTag?: string) => {
    return itemTag === 'elderly' || itemTag === 'asthma' || itemTag === 'infant' || itemTag === 'child';
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500/30 text-rose-500" />
            </div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {t('neighbour.title')}
            </h2>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {t('neighbour.desc')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-90 transition-opacity border border-[var(--primary)]/20 shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? t('common.cancel') : t('neighbour.add_new')}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--text)]">
                {t('neighbour.name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Verma Ji (Flat 304)"
                className="w-full p-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--text)]">
                {t('neighbour.contact')}
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98..."
                className="w-full p-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--text)]">
                Category / Vulnerability
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="elderly">👴 Elderly Senior Citizen</option>
                <option value="asthma">🫁 Asthma / Respiratory Vulnerable</option>
                <option value="infant">👶 Infant / Toddler</option>
                <option value="general">🏠 General Neighbour</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--text)]">
                {t('neighbour.note')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special medical or mobility notes..."
                className="w-full p-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[var(--primary)] text-[var(--on-primary)] rounded-lg transition-opacity hover:opacity-90 shadow-xs"
            >
              {t('neighbour.save')}
            </button>
          </div>
        </form>
      )}

      {/* Neighbour List */}
      <div className="space-y-3">
        {neighbours.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-6 text-center">
            {t('neighbour.empty')}
          </p>
        ) : (
          neighbours.map((item) => {
            const vulnerable = isVulnerable(item.tag);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Name chip & Vulnerability badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-2xs">
                      <span>{item.tag === 'elderly' ? '👴' : item.tag === 'infant' ? '👶' : item.tag === 'asthma' ? '🫁' : '🏠'}</span>
                      <span>{item.name}</span>
                    </span>

                    {vulnerable && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>Vulnerable</span>
                      </span>
                    )}

                    {item.contact && (
                      <span className="text-[11px] text-[var(--muted)] font-mono">
                        {item.contact}
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-[var(--muted)] pl-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Action Buttons: "Check in" (Heart icon) + Call + Remove */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <a
                    href={getWhatsAppLink(item.contact, item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs"
                    title="Check in via WhatsApp"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Check in</span>
                  </a>

                  {item.contact && (
                    <a
                      href={`tel:${item.contact}`}
                      className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                      title="Call neighbour"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Remove neighbour"
                    title="Remove neighbour"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
