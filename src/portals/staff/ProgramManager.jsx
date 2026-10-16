import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Check, Eye, EyeOff } from 'lucide-react';
import {
  SectionCard, AsyncState, TableWrap, Badge, IconButton, ModalShell, Field, INPUT_CLASS,
} from '../shared/ui';
import { programs as programsApi } from '../../lib/api/core';
import { ApiError } from '../../lib/api/client';

// Courses and internships on the public site are Program rows
// (apps/core/models.py Program) — not CMS entries — because they are the
// same records the ERP enrolls students into. So this screen writes
// Programs, and the marketing-only fields each type needs (a course's
// topics, an internship's stipend) live in Program.extra, which is exactly
// what src/lib/publicContent.js reads back.
//
// `config.extras`: [{ key, label, type: 'text'|'list', hint, placeholder }]

const EMPTY = {
  code: '', title: '', description: '', duration_weeks: 8, base_fee: 0, is_published: true,
};

function parseList(raw) {
  return String(raw || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export const ProgramManager = ({
  programType,
  title,
  description,
  addLabel,
  config,
  showToast,
  canWrite = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await programsApi.list({ program_type: programType, page_size: 100, ordering: 'title' });
      setItems(data.results || []);
    } catch (err) {
      setError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not load this catalog.');
    } finally {
      setLoading(false);
    }
  }, [programType]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setModal({
      id: null,
      form: { ...EMPTY },
      extras: Object.fromEntries((config.extras || []).map((f) => [f.key, ''])),
    });
    setFormError('');
  };

  const openEdit = (program) => {
    const extra = program.extra || {};
    setModal({
      id: program.id,
      form: {
        code: program.code || '',
        title: program.title || '',
        description: program.description || '',
        duration_weeks: program.duration_weeks ?? 8,
        base_fee: program.base_fee ?? 0,
        is_published: !!program.is_published,
      },
      extras: Object.fromEntries((config.extras || []).map((f) => [
        f.key,
        f.type === 'list'
          ? (Array.isArray(extra[f.key]) ? extra[f.key].join('\n') : '')
          : (extra[f.key] ?? ''),
      ])),
    });
    setFormError('');
  };

  const save = async () => {
    const { id, form, extras } = modal;
    if (!form.title.trim() || !form.code.trim()) {
      setFormError('Both a title and a unique code are required.');
      return;
    }
    setSaving(true);
    setFormError('');

    const extra = {};
    (config.extras || []).forEach((field) => {
      if (field.type === 'list') {
        const list = parseList(extras[field.key]);
        if (list.length) extra[field.key] = list;
      } else if (String(extras[field.key] || '').trim()) {
        extra[field.key] = String(extras[field.key]).trim();
      }
    });

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      program_type: programType,
      description: form.description,
      duration_weeks: Number(form.duration_weeks) || 1,
      base_fee: Number(form.base_fee) || 0,
      is_published: form.is_published,
      extra,
    };

    try {
      if (id) {
        await programsApi.update(id, payload);
        showToast(`“${payload.title}” updated on the website.`);
      } else {
        await programsApi.create(payload);
        showToast(`“${payload.title}” added — it is live on the website now.`);
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not save this item.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (program) => {
    if (!window.confirm(`Delete “${program.title}”? It will disappear from the public website.`)) return;
    try {
      await programsApi.remove(program.id);
      showToast(`“${program.title}” deleted.`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message
        : 'Could not delete this — students may still be enrolled in it.', 'error');
    }
  };

  const togglePublished = async (program) => {
    try {
      await programsApi.update(program.id, { is_published: !program.is_published });
      showToast(program.is_published
        ? `“${program.title}” hidden from the website.`
        : `“${program.title}” is now live on the website.`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not change visibility.', 'error');
    }
  };

  return (
    <>
      <SectionCard
        title={`${title} (${items.length})`}
        description={description}
        actions={canWrite ? <IconButton tone="gold" icon={Plus} onClick={openNew}>{addLabel}</IconButton> : null}
      >
        <AsyncState
          loading={loading}
          error={error}
          isEmpty={items.length === 0}
          onRetry={load}
          emptyMessage="Nothing in this catalog yet."
        >
          <TableWrap
            headers={[
              'Title', config.highlightColumn || 'Category', 'Duration', 'Fee',
              'Enrolled', 'Visible', ...(canWrite ? ['Actions'] : []),
            ]}
          >
            {items.map((program) => (
              <tr key={program.id} className="text-gray-300 hover:bg-[#17181A]/60">
                <td className="py-3 pr-4">
                  <span className="font-bold text-white block">{program.title}</span>
                  <span className="font-mono text-[11px] text-[#D4A72C]">{program.code}</span>
                </td>
                <td className="py-3 pr-4 text-[11px]">
                  {(program.extra || {})[config.highlightKey || 'category'] || '—'}
                </td>
                <td className="py-3 pr-4 text-[11px] whitespace-nowrap">{program.duration_weeks} wks</td>
                <td className="py-3 pr-4 text-[11px] whitespace-nowrap">
                  ₹{Number(program.base_fee || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={program.enrollment_count ? 'green' : 'gray'}>
                    {program.enrollment_count ?? 0}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={program.is_published ? 'green' : 'amber'}>
                    {program.is_published ? 'Live' : 'Hidden'}
                  </Badge>
                </td>
                {canWrite && (
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <IconButton
                        tone="gray"
                        icon={program.is_published ? EyeOff : Eye}
                        title={program.is_published ? 'Hide from website' : 'Publish to website'}
                        onClick={() => togglePublished(program)}
                      />
                      <IconButton tone="gray" icon={Edit} title={`Edit ${program.title}`} onClick={() => openEdit(program)} />
                      <IconButton tone="red" icon={Trash2} title={`Delete ${program.title}`} onClick={() => remove(program)} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </TableWrap>
        </AsyncState>
      </SectionCard>

      <ModalShell
        isOpen={!!modal}
        onClose={() => setModal(null)}
        icon={Edit}
        wide
        title={modal?.id ? `Edit — ${modal.form.title || 'item'}` : addLabel}
        footer={
          <>
            <IconButton tone="gray" onClick={() => setModal(null)}>Cancel</IconButton>
            <IconButton tone="gold" icon={Check} disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save & publish'}
            </IconButton>
          </>
        }
      >
        {modal && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title *">
                <input
                  className={INPUT_CLASS}
                  value={modal.form.title}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, title: e.target.value } }))}
                  placeholder={config.titlePlaceholder}
                />
              </Field>
              <Field label="Code *" hint="Unique identifier, e.g. CRS-FULLSTACK-WEB">
                <input
                  className={INPUT_CLASS}
                  value={modal.form.code}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, code: e.target.value.toUpperCase() } }))}
                  placeholder={config.codePlaceholder}
                />
              </Field>
              <Field label="Duration (weeks)">
                <input
                  type="number" min="1"
                  className={INPUT_CLASS}
                  value={modal.form.duration_weeks}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, duration_weeks: e.target.value } }))}
                />
              </Field>
              <Field label="Fee (₹)" hint="Use 0 for a free or stipend-based program.">
                <input
                  type="number" min="0"
                  className={INPUT_CLASS}
                  value={modal.form.base_fee}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, base_fee: e.target.value } }))}
                />
              </Field>

              {(config.extras || []).filter((f) => f.type !== 'list').map((field) => (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <input
                    className={INPUT_CLASS}
                    value={modal.extras[field.key] || ''}
                    onChange={(e) => setModal((m) => ({ ...m, extras: { ...m.extras, [field.key]: e.target.value } }))}
                    placeholder={field.placeholder || ''}
                  />
                </Field>
              ))}

              <Field label="Visibility">
                <select
                  className={INPUT_CLASS}
                  value={modal.form.is_published ? 'yes' : 'no'}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, is_published: e.target.value === 'yes' } }))}
                >
                  <option value="yes">Live on the website</option>
                  <option value="no">Hidden (draft)</option>
                </select>
              </Field>
            </div>

            <Field label="Description" hint="Shown on the public listing and detail page.">
              <textarea
                rows={4}
                className={`${INPUT_CLASS} resize-none`}
                value={modal.form.description}
                onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))}
              />
            </Field>

            {(config.extras || []).filter((f) => f.type === 'list').map((field) => (
              <Field key={field.key} label={field.label} hint={field.hint || 'One per line.'}>
                <textarea
                  rows={4}
                  className={`${INPUT_CLASS} resize-y`}
                  value={modal.extras[field.key] || ''}
                  onChange={(e) => setModal((m) => ({ ...m, extras: { ...m.extras, [field.key]: e.target.value } }))}
                  placeholder={field.placeholder || ''}
                />
              </Field>
            ))}

            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl p-3">{formError}</p>
            )}
          </>
        )}
      </ModalShell>
    </>
  );
};
