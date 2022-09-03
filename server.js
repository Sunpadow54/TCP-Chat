const net = require('net')
const server = net.createServer()

const DEFAULT_PORT = 8080
const PASSWORD = 'pass' // need to be secured
let users = []

const AUTH_USER_REGEX = /^LOGIN\/username=(?<name>.+)&password=(?<pwd>.+)$/
const COMMAND_REGEX = /^\/([a-z]+)\s?(\S+)?\s?(.+)?$/


// ------------------- Functions -------------------

const sendError = (socket, msg) => {
    socket.write(msg)
    socket.end()
}

const logMessage = (action) => {
    console.log(`A client has ${action} the chat.`)
    console.log('Users connected:', users.length)
}

// ---- Auth
const isUniqueUsername = (string) => {
    const result = users.some(user => user.username === string)
    return !result
}

const authUser = (client) => {
    client.once('data', (authData) => {
        if (!AUTH_USER_REGEX.test(authData)) {
            return sendError(client, 'Unauthorized')
        }

        const [username, password] = AUTH_USER_REGEX.exec(authData).slice(1)

        if (!isUniqueUsername(username)) {
            return sendError(client, 'Unauthorized')
        }

        if (password !== PASSWORD) {
            return sendError(client, 'Unauthorized')
        }

        // Success !
        client.write('success')

        // - Add User to Chat.
        client.username = username.replace(/\s/g, '-')
        users.push(client)
        logMessage('join')

        return
    })
}

// ---- Commands
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

const getUsers = (clientSender) => {
    if (users.length === 1) return clientSender.write('>>>> You are currently alone in the chat ...')

    let str = `>>>> There is ${users.length} people in the chat !\r\n\r>>>> `
    users.forEach(user => {
        if (user !== clientSender) {
            str += `[${user.username}] `
        }
    })

    return clientSender.write(str)
}

const sendPrivateMsg = (addressee, msg, clientSender) => {
    const user = users.find(user => user.username === addressee)
    if (!user) return clientSender.write('This user is not in the chat.')
    user.write(msg)
    return
}

const handleUserCmd = (command, clientSender) => {
    const [cmd, user, msg]  = command.toString().match(COMMAND_REGEX).slice(1)

    switch (cmd) {
        case 'quit':
            quitChat(clientSender)
            break
        case 'users':
            getUsers(clientSender)
            break
        case 'msg':
            sendPrivateMsg(user, msg, clientSender)
            break
        default:
            clientSender.write('Unknown command')
            break
    }
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
            // If request is a command
            if (COMMAND_REGEX.exec(data)) {
                handleUserCmd(data, client)
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
