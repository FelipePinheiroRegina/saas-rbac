import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { roleSchema } from '@saas-rbac/auth'
import { BadRequestError } from '../errors/bad-request-error.ts'

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['invites'],
        summary: 'Get an invite',
        params: z.object({
          inviteId: z.uuid(),
        }),
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
            invite: z.object({
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
          }),
        },
      },
    },
    async (request, reply) => {
      const { inviteId } = request.params
      const invite = await prisma.invite.findUnique({
        where: {
          id: inviteId,
        },
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
      })

      if (!invite) {
        throw new BadRequestError('Invite not found')
      }

      return reply.send({ invite })
    },
  )
}
