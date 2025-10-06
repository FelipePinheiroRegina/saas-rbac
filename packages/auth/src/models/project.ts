import z from 'zod'

// It is not necessary to store properties in the schema if they are not part of authorization conditions
export const projectSchema = z.object({
  __typename: z.literal('Project').default('Project'),
  id: z.string(),
  ownerId: z.string(),
})

export type Project = z.infer<typeof projectSchema>
