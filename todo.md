Поднять монорепу (pnpm workspaces), базовые конфиги, алиасы.

Сделать sdk/httpClient + typedStorage — ими будут пользоваться все.

Сделать ui/theme (CSS variables + provider) — и сразу Button/Input.

Подключить hooks и начать Todo-app (чтобы требования рождались из использования).

Довести UI компоненты до набора из списка.

Admin-app: Table demo, pagination hook, feature flags.

Отполировать README/Docs



Как я бы советовал выбирать уровень сложности

Есть три уровня.

Уровень 1 — разумный старт

Подходит тебе сейчас.

Содержит:
	•	pnpm-workspace.yaml - сделал
	•	root package.json - сделал
	•	root tsconfig.base.json - сделал
	•	отдельный package.json + tsconfig.json у каждого app/package - сделал пока для одного
	•	workspace зависимости между пакетами 
	•	алиасы внутри apps
	•	без project references на старте

Это уже хороший production-like фундамент.

⸻

Уровень 2 — крепкий showcase

Добавляешь:
	•	project references
	•	отдельный config package
	•	общие lint rules
	•	unified typecheck/build scripts

⸻

Уровень 3 — overengineering
	•	turborepo/nx без реальной необходимости
	•	слишком сложный shared infra слой
	•	абстракции ради абстракций
	•	десятки алиасов
	•	слишком ранняя автоматизация всего

Для твоего showcase это не нужно.


