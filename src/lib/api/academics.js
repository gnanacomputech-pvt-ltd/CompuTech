// apps/academics/urls.py, mounted under /api/v1/academics/
import { createResource } from './resource';

export const projects = createResource('academics/projects');
export const internships = createResource('academics/internships');
export const sessions = createResource('academics/sessions');
export const attendance = createResource('academics/attendance');
export const assignments = createResource('academics/assignments');
export const submissions = createResource('academics/submissions');
export const assessments = createResource('academics/assessments');
export const marks = createResource('academics/marks');
export const mentorAllocations = createResource('academics/mentor-allocations');
export const progress = createResource('academics/progress');
