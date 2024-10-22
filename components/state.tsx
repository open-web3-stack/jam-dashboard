"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { connectToNode, sendRequest, disconnectFromNode } from "@/lib/ws";
import { toast } from "sonner";
import { useEffect } from "react";

type KeyValuePair = {
  key: string;
  value: string;
};

export default function State({ endpoint }: { endpoint: string }) {
  const [keyInput, setKeyInput] = useState("");
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([]);

  useEffect(() => {
    connectToNode(endpoint).catch((error: unknown) =>
      toast.error(
        `Failed to connect: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    );

    return () => {
      disconnectFromNode(endpoint);
    };
  }, [endpoint]);

  const fetchKeyValue = useCallback(async () => {
    if (keyInput.length !== 66 || !keyInput.startsWith("0x")) {
      toast.error("Key must be a valid hex string `0x{string}`");
      return;
    }

    try {
      const result = await sendRequest(endpoint, "chain_getState", {
        key: keyInput,
      });
      setKeyValuePairs((prev) => [
        { key: keyInput, value: result as string },
        ...prev,
      ]);
      setKeyInput("");
    } catch (error: unknown) {
      toast.error(
        `Failed to fetch key value: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [endpoint, keyInput]);

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Fetch Value</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="0x... (enter a 32 byte key)"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchKeyValue()}
          />
          <Button onClick={fetchKeyValue}>Fetch</Button>
        </div>
      </div>
      {keyValuePairs.map((pair, index) => (
        <div key={index}>
          <h3 className="text-md font-semibold">Key</h3>
          <p className="font-mono break-all">{pair.key}</p>
          <h3 className="text-md font-semibold mt-2">Value</h3>
          <p className="font-mono break-all">
            {pair.value || "No value found"}
          </p>
        </div>
      ))}
    </div>
  );
}
