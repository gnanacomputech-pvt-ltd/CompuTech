import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../api/client';

// Every ERP master-data tab (Institutions, Programs, Batches, Employees,
// Projects, Assessments, ...) needs the same three things: fetch a list,
// track loading/error, and a way to refetch after a create/update/delete.
// One hook instead of retyping that per tab — the actual create/update/
// delete calls still happen in the component, since their payload shapes
// and confirmation messages differ per entity.
export function useCrudResource(resource, params) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Avoids reload() identity changing every render when callers pass an
  // inline {} — only the serialized contents matter for refetch triggers.
  const paramsKey = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await resource.list({ page_size: 100, ...(params || {}) });
      setItems(data.results);
      setTotal(data.count);
    } catch (err) {
      setError(err instanceof ApiError && typeof err.message === 'string' ? err.message : 'Could not load data.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, paramsKey]);

  useEffect(() => { load(); }, [load]);

  return { items, total, loading, error, load, setItems };
}
