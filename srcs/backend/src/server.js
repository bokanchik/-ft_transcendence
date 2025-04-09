import Fastify from 'fastify'
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path from 'path';

const fastify = Fastify({
    logger: true
})

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load openapi.yaml
const openapiSpec = YAML.load(path.join(__dirname, '../../../openapi/openapi.yaml'));

// Register @fastify/swagger first
await fastify.register(swagger, {
    mode: 'static',
    specification: {
        document: openapiSpec,
    },
});

// Register @fastify/swagger-ui next
await fastify.register(swaggerUi, {
    routePrefix: '/openapi',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

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
    fastify.log.info(`Docs available at ${address}/openapi`);
})