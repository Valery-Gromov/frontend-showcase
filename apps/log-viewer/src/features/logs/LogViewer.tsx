import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRequestSequence } from '@frontend-showcase/hooks';
import { Badge, Button, Select, Skeleton } from '@frontend-showcase/ui';
import { ThemeToggle } from '../../app/ThemeToggle';
import { fetchLogs } from './api/logApi';
import type { FetchLogsResult, LogEntry, LogLevelFilter } from './model/types';
import styles from './LogViewer.module.css';

const PAGE_SIZE = 200;
const FOLLOW_THRESHOLD_PX = 96;

const levelOptions = [
  { value: 'all', label: 'All levels' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARN', label: 'WARN' },
  { value: 'ERROR', label: 'ERROR' },
];

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function mergeLogs(current: LogEntry[], next: LogEntry[]): LogEntry[] {
  if (next.length === 0) return current;
  const byId = new Map(current.map((log) => [log.id, log]));
  for (const log of next) byId.set(log.id, log);
  return Array.from(byId.values()).sort((a, b) => a.sequence - b.sequence);
}

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < FOLLOW_THRESHOLD_PX;
}

function DetailPanel({ pinned }: { pinned: LogEntry | null }) {
  if (!pinned) {
    return (
      <aside className={styles.detailsPane} aria-label="Pinned log details">
        <h2 className={styles.detailsTitle}>No log pinned</h2>
        <p className={styles.muted}>Click a row to pin it here while the live stream continues.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.detailsPane} aria-label="Pinned log details">
      <div>
        <h2 className={styles.detailsTitle}>Pinned log</h2>
        <Badge variant={pinned.level === 'ERROR' ? 'danger' : pinned.level === 'WARN' ? 'warning' : 'info'}>
          {pinned.level}
        </Badge>
      </div>
      <dl className={styles.detailList}>
        <div>
          <dt>Timestamp</dt>
          <dd>{new Date(pinned.timestamp).toISOString()}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{pinned.service}</dd>
        </div>
        <div>
          <dt>Trace</dt>
          <dd>{pinned.traceId}</dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{pinned.message}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function LogViewer() {
  const { next } = useRequestSequence();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const levelRef = useRef<LogLevelFilter>('all');
  const [level, setLevel] = useState<LogLevelFilter>('all');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [serverHighWatermark, setServerHighWatermark] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'refreshing' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  const pinned = useMemo(
    () => logs.find((log) => log.id === pinnedId) ?? null,
    [logs, pinnedId],
  );

  const commitResult = useCallback((result: FetchLogsResult, reset: boolean) => {
    setLogs((current) => (reset ? result.items : mergeLogs(current, result.items)));
    cursorRef.current = result.nextCursor;
    setCursor(result.nextCursor);
    setServerHighWatermark(result.serverHighWatermark);
  }, []);

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      const token = next();
      setLoadState(reset ? 'loading' : 'refreshing');
      setError(null);

      try {
        const result = await fetchLogs({
          cursor: reset ? null : cursorRef.current,
          limit: PAGE_SIZE,
          level: levelRef.current,
        });
        if (!token.isLatest) return;
        commitResult(result, reset);
        setLoadState('success');
      } catch (loadError) {
        if (!token.isLatest) return;
        setError(loadError instanceof Error ? loadError.message : 'Logs could not be loaded.');
        setLoadState('error');
      } finally {
        if (token.isLatest) loadingRef.current = false;
      }
    },
    [commitResult, next],
  );

  useEffect(() => {
    levelRef.current = level;
    cursorRef.current = null;
    loadingRef.current = false;
    setLogs([]);
    setCursor(null);
    setPinnedId(null);
    setIsFollowing(true);
    void loadPage(true);
  }, [level, loadPage]);

  useEffect(() => {
    if (!isFollowing || loadState === 'loading') return;
    const timer = window.setInterval(() => {
      void loadPage(false);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [isFollowing, loadPage, loadState]);

  useEffect(() => {
    if (!isFollowing || logs.length === 0) return;
    virtualizer.scrollToIndex(logs.length - 1, { align: 'end' });
  }, [isFollowing, logs.length, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const loadedCount = logs.length;
  const latestSequence = logs[logs.length - 1]?.sequence ?? 0;
  const lag = Math.max(0, serverHighWatermark - latestSequence);
  const statusLabel = isFollowing ? 'Live tail' : 'Paused on scroll';

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Log Viewer</p>
          <h1 className={styles.title}>Virtualized event stream</h1>
          <p className={styles.subtitle}>
            Cursor pagination, constant-size DOM rendering, level filtering, live tail, pause on
            scroll-up, and click-to-pin details over the shared SDK/mock-network transport.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className={styles.toolbar} aria-label="Log controls">
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Level</span>
          <Select
            value={level}
            options={levelOptions}
            onValueChange={(value) => setLevel(value as LogLevelFilter)}
          />
        </label>
        <Button variant="secondary" loading={loadState === 'refreshing'} onClick={() => loadPage(false)}>
          Fetch newer
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setIsFollowing(true);
            void loadPage(false);
            if (logs.length > 0) virtualizer.scrollToIndex(logs.length - 1, { align: 'end' });
          }}
        >
          Jump to now
        </Button>
        <div className={styles.statusStrip} aria-live="polite">
          <Badge variant={isFollowing ? 'success' : 'warning'}>{statusLabel}</Badge>
          <span className={styles.muted}>{loadedCount.toLocaleString()} loaded</span>
          <span className={styles.muted}>{lag.toLocaleString()} behind</span>
          {error ? <span className={styles.error}>{error}</span> : null}
        </div>
      </section>

      <section className={styles.viewerGrid}>
        <div className={styles.logPane}>
          <div
            ref={parentRef}
            className={styles.scrollArea}
            onScroll={(event) => {
              setIsFollowing(isNearBottom(event.currentTarget));
            }}
          >
            {loadState === 'loading' ? (
              <div className={styles.emptyState}>
                <Skeleton variant="rectangle" width="100%" height={180} />
              </div>
            ) : null}

            {loadState === 'error' && logs.length === 0 ? (
              <div className={styles.emptyState}>
                <div>
                  <p className={styles.error}>{error}</p>
                  <Button variant="secondary" onClick={() => loadPage(true)}>Retry</Button>
                </div>
              </div>
            ) : null}

            {loadState !== 'loading' && logs.length === 0 ? (
              <div className={styles.emptyState}>No logs match this filter.</div>
            ) : null}

            {logs.length > 0 ? (
              <div className={styles.virtualCanvas} style={{ height: virtualizer.getTotalSize() }}>
                {virtualItems.map((item) => {
                  const log = logs[item.index];
                  if (!log) return null;
                  return (
                    <button
                      key={log.id}
                      type="button"
                      className={styles.logRow}
                      data-pinned={pinnedId === log.id}
                      style={{ transform: `translateY(${item.start}px)` }}
                      onClick={() => setPinnedId(log.id)}
                    >
                      <span className={styles.timestamp}>{formatTime(log.timestamp)}</span>
                      <span className={styles.level} data-level={log.level}>{log.level}</span>
                      <span className={styles.service}>{log.service}</span>
                      <span className={styles.message}>{log.message}</span>
                      <span className={styles.trace}>{log.traceId}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!isFollowing && logs.length > 0 ? (
              <div className={styles.jumpButton}>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsFollowing(true);
                    void loadPage(false);
                    virtualizer.scrollToIndex(logs.length - 1, { align: 'end' });
                  }}
                >
                  Jump to now
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <DetailPanel pinned={pinned} />
      </section>
    </main>
  );
}
