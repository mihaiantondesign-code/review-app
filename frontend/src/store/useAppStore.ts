import { create } from "zustand";
import type {
  Review,
  AppSearchResult,
  BusinessInfo,
  FetchProgress,
  ActiveSection,
  FetchMode,
} from "@/types";

interface CompData {
  [appId: string]: Review[];
}

interface CompNames {
  [appId: string]: string;
}

interface AppState {
  activeSection: ActiveSection;
  setActiveSection: (s: ActiveSection) => void;

  selectedApps: AppSearchResult[];
  setSelectedApps: (apps: AppSearchResult[]) => void;
  // computed alias — keeps downstream code (fetch hook, ComparisonSection) intact
  selectedApp: AppSearchResult | null;

  reviews: Review[];
  setReviews: (r: Review[]) => void;
  fetchDone: boolean;
  setFetchDone: (v: boolean) => void;
  fetchProgress: FetchProgress | null;
  setFetchProgress: (p: FetchProgress | null) => void;
  isFetching: boolean;
  setIsFetching: (v: boolean) => void;

  trustpilotReviews: Review[];
  setTrustpilotReviews: (r: Review[]) => void;
  trustpilotInfo: BusinessInfo | null;
  setTrustpilotInfo: (i: BusinessInfo | null) => void;
  tpFetchDone: boolean;
  setTpFetchDone: (v: boolean) => void;
  tpFetchProgress: FetchProgress | null;
  setTpFetchProgress: (p: FetchProgress | null) => void;
  isTpFetching: boolean;
  setIsTpFetching: (v: boolean) => void;

  compApps: (AppSearchResult | null)[];
  setCompApps: (a: (AppSearchResult | null)[]) => void;
  compData: CompData;
  setCompData: (d: CompData) => void;
  compNames: CompNames;
  setCompNames: (n: CompNames) => void;
  compFetched: boolean;
  setCompFetched: (v: boolean) => void;
  isCompFetching: boolean;
  setIsCompFetching: (v: boolean) => void;
  compProgress: FetchProgress | null;
  setCompProgress: (p: FetchProgress | null) => void;

  countryCode: string;
  setCountryCode: (c: string) => void;
  fetchMode: FetchMode;
  setFetchMode: (m: FetchMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: "appstore",
  setActiveSection: (s) => set({ activeSection: s }),

  selectedApps: [],
  setSelectedApps: (apps) => set({ selectedApps: apps, selectedApp: apps[0] ?? null }),
  selectedApp: null,

  reviews: [],
  setReviews: (r) => set({ reviews: r }),
  fetchDone: false,
  setFetchDone: (v) => set({ fetchDone: v }),
  fetchProgress: null,
  setFetchProgress: (p) => set({ fetchProgress: p }),
  isFetching: false,
  setIsFetching: (v) => set({ isFetching: v }),

  trustpilotReviews: [],
  setTrustpilotReviews: (r) => set({ trustpilotReviews: r }),
  trustpilotInfo: null,
  setTrustpilotInfo: (i) => set({ trustpilotInfo: i }),
  tpFetchDone: false,
  setTpFetchDone: (v) => set({ tpFetchDone: v }),
  tpFetchProgress: null,
  setTpFetchProgress: (p) => set({ tpFetchProgress: p }),
  isTpFetching: false,
  setIsTpFetching: (v) => set({ isTpFetching: v }),

  compApps: [null, null],
  setCompApps: (a) => set({ compApps: a }),
  compData: {},
  setCompData: (d) => set({ compData: d }),
  compNames: {},
  setCompNames: (n) => set({ compNames: n }),
  compFetched: false,
  setCompFetched: (v) => set({ compFetched: v }),
  isCompFetching: false,
  setIsCompFetching: (v) => set({ isCompFetching: v }),
  compProgress: null,
  setCompProgress: (p) => set({ compProgress: p }),

  countryCode: "it",
  setCountryCode: (c) => set({ countryCode: c }),
  fetchMode: "time",
  setFetchMode: (m) => set({ fetchMode: m }),
}));
