import Fastify from 'fastify'
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path from 'path';

const server = Fastify({
    logger: true
})

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load openapi.yaml
const openapiSpec = YAML.load(path.join(__dirname, '../openapi/openapi.yaml'));

// Register @fastify/swagger first
await server.register(swagger, {
    mode: 'static',
    specification: {
        document: openapiSpec,
    },
});

// Register @fastify/swagger-ui next
await server.register(swaggerUi, {
    routePrefix: '/openapi',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

// Declare a route
server.get('/ping', async (req, res) => {
    return { pong: true };
})

// Run the server
const start = async () => {
    try {
        await server.listen({
            port: 3002,
          //  host: '0.0.0.0', => when deploying to a Docker !
            listenTextResolver: (address) => { return `Server is listening on ${address}`}
        })
            .then((address) => { server.log.info(`Docs available at ${address}/openapi`)});
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start();