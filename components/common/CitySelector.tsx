'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import { Location } from '@/lib/schemas';
import { INDIAN_CITIES, CityOption, findNearestCity } from '@/lib/data/cities';
import { searchPlaces } from '@/lib/data/openMeteo';

interface CitySelectorProps {
  currentLocation?: Location | null;
  onSelect: (location: Location) => void;
  onCancel?: () => void;
  className?: string;
  compact?: boolean;
}

export function CitySelector({
  currentLocation,
  onSelect,
  onCancel,
  className = '',
  compact = false,
}: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [customPlaces, setCustomPlaces] = useState<CityOption[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Quick Metro choices
  const metros = useMemo(() => {
    return INDIAN_CITIES.filter((c) => c.isMetro);
  }, []);

  // Filtered Indian Cities
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return INDIAN_CITIES;
    return INDIAN_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.placeName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Online search for smaller towns / places if query has 3+ chars
  const handleOnlineSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearchingOnline(true);
    setLocationError(null);
    try {
      const results = await searchPlaces(searchQuery.trim());
      const mapped: CityOption[] = results.map((r) => ({
        city: r.name,
        state: r.admin1 || r.country || 'India',
        region: 'Central',
        placeName: `${r.name}, ${r.admin1 ? r.admin1 + ', ' : ''}${r.country || 'India'}`,
        lat: r.latitude,
        lon: r.longitude,
      }));
      setCustomPlaces(mapped);
    } catch {
      setLocationError('Could not find remote location results.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // GPS Geolocation
  const handleDetectGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('GPS geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const nearest = findNearestCity(latitude, longitude);

        onSelect({
          lat: Number(latitude.toFixed(4)),
          lon: Number(longitude.toFixed(4)),
          placeName: `${nearest.city} Area (${nearest.state})`,
          timezone: 'Asia/Kolkata',
        });
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        setLocationError('Location access was denied or timed out. Please select from the list below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (city: CityOption) => {
    onSelect({
      lat: city.lat,
      lon: city.lon,
      placeName: city.placeName,
      timezone: 'Asia/Kolkata',
    });
  };

  const isCurrentCity = (c: CityOption) => {
    if (!currentLocation) return false;
    const sameCoords =
      Math.abs(currentLocation.lat - c.lat) < 0.1 &&
      Math.abs(currentLocation.lon - c.lon) < 0.1;
    const sameName =
      currentLocation.placeName?.toLowerCase().includes(c.city.toLowerCase());
    return sameCoords || sameName;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Selection summary if compact */}
      {currentLocation && !compact && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[var(--primary)] shrink-0" />
            <div>
              <span className="text-[var(--muted)]">Active Location:</span>{' '}
              <span className="font-bold text-[var(--text)]">
                {currentLocation.placeName}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--muted)] font-mono">
            {currentLocation.lat.toFixed(2)}°N, {currentLocation.lon.toFixed(2)}°E
          </span>
        </div>
      )}

      {/* GPS Detection Button */}
      <button
        type="button"
        onClick={handleDetectGPS}
        disabled={isLocating}
        className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-[var(--text)] shadow-xs"
      >
        {isLocating ? (
          <>
            <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
            <span>Detecting your location via GPS...</span>
          </>
        ) : (
          <>
            <Navigation size={16} className="text-[var(--primary)]" />
            <span>Detect My Current GPS Location</span>
          </>
        )}
      </button>

      {locationError && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
          {locationError}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleOnlineSearch();
          }}
          placeholder="Search Indian city or state (e.g. Mumbai, Bengaluru, Lucknow)..."
          className="w-full pl-9 pr-20 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
        />
        {searchQuery.trim().length >= 2 && (
          <button
            type="button"
            onClick={handleOnlineSearch}
            disabled={isSearchingOnline}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] text-[11px] font-semibold hover:opacity-90 cursor-pointer"
          >
            {isSearchingOnline ? 'Searching...' : 'Find town'}
          </button>
        )}
      </div>

      {/* Quick Metro Chips */}
      {!searchQuery && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Popular Metros & Capitals:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {metros.map((m) => {
              const active = isCurrentCity(m);
              return (
                <button
                  key={m.city}
                  type="button"
                  onClick={() => handleSelectCity(m)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                    active
                      ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {active && <Check size={12} strokeWidth={3} />}
                  <span>{m.city}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Online Search Results (if triggered) */}
      {customPlaces.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Online Geocoding Results:
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1 border border-[var(--border)] rounded-xl p-1 bg-[var(--surface)]">
            {customPlaces.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectCity(p)}
                className="w-full text-left p-2 rounded-lg hover:bg-[var(--surface-2)] text-xs flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-[var(--text)]">{p.city}</span>
                  <span className="text-[var(--muted)] text-[11px]"> ({p.state})</span>
                </div>
                <span className="text-[10px] text-[var(--muted)]">Select</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Directory of Cities (Scrollable List) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {searchQuery
              ? `Search Results (${filteredCities.length})`
              : 'All Cities by State:'}
          </p>
          <span className="text-[10px] text-[var(--muted)]">
            {filteredCities.length} locations
          </span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 border border-[var(--border)] rounded-xl p-1 bg-[var(--surface)] scrollbar-thin">
          {filteredCities.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--muted)]">
              No matching city found in local directory. Click &quot;Find town&quot; above to search online.
            </div>
          ) : (
            filteredCities.map((city) => {
              const active = isCurrentCity(city);
              return (
                <button
                  key={`${city.city}-${city.state}`}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                      : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={14}
                      className={active ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}
                    />
                    <div>
                      <span className="font-semibold">{city.city}</span>
                      <span className="text-[var(--muted)] font-normal text-[11px]">
                        {' '}
                        · {city.state}
                      </span>
                    </div>
                  </div>
                  {active && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[10px] font-bold flex items-center gap-1">
                      <Check size={10} strokeWidth={3} /> Selected
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

export default CitySelector;
