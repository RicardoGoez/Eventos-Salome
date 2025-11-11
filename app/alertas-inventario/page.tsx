"use client";

import { Sidebar } from "@/components/sidebar";
import { Breadcrumb } from "@/components/breadcrumb";
import { AlertasInventarioPanel } from "@/components/panels/alertas-inventario-panel";
import { AdminWrapper } from "@/components/admin-wrapper";
import { Logo } from "@/components/logo";

export default function AlertasInventarioPage() {
  return (
    <AdminWrapper>
      <div className="flex min-h-screen lg:h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-light p-4 lg:p-8 lg:ml-0">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb items={[{ label: "Alertas de Inventario" }]} />
            <div className="flex items-center gap-3 mb-6">
              <Logo size="lg" shadow priority />
              <h1 className="text-2xl sm:text-3xl font-bold text-dark">
                Alertas de Inventario
              </h1>
            </div>
            <AlertasInventarioPanel />
          </div>
        </main>
      </div>
    </AdminWrapper>
  );
}

