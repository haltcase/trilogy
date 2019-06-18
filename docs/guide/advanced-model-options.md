# Advanced model options

## Complex indexing

When creating a model, the property descriptor can contain an `index` attribute
to specify that particular property as an index. If you need to define a more
complex index, such as on multiple properties, you can provide the `index` field
in the `options` object instead.

Let's use this as our model's schema for all the following examples:

```ts
const schema = {
  brand: String,
  color: String,
  price: Number
}
```

`options.index` accepts a variety of index definitions:

### single property index

This is equivalent to specifying the index in the property descriptor,
except the index name is automatically generated.

```ts
db.model('shoes', schema, { index: 'brand' })
```

### multiple property index

Create a single index on all the specified properties.

```ts
db.model('shoes', schema, { index: ['brand', 'color']})
```

### multiple indices on multiple properties

Create an index for each set of properties.

```ts
db.model('shoes', schema, {
  index: [
    ['brand', 'color'],
    ['color', 'price']
  ]
})
```

### named indices

All other forms will automatically generate a unique index name of
the format `index_property1[_property2[_property3...]]`. If you want the
index to have a specific custom name, use an object instead.

```ts
db.model('shoes', schema, {
  index: {
    idx_brand: 'brand',
    idx_brand_color: ['brand', 'color'],
    idx_color_price: ['color', 'price']
  }
})
```

## Primary and unique fields

When you use the `primary` or `unique` attributes on an individual property,
the primary key or unique index consists only of that property.

```ts
db.model('cars', {
  make: { type: String, primary: true },
  model: String
})
```

However there are many cases where you want the primary key to consist of
_multiple_ properties. For example let's assume we now want `make` and `model`
to be a _composite primary key_, meaning both fields are needed to uniquely
identify an object in the model. To do this in trilogy, remove the `primary`
or `unique` attributes from the individual properties and instead declare
them in the `ModelOptions`:

```diff
  db.model('cars', {
-   make: { type: String, primary: true },
+   make: String,
    model: String
- })
+ }, {
+   primary: ['make', 'model']
+ })
```

Now, the combination of both fields is checked for uniqueness when objects
are created in this model. The same applies to `unique`, but here these
fields are each individually declared as _unique constraints_, not as a
composite key.

```ts
db.model('cars', {
  make: String,
  model: String
}, {
  unique: ['make', 'model']
})
```

## Timestamps

Rather than defining your own properties for creation or updated dates, you can
use the `timestamps` option to define these on your model. When `timestamps`
is `true`, `created_at` and `updated_at` properties are defined, with both
defaulting to the current time.

```ts
db.model('users', {
  name: { type: String, primary: true }
}, {
  timestamps: true
})
```

Note that for the `updated_at` timestamp to automatically update when you
make changes, a primary key or unique constraint is required on your model
so trilogy can uniquely identify the updated record(s). If the model above
had been defined like this:

```ts
db.model('users', {
  name: String
}, {
  timestamps: true
})
```

... then there's no way for trilogy to uniquely identify updated records.
In that case you can use trilogy's **lifecycle hooks** to keep the timestamp
up to date yourself, which will be covered in the next section.
