import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Edit, Check, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
import {
  SectionCard, AsyncState, TableWrap, Badge, IconButton, ModalShell, Field, INPUT_CLASS,
} from '../shared/ui';
import { siteContent } from '../../lib/api/content';
import { ApiError } from '../../lib/api/client';

// Generic CRUD screen for one section of the marketing-site CMS
// (apps/website SiteContent). Every website-editing screen in the staff
// dashboard is this component with a different field config — the sections
// share one backend model, so they share one editor rather than each
// re-implementing list/create/edit/delete/publish.
//
// `config` shape:
//   titleLabel      - what `title` means for this section
//   subtitleLabel   - what `subtitle` means, or null to hide it
//   descriptionLabel- what `description` means
//   image           - 'upload' (file picker) | 'url' | false
//   dateLabel       - label for event_start, or null to hide it
//   showEventEnd    - also collect event_end
//   locationLabel   - label for `location`, or null to hide it
//   extras          - [{ key, label, type: 'text'|'number'|'longtext'|'list', hint, options }]
//                     stored inside SiteContent.extra
//   columns         - extra table columns: [{ header, render(item) }]

const EMPTY = {
  title: '', subtitle: '', description: '', image_url: '', link_url: '',
  location: '', event_start: '', event_end: '', display_order: 0, is_active: true,
};

