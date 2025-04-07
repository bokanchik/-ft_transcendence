import Fastify from 'fastify'

const fastify = Fastify({
    logger: true
})

// Declare a route
fastify.get('/', function (req, res) {
    res.send({hello: 'world'})
})

// Run the server
fastify.listen({ port: 3000, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`Server is listening on ${address}`);
})