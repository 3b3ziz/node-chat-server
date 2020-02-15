#!/usr/bin/env node

/**
 * Module dependencies.
 */
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import importedDebug from 'debug';
const debug = importedDebug('chat-server:server');

import http from 'http';
import { connectDb } from './db';
import socketIO from 'socket.io';
import jwt from 'jsonwebtoken';

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '4000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
const users: Record<string, string[]> = {};
const io = socketIO(server);
app.set('io', io);
app.set('users', users);

/**
 * Listen on provided port, on all network interfaces.
 */

connectDb().then(async () => {
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
  io.on('connection', function(socket) {
    const authToken = socket.handshake.query.token;
    const secretKey = process.env.SECRET_KEY;
    const decodedToken = jwt.verify(authToken, secretKey) as DecodedToken;
    const { user_id: userID } = decodedToken;

    if (users[userID]) users[userID].push(socket.id);
    else users[userID] = [socket.id];

    // idea: decode token .. make this user join a room with his id
    // socket.join('some room');
    // if message is sent to this user, emit it to the room or directly
    // with the socket id
    // keep socket ids in a map { userId: socketId }

    console.log(`Socket ${socket.id} connected.`);
    socket.on('disconnect', reason => {
      console.log(reason);
      console.log(`a user with ID ${userID} with socket ${socket.id} has disconnected`);
      users[userID] = users[userID].filter(x => x !== socket.id);
    });
  });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
