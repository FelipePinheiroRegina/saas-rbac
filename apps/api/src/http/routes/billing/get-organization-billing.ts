import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth.ts'
import z from 'zod'
import { getUserPermissions } from '../../../utils/get-user-permissions.ts'
import { UnauthorizedError } from '../errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'

export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:slug/billing',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get billing information from organization',
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
              billing: z.object({
                seats: z.object({
                  quantity: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                projects: z.object({
                  quantity: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                total: z.number(),
              }),
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

        if (cannot('get', 'Billing')) {
          throw new UnauthorizedError(
            `You're not allowed to get billing details from this organization`,
          )
        }

        const [quantityOfMembers, quantityOfProject] = await Promise.all([
          prisma.member.count({
            where: {
              organizationId: organization.id,
              role: { not: 'BILLING' },
            },
          }),

          prisma.project.count({
            where: {
              organizationId: organization.id,
            },
          }),
        ])

        return reply.status(200).send({
          billing: {
            seats: {
              quantity: quantityOfMembers,
              unit: 10,
              price: quantityOfMembers * 10,
            },
            projects: {
              quantity: quantityOfProject,
              unit: 20,
              price: quantityOfProject * 20,
            },

            total: quantityOfMembers * 10 + quantityOfProject * 20,
          },
        })
      },
    )
}
