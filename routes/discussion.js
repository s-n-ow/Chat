const express = require('express');
const mongoose = require('mongoose');
const io = require('../app');
const users = require('../models/users');
const router = express.Router();
const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false });


router.get('/', (req, res) => {
    res.render('index.ejs');
});

router.get('/chat', (req, res) => {
    res.render('chat.ejs',{username: req.query.username, room: req.query.room});
});

router.post('/chat', urlencodedParser, (req, res) => {
    console.log(req.body);
    res.redirect('/chat?username='+req.body.name+'&room='+req.body.room);
});

const url = 'mongodb://localhost:27017/mongoChat';

mongoose.connect(url, (err, db) => {

    console.log('connected to database');

    io.on('connection', (socket) => {

        socket.on('joinRoom',({userName, roomName}) => {

            const user = new users({
                name:userName,
                room:roomName
            });

            user.save();

            socket.join(user.room);

            let roomChat = db.collection(`${user.room}`);

            socket.emit('message', 'Welcome to Discussion Portal!');

             //broadcasts when a user connects
            socket.broadcast.to(user.room).emit('message', `${user.name} has joined the chat`);

            //printing the saved chats
            roomChat.find().limit(100).sort({_id:1}).toArray((err, res) => {
                if(err){
                    throw err;
                }
    
                //emit the message
                socket.emit('output',res);
                });

            //listen for chat-message
            socket.on('chatMessage', (data) => {
                const name = data.name;
                const message = data.message;
                console.log(data);
                roomChat.insert({name: name, message: message}, () => {
                    io.emit('output', data);
                });
    
            });


            //when clients disconnect
            socket.on('disconnect', () => {
                io.emit('message', 'A USER has left a chat');
            });

        });

    });

});

module.exports = router;