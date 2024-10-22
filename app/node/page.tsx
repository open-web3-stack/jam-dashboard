"use client";

import { useSearchParams } from "next/navigation";
import State from "@/components/state";

export default function NodePage() {
  const searchParams = useSearchParams();
  const endpoint = decodeURIComponent(searchParams.get("endpoint") || "");

  return (
    <div className="container mt-3 mb-8 flex flex-col gap-8 items-center sm:items-start">
      <h3 className="text-xl font-bold mb-2">{endpoint}</h3>
      <State endpoint={endpoint} />
    </div>
  );
}
