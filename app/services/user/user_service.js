import Fastify from 'fastify'

const server = Fastify({
    logger:true
})

// !!dans le dossier "/routes" folder server.register(routes) par exemple
server.get('/', async (req, res) => {
    return "It's a user service!";
})

server.get('/profile', async (req, res) => {
    return { user: "Sasha" };
});

const start = async () => {
    try {
        await server.listen({
            port: 3002,
            host: '0.0.0.0', // => when deploying to a Docker !
        })
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();