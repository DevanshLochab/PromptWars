'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

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

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t('neighbour.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('neighbour.desc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900 transition-colors border border-sky-200 dark:border-sky-800"
        >
          {showAddForm ? t('common.cancel') : `+ ${t('neighbour.add_new')}`}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('neighbour.name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Verma Ji (Flat 304)"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('neighbour.contact')}
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 98..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Category / Vulnerability
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="elderly">👴 Elderly Senior Citizen</option>
                <option value="infant">👶 Infant / Toddler</option>
                <option value="asthma">🫁 Asthma / Respiratory Vulnerable</option>
                <option value="general">🏠 General Neighbour</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {t('neighbour.note')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special medical or mobility notes..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors shadow-xs"
            >
              {t('neighbour.save')}
            </button>
          </div>
        </form>
      )}

      {/* Neighbour List */}
      <div className="space-y-2.5">
        {neighbours.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            {t('neighbour.empty')}
          </p>
        ) : (
          neighbours.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {item.tag === 'elderly' ? '👴' : item.tag === 'infant' ? '👶' : '🫁'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </span>
                  {item.contact && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.contact}
                    </span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-6">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <a
                  href={getWhatsAppLink(item.contact, item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>

                {item.contact && (
                  <a
                    href={`tel:${item.contact}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 hover:bg-sky-200 transition-colors flex items-center gap-1"
                  >
                    <span>📞</span>
                    <span>Call</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  aria-label="Remove neighbour"
                  title="Remove neighbour"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
