---
next: ../reference/api.md
---

# Lifecycle hooks

***Hooks*** are triggered by specific events throughout trilogy's lifecycle that
you can tap into in order to fire off your own actions. There are both pre- and
post-event hooks for object creation, updates, and removals, as well as an
`onQuery` hook that's called on each SQL query.

::: tip
It's important to be aware of the fact that methods such as `increment`,
`decrement`, and `set` will not trigger update hooks because they only
modify a _property_ and not a record as a whole. The hook would
therefore not be useful since you could not reliably identify records.
:::

These hooks can all be attached to a `Trilogy` instance or scoped more
specifically to a particular `Model`. You could for example add a `beforeUpdate`
hook to a model that sets the [`updated_at` timestamp](advanced-model-options.md#timestamps)
whenever an object is updated:

```js
import { connect } from 'trilogy'

const db = connect('./storage.db')

;(async () => {
  const users = await db.model('users', {
    name: String
  }, {
    timestamps: true
  })

  users.beforeUpdate(item => {
    item.updated_at = new Date()
  })

  await users.create({ name: 'mr. robot' })
})()
```

## preventing events

In the case of the `before*` hooks, it's also possible to cancel the upcoming
event from any subscriber to that hook. For example, in a `beforeCreate` hook:

```ts
import { connect, EventCancellation } from 'trilogy'

const db = connect(':memory:')

db.model('users', {
  name: String,
  isAdmin: Boolean
}).then(users => {
  const unsub = users.beforeCreate(user => {
    if (user.isAdmin && user.name !== 'boss') {
      // boss is the only admin allowed apparently
      return EventCancellation
    }
  })
})
```

## available hooks

* [onQuery](../reference/api.md#onquery-hook)
* [beforeCreate](../reference/api.md#beforecreate-hook)
* [afterCreate](../reference/api.md#aftercreate-hook)
* [beforeUpdate](../reference/api.md#beforeupdate-hook)
* [afterUpdate](../reference/api.md#afterupdate-hook)
* [beforeRemove](../reference/api.md#beforeremove-hook)
* [afterRemove](../reference/api.md#afterremove-hook)
