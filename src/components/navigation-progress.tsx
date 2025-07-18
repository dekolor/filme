"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

export default function NavigationProgress() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false,
      minimum: 0.3,
      easing: 'ease',
      speed: 500,
    });
  }, []);

  useEffect(() => {
    // Start progress on pathname change
    NProgress.start();
    
    // Complete progress after a brief delay to show the progress bar
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname]);

  return null;
}