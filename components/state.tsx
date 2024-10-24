"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JSONObject, sendRequest } from "@/lib/ws";
import { toast } from "sonner";
import { X } from "lucide-react";

type Result = {
  type: "block" | "state";
  data: JSONObject;
};

export default function State({ endpoint }: { endpoint: string }) {
  const [blockHashInput, setBlockHashInput] = useState("");
  const [stateHashInput, setStateHashInput] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  const fetchBlock = useCallback(async () => {
    if (blockHashInput.length !== 66 && blockHashInput.length !== 0) {
      toast.error(
        "Hash must be a valid 32 byte hex string `0x{string}` or empty for best block"
      );
      return;
    }

    try {
      const method = "chain_getBlock";
      const params = { hash: blockHashInput };
      const result = await sendRequest(endpoint, method, params);
      setResults((prev) => [
        { type: "block", data: result as JSONObject },
        ...prev,
      ]);
      setBlockHashInput("");
    } catch (error: unknown) {
      toast.error(
        `Failed to fetch block: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [endpoint, blockHashInput]);

  const fetchState = useCallback(async () => {
    if (stateHashInput.length !== 66 && stateHashInput.length !== 0) {
      toast.error(
        "Hash must be a valid 32 byte hex string `0x{string}` or empty for best block"
      );
      return;
    }

    try {
      const method = "chain_getState";
      const params = { hash: stateHashInput };
      const result = await sendRequest(endpoint, method, params);
      setResults((prev) => [
        { type: "state", data: result as JSONObject },
        ...prev,
      ]);
      setStateHashInput("");
    } catch (error: unknown) {
      toast.error(
        `Failed to fetch state: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [endpoint, stateHashInput]);

  const removeResult = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  const renderJSON = (json: JSONObject) => {
    return (
      <pre className="text-sm overflow-auto">
        {JSON.stringify(json, null, 2)}
      </pre>
    );
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Fetch Block</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="0x... (optional 32 byte block hash)"
            value={blockHashInput}
            onChange={(e) => setBlockHashInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBlock()}
          />
          <Button onClick={fetchBlock}>Fetch</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Fetch State</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="0x... (optional 32 byte block hash)"
            value={stateHashInput}
            onChange={(e) => setStateHashInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchState()}
          />
          <Button onClick={fetchState}>Fetch</Button>
        </div>
      </div>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => removeResult(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h4 className="text-md font-semibold mb-2">
              {result.type === "block" ? "Block" : "State"}
            </h4>
            {renderJSON(result.data)}
          </div>
        ))}
      </div>
    </div>
  );
}
