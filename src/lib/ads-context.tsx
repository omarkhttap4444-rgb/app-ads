'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { usePathname } from 'next/navigation';

interface AdSenseContextValue {
  isSuppressed: boolean;
  setSuppressed: (suppressed: boolean) => void;
}

const AdSenseContext = createContext<AdSenseContextValue>({
  isSuppressed: false,
  setSuppressed: () => {},
});

export function AdSenseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isSuppressed, setIsSuppressed] = useState(false);

  // React pattern: Adjust state when props/pathname change during rendering
  // Avoids synchronous setState inside effects and eliminates cascading renders.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsSuppressed(false);
  }

  const setSuppressed = useCallback((suppressed: boolean) => {
    setIsSuppressed(suppressed);
  }, []);

  const value = useMemo(
    () => ({ isSuppressed, setSuppressed }),
    [isSuppressed, setSuppressed]
  );

  return (
    <AdSenseContext.Provider value={value}>
      {children}
    </AdSenseContext.Provider>
  );
}

export function useAdSense() {
  return useContext(AdSenseContext);
}
