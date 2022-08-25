const readLine = require('readline')
const net = require('net')

const DEFAULT_PORT = 8080

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
})

// ------------- Functions
const waitUsername = new Promise((resolve) => {
        rl.question('Entrer a username: ', (answer) => {
            if (answer !== '') resolve(answer)
            else {
                console.log('\x1b[31m%s\x1b[0m','Your must enter a Username')
                rl.close()
            }
        })
})

// ---------------

waitUsername
    .then(username => {
        const socket = net.connect({
            port: DEFAULT_PORT
        })
        
        // ---- Connection
        socket.on('connect', () => {
            console.log('\x1b[36m%s\x1b[0m', `Welcome ${username} !`)
            socket.write(`${username} joined the chat.`)
        })

        // ---- Read line
        rl.on('line', data => {
            if (data === '/quit') {
                socket.write(`${username} has left the chat.`);
                socket.end()
            }
            else {
                socket.write(username + ': ' + data)
            }
        })
        
        // ---- handle msg recieved from server
        socket.on('data', data => {
            console.log('\x1b[32m%s\x1b[0m', data);
        })
        
        // ---- Disconnection
        socket.on('end', () => {
            console.log('\x1b[36m%s\x1b[0m', 'Disconnected');
            rl.close()
        })

        // ---- Errors
        socket.on('error', (err) => {
            console.log('error server: ', err);
        })
        
    })
