# `httpClient` design notes

Working notes from the original design exercise. The actual implementation lives in
[`client.ts`](client.ts), [`types.ts`](types.ts), and [`helpers.ts`](helpers.ts).

## Step 1: Problem

- One uniform way to make HTTP requests.
- One uniform error shape.
- One uniform timeout / retry policy.
- Eliminate boilerplate: `fetch` + `try/catch` + `JSON.parse`.

## Step 2: Boundaries

`httpClient` MUST:

- Perform the HTTP request.
- Normalize errors.
- Parse JSON.
- Honor a timeout.
- Optionally retry idempotent calls.

`httpClient` MUST NOT:

- Know about React.
- Know about UI.
- Know about a specific API surface (`/todos`, `/users`).
- Contain business logic.
- Cache responses.

## Step 3: API

Clients are built with `createHttpClient(config)`. The resulting client exposes:

- `httpClient.get(path, headers?)`
- `httpClient.post(path, body, headers?)`
- `httpClient.put(path, body, headers?)`
- `httpClient.patch(path, body, headers?)`
- `httpClient.delete(path, headers?)`

Configuration accepts:

- `baseUrl`
- `timeout`
- `fetch` (injectable)
- `retry` (idempotent methods only)
- `defaultHeaders`

### Example

```ts
const httpClient = createHttpClient({
  baseUrl: '/api',
  timeout: 5000,
});

const todos = await httpClient.get('/todos');
await httpClient.post('/todos', { title: 'Learn monorepo' });
```

## Step 4: Edge cases

- **Network errors**: DNS failure, offline, connection reset.
- **Timeout**: hung server, slow network.
- **HTTP errors**: 4xx, 5xx (5xx in the retry window can be retried for idempotent calls).
- **Parsing errors**: malformed JSON.

## Step 5: Return shape and error behavior

- On success the client returns the parsed JSON response.
- On timeout, network failure, HTTP error, or parse error the client throws a normalized
  `HttpClientError` that carries `code`, `status`, `method`, `url`, and a best-effort
  `responseBody`.

## Step 6: File layout

```
http/
  client.ts    main class + factory
  types.ts     interfaces, error codes, error class
  helpers.ts   AbortController helper, idempotency check, header merge, delay
```
