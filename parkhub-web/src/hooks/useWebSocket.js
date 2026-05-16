import { useEffect, useRef, useCallback, useState } from 'react';
export function useWebSocket(options = {}) {
    const { autoReconnect = true, reconnectDelay = 1000, maxReconnectDelay = 30_000, maxRetries = 10, heartbeatInterval = 30_000, onEvent, token, } = options;
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [occupancy, setOccupancy] = useState({});
    const [retriesExhausted, setRetriesExhausted] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const heartbeatTimer = useRef(null);
    const retryCount = useRef(0);
    const onEventRef = useRef(onEvent);
    const unmountedRef = useRef(false);
    onEventRef.current = onEvent;
    const getWsUrl = useCallback(() => {
        if (options.url)
            return options.url;
        
        const baseUrl = import.meta.env.VITE_API_URL || '';
        let host = window.location.host;
        let proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        if (baseUrl.startsWith('http')) {
            const urlObj = new URL(baseUrl);
            host = urlObj.host;
            proto = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        }

        let url = `${proto}//${host}/api/v1/ws`;
        if (token) {
            url += `?token=${encodeURIComponent(token)}`;
        }
        return url;
    }, [options.url, token]);
    const connect = useCallback(() => {
        if (unmountedRef.current)
            return;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        const ws = new WebSocket(getWsUrl());
        wsRef.current = ws;
        ws.onopen = () => {
            setConnected(true);
            retryCount.current = 0;
            setRetriesExhausted(false);
            // Start heartbeat ping to detect dead connections
            if (heartbeatTimer.current)
                clearInterval(heartbeatTimer.current);
            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, heartbeatInterval);
        };
        ws.onmessage = (msg) => {
            try {
                const event = JSON.parse(msg.data);
                setLastMessage(event);
                onEventRef.current?.(event);
                // Update occupancy map from occupancy_changed events
                if (event.event === 'occupancy_changed' && event.data.lot_id) {
                    const rawId = event.data.lot_id;
                    // Validate lot_id is a safe string (alphanumeric, hyphens, underscores)
                    if (typeof rawId === 'string' && /^[a-zA-Z0-9_-]+$/.test(rawId)) {
                        const entry = { available: event.data.available, total: event.data.total };
                        const sanitizedId = String(rawId);
                        setOccupancy(prev => {
                            const next = Object.create(null);
                            Object.assign(next, prev);
                            next[sanitizedId] = entry;
                            return next;
                        });
                    }
                }
            }
            catch {
                // Ignore non-JSON messages (e.g., pong frames)
            }
        };
        ws.onclose = () => {
            setConnected(false);
            wsRef.current = null;
            if (heartbeatTimer.current) {
                clearInterval(heartbeatTimer.current);
                heartbeatTimer.current = null;
            }
            if (autoReconnect && !unmountedRef.current) {
                if (retryCount.current >= maxRetries) {
                    setRetriesExhausted(true);
                    return;
                }
                const delay = Math.min(reconnectDelay * Math.pow(2, retryCount.current), maxReconnectDelay);
                retryCount.current += 1;
                reconnectTimer.current = setTimeout(connect, delay);
            }
        };
        ws.onerror = () => { };
    }, [getWsUrl, autoReconnect, reconnectDelay, maxReconnectDelay]);
    const reconnect = useCallback(() => {
        retryCount.current = 0;
        setRetriesExhausted(false);
        connect();
    }, [connect]);
    useEffect(() => {
        unmountedRef.current = false;
        connect();
        return () => {
            unmountedRef.current = true;
            if (reconnectTimer.current)
                clearTimeout(reconnectTimer.current);
            if (heartbeatTimer.current)
                clearInterval(heartbeatTimer.current);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);
    return { connected, lastMessage, occupancy, retriesExhausted, reconnect };
}
