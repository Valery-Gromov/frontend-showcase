# Dependency graph

## Allowed imports

```mermaid
graph TD
  subgraph apps
    catalog["product-catalog-admin"]
    dataHub["data-hub"]
    todo["todo-app"]
    logViewer["log-viewer"]
  end

  subgraph packages
    ui["ui"]
    hooks["hooks"]
    sdk["sdk"]
    mockNetwork["mock-network"]
  end

  catalog --> ui
  catalog --> hooks
  catalog --> sdk
  catalog -. dev only .-> mockNetwork

  dataHub --> ui
  dataHub --> hooks
  dataHub --> sdk
  dataHub -. dev only .-> mockNetwork

  todo --> ui
  todo --> sdk

  logViewer --> ui
  logViewer --> hooks
  logViewer --> sdk
  logViewer -. dev only .-> mockNetwork

  ui --> hooks
  hooks --> react["react"]
```

## Rules

- Apps may import workspace packages; apps must not import other apps.
- `sdk` must not import React, `ui`, `hooks`, or app code.
- `hooks` may depend on React but must not depend on `ui`, `sdk`, or app code.
- `ui` may use hooks, but it must not know about apps or the SDK.
- `mock-network` is dev/demo transport and is injected into SDK clients from apps.
