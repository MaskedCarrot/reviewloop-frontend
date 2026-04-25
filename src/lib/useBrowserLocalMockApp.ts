"use client";

import { useState, useEffect } from "react";
import { isBrowserLocalMockApp } from "./api";

/** `NEXT_PUBLIC_BROWSER_MOCK=1` or `NEXT_PUBLIC_TEST_MODE=1` — in-browser API, no real backend. */
export function useBrowserLocalMockApp() {
  const [v, setV] = useState(false);
  useEffect(() => {
    setV(isBrowserLocalMockApp());
  }, []);
  return v;
}
