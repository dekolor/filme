"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

export default function NavigationProgress() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    return () => {
      NProgress.done();
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname]);

  return null;
}