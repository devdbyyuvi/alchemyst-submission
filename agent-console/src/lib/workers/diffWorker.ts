export type DiffResult = {
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  changed: Record<string, { old: unknown; new: unknown }>;
};

function computeDiff(oldData: unknown, newData: unknown): DiffResult {
  const result: DiffResult = { added: {}, removed: {}, changed: {} };

  if (typeof oldData !== 'object' || typeof newData !== 'object' || oldData === null || newData === null) {
    if (oldData !== newData) {
      result.changed['root'] = { old: oldData, new: newData };
    }
    return result;
  }

  const oldObj = oldData as Record<string, unknown>;
  const newObj = newData as Record<string, unknown>;
  const oldKeys = new Set(Object.keys(oldObj));
  const newKeys = new Set(Object.keys(newObj));

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      result.added[key] = newObj[key];
    } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      result.changed[key] = { old: oldObj[key], new: newObj[key] };
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      result.removed[key] = oldObj[key];
    }
  }

  return result;
}

self.onmessage = (event: MessageEvent) => {
  const { oldData, newData, contextId } = event.data;
  try {
    const diff = computeDiff(oldData, newData);
    self.postMessage({ type: 'DIFF_COMPLETE', contextId, diff, newData });
  } catch (error) {
    self.postMessage({ type: 'DIFF_ERROR', contextId, error: String(error) });
  }
};
