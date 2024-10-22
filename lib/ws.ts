type NodeInfo = {
  name: string;
  chainHead: number;
  blockHash: string;
  peerCount: number;
};

type Subscription = {
  url: string;
  ws: WebSocket;
  callback: (data: NodeInfo) => void;
};

const subscriptions: Map<string, Subscription> = new Map();

export function subscribeToNode(
  url: string,
  callback: (data: NodeInfo) => void
) {
  if (subscriptions.has(url)) {
    console.warn(`Already subscribed to ${url}`);
    return;
  }

  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`Connected to ${url}`);
    sendUpdate(ws);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.jsonrpc === "2.0" && data.result) {
      const nodeInfo: NodeInfo = {
        name: data.result.name,
        peerCount: parseInt(data.result.peerCount, 10),
        chainHead: parseInt(data.result.chainHead, 10),
        blockHash: data.result.blockHash,
      };
      callback(nodeInfo);
    }
  };

  ws.onerror = (error) => {
    console.error(`WebSocket error for ${url}:`, error);
  };

  ws.onclose = () => {
    console.log(`Connection closed for ${url}`);
    subscriptions.delete(url);
  };

  subscriptions.set(url, { url, ws, callback });

  // Set up periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      sendUpdate(ws);
    }
  }, 5000);

  return { ws, interval };
}

function sendUpdate(ws: WebSocket) {
  const message = {
    jsonrpc: "2.0",
    method: "telemetry_getUpdate",
    id: 1,
    params: {},
  };
  ws.send(JSON.stringify(message));
}

export function unsubscribeFromNode(url: string) {
  const subscription = subscriptions.get(url);
  if (subscription) {
    if (subscription.ws.readyState === WebSocket.OPEN) {
      subscription.ws.close();
    }
    subscriptions.delete(url);
  }
}
