let ws = null;
const vibrate =
    navigator.vibrate ||
    navigator.webkitVibrate ||
    navigator.mozVibrate;
const INTENTIONAL_CLOSE = 4999;
const rumbleListeners = new Set();

function haptic() {
    if (vibrate) {
        vibrate.call(navigator, 30);
    }
}

export function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

export function connect(
    layoutType,
    client,
    hasTouchpad,
    targetHost,
    targetPort
) {
    if (ws) {
        ws.close(INTENTIONAL_CLOSE);
        ws = null;
    }

    // location connection target details
    const locationProtocol = typeof location !== "undefined" ? location.protocol : ""
    const locationHost = typeof location !== "undefined" ? location.hostname : "127.0.0.1";
    const proto = locationProtocol === "https:" ? "wss:" : "wss:";
    const host = targetHost ? targetHost : locationHost;
    const port = targetPort ? targetPort : "8080";
    const target = host + ":" + port;

    // client connection name details
    const clientIdKey = "padforge_client_id_" + layoutType;
    let clientId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(clientIdKey) : null;
    if (!clientId) {
        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        clientId = client ? client : uuid;
        typeof sessionStorage !== "undefined" ? sessionStorage.setItem(clientIdKey, clientId) : "";
    }

    let wsUrl = proto + "//" + target + "/ws" +
        "?id=" + encodeURIComponent(clientId) + "" +
        "&layout=" + encodeURIComponent(layoutType);
    if (hasTouchpad) wsUrl += "&touchpad=1";

    ws = new WebSocket(wsUrl);
    ws.onopen = function () {
        console.log("[WS] WebSocket connected");
    }

    ws.onclose = function (event) {
        if (event.code !== INTENTIONAL_CLOSE) {
            console.log(`[WS] connection closed: ${event.code}`);
            setTimeout(
                () => {
                    connect(layoutType, client, hasTouchpad, targetHost, targetPort);
                },
                5000
            );
        }
    }

    ws.onerror = function (event) {
        console.error(`[WS] connection error:`, event);
        ws.close();
    }

    ws.onmessage = function (event) {
        let message;
        try {
            message = JSON.parse(event.data);
        } catch (error) {
            console.log(`[WS] connection exception on ${event}: ${error}`);
            return;
        }

        if (message.type === "connected") {
            console.log(`[WS] connection name: ${message.name} (haptic: ${vibrate})`);
        } else if (message.type === "rumble") {
            if (vibrate && (message.left > 0 || message.right > 0)) {
                const intensity = Math.max(message.left, message.right) / 65535;
                console.log(`[WS] rumble : ${message} : ${intensity}`);
                vibrate.call(navigator, Math.round(intensity * 200));
            }
            // Forward rumble to the locally connected physical gamepad.
            for (const listener of rumbleListeners) {
                listener({
                    left: message.left ?? 0,
                    right: message.right ?? 0
                });
            }
        }
    }
}

export function onRumble(callback) {
    rumbleListeners.add(callback);

    // Return unsubscribe function.
    return () => {
        rumbleListeners.delete(callback);
    };
}