import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth.ts'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { organizationSchema } from '@saas-rbac/auth'
import { UnauthorizedError } from '../errors/unauthorized-error.ts'
import { getUserPermissions } from '../../../utils/get-user-permissions.ts'

export async function deleteOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organization/:slug',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Update organization details',
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
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        const authOrganization = organizationSchema.parse(organization)

        if (cannot('delete', authOrganization)) {
          throw new UnauthorizedError(
            `You're not allowed to delete this organization`,
          )
        }

        await prisma.organization.delete({
          where: { id: organization.id },
        })

        return reply.status(204).send()
      },
    )
}
