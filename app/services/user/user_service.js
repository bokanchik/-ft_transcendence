import Fastify from 'fastify'

const server = Fastify({
    logger:false
})

server.get('/user', async (req, res) => {
    return "It's a user service!";
})

const start = async () => {
    try {
        await server.listen({ port: 3002 })
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();