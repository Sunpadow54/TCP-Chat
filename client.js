const readLine = require('readline')
const net = require('net')
const util = require('util')

const DEFAULT_PORT = 8080

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const colors = {
    warning : '\x1b[31m',
    auth: '\x1b[1;37;44m%s\x1b[0m\xa0',
    userMsg: '\x1b[2;30m%s\xa0\x1b[36m%s\xa0\x1b[0m%s',
    myMsg: '\x1b[2;32m%s\xa0\xa0\x1b[32m',
    info: '\x1b[36m%s\x1b[0m',
}


// ------------- Functions

const getDate = () => {
    const now = new Date()
    return `[${now.toLocaleTimeString('fr-FR')}]`
}

const colorMsg = (data, color) => {
    if (Array.isArray(data)) {
        return util.format(colors[color], ...data)
    }
    return util.format(colors[color], data)
}

const rlQuestions = (question) => {
    return new Promise((resolve) => {
        const type = question.split(' ').pop()
        
        rl.question(question, (answer) => {
            if (answer !== '') resolve(answer)
            else {
                console.log(colors.warning,'Your must enter a ' + type)
                rl.close()
            }
        })
    })
}

const login = async () => {
    let authData = []

    const username = await rlQuestions(colorMsg('Enter a Username:', 'auth'))
    const password = await rlQuestions(colorMsg('Enter the Password:', 'auth'))

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
                    socket.write(colorMsg(`${username} has left the chat.`, 'info'))
                    socket.end()
                }
                else {
                    const user = `<${username}>`
                    socket.write(colorMsg([getDate(), user, data], 'userMsg'))
                }
            })
            
            
            // ---- handle msg recieved from server
            socket.on('data', data => {
                console.log(colors.info, data)
            })

            // ---- Disconnection
            socket.on('end', () => {
                console.log(colors.info, 'Disconnected')
                rl.close()
            })

            // ---- Errors
            socket.on('error', (err) => {
                console.log('error server: ', err)
            })
        }
    })
