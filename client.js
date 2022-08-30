const readLine = require('readline')
const net = require('net')

const DEFAULT_PORT = 8080
const color = {
    red : '\x1b[31m%s\x1b[0m',
    green: '\x1b[32m%s\x1b[0m',
    cyan: '\x1b[36m%s\x1b[0m',
    yellow: '\x1b[33m%s\x1b[0m',
    bgCyan : '\x1b[46m'
}

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
})

// ------------- Functions
const rlQuestions = (question) => {
    return new Promise((resolve) => {
        const type = question.split(' ').pop()
        rl.question(question + ': ', (answer) => {
            if (answer !== '') resolve(answer)
            else {
                console.log(color.red,'Your must enter a ' + type)
                rl.close()
            }
        })
    })
}

const login = async () => {
    let authData = []

    const username = await rlQuestions('Enter a Username')
    const password = await rlQuestions('Enter the Password')

    authData.push(username, password)

    return Promise.resolve(authData)
}

// ---------------

login()
    .then((authData) => {
        const [username, password] = authData

        if (username && password) {
            const socket = net.connect({
                port: DEFAULT_PORT
            })

            socket.on('connect', () => {
                socket.write(`LOGIN/username=${username}&password=${password}`)
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
                console.log(color.cyan, data)
            })

            // ---- Disconnection
            socket.on('end', () => {
                console.log(color.cyan, 'Disconnected')
                rl.close()
            })

            // ---- Errors
            socket.on('error', (err) => {
                console.log('error server: ', err)
            })
        }
    })
