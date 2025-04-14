import Fastify from 'fastify'

const server = Fastify({
    logger:false
})

server.get('/game', async (req, res) => {
    return "It's a game service!";
})

const start = async () => {
    try {
        await server.listen({ port: 3001 })
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();