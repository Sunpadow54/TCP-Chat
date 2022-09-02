const readLine = require('readline')
const net = require('net')
const util = require('util')

const DEFAULT_PORT = 8080

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
    terminal: true,
})

const colors = {
    warning : '\x1b[1;31m%s\x1b[0m',
    auth: '\x1b[1;37;44m%s\x1b[0m\xa0',
    userMsg: '\x1b[%s\x1b[36m%s\xa0\x1b[0m%s',
    myMsg: '\x1b[%s\x1b[32m%s\xa0\x1b[0m',
    info: '\x1b[36m%s\x1b[0m',
    highlight: '\x1b[1;33m%s\x1b[36m',
    date: '\x1b[90m%s\xa0\x1b[0m',
}

const ASK_USERNAME = 'Enter a Username:'
const ASK_PASSWORD = 'Enter the Password:'


// ------------------- Functions -------------------

const colorMsg = (data, color) => {
    if (Array.isArray(data)) {
        return util.format(colors[color], ...data)
    }
    return util.format(colors[color], data)
}

const hidePassword = (password) => {
    // Move Cursor to start of password printed.
    const x = ASK_PASSWORD.length + 1
    readLine.moveCursor(process.stdout, x, -1)
    // Replace * instead of the password.
    let result = ''
    for (const char of password) {
        result += '*'
    }
    console.log(result)
    // Remove readline history.
    rl.history = rl.history.slice(1)
}

const getDate = () => {
    const now = new Date()
    return colorMsg(`[${now.toLocaleTimeString('fr-FR')}]`, 'date')
}

const getResponse = (question) => {
    return new Promise((resolve) => {
        let type = question.split(' ').slice(-1)
        type = type.toString().replace(':', '.')

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
    const username = await getResponse(colorMsg(ASK_USERNAME, 'auth'))
    const password = await getResponse(colorMsg(ASK_PASSWORD, 'auth'))

    hidePassword(password)

    return new Promise((resolve) => {
        // Create Socket
        const socket = net.connect({
            port: DEFAULT_PORT
        })
        
        socket.on('connect', () => {
            socket.write(`LOGIN/username=${username}&password=${password}`)
        })

        socket.once('data', data => {
            const user = colorMsg(username, 'highlight')

            if (data.toString() === 'success') {
                console.log(colorMsg(`>>>> Welcome ${user} !`, 'info'))
                socket.write(colorMsg(`>>>> ${user} join the chat !`, 'info'))

                resolve([socket, username])
            }
            if (data.toString() === 'Unauthorized') {
                console.log(colorMsg(data.toString(), 'warning'))
                socket.destroy()
                rl.close()
            }
        })

    })
}

// ------------------- Chat -------------------

login()
    .then(res => {
        const [socket, username] = res

        let isTyping = false

        // ---- Read line
        rl.on('line', data => {
            if (data === '/quit') {
                const user = colorMsg(username, 'highlight')
                socket.write(colorMsg(`<<<< ${user} has left the chat.`, 'info'))
                socket.setTimeout(1000)
            }
            if (data === '/users') {
                socket.write('/users')
            }
            else {
                // Send to server
                const user = `<${username}>`
                socket.write(colorMsg([getDate(), user, data], 'userMsg'))
                // clear line and rewrite the formatted data
                readLine.moveCursor(process.stdout, 0, -1)
                console.log(getDate() + data)
            }
        })

        // ---- Socket
        socket.on('data', data => {
            if (isTyping) {
                let keepText = rl.line
                rl.write(null, {ctrl: true, name: 'u'})
                console.log(data.toString())
                rl.write(keepText)
            } else {
                console.log(colorMsg(data.toString(), 'info'))    
            }
                
        })

        socket.on('timeout', () => {
            socket.write('/QUIT')
            rl.close()
            socket.destroy()
        })

        process.stdin.on('keypress', (str, key) => {
            isTyping = true
            if (key.name === 'return') {
                isTyping = false
            }
        })
    })
