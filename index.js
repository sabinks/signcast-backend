import express from 'express';
import http from 'http'
import cors from 'cors';
import 'dotenv/config';
import { Server } from 'socket.io';
import connectDB from './config/db.js'
import { Screen, validateScreen } from './model/screen.js';

const app = express();
const server = http.createServer(app);

connectDB()
app.use(express.json());
const corsOptions = {
    // origin:'https://abc.onrender.com',
    AccessControlAllowOrigin: '*',
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}
app.use(cors(corsOptions))
app.get('/api/screens', async (req, res) => {
    const screens = await Screen.find({})
    res.send(screens)
});
app.post('/api/screens', async (req, res) => {
    const { error } = validateScreen(req.body)
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const screen = Screen({
        screenId: req.body.screenId,
        name: req.body.name,
        content: req.body.content
    })
    await screen.save();
    res.send({ message: 'Screen added successfully' })
});
app.put('/api/screens/:id', async (req, res) => {
    const { error } = validateScreen(req.body)
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const screen = await Screen.findOne({ _id: req.params.id });
    screen.screenId = req.body.screenId;
    screen.name = req.body.name;
    screen.content = req.body.content;
    await screen.save();
    res.send({ message: 'Screen updated successfully' })
});
app.delete('/api/screens/:id', async (req, res) => {
    await Screen.deleteOne({ _id: req.params.id });
    res.send({ message: 'Screen deleted successfully' })
});


const connectedDevices = []
const socket = new Server(server, {
    cors: { origin: "*" },
    rejectUnauthorized: false,
    transports: ["websocket", "polling"],
    pingTimeout: 60000
});

const io = socket.of('/socket.io');
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