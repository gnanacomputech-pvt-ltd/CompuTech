// apps/website/urls.py -> /api/v1/content/ (SiteContentViewSet)
// One endpoint backs every editable marketing-site section — GET is public
// (filtered to published items for anonymous callers), writes require ERP
// staff. See gcs_erp/apps/website/models.py SiteContent for why this is a
// single flexible model instead of one per section.
import { createResource } from './resource';

const base = createResource('content');

export const siteContent = {
  ...base,
  // page_size=200: this is editorial content (tens of items per section at
  // most), not a paginated data table — every consumer wants the full set.
  bySection: (section, params) => base.list({ section, page_size: 200, ...params }),
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
];
