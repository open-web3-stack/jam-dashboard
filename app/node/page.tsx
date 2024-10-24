"use client";

import { useSearchParams } from "next/navigation";
import State from "@/components/state";
import { useEffect, useState } from "react";
import { sendRequest } from "@/lib/ws";
import { toast } from "sonner";

export default function NodePage() {
  const searchParams = useSearchParams();
  const endpoint = decodeURIComponent(searchParams.get("endpoint") || "");
  const [nodeName, setNodeName] = useState<string>("");

  useEffect(() => {
    const fetchNodeName = async () => {
      try {
        const name = await sendRequest(endpoint, "system_name");
        setNodeName(name as string);
      } catch (error) {
        toast.error(
          `Failed to fetch node name: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    if (endpoint) {
      fetchNodeName();
    }
  }, [endpoint]);

  return (
    <div className="container mt-3 mb-8 flex flex-col gap-8 items-center sm:items-start">
      <h3 className="text-xl font-bold mb-2">
        {nodeName ? `${nodeName} (${endpoint})` : endpoint}
      </h3>
      <State endpoint={endpoint} />
    </div>
  );
}
