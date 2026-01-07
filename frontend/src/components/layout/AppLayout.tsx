import React from "react";
import { Sidebar } from "./Sidebar.tsx";
import { Header } from "./Header.tsx";
import { SecondaryNav } from "./SecondaryNav.tsx";
// import { NotificationContainer } from '@/NotificationContainer';
import PerformanceDashboard from "@/pages/PerformanceDashboard";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-primary focus:rounded-md"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <SecondaryNav />
        <main
          id="main-content"
          className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
        {/* <NotificationContainer /> */}
        <PerformanceDashboard />
      </div>
    </div>
  );
};
