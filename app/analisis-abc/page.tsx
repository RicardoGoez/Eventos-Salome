"use client";

import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { AnalisisABCPanel } from "@/components/panels/analisis-abc-panel";
import { AdminWrapper } from "@/components/admin-wrapper";
import { Logo } from "@/components/logo";

export default function AnalisisABCPage() {
  return (
    <AdminWrapper>
      <div className="flex min-h-screen lg:h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb items={[{ label: "Análisis ABC" }]} />
            <div className="flex items-center gap-3 mb-6">
              <Logo size="lg" shadow priority />
              <h1 className="text-2xl sm:text-3xl font-bold text-dark">
                Análisis ABC de Inventario
              </h1>
            </div>
            <AnalisisABCPanel />
          </div>
        </main>
      </div>
    </AdminWrapper>
  );
}

