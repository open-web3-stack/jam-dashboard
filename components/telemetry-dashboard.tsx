"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Hash, Cpu, Blocks, Users, X, RefreshCw } from "lucide-react";
import { connectToNode, sendRequest, disconnectFromNode } from "@/lib/ws";
import { toast } from "sonner";

type NodeInfo = {
  endpoint: string;
  name?: string | null;
  chainHead?: number | null;
  blockHash?: string | null;
  peerCount?: number | null;
  connected: boolean;
};

const STORAGE_KEY = "telemetry-endpoints";

export default function TelemetryDashboard() {
  const [rpcInput, setRpcInput] = useState("");
  const [nodeInfo, setNodeInfo] = useState<NodeInfo[]>([]);
  const intervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const setNodeConnected = useCallback(
    (endpoint: string, connected: boolean) => {
      setNodeInfo((prev) =>
        prev.map((node) =>
          node.endpoint === endpoint ? { ...node, connected } : node
        )
      );
    },
    []
  );

  const updateNodeInfo = useCallback(
    async (endpoint: string) => {
      try {
        const data = await sendRequest(endpoint, "telemetry_getUpdate");
        setNodeInfo((prev) => {
          const index = prev.findIndex((node) => node.endpoint === endpoint);
          if (index !== -1) {
            const newNodeInfo = [...prev];
            newNodeInfo[index] = {
              ...newNodeInfo[index],
              endpoint,
              ...(data as Partial<NodeInfo>),
              connected: true,
            };
            return newNodeInfo;
          } else {
            return [
              ...prev,
              { endpoint, ...(data as Partial<NodeInfo>), connected: true },
            ];
          }
        });
      } catch (error: unknown) {
        setNodeConnected(endpoint, false);
        toast.error(
          `Failed to update info for ${endpoint}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [setNodeConnected]
  );

  const connectAndSubscribe = useCallback(
    (endpoint: string) => {
      const connect = async () => {
        try {
          await connectToNode(endpoint);
          setNodeConnected(endpoint, true);
          await updateNodeInfo(endpoint);
        } catch (error: unknown) {
          setNodeConnected(endpoint, false);
          toast.error(
            `Failed to connect to ${endpoint}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      };

      // Initial connection attempt
      connect();

      // Set up interval for periodic updates and reconnection attempts
      const interval = setInterval(async () => {
        if (!nodeInfo.find((node) => node.endpoint === endpoint)?.connected) {
          // If not connected, try to reconnect
          await connect();
        } else {
          // If connected, update node info
          await updateNodeInfo(endpoint);
        }
      }, 4000);

      intervalsRef.current[endpoint] = interval;

      return () => {
        clearInterval(interval);
        delete intervalsRef.current[endpoint];
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setNodeConnected, updateNodeInfo]
  );

  useEffect(() => {
    const loadSavedEndpoints = () => {
      const savedEndpoints = localStorage.getItem(STORAGE_KEY);
      if (savedEndpoints) {
        const endpoints: string[] = JSON.parse(savedEndpoints);
        setNodeInfo(
          endpoints.map((endpoint) => ({
            endpoint,
            connected: false,
          }))
        );

        endpoints.forEach((endpoint) => {
          connectAndSubscribe(endpoint);
        });
      }
    };

    loadSavedEndpoints();

    return () => {
      const currentIntervals = intervalsRef.current;
      Object.values(currentIntervals).forEach(clearInterval);
      nodeInfo.forEach((node) => disconnectFromNode(node.endpoint));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectAndSubscribe]);

  const validateUrl = (url: string) => {
    const pattern = /^(wss?:\/\/).+$/;
    return pattern.test(url);
  };

  const addRpc = useCallback(() => {
    if (!validateUrl(rpcInput)) {
      toast.error("Invalid WebSocket URL");
      return;
    }

    if (rpcInput && !nodeInfo.some((node) => node.endpoint === rpcInput)) {
      setNodeInfo((prev) => [
        ...prev,
        { endpoint: rpcInput, connected: false },
      ]); // Add as disconnected
      connectAndSubscribe(rpcInput);
      setRpcInput("");

      const savedEndpoints = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      savedEndpoints.push(rpcInput);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEndpoints));
    }
  }, [rpcInput, nodeInfo, connectAndSubscribe]);

  const removeRpc = useCallback((endpoint: string) => {
    disconnectFromNode(endpoint);
    setNodeInfo((prev) => prev.filter((node) => node.endpoint !== endpoint));

    const savedEndpoints = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    const updatedEndpoints = savedEndpoints.filter(
      (savedEndpoint: string) => savedEndpoint !== endpoint
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEndpoints));

    if (intervalsRef.current[endpoint]) {
      clearInterval(intervalsRef.current[endpoint]);
      delete intervalsRef.current[endpoint];
    }
  }, []);

  const refreshAll = useCallback(() => {
    // Disconnect from all endpoints
    nodeInfo.forEach((node) => {
      disconnectFromNode(node.endpoint);
      if (intervalsRef.current[node.endpoint]) {
        clearInterval(intervalsRef.current[node.endpoint]);
        delete intervalsRef.current[node.endpoint];
      }
    });

    // Reconnect to all endpoints
    nodeInfo.forEach((node) => {
      connectAndSubscribe(node.endpoint);
    });
  }, [nodeInfo, connectAndSubscribe]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <h3 className="text-xl font-bold">Telemetry Dashboard</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Enter telemetry RPC endpoint"
          value={rpcInput}
          onChange={(e) => setRpcInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRpc()}
          className="flex-grow"
        />
        <Button onClick={addRpc}>Add RPC</Button>
        <Button onClick={refreshAll}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-x-auto min-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <Cpu className="inline-block mr-2 h-4 w-4" />
                <span>Node</span>
              </TableHead>
              <TableHead className="w-[200px]">
                <Hash className="inline-block mr-2 h-4 w-4" />
                <span>Endpoint</span>
              </TableHead>
              <TableHead className="w-[100px]">
                <Users className="inline-block mr-2 h-4 w-4" />
                <span>Peers</span>
              </TableHead>
              <TableHead className="w-[150px]">
                <Blocks className="inline-block mr-2 h-4 w-4" />
                <span>Chain Head</span>
              </TableHead>
              <TableHead className="w-[200px]">
                <Hash className="inline-block mr-2 h-4 w-4" />
                <span>Block Hash</span>
              </TableHead>
              <TableHead className="w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodeInfo.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <span className="text-muted-foreground text-sm">No Data</span>
                </TableCell>
              </TableRow>
            ) : (
              nodeInfo.map((node, index) => (
                <TableRow
                  key={index}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    node.connected
                      ? ""
                      : "bg-red-100 dark:bg-red-500 text-black dark:text-white"
                  }`}
                  onClick={() =>
                    window.open(
                      `${
                        window.location.pathname
                      }/node/?endpoint=${encodeURIComponent(node.endpoint)}`,
                      "_blank"
                    )
                  }
                >
                  <TableCell className="font-medium truncate max-w-[150px]">
                    {node.name || "-"}
                  </TableCell>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[200px]">
                          {node.endpoint}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent align="start" side="top">
                        <p>{node.endpoint}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TableCell className="truncate max-w-[100px]">
                    {node.peerCount ?? "-"}
                  </TableCell>
                  <TableCell className="truncate max-w-[150px]">
                    {node.chainHead ?? "-"}
                  </TableCell>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[200px]">
                          {node.blockHash || "-"}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent align="start" side="top">
                        <p>{node.blockHash || "-"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRpc(node.endpoint)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
