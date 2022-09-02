const net = require('net')
const server = net.createServer()

const DEFAULT_PORT = 8080
const PASSWORD = 'pass' // need to be secured
let users = []

const AUTH_USER_REGEX = /^LOGIN\/username=(?<name>.+)&password=(?<pwd>.+)$/
const CMD_QUIT_REGEX = /^\/QUIT$/

// ------------------- Functions -------------------

const sendError = (socket, msg) => {
    socket.write(msg)
    socket.end()
}

const isUniqueUsername = (string) => {
    const result = users.some(user => user.username === string)
    return !result
}

const quitChat = (socket) => {
    // Remove client from users array
    const clientIndex = users.indexOf(socket)
    console.log('clientIndex', clientIndex)
    users.splice(clientIndex, 1)
    // End client
    socket.end()
}

const broadcast = (msg, clientSender) => {
    users.forEach(client => {
        if (client !== clientSender) {
            client.write(msg)
        }
    })
}

const authUser = (client) => {
    client.once('data', (authData) => {
        if (!AUTH_USER_REGEX.test(authData)) {
            return sendError(client, 'Unauthorized')
        }

        const [wholeMatch, username, password] = AUTH_USER_REGEX.exec(authData)

        if (!isUniqueUsername(username)) {
            return sendError(client, 'Unauthorized')
        }

        if (password !== PASSWORD) {
            return sendError(client, 'Unauthorized')
        }

        // Success !
        client.write('success')

        // - Add User to Chat.
        client.username = username
        users.push(client)
        logMessage('join')

        return
    })
}

// Show Number of connected users
const logMessage = (action) => {
    console.log(`A client has ${action} the chat.`)
    console.log('Users connected:', users.length)
}


// ------------------- Server -------------------

// ------------- Server Error
server.on('error', err => console.error(err.stack))

// ------------- Server Connection
server.on('connection', (client) => {
    // ---- Check username and password
    authUser(client)

    // ---- Data recieved
    client.on('data', data => {
        if (users.indexOf(client) !== -1 && !AUTH_USER_REGEX.test(data)) {
            // If request is to quit the chat
            if (CMD_QUIT_REGEX.test(data)) {
                quitChat(client)
            }
            else {
                broadcast(data, client)
            }
        }
    })

    client.on('end', () => {
        logMessage('left')
    })
})

// ------------- Listen to port
server.listen(DEFAULT_PORT, () => {
	console.log('Server listening on port %s', DEFAULT_PORT)
})
