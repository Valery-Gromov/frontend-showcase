import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Loader,
  Select,
  Skeleton,
  TextInput,
  Tooltip,
  type SelectOption,
} from '@frontend-showcase/ui';

type TodoStatus = 'todo' | 'done';
type FilterStatus = 'all' | TodoStatus;

interface TodoItem {
  id: string;
  title: string;
  status: TodoStatus;
}

const statusOptions: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Todo', value: 'todo' },
  { label: 'Done', value: 'done' },
];

export function App() {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', title: 'Buy milk', status: 'todo' },
    { id: '2', title: 'Write docs', status: 'done' },
    { id: '3', title: 'Test UI atoms', status: 'todo' },
  ]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(false);

  const filtered = useMemo(() => {
    return todos.filter((todo) => {
      const matchText = todo.title.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || todo.status === statusFilter;
      return matchText && matchStatus;
    });
  }, [todos, query, statusFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));
  const someVisibleSelected = filtered.some((t) => selectedIds.includes(t.id));

  const activeFilterChips = [
    query ? `Search: ${query}` : null,
    statusFilter !== 'all' ? `Status: ${statusFilter}` : null,
  ].filter(Boolean) as string[];

  const addTodo = () => {
    const title = draft.trim();
    if (!title) return;
    setBusy(true);
    setTimeout(() => {
      setTodos((prev) => [{ id: String(Date.now()), title, status: 'todo' }, ...prev]);
      setDraft('');
      setBusy(false);
    }, 300);
  };

  const toggleTodo = (id: string, checked: boolean) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, status: checked ? 'done' : 'todo' } : todo)));
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const ids = filtered.map((t) => t.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
      return;
    }
    const visibleIds = new Set(filtered.map((t) => t.id));
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  const markSelectedDone = () => {
    if (selectedIds.length === 0) return;
    setTodos((prev) => prev.map((todo) => (selectedIds.includes(todo.id) ? { ...todo, status: 'done' } : todo)));
  };

  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    setTodos((prev) => prev.filter((todo) => !selectedIds.includes(todo.id)));
    setSelectedIds([]);
  };

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <h1>Todo test app</h1>
          <Badge variant="info">{todos.length} total</Badge>
        </header>

        <section className="panel">
          <h2>Create</h2>
          <div className="row">
            <TextInput
              value={draft}
              onValueChange={setDraft}
              placeholder="New todo title"
              clearable
              pending={busy}
              helperText="Press Add to create todo"
            />
            <Button onClick={addTodo} loading={busy}>
              Add
            </Button>
          </div>
        </section>

        <section className="panel">
          <h2>Filters</h2>
          <div className="row">
            <TextInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search todos"
              clearable
              onClear={() => setQuery('')}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as FilterStatus)}
              options={statusOptions}
            />
            <Button variant="secondary" onClick={clearFilters}>
              Reset
            </Button>
            <Button variant="ghost" onClick={() => setShowInitialSkeleton((s) => !s)}>
              Toggle skeleton
            </Button>
          </div>
          {activeFilterChips.length > 0 ? (
            <div className="chips">
              {activeFilterChips.map((chip) => (
                <Chip key={chip} removable onRemove={clearFilters} compact>
                  {chip}
                </Chip>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="header-row">
            <h2>Todos</h2>
            <div className="row">
              <Badge variant="neutral">{filtered.length} visible</Badge>
              <Badge variant="warning">{selectedIds.length} selected</Badge>
            </div>
          </div>

          <div className="row">
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={!allVisibleSelected && someVisibleSelected}
              onCheckedChange={toggleSelectAllVisible}
              label="Select visible"
            />
            <Button variant="secondary" onClick={markSelectedDone} disabled={selectedIds.length === 0}>
              Bulk done
            </Button>
            <Button variant="danger" onClick={removeSelected} disabled={selectedIds.length === 0}>
              Bulk delete
            </Button>
            <Tooltip content="Simulate refetch action">
              <span>
                <IconButton
                  icon="⟳"
                  label="Refresh list"
                  onClick={() => {
                    setBusy(true);
                    setTimeout(() => setBusy(false), 350);
                  }}
                  loading={busy}
                />
              </span>
            </Tooltip>
          </div>

          {showInitialSkeleton ? (
            <div className="list">
              <Skeleton variant="table-row" />
              <Skeleton variant="table-row" />
              <Skeleton variant="table-row" />
            </div>
          ) : (
            <ul className="list">
              {filtered.map((todo) => {
                const checked = todo.status === 'done';
                const selected = selectedIds.includes(todo.id);
                return (
                  <li key={todo.id} className="item">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(next) => {
                        setSelectedIds((prev) =>
                          next ? Array.from(new Set([...prev, todo.id])) : prev.filter((id) => id !== todo.id),
                        );
                      }}
                    />
                    <Checkbox checked={checked} onCheckedChange={(next) => toggleTodo(todo.id, next)} />
                    <span className={checked ? 'done' : ''}>{todo.title}</span>
                    <Badge variant={checked ? 'success' : 'neutral'}>{checked ? 'Done' : 'Todo'}</Badge>
                    <Tooltip content={selected ? 'Remove from selection' : 'Add to selection'}>
                      <span>
                        <IconButton
                          icon={selected ? '−' : '+'}
                          label={selected ? 'Unselect row' : 'Select row'}
                          onClick={() =>
                            setSelectedIds((prev) =>
                              selected ? prev.filter((id) => id !== todo.id) : Array.from(new Set([...prev, todo.id])),
                            )
                          }
                        />
                      </span>
                    </Tooltip>
                  </li>
                );
              })}
              {filtered.length === 0 ? <li>No todos found.</li> : null}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Loader showcase</h2>
          <div className="row">
            <Loader variant="inline" size="sm" />
            <Loader variant="block" size="md" />
          </div>
        </section>
      </div>
    </div>
  );
}
