import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import fs from 'fs';
import path from 'path';

import { BuildEvents } from './fileOperations.js';

const DEFAULT_PORT = 4142;

const injectScript = (content) => {
    return content.replace(
        /<\/body>/,
        '<script src="/socket.io/socket.io.js"></script><script src="/reload.js"></script></body>'
    );
};

export const DevServer = async (SERVER_ROOT) => {
    const app = express();
    const server = http.createServer(app);
    const io = new SocketIO(server);

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
        const SERVER_URL = `http://localhost:${DEFAULT_PORT}`;
        console.log(`Dev server started on ${SERVER_URL}`);
        const open = (await import('open')).default;
        open(SERVER_URL);
    });

    BuildEvents.on('sitebuild:finished', () => {
        console.log("Site building has finished!");
        io.emit('reload');  // Notify all connected clients to reload
    });
};
