import { type FastifyInstance } from 'fastify'
import { BadRequestError } from './routes/errors/bad-request-error.ts'
import { UnauthorizedError } from './routes/errors/unauthorized-error.ts'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, _, reply) => {
  if (error.code === 'FST_ERR_VALIDATION') {
    const errors = error.validation?.map((v) => {
      return {
        path: v.instancePath,
        message: v.message,
      }
    })

    return reply.status(400).send({
      message: 'Validation error',
      errors,
    })
  }

  if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
    console.log(error)
    const errors = error.validation?.map((v) => {
      return {
        path: v.instancePath,
        message: v.message,
      }
    })

    return reply.status(400).send({
      message: 'Validation error',
      errors,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  console.error(error)

  return reply.status(500).send({ message: 'Internal server error.' })
}
