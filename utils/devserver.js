const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const { BuildEvents } = require("./fileOperations");

const DEFAULT_PORT = 4142;

const injectScript = (content) => {
    return content.replace(
        /<\/body>/,
        '<script src="/socket.io/socket.io.js"></script><script src="/reload.js"></script></body>'
    );
};

const open = async()=>{
    const open = await import('open');
    return open.default;
}

const DevServer = async (SERVER_ROOT) => {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);

    const STATIC_ROOT = path.join(process.cwd(), SERVER_ROOT);
    

    // Serve the reload script to clients
    app.get('/reload.js', (req, res) => {
        res.type('application/javascript');
        res.send(`
        document.addEventListener('DOMContentLoaded', function() {
            console.log("init socketio")
            const socket = io();
            socket.on('reload', function() {
                window.location.reload();
            });
        });`);
    });

    // When a .html file is requested, inject the reload script
    app.use((req, res, next) => {
        if (path.extname(req.path) === '.html') {
            const filePath = path.join(STATIC_ROOT, req.path);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    next(err);
                    return;
                }
                res.send(injectScript(data));
            });
        } else {
            next();
        }
    });

    // Serve the files from SERVER_ROOT if not HTML
    app.use(express.static(STATIC_ROOT));

    server.listen(DEFAULT_PORT, async () => {
        const SERVER_URL = `http://localhost:${DEFAULT_PORT}`
        console.log(`Dev server started on ${SERVER_URL}`);
        const openBrowser = await open();
        openBrowser(SERVER_URL);
    });

    BuildEvents.on('sitebuild:finished', () => {
        console.log("Site building has finished!");
        io.emit('reload');  // Notify all connected clients to reload
    });
};

exports.DevServer = DevServer;
