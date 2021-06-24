const express = require('express');
const app = express();
const path = require('path');
const http = require("http");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const mongoose = require('mongoose');


const server = http.createServer(app);

const io = require('socket.io')(server);
module.exports = io;

const discussion = require('./routes/discussion');

const port = 3000 || process.env.port;
const hostname = "localhost";

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/',discussion);


app.set('view engine', 'ejs');

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
});

