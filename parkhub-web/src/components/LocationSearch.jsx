import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";

// ── Types ─────────────────────────────────────────────────────────────────────

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_API_KEY ?? "";
const DEBOUNCE_MS = 350;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * LocationSearch
 *
 * Mappls Autosuggest-powered Indian address search.
 * Uses the Mappls Atlas API (textsearch) for place lookup.
 * Debounces user input, shows dropdown with Indian addresses.
 */
export function LocationSearch({
  onLocationSelect,
  placeholder = "Search parking near a location…",
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // ── Click-outside to close ──────────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced Mappls Autosuggest fetch ──────────────────────────────────
  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (!MAPPLS_KEY) {
      setError("Mappls API key not configured.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mappls Atlas TextSearch endpoint — returns Indian places
      const url = `https://atlas.mappls.com/api/places/textsearch/json?query=${encodeURIComponent(q)}&region=IND`;
      const res = await fetch(url, {
        headers: { Authorization: `bearer ${MAPPLS_KEY}` },
      });

      if (!res.ok) throw new Error("Autosuggest API error");
      const json = await res.json();

      const places = (json.suggestedLocations ?? []).slice(0, 6).map((p) => ({
        placeName: p.placeName ?? p.placeAddress ?? "Unknown place",
        placeAddress: p.placeAddress ?? "",
        latitude: p.latitude ?? "0",
        longitude: p.longitude ?? "0",
        type: p.type ?? "place",
        eLoc: p.eLoc,
      }));

      setSuggestions(places);
      setOpen(places.length > 0);
    } catch (err) {
      setError("Could not fetch suggestions. Check your Mappls API key.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS);
  }

  function handleSelect(suggestion) {
    const lat = parseFloat(suggestion.latitude);
    const lng = parseFloat(suggestion.longitude);
    setQuery(suggestion.placeName);
    setOpen(false);
    onLocationSelect?.(lat, lng, suggestion.placeName);
  }

  function handleClear() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <MagnifyingGlass
          weight="bold"
          className="pointer-events-none absolute left-3.5 h-4 w-4 text-surface-400 dark:text-surface-500"
        />

        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Location search"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full rounded-2xl border border-surface-200 bg-white py-3 pl-10 pr-10 text-sm text-surface-900 shadow-sm outline-none placeholder:text-surface-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-surface-700 dark:bg-surface-900 dark:text-white dark:placeholder:text-surface-600 dark:focus:border-emerald-500"
        />

        {loading && (
          <div className="absolute right-3.5 h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 rounded-full p-0.5 text-surface-400 transition hover:text-surface-700 dark:hover:text-surface-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && <p className="mt-1.5 px-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-[0_12px_40px_-10px_rgba(15,23,42,0.18)] dark:border-surface-700 dark:bg-surface-900"
        >
          {suggestions.map((s, i) => (
            <li key={s.eLoc ?? i} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <MapPin
                  weight="fill"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">
                    {s.placeName}
                  </p>
                  {s.placeAddress && s.placeAddress !== s.placeName && (
                    <p className="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">
                      {s.placeAddress}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {open && suggestions.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-surface-200 bg-white p-4 text-center text-sm text-surface-500 shadow-lg dark:border-surface-700 dark:bg-surface-900">
          No places found for "<span className="font-medium">{query}</span>"
        </div>
      )}
    </div>
  );
}
