import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../errors/bad-request-error.ts'
import { auth } from '../../middlewares/auth.ts'

export async function acceptInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/invites/:inviteId/accept',
      {
        schema: {
          tags: ['invites'],
          summary: 'Accept an invite',
          security: [{ bearerAuth: [] }],
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
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { inviteId } = request.params
        const userId = await request.getCurrentUserId()

        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found or expired.')
        }

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        if (invite.email !== user.email) {
          throw new BadRequestError('This invite belongs to another user.')
        }

        await prisma.$transaction([
          prisma.member.create({
            data: {
              userId,
              organizationId: invite.organizationId,
              role: invite.role,
            },
          }),

          prisma.invite.delete({
            where: {
              id: inviteId,
            },
          }),
        ])

        return reply.status(204).send()
      },
    )
}
