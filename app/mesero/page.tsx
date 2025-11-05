"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MeseroRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mesero/mesas");
  }, [router]);
  return null;
}

