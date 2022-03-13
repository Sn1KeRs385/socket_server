const express = require('express');
const axios = require('axios');
const app = express();
const http = require('http').createServer(app)
const io = require('socket.io')(http, {cors: {origin: '*'}});
const jsonParser = express.json();

let clients = []

io.on('connection', (socket) => {
    const token = socket?.handshake?.query?.Authorization || '';
    axios.get('http://localhost:8000/api/v1/users/me', {headers: {'Authorization': token}})
        .then(res => {
            clients.push({
                userId: res.data.data.user.id,
                socket
            })

            socket.on('disconnect', () => {
                clients = clients.filter(client => client.socket.id !== socket.id)
                console.log(`Client with id ${socket.id} disconnected`)
                // clients.splice(clients.indexOf(socket.id), 1)
            })

            console.log(`Client with id ${socket.id} connected`)
        })
        .catch(error => {
            socket.disconnect()
        })
})

app.post("/socket/send-data", jsonParser, function (req, res) {
    if (!req.body || Object.keys(req.body).length === 0) return res.sendStatus(400);

    const userIds = req.body?.user_ids;
    const event = req.body?.event;
    const data = req.body?.data;

    if (!userIds || userIds.length === 0 || !event) return res.sendStatus(400);

    clients.filter(({userId}) => userIds.includes(userId))
        .forEach(({socket}) => {
            socket.emit(
                event,
                data
            )
        });
    res.sendStatus(204);
});

http.listen(3000, function () {
    console.log("Сервер ожидает подключения...");
});
