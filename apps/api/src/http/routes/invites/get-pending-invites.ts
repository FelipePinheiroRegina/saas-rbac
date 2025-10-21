import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../errors/bad-request-error.ts'
import { auth } from '../../middlewares/auth.ts'
import { roleSchema } from '@saas-rbac/auth'

export async function getPendingInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/invites/pending',
      {
        schema: {
          tags: ['invites'],
          summary: 'Get all user pending invites',
          security: [{ bearerAuth: [] }],
          response: {
            400: z.object({
              message: z.string(),
              errors: z
                .array(
                  z.object({
                    path: z.string(),
                    message: z.string(),
                  }),
                )
                .nullish(),
            }),
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.uuid(),
                  email: z.string(),
                  role: roleSchema,
                  createdAt: z.date(),
                  author: z
                    .object({
                      id: z.uuid(),
                      name: z.string().nullable(),
                      avatarUrl: z.url().nullable(),
                    })
                    .nullable(),
                  organization: z.object({
                    name: z.string(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        const invites = await prisma.invite.findMany({
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
          where: {
            email: user.email,
          },
        })

        if (!invites) {
          throw new BadRequestError('Invites not found or expired.')
        }

        return reply.status(200).send({ invites })
      },
    )
}
