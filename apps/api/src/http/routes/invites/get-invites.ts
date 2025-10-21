import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth.ts'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { getUserPermissions } from '../../../utils/get-user-permissions.ts'
import { UnauthorizedError } from '../errors/unauthorized-error.ts'
import { roleSchema } from '@saas-rbac/auth'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:slug/invites',
      {
        schema: {
          tags: ['invites'],
          summary: 'Get all organization invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
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
              invites: z.array(
                z.object({
                  id: z.uuid(),
                  createdAt: z.date(),
                  role: roleSchema,
                  email: z.email(),
                  author: z
                    .object({
                      name: z.string().nullable(),
                      id: z.uuid(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Invite')) {
          throw new UnauthorizedError(
            `You're not allowed to get organization invites.`,
          )
        }

        const invites = await prisma.invite.findMany({
          where: {
            organizationId: organization.id,
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
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.send({ invites })
      },
    )
}
