import express from 'express';
import http from 'http'
import fs from 'fs';
import cors from 'cors';
import 'dotenv/config';
import { Server } from 'socket.io';
import connectDB from './config/db.js'
import { Screen } from './model/screen.js';

const app = express();
const server = http.createServer(app);

const socket = new Server(server, {
    cors: { origin: "*" },
    rejectUnauthorized: false,
    transports: ["websocket", "polling"],
    pingTimeout: 60000
});

const io = socket.of('/socket.io');
connectDB()
app.use(cors());
app.use(express.json());

const connectedDevices = []

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    const devicePresent = connectedDevices.includes(socket.id)
    if (!devicePresent) {
        connectedDevices.push({ id: socket.id, status: 'online', screenId: null })
    }

    socket.on("get-all-screens", async () => {
        const screens = await Screen.find({})
        io.emit("list-screens", screens);
    });

    socket.on("add-screen", async (data) => {
        const screen = Screen({
            screenId: data.screenId,
            name: data.name,
            content: data.content
        })
        await screen.save();
        const screens = await Screen.find({})
        io.emit("list-screens", screens);
    });

    socket.on("update-screen", async (data) => {
        const screen = await Screen.findOne({ _id: data.id });
        screen.screenId = data.payload.screenId;
        screen.name = data.payload.name;
        screen.content = data.payload.content;
        await screen.save();
        const screens = await Screen.find({})
        io.emit("list-screens", screens);
    });

    socket.on("delete-screen", async (payload) => {
        const { screenId } = payload
        await Screen.deleteOne({ screenId });
        const screens = await Screen.find({})
        io.emit("list-screens", screens);
    });

    socket.on("request-content", async (payload) => {
        const { screenId } = payload
        const index = connectedDevices.findIndex(device => device.id === socket.id)
        connectedDevices[index].sceeenId = screenId
        const screen = await Screen.findOne({ screenId });
        // const content = JSON.parse(fs.readFileSync(contentFile, "utf-8"));
        io.emit("update-content", screen);
    });
    socket.on("sync-screen-with-devices", async (payload) => {
        const { screenId } = payload
        console.log(connectedDevices);
        const screen = await Screen.findOne({ screenId });
        let groupedScreen = connectedDevices.filter(device => device.screenId = screenId)
        groupedScreen.forEach(device => {
            io.to(device.id).emit("update-content", screen);
        })
    })

    socket.on("disconnect", () => {
        const index = connectedDevices.findIndex(device => device.id === socket.id)
        connectedDevices[index].status = 'offline'
        console.log("Client disconnected:", socket.id)
    });
});

const port = process.env.PORT || 5000

server.listen(port, () => console.log('Server running on port:', port));