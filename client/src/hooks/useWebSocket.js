import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

// ✅ Dynamic Socket URL from environment
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * 🌐 useWebSocket - Custom Hook for WebSocket Management (Socket.IO)
 * @param {string} namespace - WebSocket namespace (e.g., "/admin", "/staff")
 * @param {object} eventHandlers - { eventName: callbackFunction }
 */
const useWebSocket = (namespace, eventHandlers = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!namespace) return;
    if (socketRef.current) return; // Prevent duplicate connections

    console.log(`🔌 Connecting WebSocket to namespace: ${namespace}...`);
    socketRef.current = io(`${SOCKET_URL}/${namespace}`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    socketRef.current.on("connect", () => {
      console.log(`✅ Connected to ${namespace}:`, socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.warn(`🔴 Disconnected from ${namespace}: ${reason}`);
      setIsConnected(false);
    });

    // ✅ Attach dynamic event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });

    // ✅ Clean-up on unmount
    return () => {
      console.log(`🔴 Closing WebSocket for ${namespace}`);
      if (socketRef.current) {
        Object.entries(eventHandlers).forEach(([event, handler]) =>
          socketRef.current.off(event, handler)
        );
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [namespace, JSON.stringify(eventHandlers)]); // ✅ re-run if event handlers change

  /**
   * 📤 Emit events to the server
   */
  const emitEvent = useCallback((event, data) => {
    if (socketRef.current) {
      console.log(`📤 Emitting event: ${event}`, data);
      socketRef.current.emit(event, data);
    }
  }, []);

  return { isConnected, emitEvent };
};

export default useWebSocket;
