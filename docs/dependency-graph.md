Dependency graph

Allowed:
- todo-app -> ui, hooks, sdk
- admin-app -> ui, hooks, sdk
- ui -> hooks
- hooks -> react
- sdk -> no internal workspace packages

Forbidden:
- app -> app
- sdk -> ui
- sdk -> hooks
- hooks -> ui
- ui -> app