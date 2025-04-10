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
export default async function (server, opts) {
    server.get('/ping', async (req, reply) => {
      return { pong: true };
    });
  }

// Run the server
server.listen({ port: 3001, host: '0.0.0.0' }, function (err, address) {
    if (err) {
        server.log.error(err)
        process.exit(1)
    }
    server.log.info(`Server is listening on ${address}`);
    server.log.info(`Docs available at ${address}/openapi`);
})