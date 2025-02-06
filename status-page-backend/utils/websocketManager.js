const WebSocket = require("ws");

const clients = new Set();

const setupWebSocket = (server) => {    
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        console.log("New WebSocket connection");
        clients.add(ws);

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    console.log("WebSocket server initialized");
};

const broadcast = (data) => {
    const message = JSON.stringify(data);
    console.log(clients.size)
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

module.exports = { setupWebSocket, broadcast };