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

type NodeInfo = {
  url: string;
  name: string;
  chainHead: number;
  blockHash: string;
};

export default function TelemetryDashboard() {
  const [rpcInput, setRpcInput] = useState("");
  const [rpcs, setRpcs] = useState<string[]>([]);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo[]>([]);

  const addRpc = () => {
    if (rpcInput && !rpcs.includes(rpcInput)) {
      setRpcs([...rpcs, rpcInput]);
      setRpcInput("");
    }
  };

  useEffect(() => {
    const mockWebSocket = (url: string) => {
      const ws = {
        url,
        onmessage: null as ((event: { data: string }) => void) | null,
        send: (message: string) => {
          console.log(`Sending message to ${url}:`, message);
          // Simulate receiving data
          setTimeout(() => {
            if (ws.onmessage) {
              ws.onmessage({
                data: JSON.stringify({
                  name: `Node ${Math.floor(Math.random() * 1000)}`,
                  chainHead: Math.floor(Math.random() * 1000000),
                  blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                }),
              });
            }
          }, 1000);
        },
        close: () => {
          console.log(`Closing connection to ${url}`);
        },
      };
      return ws;
    };

    const connections = rpcs.map((url) => {
      const ws = mockWebSocket(url);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNodeInfo((prev) => {
          const index = prev.findIndex((node) => node.url === url);
          if (index !== -1) {
            const newNodeInfo = [...prev];
            newNodeInfo[index] = { url, ...data };
            return newNodeInfo;
          } else {
            return [...prev, { url, ...data }];
          }
        });
      };
      ws.send("subscribe");
      return ws;
    });

    const interval = setInterval(() => {
      connections.forEach((ws) => ws.send("getUpdate"));
    }, 5000);

    return () => {
      clearInterval(interval);
      connections.forEach((ws) => ws.close());
    };
  }, [rpcs]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">JAM Telemetry Dashboard</h1>
      <div className="mb-4 flex">
        <Input
          type="text"
          placeholder="Enter RPC endpoint"
          value={rpcInput}
          onChange={(e) => setRpcInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addRpc()}
          className="mr-2"
        />
        <Button onClick={addRpc}>Add RPC</Button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Added RPCs:</h2>
        <ul>
          {rpcs.map((rpc, index) => (
            <li key={index}>{rpc}</li>
          ))}
        </ul>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Node Name</TableHead>
            <TableHead>RPC</TableHead>
            <TableHead>Chain Head</TableHead>
            <TableHead>Block Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodeInfo.map((node, index) => (
            <TableRow key={index}>
              <TableCell>{node.name}</TableCell>
              <TableCell>{node.url}</TableCell>
              <TableCell>{node.chainHead}</TableCell>
              <TableCell>{node.blockHash}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
