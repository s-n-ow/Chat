const express = require('express');
const mongoose = require('mongoose');
const io = require('../app');
const users = require('../models/users');
const router = express.Router();
const bodyParser = require('body-parser');
const formatMessage = require('../utils/messages');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

router.get('/', (req, res) => {
    res.render('index.ejs');
});

router.get('/chat', (req, res) => {
    res.render('chat.ejs',{username: req.query.username, room: req.query.room});
});

router.post('/chat', urlencodedParser, (req, res) => {
    console.log(req.body);
    res.redirect('/chat?username='+req.body.username+'&room='+req.body.room);
});

const url = 'mongodb+srv://user123:user12345@chat.ascyc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {

    console.log('connected to database');

    io.on('connection', (socket) => {

        socket.on('joinRoom',({userName, roomName}) => {

            const user = new users({
                username:userName,
                room:roomName,
                id:socket.id
            });

            user.save()
            .then(() => {
                users.find({room: user.room}).sort({_id:1})
                .then((arr) => {
                io.to(user.room).emit('currentUsers',arr);
                })
                .catch((err) => {
                    throw err;
            });
            });

            socket.join(user.room);

            let roomChat = db.collection(`${user.room}`);

            socket.emit('message', formatMessage('BOT', 'Welcome to Discussion Portal!'));

             //broadcasts when a user connects
            socket.broadcast.to(user.room).emit('message', formatMessage('BOT',`${user.username} has joined the chat`));

            //print the current users when someone joins

            //printing the saved chats
            roomChat.find().limit(100).sort({_id:1}).toArray((err, res) => {
                if(err){
                    throw err;
                }
                //emit the message
                socket.emit('previous',res);
            });


            //listen for chat-message
            socket.on('chatMessage',  msg => {
                const data = formatMessage(user.username, msg);
                roomChat.insert({name: data.username, message: data.message, time: data.time, room: user.room}, () => {
                    io.to(user.room).emit('output', data);
                });

            });

            //when clients disconnect
            socket.on('disconnect', () => {
                socket.broadcast.to(user.room).emit('message', formatMessage('BOT',`${user.username} has left a chat`));
                user.remove({id: socket.id})
                .then(() => {
                    users.find({room: user.room}).sort({_id:1})
                    .then((arr) => {
                        io.to(user.room).emit('currentUsers',arr);
                    })
                    .catch((err) => {
                         throw err;
                    });
                });

            });

        });


    });

});

module.exports = router;