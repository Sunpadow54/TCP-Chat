const readLine = require('readline')
const net = require('net')
const util = require('util')

const DEFAULT_PORT = 8080

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const colors = {
    warning : '\x1b[1;31m%s\x1b[0m',
    auth: '\x1b[1;37;44m%s\x1b[0m\xa0',
    userMsg: '\x1b[2;30m%s\xa0\x1b[36m%s\xa0\x1b[0m%s',
    myMsg: '\x1b[2;32m%s\xa0\xa0\x1b[32m',
    info: '\x1b[36m%s\x1b[0m',
    highlight: '\x1b[1;33m%s\x1b[36m'
}


// ------------------- Functions -------------------

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
    const username = await rlQuestions(colorMsg('Enter a Username:', 'auth'))
    const password = await rlQuestions(colorMsg('Enter the Password:', 'auth'))

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
                socket.end()
                rl.close()
            }
        })

    })
}

// ------------------- Connect -------------------

login()
    .then(res => {
        const [socket, username] = res

        
        // ---- Read line
        rl.on('line', data => {
            if (data === '/quit') {
                socket.write(colorMsg(`>>>> ${username} has left the chat.`, 'info'))
                socket.setTimeout(1000)
            }
            else {
                const user = `<${username}>`
                socket.write(colorMsg([getDate(), user, data], 'userMsg'))
            }
        })
        
        // ---- Socket
        socket.on('data', data => {
                console.log(data.toString())
        })

        socket.on('timeout', () => {
            socket.write('/QUIT')
            rl.close()
            socket.destroy()
        });
    })