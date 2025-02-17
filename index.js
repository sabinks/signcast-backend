import express from 'express';
import http from 'http'
import cors from 'cors';
import 'dotenv/config';
import { Server } from 'socket.io';
import connectDB from './config/db.js'
import router from './routes/appRouter.js';
// import codeRouter from './routes/codeRouter.js';
import { Screen, validateScreen } from './model/screen.js';

const app = express();
const server = http.createServer(app);

connectDB();
app.use(express.json());
app.use(cors());
app.use('/api/screens', router);
// app.use('/api/pairing', codeRouter);
const connectedDevices = []
const socket = new Server(server, {
    cors: { origin: "*" },
    rejectUnauthorized: false,
    transports: ["websocket", "polling"],
    pingTimeout: 60000
});
export let pairingCodes = {}; // Store active codes

const io = socket.of('/data-sync');
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
    socket.on("get-all-devices", async () => {
        io.emit("list-devices", connectedDevices);
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
        io.emit("list-devices", connectedDevices);
    });

    socket.on("delete-screen", async (payload) => {
        const { screenId } = payload
        await Screen.deleteOne({ screenId });
        const screens = await Screen.find({})
        io.emit("list-screens", screens);
        io.emit("list-devices", connectedDevices);

    });

    socket.on("request-content", async (payload) => {
        const { screenId } = payload
        const index = connectedDevices.findIndex(device => device.id === socket.id)
        connectedDevices[index].screenId = screenId
        const screen = await Screen.findOne({ screenId });
        io.emit("update-content", screen);
        io.emit("list-devices", connectedDevices);
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
        io.emit("list-devices", connectedDevices);
    });
});

const port = process.env.PORT || 5000

server.listen(port, () => console.log('Server running on port:', port));