const express = require('express');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
require('dotenv').config()

const socket = require('socket.io')(server, {
    cors: { origin: "*" },
    rejectUnauthorized: false,
    transports: ["websocket", "polling"],
    pingTimeout: 60000
});

const io = socket.of('/socket.io');

app.use(cors());
app.use(express.json());

const contentFile = "./content.json";

// WebSocket connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send stored content to new clients
    if (fs.existsSync(contentFile)) {
        const content = JSON.parse(fs.readFileSync(contentFile, "utf-8"));
        socket.emit("update-content", content);
    }

    // Sync content from dashboard to Electron clients
    socket.on("sync-content", (data) => {
        fs.writeFileSync(contentFile, JSON.stringify(data, null, 2));
        console.log('sync-content');
        io.emit("update-content", data);
    });

    socket.on("request-content", (data) => {
        const content = JSON.parse(fs.readFileSync(contentFile, "utf-8"));
        io.emit("update-content", content);
    });

    socket.on("disconnect", () => console.log("Client disconnected:", socket.id));

});

app.get("/content", (req, res) => {
    if (fs.existsSync(contentFile)) {
        return res.json(JSON.parse(fs.readFileSync(contentFile, "utf-8")));
    }
    res.json({});
});

const port = process.env.PORT || 5000

server.listen(port, () => console.log('Server running on port:', port));