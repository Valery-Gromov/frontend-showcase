Шаг 1: Проблема

- Единый способ делать HTTP-запросы
- Единый формат обработки ошибок
- Единый timeout / retry
- Убрать повторяющийся код: fetch + try/catch + JSON.parse

Шаг 2: Границы

httpClient:
✔ делает HTTP-запрос
✔ обрабатывает ошибки
✔ парсит JSON
✔ поддерживает timeout
✔ может делать retry

httpClient не должен:
❌ знать про React
❌ знать про UI
❌ знать про конкретный API (/todos, /users)
❌ содержать бизнес-логику
❌ делать caching

Шаг 3: API

httpClient создаётся через createHttpClient(config), который принимает базовую конфигурацию клиента.

После создания клиент предоставляет методы:

- httpClient.get(path, options)
- httpClient.post(path, data, options)
- httpClient.delete(path, options)

Конфигурация клиента может включать:

- baseUrl
- timeout
- default headers

Шаг 3.5: Пример использования

const httpClient = createHttpClient({
baseUrl: "/api",
timeout: 5000,
})

const todos = await httpClient.get("/todos")

await httpClient.post("/todos", {
title: "Learn monorepo",
})

Шаг 4: Edge cases

Network errors

- DNS fail
- offline
- connection reset

Timeout

- сервер завис
- slow network

HTTP errors

- 4xx
- 5xx

Parsing errors

- JSON parse error

Шаг 4.5: Что возвращает клиент / поведение при ошибке

- По умолчанию клиент возвращает распарсенный JSON-ответ
- Если произошёл timeout, network error, HTTP error или ошибка парсинга — клиент выбрасывает нормализованную ошибку

Шаг 5: Структура

httpClient
    client
    types
    helpers
