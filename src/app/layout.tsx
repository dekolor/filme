import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import NavigationProgress from "~/components/navigation-progress";
import Navbar from "~/app/_components/navbar";

export const metadata: Metadata = {
  title: "MovieTime",
  description: "Movie Showtimes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body>
        <NavigationProgress />
        <TRPCReactProvider>
          <Navbar />
          {children}
        </TRPCReactProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
