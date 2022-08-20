import Fastify from 'fastify'
import formBodyPlugin from '@fastify/formbody'
import fs from 'fs'
import { exec } from 'child_process'
import { v4 as uuidv4 } from 'uuid';

const fastify = Fastify({
    logger: false
})
fastify.register(formBodyPlugin)
await fastify.register(import('@fastify/rate-limit'), {
    max: 10,
    timeWindow: '1 minute'
})

if (!fs.existsSync('cache')) {
    fs.mkdirSync('cache');
}

function clear(uuid) {
    fs.unlinkSync(`cache/${uuid}.xml`)
    fs.unlinkSync(`cache/${uuid}.xslt`)
    fs.unlinkSync(`cache/${uuid}.out`)
}

fastify.post('/transform', function (req, reply) {
    var uuid = uuidv4()
    if (!req.body.xml || !req.body.xslt) {
        reply.statusCode = 400
        reply.send('Missing XML or XSLT')
        return
    }
    fs.writeFile(`cache/${uuid}.xml`, req.body.xml, (err, file) => {
        fs.writeFile(`cache/${uuid}.xslt`, req.body.xslt, (err, file) => {
            if (err) {
                fs.unlinkSync(`cache/${uuid}.xml`)
                return;
            }
            exec(`npx xslt3 -s:"cache/${uuid}.xml" -xsl:"cache/${uuid}.xslt" -o:"cache/${uuid}.out"`, (error, stout, stderr) => {
                if (error) {
                    reply.status = 400
                    reply.send(error.message.split('\n').splice(3).join('\n').trim())
                    clear(uuid)
                    return;
                }
                fs.readFile(`cache/${uuid}.out`, 'utf8', (err, data) => {
                    reply.send(data)
                    clear(uuid)
                })

            })

        })
    })
})

fastify.listen({ port: 8080 }, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})