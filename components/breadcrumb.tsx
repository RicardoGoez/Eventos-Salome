"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav 
      className={cn("flex items-center space-x-2 text-sm mb-4 sm:mb-6", className)} 
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link 
            href="/admin" 
            className="text-gray-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label="Ir al dashboard"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
              {isLast || !item.href ? (
                <span 
                  className={cn(
                    "font-medium",
                    isLast ? "text-gray-900" : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

