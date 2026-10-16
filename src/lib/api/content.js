// apps/website/urls.py -> /api/v1/content/ (SiteContentViewSet)
// One endpoint backs every editable marketing-site section — GET is public
// (filtered to published items for anonymous callers), writes require ERP
// staff. See gcs_erp/apps/website/models.py SiteContent for why this is a
// single flexible model instead of one per section.
import { createResource } from './resource';
import { apiClient } from './client';

const base = createResource('content');

// Gallery photos and blog covers are uploaded as files, so those writes go
// out as multipart instead of JSON. `extra` is a JSONField, which a
// multipart body can only carry as text — the backend parses it back.
function toFormData(payload) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'extra' && typeof value === 'object') {
      form.append(key, JSON.stringify(value));
    } else if (value instanceof File || value instanceof Blob) {
      form.append(key, value);
    } else {
      form.append(key, value);
    }
  });
  return form;
}

// Letting axios set the multipart boundary itself is deliberate: naming
// Content-Type by hand omits the boundary and the upload fails to parse.
const MULTIPART = { headers: { 'Content-Type': undefined } };

export const siteContent = {
  ...base,
  // page_size=200: this is editorial content (tens of items per section at
  // most), not a paginated data table — every consumer wants the full set.
  bySection: (section, params) => base.list({ section, page_size: 200, ...params }),

  createWithImage: (payload) => apiClient.post('content/', toFormData(payload), MULTIPART),
  updateWithImage: (id, payload) => apiClient.patch(`content/${id}/`, toFormData(payload), MULTIPART),
};

export const CONTENT_SECTIONS = [
  { value: 'partner', label: 'Partner Colleges & Training Associations' },
  { value: 'recognition', label: 'Official Recognitions & Certifications' },
  { value: 'about', label: 'About Gnana Computech Solutions' },
  { value: 'owner', label: 'Owners / Leadership' },
  { value: 'impact_stat', label: 'Our Impact in Numbers' },
  { value: 'event', label: 'Events & Workshops' },
  { value: 'service', label: 'Technology Services' },
  { value: 'internship', label: 'Internships' },
  { value: 'testimonial', label: 'Student & Partner Stories' },
  { value: 'gallery', label: 'Gallery Photos' },
  { value: 'blog', label: 'Blog Posts' },
];

// Categories the public Gallery page filters by — kept here so the staff
// upload form offers exactly the ones the page can show.
export const GALLERY_CATEGORIES = [
  'Workshops', 'Training', 'Events', 'Internships', 'Student Activities', 'Seminars',
];

export const BLOG_CATEGORIES = [
  'Academic Advice', 'Career & Tech', 'Internship Guide', 'Student Success', 'Technology',
];
