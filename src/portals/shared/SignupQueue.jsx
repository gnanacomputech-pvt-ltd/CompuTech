import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, Clock, Mail, Phone, ShieldCheck, Filter } from 'lucide-react';
import {
  SectionCard, AsyncState, TableWrap, Badge, IconButton, ModalShell, Field,
  INPUT_CLASS, statusTone,
} from './ui';
import { signupRequests } from '../../lib/api/signup';
import { ASSIGNABLE_STAFF_ROLES } from '../../lib/api/core';
import { ApiError } from '../../lib/api/client';

// The accept/reject queue, shared by both dashboards: the staff dashboard
// reviews STUDENT requests, the admin dashboard reviews STAFF and
// INSTITUTION ones. Backed by /api/v1/signup-requests/ — approving is what
// creates the Student/Employee/Institution profile and lets the person sign
// in at all (gcs_erp/apps/core/signup.py).
//
// `kind` picks which queue this instance shows; the backend independently
// refuses a kind the signed-in user may not decide on, so this is a view
// filter, not the security boundary.
export const SignupQueue = ({
  kind,
  title,
  description,
  showToast,
  onDecided,
  // STAFF requests only: let the approver grant a different role than the
  // one the applicant asked for.
  allowRoleOverride = false,
  // Institutions a student can be attached to, for the approve dialog.
  institutions = [],
  allowInstitutionOverride = false,
}) => {
  const [status, setStatus] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // The approve/reject dialog: { request, action }
  const [dialog, setDialog] = useState(null);
  const [notes, setNotes] = useState('');
  const [roleOverride, setRoleOverride] = useState('');
  const [institutionOverride, setInstitutionOverride] = useState('');
  const [dialogError, setDialogError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await signupRequests.byKind(kind, { status, ordering: '-created_at' });
      setItems(data.results || []);
    } catch (err) {
      setError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not load signup requests.');
    } finally {
      setLoading(false);
    }
  }, [kind, status]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (request, action) => {
    setDialog({ request, action });
    setNotes('');
    setDialogError('');
    setRoleOverride(request.requested_role || '');
    setInstitutionOverride(request.institution || '');
  };

  const submitDecision = async () => {
    const { request, action } = dialog;
    setBusyId(request.id);
    setDialogError('');
    try {
      if (action === 'approve') {
        const payload = { review_notes: notes };
        if (allowRoleOverride && roleOverride) payload.role = roleOverride;
        if (allowInstitutionOverride && institutionOverride) payload.institution = institutionOverride;
        const result = await signupRequests.approve(request.id, payload);
        showToast(result?._message || `${request.full_name} can now sign in.`);
      } else {
        const result = await signupRequests.reject(request.id, { review_notes: notes });
        showToast(result?._message || `Request from ${request.full_name} was rejected.`, 'info');
      }
      setDialog(null);
      load();
      if (onDecided) onDecided();
    } catch (err) {
      setDialogError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not save this decision.');
    } finally {
      setBusyId(null);
    }
  };

  const isStudentQueue = kind === 'STUDENT';
  const isStaffQueue = kind === 'STAFF';

  const headers = [
    'Applicant',
    'Contact',
    isStudentQueue ? 'College & Course' : isStaffQueue ? 'Role Requested' : 'Institution',
    'Requested',
    'Status',
    'Decision',
  ];

  return (
    <>
      <SectionCard
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            {['PENDING', 'APPROVED', 'REJECTED'].map((value) => (
              <button
                key={value}
                onClick={() => setStatus(value)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                  status === value
                    ? 'bg-[#D4A72C] text-[#17181A]'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        }
      >
        <AsyncState
          loading={loading}
          error={error}
          isEmpty={items.length === 0}
          onRetry={load}
          emptyMessage={
            status === 'PENDING'
              ? 'No requests waiting for review. New sign-ups appear here automatically.'
              : `No ${status.toLowerCase()} requests.`
          }
        >
          <TableWrap headers={headers}>
            {items.map((request) => (
              <tr key={request.id} className="text-gray-300 hover:bg-[#17181A]/60">
                <td className="py-3 pr-4">
                  <span className="font-bold text-white block">{request.full_name}</span>
                  {request.designation && (
                    <span className="text-[11px] text-gray-500">{request.designation}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Mail className="w-3 h-3 text-gray-600" /> {request.email}
                  </span>
                  {request.phone && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Phone className="w-3 h-3 text-gray-600" /> {request.phone}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {isStudentQueue ? (
                    <>
                      <span className="block text-[11px] text-white">{request.college || '—'}</span>
                      <span className="text-[11px] text-gray-500">
                        {[request.degree, request.semester ? `Sem ${request.semester}` : null, request.usn]
                          .filter(Boolean).join(' • ') || 'Course details not provided'}
                      </span>
                    </>
                  ) : isStaffQueue ? (
                    <Badge tone="blue">
                      {(request.requested_role || 'CONTENT_MANAGER').replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    <>
                      <span className="block text-[11px] text-white">
                        {request.organization_name || request.institution_name || '—'}
                      </span>
                      <span className="text-[11px] text-gray-500">{request.city || ''}</span>
                    </>
                  )}
                </td>
                <td className="py-3 pr-4 text-[11px] text-gray-500 whitespace-nowrap">
                  {new Date(request.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                </td>
                <td className="py-3 pr-4">
                  {request.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <IconButton
                        tone="green"
                        icon={Check}
                        title={`Approve ${request.full_name}`}
                        disabled={busyId === request.id}
                        onClick={() => openDialog(request, 'approve')}
                      >
                        Accept
                      </IconButton>
                      <IconButton
                        tone="red"
                        icon={X}
                        title={`Reject ${request.full_name}`}
                        disabled={busyId === request.id}
                        onClick={() => openDialog(request, 'reject')}
                      >
                        Reject
                      </IconButton>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-500">
                      {request.reviewed_by_name ? `by ${request.reviewed_by_name}` : 'Reviewed'}
                      {request.review_notes ? ` — ${request.review_notes}` : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </TableWrap>
        </AsyncState>
      </SectionCard>

      <ModalShell
        isOpen={!!dialog}
        onClose={() => setDialog(null)}
        icon={dialog?.action === 'approve' ? Check : X}
        title={dialog?.action === 'approve'
          ? `Approve ${dialog?.request.full_name}`
          : `Reject ${dialog?.request.full_name}`}
        footer={
          <>
            <IconButton tone="gray" onClick={() => setDialog(null)}>Cancel</IconButton>
            <IconButton
              tone={dialog?.action === 'approve' ? 'green' : 'red'}
              icon={dialog?.action === 'approve' ? Check : X}
              disabled={!!busyId}
              onClick={submitDecision}
            >
              {busyId ? 'Saving…' : dialog?.action === 'approve' ? 'Approve & Activate' : 'Reject Request'}
            </IconButton>
          </>
        }
      >
        {dialog && (
          <>
            <p className="text-xs text-gray-300">
              {dialog.action === 'approve' ? (
                <>
                  <strong className="text-white">{dialog.request.email}</strong> will be able to sign in
                  immediately and will be emailed that their account is active.
                  {kind === 'STUDENT' && ' A student profile is created from their registration details.'}
                  {kind === 'STAFF' && ' A staff profile is created and the role below is granted.'}
                  {kind === 'INSTITUTION' && ' Their institution record is created with them as coordinator.'}
                </>
              ) : (
                <>
                  <strong className="text-white">{dialog.request.email}</strong> will not be able to sign in,
                  and will be emailed that the request was not approved.
                </>
              )}
            </p>

            {dialog.request.message && (
              <div className="rounded-xl bg-[#17181A] border border-gray-800 p-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  Note from applicant
                </span>
                <p className="text-xs text-gray-300 mt-1">{dialog.request.message}</p>
              </div>
            )}

            {dialog.action === 'approve' && allowRoleOverride && (
              <Field
                label="Role to grant"
                hint="Defaults to what the applicant asked for. This decides what they can do in the ERP."
              >
                <select
                  value={roleOverride}
                  onChange={(e) => setRoleOverride(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {ASSIGNABLE_STAFF_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </Field>
            )}

            {dialog.action === 'approve' && allowInstitutionOverride && (
              <Field
                label="Attach to institution"
                hint={dialog.request.institution
                  ? 'The college this student selected at signup.'
                  : `They typed "${dialog.request.college_name}". Pick an existing college to avoid creating a duplicate, or leave blank to create it.`}
              >
                <select
                  value={institutionOverride}
                  onChange={(e) => setInstitutionOverride(e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">
                    {dialog.request.college_name
                      ? `Create "${dialog.request.college_name}"`
                      : 'Select an institution…'}
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label={dialog.action === 'approve' ? 'Internal note (optional)' : 'Reason (shared with the applicant)'}
            >
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={dialog.action === 'approve'
                  ? 'e.g. Verified with the college coordinator.'
                  : 'e.g. Not currently enrolled at a partner college.'}
                className={`${INPUT_CLASS} resize-none`}
              />
            </Field>

            {dialogError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl p-3">
                {dialogError}
              </p>
            )}
          </>
        )}
      </ModalShell>
    </>
  );
};

export const PendingHint = ({ count, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400">
    <Clock className="w-3.5 h-3.5" />
    {count} {label}{count === 1 ? '' : 's'} awaiting review
  </span>
);

export const ApprovalNote = () => (
  <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
    <ShieldCheck className="w-3.5 h-3.5 text-[#D4A72C]" />
    New sign-ups cannot log in until they are approved here.
  </p>
);
