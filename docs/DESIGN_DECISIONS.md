# Design Decisions

## Naming

### Components

The [Vue recommendation](https://vuejs.org/guide/components/registration.html#component-name-casing) is `PascalCase` due to how JavaScript imports work (can't have hyphens). They also recommend `<PascalCase />` for the actual html tags as well, even though you _can_ use `<kebab-case />` for them without changing the import or file names at all (automatic stuff from vue).

Using default recommendation.

### Composables

The [recommended naming practice](https://vuejs.org/guide/reusability/composables.html#naming) is `kebab-case` for files, and `camelCase` for the `useThing` function.

Composables are useful for access to things like vue refs for state, and access to lifecycle hooks such as `onMounted`. If your function(s) do not require state or lifecycle hooks, prefer the simpler utility functions method instead (see `src/utils/color-utils.ts` -> `autoContrastTextColor` for an example of what this means).

Using default recommendation.

### Page Names

For the pages, we decided to model each based on a presentation layer, and use filters/setting toggles for manipulating the data (e.g. show a specific list of tasks, or layer zero, etc).

Inline with that decision, we renamed `/tasks` to `/list` to match how the other pages already are named according to the type of presentation layer they are. e.g. `/calendar`, `/tree`, `/graph`, etc. All pages deal with tasks, so calling it Tasks is redundant.

### Utility Functions

It seems the standard practice (according to ChatGPT anyway) for stateless utility functions is to chuck them into `src/utils/something-utils.ts` with `kebab-case`.

Anything that requires state and/or lifecycle hooks should be a `composable` instead.

Seems reasonable, and much better than `src/hackerman`. Struggling to find any official documentation on this though.

## Task Filtering

We need a way to allow for dynamic and modular filtering of tasks to account for mixing and matching different filtering and sorting algorithms.

For example, filtering by task, or sorting by priority, etc.

This should allow for pluggin in separately:
- Filtering
- Sorting

It should also allow combining sorting options, by using lower ranked sorting options as the tiebreaker for higher sorting options.

Similar to Airtable

Preset filters:
Inbox
Today
Upcoming
Agenda
By list

Preset sorting:
- By datetime
- By priority
- By task name
