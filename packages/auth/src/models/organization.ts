import z from 'zod'

// It is not necessary to store properties in the schema if they are not part of authorization conditions
export const organizationSchema = z.object({
  __typename: z.literal('Organization').default('Organization'),
  id: z.string(),
  ownerId: z.string(),
})

export type Organization = z.infer<typeof organizationSchema>
