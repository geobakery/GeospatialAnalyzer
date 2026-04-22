# Topics - API Call

In this document we will describe important and good-to-know facts about the topics service.

## Functionality

Show all topics along with their metadata: `identifiers`, `title`, `description`, the list of supported operations (`supports`), available `attributes`, and if present `valueMetadata` and `attribution`.

## Examples

Get-call http://localhost:3000/v1/topics

## Optional topic metadata

Topics may carry two optional blocks that appear in the `/topics` response when configured in `topic.json`:

- `valueMetadata` — unit and vertical datum for topic values. Topic-wide defaults at the top with per-source overrides in an optional `sources[]`. Shape: `{ unit?, verticalDatum?, sources?: [{ sourceName, unit?, verticalDatum? }] }`. See [valuesAtPoint.md](./valuesAtPoint.md#value-metadata-in-responses).
- `attribution` — list of data providers for the dataset(s). Each entry has optional `name` and `url`. For multi-source topics the response is the de-duplicated union of what each source contributes (with topic-level fallback for sources that have no own attribution). Omitted entirely when nothing is configured. Source-specific attribution is available on feature responses via `__attribution`.

  ```json
  [
    { "name": "GeoSN", "url": "https://example.org/dataset-dgm" },
    { "name": "GeoSN", "url": "https://example.org/dataset-dom" }
  ]
  ```

### Configuration in `topic.json`

- Topic-level: add `__attribution__: [{ name?, url? }, ...]` on the topic.
- Per-source: add `attribution: [{ name?, url? }, ...]` on a `__source__` or any entry of `__multipleSources__`. A source-level list fully replaces the topic-level list for that source.