// A datetime-local input needs "YYYY-MM-DDTHH:mm"; the API returns ISO with
// a timezone, which that input silently rejects.
function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseExtraValue(type, raw) {
  if (type === 'list') {
    return String(raw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (type === 'number') {
    const num = Number(raw);
    return Number.isFinite(num) ? num : undefined;
  }
  return raw === '' ? undefined : raw;
}

function formatExtraValue(type, value) {
  if (type === 'list') return Array.isArray(value) ? value.join('\n') : (value || '');
  return value === undefined || value === null ? '' : String(value);
}

export const ContentSectionManager = ({
  section,
  title,
  description,
  addLabel = 'Add item',
  config,
  showToast,
  canWrite = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // { id, form, extras, file }
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Staff see drafts too (the backend widens the queryset for ERP
      // staff), which is what makes "unpublish" usable rather than a
      // one-way door.
      const data = await siteContent.bySection(section, { ordering: 'display_order' });
      setItems(data.results || []);
    } catch (err) {
      setError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not load this content.');
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setModal({
      id: null,
      form: { ...EMPTY, display_order: items.length },
      extras: Object.fromEntries((config.extras || []).map((f) => [f.key, f.type === 'list' ? '' : ''])),
      file: null,
    });
    setFormError('');
  };

  const openEdit = (item) => {
    setModal({
      id: item.id,
      form: {
        title: item.title || '',
        subtitle: item.subtitle || '',
        description: item.description || '',
        image_url: item.image_url || '',
        link_url: item.link_url || '',
        location: item.location || '',
        event_start: toLocalInput(item.event_start),
        event_end: toLocalInput(item.event_end),
        display_order: item.display_order ?? 0,
        is_active: !!item.is_active,
      },
      extras: Object.fromEntries((config.extras || []).map((f) => [
        f.key, formatExtraValue(f.type, (item.extra || {})[f.key]),
      ])),
      file: null,
      existingImage: item.image_src || '',
    });
    setFormError('');
  };

  const save = async () => {
    const { id, form, extras, file } = modal;
    if (!form.title.trim()) {
      setFormError(`${config.titleLabel || 'Title'} is required.`);
      return;
    }
    setSaving(true);
    setFormError('');

    const extra = {};
    (config.extras || []).forEach((field) => {
      const value = parseExtraValue(field.type, extras[field.key]);
      if (value !== undefined && !(Array.isArray(value) && value.length === 0)) {
        extra[field.key] = value;
      }
    });

    const payload = {
      section,
      title: form.title.trim(),
      subtitle: form.subtitle,
      description: form.description,
      link_url: form.link_url,
      location: form.location,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
      extra,
    };
    // Blank datetimes must be sent as null, not '' — DRF rejects the empty
    // string for a DateTimeField.
    payload.event_start = form.event_start ? new Date(form.event_start).toISOString() : null;
    payload.event_end = form.event_end ? new Date(form.event_end).toISOString() : null;

    if (config.image === 'url') payload.image_url = form.image_url;

    try {
      if (file) {
        // Multipart: a null datetime can't travel in a form field, and
        // `extra` goes as a JSON string (see lib/api/content.js).
        const multipart = { ...payload, image: file };
        Object.keys(multipart).forEach((key) => {
          if (multipart[key] === null) delete multipart[key];
        });
        if (id) await siteContent.updateWithImage(id, multipart);
        else await siteContent.createWithImage(multipart);
      } else if (id) {
        await siteContent.update(id, payload);
      } else {
        await siteContent.create(payload);
      }
      showToast(id ? `“${payload.title}” updated.` : `“${payload.title}” added — it is live on the website now.`);
      setModal(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not save this item.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? It will disappear from the public website.`)) return;
    try {
      await siteContent.remove(item.id);
      showToast(`“${item.title}” deleted.`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not delete this item.', 'error');
    }
  };

  const togglePublished = async (item) => {
    try {
      await siteContent.update(item.id, { is_active: !item.is_active });
      showToast(item.is_active
        ? `“${item.title}” hidden from the website.`
        : `“${item.title}” is now live on the website.`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError && typeof err.message === 'string'
        ? err.message : 'Could not change visibility.', 'error');
    }
  };

  const headers = useMemo(() => [
    ...(config.image ? ['Image'] : []),
    config.titleLabel || 'Title',
    ...(config.subtitleLabel ? [config.subtitleLabel] : []),
    ...(config.columns || []).map((column) => column.header),
    'Visible',
    ...(canWrite ? ['Actions'] : []),
  ], [config, canWrite]);

  return (
    <>
      <SectionCard
        title={title}
        description={description}
        actions={canWrite ? <IconButton tone="gold" icon={Plus} onClick={openNew}>{addLabel}</IconButton> : null}
      >
        <AsyncState
          loading={loading}
          error={error}
          isEmpty={items.length === 0}
          onRetry={load}
          emptyMessage="Nothing published in this section yet."
        >
          <TableWrap headers={headers}>
            {items.map((item) => (
              <tr key={item.id} className="text-gray-300 hover:bg-[#17181A]/60">
                {config.image && (
                  <td className="py-3 pr-4">
                    {item.image_src ? (
                      <img
                        src={item.image_src}
                        alt={item.title}
                        className="w-14 h-10 object-cover rounded-lg border border-gray-800"
                      />
                    ) : (
                      <span className="w-14 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                      </span>
                    )}
                  </td>
                )}
                <td className="py-3 pr-4">
                  <span className="font-bold text-white block">{item.title}</span>
                  {item.description && (
                    <span className="text-[11px] text-gray-500 line-clamp-1">{item.description}</span>
                  )}
                </td>
                {config.subtitleLabel && (
                  <td className="py-3 pr-4 text-[11px]">{item.subtitle || '—'}</td>
                )}
                {(config.columns || []).map((column) => (
                  <td key={column.header} className="py-3 pr-4 text-[11px]">{column.render(item)}</td>
                ))}
                <td className="py-3 pr-4">
                  <Badge tone={item.is_active ? 'green' : 'amber'}>
                    {item.is_active ? 'Live' : 'Hidden'}
                  </Badge>
                </td>
                {canWrite && (
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <IconButton
                        tone="gray"
                        icon={item.is_active ? EyeOff : Eye}
                        title={item.is_active ? 'Hide from website' : 'Publish to website'}
                        onClick={() => togglePublished(item)}
                      />
                      <IconButton tone="gray" icon={Edit} title={`Edit ${item.title}`} onClick={() => openEdit(item)} />
                      <IconButton tone="red" icon={Trash2} title={`Delete ${item.title}`} onClick={() => remove(item)} />
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
              <Field label={`${config.titleLabel || 'Title'} *`}>
                <input
                  className={INPUT_CLASS}
                  value={modal.form.title}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, title: e.target.value } }))}
                  placeholder={config.titlePlaceholder || ''}
                />
              </Field>

              {config.subtitleLabel && (
                <Field label={config.subtitleLabel} hint={config.subtitleHint}>
                  <input
                    className={INPUT_CLASS}
                    value={modal.form.subtitle}
                    onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, subtitle: e.target.value } }))}
                    placeholder={config.subtitlePlaceholder || ''}
                  />
                </Field>
              )}

              {config.dateLabel && (
                <Field label={config.dateLabel}>
                  <input
                    type="datetime-local"
                    className={INPUT_CLASS}
                    value={modal.form.event_start}
                    onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, event_start: e.target.value } }))}
                  />
                </Field>
              )}

              {config.showEventEnd && (
                <Field label="Ends">
                  <input
                    type="datetime-local"
                    className={INPUT_CLASS}
                    value={modal.form.event_end}
                    onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, event_end: e.target.value } }))}
                  />
                </Field>
              )}

              {config.locationLabel && (
                <Field label={config.locationLabel}>
                  <input
                    className={INPUT_CLASS}
                    value={modal.form.location}
                    onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, location: e.target.value } }))}
                  />
                </Field>
              )}

              {(config.extras || []).filter((f) => f.type !== 'list' && f.type !== 'longtext').map((field) => (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  {field.options ? (
                    <select
                      className={INPUT_CLASS}
                      value={modal.extras[field.key] || ''}
                      onChange={(e) => setModal((m) => ({ ...m, extras: { ...m.extras, [field.key]: e.target.value } }))}
                    >
                      <option value="">Select…</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      className={INPUT_CLASS}
                      value={modal.extras[field.key] || ''}
                      onChange={(e) => setModal((m) => ({ ...m, extras: { ...m.extras, [field.key]: e.target.value } }))}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                </Field>
              ))}

              <Field label="Display order" hint="Lower numbers appear first on the website.">
                <input
                  type="number" min="0"
                  className={INPUT_CLASS}
                  value={modal.form.display_order}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, display_order: e.target.value } }))}
                />
              </Field>

              <Field label="Visibility">
                <select
                  className={INPUT_CLASS}
                  value={modal.form.is_active ? 'yes' : 'no'}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, is_active: e.target.value === 'yes' } }))}
                >
                  <option value="yes">Live on the website</option>
                  <option value="no">Hidden (draft)</option>
                </select>
              </Field>
            </div>

            <Field label={config.descriptionLabel || 'Description'} hint={config.descriptionHint}>
              <textarea
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
                value={modal.form.description}
                onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, description: e.target.value } }))}
                placeholder={config.descriptionPlaceholder || ''}
              />
            </Field>

            {(config.extras || []).filter((f) => f.type === 'longtext' || f.type === 'list').map((field) => (
              <Field
                key={field.key}
                label={field.label}
                hint={field.hint || (field.type === 'list' ? 'One per line.' : undefined)}
              >
                <textarea
                  rows={field.type === 'longtext' ? 8 : 4}
                  className={`${INPUT_CLASS} resize-y`}
                  value={modal.extras[field.key] || ''}
                  onChange={(e) => setModal((m) => ({ ...m, extras: { ...m.extras, [field.key]: e.target.value } }))}
                  placeholder={field.placeholder || ''}
                />
              </Field>
            ))}

            {config.image === 'upload' && (
              <Field
                label="Photo"
                hint="JPG or PNG. Leave empty when editing to keep the current photo."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#D4A72C] text-[#17181A] text-[11px] font-bold cursor-pointer hover:bg-[#B88918]">
                    <Upload className="w-3.5 h-3.5" />
                    {modal.file ? 'Change file' : 'Choose file'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && !file.type.startsWith('image/')) {
                          setFormError('That file is not an image.');
                          return;
                        }
                        setFormError('');
                        setModal((m) => ({ ...m, file }));
                      }}
                    />
                  </label>
                  {modal.file && <span className="text-[11px] text-gray-300">{modal.file.name}</span>}
                  {!modal.file && modal.existingImage && (
                    <img
                      src={modal.existingImage}
                      alt=""
                      className="w-16 h-12 object-cover rounded-lg border border-gray-800"
                    />
                  )}
                </div>
              </Field>
            )}

            {config.image === 'url' && (
              <Field label="Image URL" hint="Paste a hosted image address.">
                <input
                  className={INPUT_CLASS}
                  value={modal.form.image_url}
                  onChange={(e) => setModal((m) => ({ ...m, form: { ...m.form, image_url: e.target.value } }))}
                  placeholder="https://…"
                />
              </Field>
            )}

            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl p-3">{formError}</p>
            )}
          </>
        )}
      </ModalShell>
    </>
  );
};
