
//! TODO make a custom fuse constructor that bakes this
// Fuse search options
export const fuseOptions = {
  isCaseSensitive: false,
  ignoreLocation: true,
  threshold: 0.29, // Lower = stricter matching (0 = exact, 1 = match anything)
  keys: ['title']
}