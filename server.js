const net = require('net')
const server = net.createServer()

const DEFAULT_PORT = 8080
let users = []


// ------------- Functions
const broadcast = (msg, clientSender) => {
    users.forEach(client => {
        if (client !== clientSender) {
            client.write(msg);
        }
    })
}

// Show Number of connected users
const showMessage = (action) => {
    console.log(`A client has ${action} the chat.`)
    console.log('Users connected:', users.length)
}


// ------------- Server Error
server.on('error', err => console.error(err.stack))

// ------------- Server Connection
server.on('connection', (client) => {
    // Check username and password ?
    users.push(client)

    showMessage('join')

    // ---- Data recieve
    client.on('data', data => {
        // data sent
        broadcast(data, client)
    })

    // ---- Close client
    client.on('end', () => {
        // Remove client from users array
        const clientIndex = users.indexOf(client)
        users.splice(clientIndex, 1)

        // Close socket
        client.end()

        showMessage('left')
    })
    
})

// ------------- Listen to port
server.listen(DEFAULT_PORT, () => {
	console.log('Server listening on port %s', DEFAULT_PORT)
})

