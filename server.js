const net = require('net')
const util = require('util')
const server = net.createServer()

const DEFAULT_PORT = 8080
let users = []

const AUTH_USER_REGEX = /^LOGIN\/username=(?<name>.+)&password=(?<pwd>.+)$/

const colors = {
    warning : '\x1b[1;31m%s\x1b[0m',
    chat: '\x1b[1;33m%s\x1b[36m'
}

// ------------- Functions
const colorMsg = (data, color) => {
    if (Array.isArray(data)) {
        return util.format(colors[color], ...data)
    }
    return util.format(colors[color], data)
}

const sendError = (socket, msg) => {
    socket.write(colorMsg(msg, 'warning'))
    socket.end()
}

const isUniqueUsername = (string) => {
    const result = users.some(user => user.username === string)
    return !result
}

const quitChat = (socket) => {
    // Remove client from users array
    const clientIndex = users.indexOf(client)
    users.splice(clientIndex, 1)
    // Print server msg
    logMessage('left')
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

        if (password !== 'pass') {
            return sendError(client, 'Unauthorized')
        }

        // Success ! 
        // - Add User to Chat.
        client.username = username
        users.push(client)
        logMessage('join')

        // - Send Msg to the Chat
        const user = colorMsg(username, 'chat')
        broadcast(`>>>> ${user} join the chat !`, client)
        client.write(`>>>> Welcome ${user} !`)

        return
    })
}

// Show Number of connected users
const logMessage = (action) => {
    console.log(`A client has ${action} the chat.`)
    console.log('Users connected:', users.length)
}


// ------------- Server Error
server.on('error', err => console.error(err.stack))

// ------------- Server Connection
server.on('connection', (client) => {
    // ---- Check username and password
    authUser(client)

    // ---- Data recieve
    client.on('data', data => {
        // If request is to quit the chat
        if (users.indexOf(client) !== -1) {
            if (data === '/quit') {
                quitChat(client)
            }
            // If the data recieve is not a Login request
            if (!AUTH_USER_REGEX.test(data)) {
                broadcast(data, client)
            }
        }
    })
})

// ------------- Listen to port
server.listen(DEFAULT_PORT, () => {
	console.log('Server listening on port %s', DEFAULT_PORT)
})
