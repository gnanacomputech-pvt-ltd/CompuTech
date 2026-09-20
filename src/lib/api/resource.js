import { apiClient } from './client';

// Every ModelViewSet on this backend (core/academics/finance) shares the
// same DRF router conventions and the same StandardResultsSetPagination
// shape (apps/common/pagination.py): { count, total_pages, current_page,
// next, previous, results }. One factory covers all of them instead of
// hand-writing the same five methods per resource.
export function createResource(basePath) {
  const path = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return {
    list: (params) => apiClient.get(path, { params }),
    get: (id) => apiClient.get(`${path}${id}/`),
    create: (payload) => apiClient.post(path, payload),
    update: (id, payload) => apiClient.patch(`${path}${id}/`, payload),
    replace: (id, payload) => apiClient.put(`${path}${id}/`, payload),
    remove: (id) => apiClient.delete(`${path}${id}/`),
  };
}
