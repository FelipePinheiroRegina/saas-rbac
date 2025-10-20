import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account.ts'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password.ts'
import fastifyJwt from '@fastify/jwt'
import { getProfile } from './routes/get-profile.ts'
import { errorHandler } from './error-handler.ts'
import { requestPasswordRecover } from './routes/auth/request-password-recover.ts'
import { resetPasswordRecover } from './routes/auth/reset-password.ts'
import { authenticateWithGithub } from './routes/auth/authenticate-with-github.ts'
import { env } from '@saas-rbac/env'
import { createOrganization } from './routes/organizations/create-organization.ts'
import { getMembership } from './routes/organizations/get-membership.ts'
import { getOrganization } from './routes/organizations/get-organization.ts'
import { getOrganizations } from './routes/organizations/get-organizations.ts'
import { updateOrganization } from './routes/organizations/update-organization.ts'
import { deleteOrganization } from './routes/organizations/delete-organization.ts'
import { updateOrganizationOwner } from './routes/organizations/update-organization-owner.ts'
import { createProject } from './routes/projects/create-project.ts'
import { deleteProject } from './routes/projects/delete-project.ts'
import { getProject } from './routes/projects/get-project.ts'
import { getProjects } from './routes/projects/get-projects.ts'
import { updateProject } from './routes/projects/update-project.ts'
import { getMembers } from './routes/members/get-member.ts'
import { updateMember } from './routes/members/update-member.ts'
import { removeMember } from './routes/members/remove-member.ts'
import { createInvite } from './routes/invites/create-invite.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SaaS with RBAC',
      description: 'Full-stack SaaS app with multi-tenant & RBAC.',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

// AUTH
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(authenticateWithGithub)
app.register(requestPasswordRecover)
app.register(resetPasswordRecover)

// ROOT
app.register(getProfile)

// ORGANIZATIONS
app.register(createOrganization)
app.register(getMembership)
app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(deleteOrganization)
app.register(updateOrganizationOwner)

// PROJECTS
app.register(createProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)
app.register(updateProject)

// MEMBERS
app.register(getMembers)
app.register(updateMember)
app.register(removeMember)

// INVITES
app.register(createInvite)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log('server running on: ', env.SERVER_PORT)
})
