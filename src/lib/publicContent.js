// Central place the public marketing pages fetch live data from — either
// the Program model (Courses/Internships, apps/core/models.py) or the
// SiteContent CMS (everything else, apps/website/models.py). Centralized
// here so every page maps fields the same way instead of re-deriving it
// per component.
import { programs as programsApi } from './api/core';
import { siteContent } from './api/content';

export function toCourse(program) {
  const extra = program.extra || {};
  return {
    id: program.id,
    title: program.title,
    category: extra.category || 'General',
    level: extra.level || '',
    mode: extra.mode || '',
    duration: `${program.duration_weeks} week${program.duration_weeks === 1 ? '' : 's'}`,
    shortDesc: program.description,
    fullDesc: program.description,
    topics: Array.isArray(extra.topics) ? extra.topics : [],
    highlights: Array.isArray(extra.highlights) ? extra.highlights : [],
  };
}

export function toInternship(program) {
  const extra = program.extra || {};
  return {
    id: program.id,
    title: program.title,
    domain: extra.domain || 'General',
    mode: extra.mode || '',
    stipend: extra.stipend || '',
    duration: `${program.duration_weeks} week${program.duration_weeks === 1 ? '' : 's'}`,
    shortDesc: program.description,
    skills: Array.isArray(extra.skills) ? extra.skills : [],
    learnings: Array.isArray(extra.learnings) ? extra.learnings : [],
    eligibility: extra.eligibility || '',
  };
}

export async function fetchCourses() {
  const data = await programsApi.list({ program_type: 'COURSE', page_size: 100 });
  return (data.results || []).map(toCourse);
}

export async function fetchInternships() {
  const data = await programsApi.list({ program_type: 'INTERNSHIP', page_size: 100 });
  return (data.results || []).map(toInternship);
}

export function toService(item) {
  const extra = item.extra || {};
  return {
    id: item.id,
    title: item.title,
    shortDesc: item.description,
    fullDesc: item.description,
    iconName: extra.iconName || 'Code',
    features: Array.isArray(extra.features) ? extra.features : [],
    technologies: Array.isArray(extra.technologies) ? extra.technologies : [],
  };
}

export async function fetchServices() {
  const data = await siteContent.bySection('service');
  return (data.results || []).map(toService);
}

const EVENT_ICON_FALLBACK_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

export function toEvent(item) {
  const extra = item.extra || {};
  const now = new Date();
  const start = item.event_start ? new Date(item.event_start) : null;
  const status = start && start < now ? 'previous' : 'upcoming';
  return {
    id: item.id,
    title: item.title,
    image: item.image_src || item.image_url || EVENT_ICON_FALLBACK_IMG,
    status,
    category: extra.category || 'Workshop',
    date: start ? start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA',
    time: start ? start.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    shortDesc: item.description,
    fullDesc: item.description,
    location: item.location || 'Sunkadakatte, Bangalore',
    seatsAvailable: extra.seatsAvailable || '',
    agenda: Array.isArray(extra.agenda) ? extra.agenda : null,
  };
}

export async function fetchEvents() {
  const data = await siteContent.bySection('event');
  return (data.results || []).map(toEvent);
}

export function toTestimonial(item) {
  const extra = item.extra || {};
  return {
    id: item.id,
    name: item.title,
    role: item.subtitle || '',
    college: item.location || '',
    testimonial: item.description,
    avatar: item.image_src || item.image_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(item.title || 'GCS'),
    rating: Number(extra.rating) || 5,
  };
}

export async function fetchTestimonials() {
  const data = await siteContent.bySection('testimonial');
  return (data.results || []).map(toTestimonial);
}

export function toPartner(item) {
  const extra = item.extra || {};
  return {
    id: item.id,
    name: item.title,
    type: item.subtitle || '',
    location: item.location || '',
    description: item.description,
    studentsImpacted: extra.studentsImpacted || '',
    tag: extra.tag || '',
    image: item.image_src || item.image_url || '',
  };
}

export async function fetchPartners() {
  const data = await siteContent.bySection('partner');
  return (data.results || []).map(toPartner);
}

export function toRecognition(item) {
  const extra = item.extra || {};
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || '',
    description: item.description,
    badge: extra.badge || '',
    icon: extra.icon || '🏆',
    image: item.image_src || item.image_url || '',
  };
}

export async function fetchRecognitions() {
  const data = await siteContent.bySection('recognition');
  return (data.results || []).map(toRecognition);
}

const IMPACT_ICON_ROTATION = ['Users', 'GraduationCap', 'Building2'];

export function toImpactStat(item, index) {
  return {
    id: item.id,
    number: item.title,
    label: item.subtitle || '',
    sub: item.description || '',
    iconName: IMPACT_ICON_ROTATION[index % IMPACT_ICON_ROTATION.length],
  };
}

export async function fetchImpactStats() {
  const data = await siteContent.bySection('impact_stat');
  return (data.results || []).map(toImpactStat);
}


// ---------------------------------------------------------------------------
// Gallery & Blog
// ---------------------------------------------------------------------------
// Both used to be hardcoded arrays in src/data/, which is why a photo added
// in the dashboard never appeared on the site. They are SiteContent sections
// now, so a staff edit shows up on the public page on the next load. The
// original content is seeded by the seed_site_gallery_blog management
// command.
//
// `event_start` carries "the date this item is about" for every dated
// section — an event's start time, a gallery photo's date, a post's publish
// date — rather than each one inventing its own column.

const GALLERY_FALLBACK_IMG = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80';

export function toGalleryItem(item) {
  const extra = item.extra || {};
  const date = item.event_start ? new Date(item.event_start) : null;
  return {
    id: item.id,
    title: item.title,
    category: extra.category || 'Gallery',
    date: date ? date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '',
    image: item.image_src || item.image_url || GALLERY_FALLBACK_IMG,
    description: item.description || '',
  };
}

export async function fetchGallery() {
  const data = await siteContent.bySection('gallery', { ordering: '-event_start' });
  return (data.results || []).map(toGalleryItem);
}

const BLOG_FALLBACK_IMG = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80';

export function toBlog(item) {
  const extra = item.extra || {};
  const date = item.event_start ? new Date(item.event_start) : new Date(item.created_at);
  return {
    id: item.id,
    title: item.title,
    category: extra.category || 'Technology',
    date: date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
    author: item.subtitle || 'Gnana Computech Team',
    readTime: extra.readTime || `${estimateReadMinutes(extra.content || item.description)} min read`,
    image: item.image_src || item.image_url || BLOG_FALLBACK_IMG,
    shortDesc: item.description || '',
    // The body lives in `extra.content`; `description` is the card summary.
    // Falling back to the summary keeps a post readable if someone saves one
    // without a body rather than rendering an empty article.
    content: extra.content || item.description || '',
  };
}

// 200 words a minute, rounded up, so a post always claims at least 1 minute.
function estimateReadMinutes(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function fetchBlogs() {
  const data = await siteContent.bySection('blog', { ordering: '-event_start' });
  return (data.results || []).map(toBlog);
}

export async function fetchBlog(id) {
  const item = await siteContent.get(id);
  return toBlog(item);
}

// ---------------------------------------------------------------------------
// About section
// ---------------------------------------------------------------------------

export function toAbout(item) {
  const extra = item.extra || {};
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle || '',
    description: item.description || '',
    image: item.image_src || item.image_url || '',
    highlights: Array.isArray(extra.highlights) ? extra.highlights : [],
  };
}

export async function fetchAbout() {
  const data = await siteContent.bySection('about');
  return (data.results || []).map(toAbout);
}
