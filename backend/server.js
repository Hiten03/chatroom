// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet'); // For basic security headers

// const DbConnect = require('./database');
// const router = require('./routes');

// const app = express();
// const PORT = process.env.PORT || 5500;

// // -------------------------
// // Middleware
// // -------------------------
// app.use(helmet());
// app.use(express.json());

// const corsOptions = {
//   origin: ['http://localhost:3000'],
//   credentials: true, // needed if using cookies
// };
// app.use(cors(corsOptions));

// // -------------------------
// // DB Connection
// // -------------------------
// DbConnect();

// // -------------------------
// // Routes
// // -------------------------
// app.use('/api', router);

// // Root Route
// app.get('/', (req, res) => {
//   res.send('Welcome to the Express Server!');
// });

// // -------------------------
// // Global Error Handler (Optional)
// // -------------------------
// app.use((err, req, res, next) => {
//   console.error('Server Error:', err);
//   res.status(500).json({ message: 'Something went wrong on the server.' });
// });

// // -------------------------
// // Start Server
// // -------------------------
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


// require('dotenv').config();
// const express = require('express');
// const app = express();
// const DbConnect = require('./database');
// const router = require('./routes');
// const cors = require('cors');

// const corsOption = {
//     credentials: true,
//     origin: ['http://localhost:3000'],
// };
// app.use(cors(corsOption));

// const PORT = process.env.PORT || 5500;
// DbConnect();
// app.use(express.json());
// app.use(router);

// app.get('/', (req, res) => {
//     res.send('Hello from express Js');
// });

// app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const app = express();
const DbConnect = require('./database');
const router = require('./routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { METHODS } = require('http');
const ACTIONS = require('./actions');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: [process.env.FRONT_URL, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

app.use(cookieParser());
const corsOption = {
    credentials: true,
    origin: [process.env.FRONT_URL, 'http://localhost:3000'],
};
app.use(cors(corsOption));
app.set('trust proxy', 1);
app.use('/storage', express.static('storage'));

const PORT = process.env.PORT || 5500;
DbConnect();
app.use(express.json({ limit: '8mb' }));
app.use(router);

app.get('/', (req, res) => {
    res.send('Hello from express Js');
});

//Sockets

const socketUserMapping = {

}

io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
        socketUserMapping[socket.id] = user;

        //new Map
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.ADD_PEER, {
                peerId: socket.id,
                createOffer: false,
                user
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerId: clientId,
                createOffer: true,
                user: socketUserMapping[clientId],
            });
        });

        socket.join(roomId);
    });


    //handle relay ice
    socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
        io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
            peerId: socket.id,
            icecandidate,
        });
    });

    //handle relay sdp (session description)
    socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
        io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerId: socket.id,
            sessionDescription,
        });
    });

    //Handle mute/unmute
    socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.MUTE, {
                peerId: socket.id,
                userId,
            });
        });
    });

    socket.on(ACTIONS.UN_MUTE, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.UN_MUTE, {
                peerId: socket.id,
                userId,
            });
        });
    });

    // Room Moderation Events
    socket.on(ACTIONS.KICK_USER, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.KICK_USER, {
                peerId: socket.id,
                userId,
            });
        });
    });

    socket.on(ACTIONS.MAKE_SPEAKER, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.MAKE_SPEAKER, {
                peerId: socket.id,
                userId,
            });
        });
    });

    socket.on(ACTIONS.MAKE_LISTENER, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.MAKE_LISTENER, {
                peerId: socket.id,
                userId,
            });
        });
    });

    socket.on(ACTIONS.REMOVE_ROOM, ({ roomId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.REMOVE_ROOM, {
                peerId: socket.id,
            });
        });
    });

    // Hand Raising
    socket.on(ACTIONS.RAISE_HAND, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.RAISE_HAND, { peerId: socket.id, userId });
        });
    });

    socket.on(ACTIONS.LOWER_HAND, ({ roomId, userId }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.LOWER_HAND, { peerId: socket.id, userId });
        });
    });

    // In-Room Text Chat
    socket.on(ACTIONS.SEND_MSG, ({ roomId, message, user: senderUser }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        const msgData = {
            id: Date.now().toString(),
            text: message,
            user: senderUser,
            timestamp: new Date().toISOString(),
        };
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.RECEIVE_MSG, msgData);
        });
    });

    // Emoji Reactions
    socket.on(ACTIONS.SEND_REACTION, ({ roomId, emoji, user: senderUser }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        const reactionData = {
            id: Date.now().toString() + Math.random(),
            emoji,
            user: senderUser,
        };
        clients.forEach(clientId => {
            io.to(clientId).emit(ACTIONS.RECEIVE_REACTION, reactionData);
        });
    });

    //leaving the room
    const leaveRoom = ({ roomId }) => {
        const { rooms } = socket;

        Array.from(rooms).forEach(roomId => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

            clients.forEach(clientId => {
                io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
                    peerId: socket.id,
                    userId: socketUserMapping[socket.id]?.id,
                });

                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerId: clientId,
                    userId: socketUserMapping[clientId]?.id,
                });
            });

            socket.leave(roomId);
        });

        delete socketUserMapping[socket.id];

    };
    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on('disconnecting', leaveRoom);
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));