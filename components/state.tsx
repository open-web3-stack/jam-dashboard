"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { connectToNode, sendRequest, disconnectFromNode } from "@/lib/ws";
import { toast } from "sonner";

type KeyValuePair = {
  blockHash: string;
  stateRoot: string;
};

export default function State({ endpoint }: { endpoint: string }) {
  const [hashInput, setHashInput] = useState("");
  const [stateRoots, setStateRoots] = useState<KeyValuePair[]>([]);

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

  const fetchState = useCallback(async () => {
    if (hashInput.length !== 66 && hashInput.length !== 0) {
      toast.error(
        "Hash must be a valid 32 byte hex string `0x{string}` or empty for best block"
      );
      return;
    }

    try {
      const method = "chain_getState";
      const params = hashInput ? { hash: hashInput } : {};
      const result = (await sendRequest(endpoint, method, params)) as {
        [key: string]: string;
      };
      setStateRoots((prev) => [
        {
          blockHash: result?.blockHash,
          stateRoot: result?.stateRoot,
        },
        ...prev,
      ]);
      setHashInput("");
    } catch (error: unknown) {
      toast.error(
        `Failed to fetch state root: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [endpoint, hashInput]);

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Fetch State</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="0x... (optional 32 byte block hash)"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchState()}
          />
          <Button onClick={fetchState}>Fetch</Button>
        </div>
      </div>
      {stateRoots.map((pair, index) => (
        <div key={index}>
          <h3 className="text-md font-semibold">Block Hash</h3>
          <p className="font-mono break-all">{pair.blockHash}</p>
          <h3 className="text-md font-semibold mt-2">State Root</h3>
          <p className="font-mono break-all">
            {pair.stateRoot || "No state root found"}
          </p>
        </div>
      ))}
    </div>
  );
}
