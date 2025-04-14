import Fastify from 'fastify'

const server = Fastify({
    logger:true
})

server.get('/', async (req, res) => {
    return "It's a user service!";
})

const start = async () => {
    try {
        await server.listen({
            port: 3002,
            host: '0.0.0.0',// => when deploying to a Docker !
        })
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();