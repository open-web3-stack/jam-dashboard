type NodeInfo = {
  name: string;
  chainHead: number;
  blockHash: string;
  peerCount: number;
};

type Subscription = {
  url: string;
  // TODO: to be changed to ws
  interval: NodeJS.Timeout;
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

  // TODO: In a real implementation, you would create a WebSocket connection here
  // For now, we'll use a mock implementation
  const mockWebSocket = {
    send: (message: string) => {
      console.log(`Sending message to ${url}:`, message);
      // Simulate receiving data
      setTimeout(() => {
        const mockData: NodeInfo = {
          name: `Node ${Math.floor(Math.random() * 1000)}`,
          chainHead: Math.floor(Math.random() * 1000000),
          blockHash: `0x${Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("")}`,
          peerCount: Math.floor(Math.random() * 100),
        };
        callback(mockData);
      }, 1000);
    },
    close: () => {
      console.log(`Closing connection to ${url}`);
    },
  };

  // Simulate periodic updates
  mockWebSocket.send("getUpdate");
  const interval = setInterval(() => {
    mockWebSocket.send("getUpdate");
  }, 5000);

  subscriptions.set(url, { url, callback, interval });

  // In a real implementation, you would return the actual WebSocket object
  return { mockWebSocket, interval };
}

export function unsubscribeFromNode(url: string) {
  const subscription = subscriptions.get(url);
  if (subscription) {
    // Close the WebSocket connection
    // if (subscription.ws && subscription.ws.readyState === WebSocket.OPEN) {
    //   subscription.ws.close();
    // }
    // TODO: Use real connection
    if (subscription.interval) {
      clearInterval(subscription.interval);
    }
    // Remove from subscriptions map
    subscriptions.delete(url);
  }
}
