"use client";

import { useState, useEffect } from "react";
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
import { Hash, Cpu, Blocks, Users, X } from "lucide-react";
import { subscribeToNode, unsubscribeFromNode } from "@/lib/ws";
import { toast } from "sonner";

type NodeInfo = {
  endpoint: string;
  name?: string | null;
  chainHead?: number | null;
  blockHash?: string | null;
  peerCount?: number | null;
};

const STORAGE_KEY = "telemetry-endpoints";

export default function TelemetryDashboard() {
  const [rpcInput, setRpcInput] = useState("");
  const [nodeInfo, setNodeInfo] = useState<NodeInfo[]>([]);

  useEffect(() => {
    const loadSavedEndpoints = () => {
      const savedEndpoints = localStorage.getItem(STORAGE_KEY);
      if (savedEndpoints) {
        const endpoints = JSON.parse(savedEndpoints);
        endpoints.forEach((endpoint: string) => {
          subscribeToNode(endpoint, (data) => updateNodeInfo(endpoint, data));
        });
      }
    };

    loadSavedEndpoints();

    return () => {
      nodeInfo.forEach((node) => unsubscribeFromNode(node.endpoint));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateNodeInfo = (
    endpoint: string,
    data: Omit<NodeInfo, "endpoint">
  ) => {
    setNodeInfo((prev) => {
      const index = prev.findIndex((node) => node.endpoint === endpoint);
      if (index !== -1) {
        const newNodeInfo = [...prev];
        newNodeInfo[index] = { endpoint, ...data };
        return newNodeInfo;
      } else {
        return [...prev, { endpoint, ...data }];
      }
    });
  };

  const validateUrl = (url: string) => {
    const pattern = /^(wss?:\/\/).+$/;
    return pattern.test(url);
  };

  const addRpc = () => {
    if (!validateUrl(rpcInput)) {
      toast("Invalid WebSocket URL");
      return;
    }

    if (rpcInput && !nodeInfo.some((node) => node.endpoint === rpcInput)) {
      subscribeToNode(rpcInput, (data) => updateNodeInfo(rpcInput, data));
      setRpcInput("");

      // Save to localStorage
      const savedEndpoints = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      savedEndpoints.push(rpcInput);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEndpoints));
    }
  };

  const removeRpc = (endpoint: string) => {
    unsubscribeFromNode(endpoint);
    setNodeInfo((prev) => prev.filter((node) => node.endpoint !== endpoint));

    // Remove from localStorage
    const savedEndpoints = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    const updatedEndpoints = savedEndpoints.filter(
      (savedEndpoint: string) => savedEndpoint !== endpoint
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEndpoints));
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <h3 className="text-xl font-bold">Telemetry Dashboard</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Enter telemetry RPC endpoint"
          value={rpcInput}
          onChange={(e) => setRpcInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addRpc()}
          className="flex-grow"
        />
        <Button onClick={addRpc}>Add RPC</Button>
      </div>
      <div className="overflow-x-auto min-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TooltipProvider>
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-[150px] truncate">
                      <Cpu className="inline-block mr-2 h-4 w-4" />
                      <span>Node</span>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Node</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-[200px] truncate">
                      <Hash className="inline-block mr-2 h-4 w-4" />
                      <span>Endpoint</span>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Endpoint</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-[100px] truncate">
                      <Users className="inline-block mr-2 h-4 w-4" />
                      <span>Peers</span>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Peer Count</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-[150px] truncate">
                      <Blocks className="inline-block mr-2 h-4 w-4" />
                      <span>Chain Head</span>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chain Head</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip delayDuration={50}>
                  <TooltipTrigger asChild>
                    <TableHead className="w-[200px] truncate">
                      <Hash className="inline-block mr-2 h-4 w-4" />
                      <span>Block Hash</span>
                    </TableHead>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Block Hash</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                <TableRow key={index}>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="font-medium truncate max-w-[150px]">
                          {node.name || "-"}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{node.name || "-"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[200px]">
                          {node.endpoint}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{node.endpoint}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[100px]">
                          {node.peerCount ?? "-"}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{node.peerCount ?? "-"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[150px]">
                          {node.chainHead ?? "-"}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{node.chainHead ?? "-"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <TableCell className="truncate max-w-[200px]">
                          {node.blockHash || "-"}
                        </TableCell>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{node.blockHash || "-"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TableCell>
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
