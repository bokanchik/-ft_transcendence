import Fastify from 'fastify'

const server = Fastify({
    logger:true
})

// Register the route for user login
// server.post('/auth/login', async (request, reply) => {
//     const { username, password } = request.body;
  
//     if (!username || !password) {
//       return reply.status(400).send({ message: 'Username and password are required' });
//     }
// });

const start = async () => {
    try {
        await server.listen({
            port: 3003,
            host: '0.0.0.0', // => when deploying to a Docker !
        })
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();