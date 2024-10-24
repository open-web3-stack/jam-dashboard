type JSONValue = string | number | boolean | null;

export type JSONObject =
  | JSONObject[]
  | { [key: string]: JSONValue | JSONObject };

type WebSocketMessage = {
  jsonrpc: string;
  method: string;
  id: number;
  params: Record<string, JSONValue>;
};

type WebSocketSubscribeMessage = Omit<WebSocketMessage, "id">;

type RPCResult = JSONValue | JSONObject;

type WebSocketResponse = {
  jsonrpc: string;
  result?: RPCResult;
  error?: {
    code: number;
    message: string;
  };
  id: number;
};

type WebSocketSubscriptionResponse = {
  jsonrpc: string;
  method: string;
  params: {
    result: JSONObject;
    subscription: string; // id
  };
};

type Connection = {
  ws: WebSocket;
  pendingRequests: Map<
    number,
    {
      resolve: (value: RPCResult) => void;
      reject: (reason: unknown) => void;
    }
  >;
  subscriptionCallbacks: Map<string, (result: JSONObject) => void>;
};

const connections: Map<string, Connection> = new Map();

let nextRequestId = 1;

export function connectToNode(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (connections.has(url)) {
      resolve();
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`Connected to ${url}`);
      connections.set(url, {
        ws,
        pendingRequests: new Map(),
        subscriptionCallbacks: new Map(),
      });
      resolve();
    };

    ws.onmessage = (event) => {
      const data: WebSocketResponse | WebSocketSubscriptionResponse =
        JSON.parse(event.data);
      const connection = connections.get(url);
      if (connection) {
        if ("id" in data && data.id != null) {
          const request = connection.pendingRequests.get(data.id);
          if (request) {
            if (data.error) {
              request.reject(new Error(data.error.message));
            } else {
              request.resolve(data.result || {});
            }
            connection.pendingRequests.delete(data.id);
          }
        } else if ("method" in data && "params" in data) {
          // subscription updates
          const callback = connection.subscriptionCallbacks.get(data.method);
          if (callback) {
            callback(data.params);
          }
        }
      }
    };
    ws.onerror = (error) => {
      console.error(`WebSocket error for ${url}:`, error);
      reject(new Error(`WebSocket error`));
    };

    ws.onclose = () => {
      console.log(`Connection closed for ${url}`);
      connections.delete(url);
    };
  });
}

export function disconnectFromNode(url: string) {
  const connection = connections.get(url);
  if (connection) {
    connection.ws.close();
    connections.delete(url);
  }
}

export function sendRequest(
  url: string,
  method: string,
  params: Record<string, JSONValue> = {}
): Promise<RPCResult> {
  return new Promise(async (resolve, reject) => {
    if (!connections.has(url)) {
      try {
        await connectToNode(url);
      } catch (error) {
        reject(
          new Error(
            `Failed to connect to ${url}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    }

    const connection = connections.get(url);
    if (!connection) {
      reject(new Error(`No active connection to ${url}`));
      return;
    }

    const id = nextRequestId++;
    const message: WebSocketMessage = {
      jsonrpc: "2.0",
      method,
      id,
      params,
    };

    connection.pendingRequests.set(id, { resolve, reject });
    connection.ws.send(JSON.stringify(message));
  });
}

export function subscribe(
  url: string,
  method: string,
  params: Record<string, JSONValue> = {},
  callback: (result: JSONObject) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const connection = connections.get(url);
    if (!connection) {
      reject(new Error(`No active connection to ${url}`));
      return;
    }

    const message: WebSocketSubscribeMessage = {
      jsonrpc: "2.0",
      method,
      params,
    };

    connection.subscriptionCallbacks.set(method, callback);
    connection.ws.send(JSON.stringify(message));

    resolve();
  });
}

export function unsubscribe(url: string, method: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const connection = connections.get(url);
    if (!connection) {
      reject(new Error(`No active connection to ${url}`));
      return;
    }

    connection.subscriptionCallbacks.delete(method);

    resolve();
  });
}
