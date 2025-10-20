import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth.ts'
import z from 'zod'
import { prisma } from '../../../lib/prisma.ts'
import { BadRequestError } from '../errors/bad-request-error.ts'
import { organizationSchema } from '@saas-rbac/auth'
import { UnauthorizedError } from '../errors/unauthorized-error.ts'
import { getUserPermissions } from '../../../utils/get-user-permissions.ts'

export async function updateOrganizationOwner(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organization/:slug/owner',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Update organization owner',
          security: [{ bearerAuth: [] }],
          body: z.object({
            newOwnerId: z.uuid(),
          }),
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
        const { newOwnerId } = request.body

        const { cannot } = getUserPermissions(userId, membership.role)

        const authOrganization = organizationSchema.parse(organization)

        if (cannot('transfer_ownership', authOrganization)) {
          throw new UnauthorizedError(
            `You're not allowed to update owner this organization`,
          )
        }

        const transferToMembership = await prisma.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: newOwnerId,
            },
          },
        })

        if (!transferToMembership) {
          throw new BadRequestError(
            'This user is not a member of this organization',
          )
        }

        await prisma.$transaction([
          prisma.member.update({
            where: {
              organizationId_userId: {
                organizationId: organization.id,
                userId: newOwnerId,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),

          prisma.organization.update({
            where: { id: organization.id },
            data: {
              ownerId: newOwnerId,
            },
          }),
        ])

        return reply.status(204).send()
      },
    )
}
