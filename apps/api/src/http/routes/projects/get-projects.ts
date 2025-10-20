import { type FastifyInstance } from 'fastify'
import { type ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth.ts'
import z from 'zod'
import { getUserPermissions } from '../../../utils/get-user-permissions.ts'
import { UnauthorizedError } from '../errors/unauthorized-error.ts'
import { prisma } from '../../../lib/prisma.ts'

export async function getProjects(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:orgSlug/projects',
      {
        schema: {
          tags: ['projects'],
          summary: 'Get details from project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
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
              projects: z.array(
                z
                  .object({
                    name: z.string(),
                    id: z.uuid(),
                    slug: z.string(),
                    avatarUrl: z.string().nullable(),
                    ownerId: z.uuid(),
                    organizationId: z.uuid(),
                    description: z.string(),
                    owner: z.object({
                      name: z.string().nullable(),
                      id: z.uuid(),
                      avatarUrl: z.string().nullable(),
                    }),
                  })
                  .nullable(),
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { orgSlug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Project')) {
          throw new UnauthorizedError(
            `You're not allowed to see projects this organization.`,
          )
        }

        const projects = await prisma.project.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            ownerId: true,
            avatarUrl: true,
            organizationId: true,
            createdAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: { organizationId: organization.id },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.status(200).send({ projects })
      },
    )
}
