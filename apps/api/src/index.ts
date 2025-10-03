import { defineAbilityFor } from '@saas-rbac/auth'

const ability = defineAbilityFor({ role: 'ADMIN' })

const userCanInviteSomeoneElse = ability.can('invite', 'User')

console.log(userCanInviteSomeoneElse)
