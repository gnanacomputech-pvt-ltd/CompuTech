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
    image: item.image_url || EVENT_ICON_FALLBACK_IMG,
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
    avatar: item.image_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(item.title || 'GCS'),
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
    image: item.image_url || '',
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
    image: item.image_url || '',
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
