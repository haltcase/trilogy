# contributor guide

## before contributing

### code of conduct

Contributions of all kinds are welcome - this project aims to be
inclusive and open. Please read the [Code of Conduct](code_of_conduct.md)
before making any contributions.

### check current status

Try to search the [issue tracker](https://github.com/citycide/trilogy/issues)
before opening a new one - it's possible your issue has already been noted,
fixed, or otherwise handled.

## code style

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

When making changes, do your best to match the existing code style.
This project uses [`standard`](https://github.com/standard/standard).
The most common rules are [listed here](https://github.com/standard/standard#the-rules).

## pull requests

1. Fork the project on GitHub
2. Clone the project locally ( `git clone https://github.com/{YOUR_USERNAME}/{PROJECT_NAME}.git` )
3. Create a new branch with a relevant name ( `git checkout -b feat-make-better` )
4. Run `npm install` to get any necessary dependencies
5. Make your changes and run `npm run build`
6. Run `npm test` to make sure all tests continue to pass, and it never hurts to have more tests
7. Push your changes ( `git push` )
8. Go to your fork on GitHub to submit a [pull request](https://help.github.com/articles/using-pull-requests/) :tada:

### notes

* New features aren't guaranteed to be merged - it'll be up to you and the
  community to make a convincing case
* It's generally expected that new features come with tests and documentation,
  so do your best to add both of those with your pull request

## issues

You should always include as much information as possible about the problem -
help maintainers and contributors help you back:

* relevant error messages ( including stack traces )
* any uncommon or "abnormal" environment configurations
* link to a [minimal reproducible][mcve] case, ie. a GitHub repo
  ( this is the fastest way to a solution! )

### labels

This set of labels is used in the project and will be added by
project maintainers:

| name                      | description                                               |
| ------------------------- | --------------------------------------------------------- |
| breaking                  | Breaking changes will occur as part of closing the issue. |
| discussion                | [RFC] Fixes, APIs, or changes need feedback.              |
| duplicate                 | An earlier issue already exists on the topic.             |
| external                  | Issues with dependencies or otherwise unsolvable within the project itself. |
| good first issue          | Probably good for a user's first contribution.            |
| hacktoberfest             | Open season for contributions!                            |
| help wanted               | Extra attention is needed.                                |
| invalid                   | Issue doesn't apply or is working as intended.            |
| meta                      | Relates to the repo or project structure.                 |
| question                  | Not a true issue, usually a question relating to usage.   |
| status: accepted          | Change is accepted and is open to community PRs.          |
| status: declined          | The change is not currently under consideration.          |
| status: in progress       | Work has started to close the issue.                      |
| status: investigating     | Resolutions are being considered or researched.           |
| status: need response     | Waiting for more information from the issue author.       |
| status: pending release   | Issue is resolved but waiting to be released.             |
| type: bug                 | Something isn't working as intended or expected.          |
| type: build               | Affects the build system or dependencies.                 |
| type: chore               | General maintenance or upkeep.                            |
| type: ci                  | Relates to CI maintenance.                                |
| type: documentation       | Applies only to project documentation.                    |
| type: feature             | Request for a new feature or enhancement.                 |
| type: performance         | Opportunity for performance improvements.                 |
| type: refactor            | Improvements with no change in functionality.             |
| type: test                | Concerns the quality or quantity of tests.                |

#### type labels

For the most part, the `type` labels correspond to the commit types
from the [Angular commit guidelines][angular] used here, though not
all of them are represented. So if an issue is labeled with
`type: performance`, it'll probably be closed by a commit like
`perf(someMethod): optimize some particular method`.

#### status labels

A `status` label is a progress indicator on an issue - whether it's
being worked on, waiting for release, being investigated, etc.

An issue marked with `status: accepted` is one that's been given the
green light but isn't being worked on - so a pull request would be
welcome and accepted.

On the other hand, one marked with `status: declined` is a change
that isn't desired or one that might be revisited in the future.

#### tag labels

Most labels without a prefix like `status: ` or `type: ` are general
tags that can be applied to any issue, commonly combined with a `type`
or `status` such as `type: feature` + `breaking`, `type: bug` +
`good first PR`, or `status: in progress` + `discussion`.

Some tag labels are just indicators that won't be used with status or
type labels. `invalid` is usually used alone to indicate that an issue
isn't an actual issue with the project. `meta` is generally used for
issues relating to the repository itself on GitHub, for example
relating to this contributor guide.

[angular]: https://github.com/angular/angular.js/blob/7f2accaa3aed18e811338c9593fb363808c2b40d/CONTRIBUTING.md#type
[mcve]: https://stackoverflow.com/help/mcve
