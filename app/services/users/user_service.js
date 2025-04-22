import Fastify from 'fastify'

const server = Fastify({
    logger:true
})

// !!dans le dossier "/routes" folder server.register(routes) par exemple
server.get('/', async (req, res) => {
    res.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>User Profile</title>
        </head>
        <body>
          <h1>Welcome to the User Service</h1>
          <p>This is the profile creation page!</p>
        </body>
      </html>
    `);
})


// server.get('/profile', async (req, res) => {
//     return { user: "Sasha" };
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