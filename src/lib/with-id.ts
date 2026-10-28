/** An API document: Mongo's `_id`, and `id` once a response has been mapped. */
export type ApiDoc<T extends { id?: string }> = Omit<T, 'id'> & {
  _id?: string;
  id?: string;
};

/** Expose a document's `_id` as `id`, which is what the app's types use. */
export function withId<T extends { id?: string }>(doc: ApiDoc<T>): T {
  return { ...doc, id: doc._id ?? doc.id } as T;
}
