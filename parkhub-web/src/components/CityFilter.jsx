import { useState, useEffect, useCallback } from "react";
import { MapPin, CaretDown, X } from "@phosphor-icons/react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * CityFilter
 *
 * Two-level dropdown: State → City.
 * Fetches from /api/cities and /api/cities/states.
 * Calls onCitySelect(city) when a city is chosen.
 */
export function CityFilter({ onCitySelect, onStateSelect, className = "" }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load states on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/cities/states`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setStates(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    fetch(`${API_BASE}/api/cities?state=${selectedState}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCities(j.data);
      })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, [selectedState]);

  const handleStateChange = useCallback(
    (code) => {
      setSelectedState(code);
      setSelectedCity(null);
      onStateSelect?.(code || null);
      onCitySelect?.(null);
    },
    [onStateSelect, onCitySelect],
  );

  const handleCityChange = useCallback(
    (cityId) => {
      const city = cities.find((c) => String(c.id) === cityId) ?? null;
      setSelectedCity(city);
      onCitySelect?.(city);
    },
    [cities, onCitySelect],
  );

  const handleClear = useCallback(() => {
    setSelectedState("");
    setSelectedCity(null);
    onStateSelect?.(null);
    onCitySelect?.(null);
  }, [onStateSelect, onCitySelect]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* State dropdown */}
      <div className="relative">
        <MapPin
          weight="fill"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
        />
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={loadingStates}
          aria-label="Select state"
          className="h-10 appearance-none rounded-2xl border border-surface-200 bg-white pl-9 pr-8 text-sm text-surface-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-white"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s.state_code} value={s.state_code}>
              {s.state}
            </option>
          ))}
        </select>
        <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
      </div>

      {/* City dropdown */}
      {selectedState && (
        <div className="relative">
          <select
            value={selectedCity?.id ?? ""}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={loadingCities || cities.length === 0}
            aria-label="Select city"
            className="h-10 appearance-none rounded-2xl border border-surface-200 bg-white px-4 pr-8 text-sm text-surface-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-white"
          >
            <option value="">
              {loadingCities ? "Loading..." : "All Cities"}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.is_metro ? " ★" : ""}
              </option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
        </div>
      )}

      {/* Active filter chip */}
      {selectedCity && (
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <MapPin weight="fill" className="h-3 w-3" />
          {selectedCity.name},{" "}
          {selectedCity.state.substring(0, 2).toUpperCase()}
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear filter"
            className="ml-1 rounded-full hover:text-emerald-900 dark:hover:text-emerald-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
