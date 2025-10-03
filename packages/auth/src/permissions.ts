import { AbilityBuilder } from '@casl/ability'
import { type AppAbility } from './index.ts'
import type { User } from './models/user.ts'
import type { Role } from './roles.ts'

type PermissionsByRole = (
  user: User,
  builder: AbilityBuilder<AppAbility>,
) => void

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_, { can }) {
    can('manage', 'all')
  },
  MEMBER(_, { can }) {
    can('create', 'Project')
  },
  BILLING() {},
}
