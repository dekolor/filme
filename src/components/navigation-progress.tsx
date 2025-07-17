"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

export default function NavigationProgress() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    
    const handleComplete = () => NProgress.done();

    handleComplete();

    return () => {
      handleComplete();
    };
  }, [pathname]);

  return null;
}