import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import CoverImage from '../components/CoverImage.jsx';
import TagInput from '../components/TagInput.jsx';
import FormField from '../components/FormField.jsx';
import { EmptyState, ErrorMessage, Loader } from '../components/StatusViews.jsx';
import { validatePost } from '../utils/validation.js';

const EMPTY = { title: '', content: '', coverImage: '', excerpt: '', tags: [] };

// Buttons above the text area. "before"/"after" wrap the selected text.
const TOOLBAR = [
  { label: 'B', title: 'Bold', before: '**', after: '**', placeholder: 'bold text' },
  { label: 'I', title: 'Italic', before: '_', after: '_', placeholder: 'italic text' },
  { label: 'H2', title: 'Heading', before: '\n## ', after: '\n', placeholder: 'Heading' },
  { label: '🔗', title: 'Link', before: '[', after: '](https://)', placeholder: 'link text' },
  { label: '`', title: 'Inline code', before: '`', after: '`', placeholder: 'code' },
  { label: '{ }', title: 'Code block', before: '\n```js\n', after: '\n```\n', placeholder: "console.log('hello');" },
  { label: '•', title: 'List', before: '\n- ', after: '', placeholder: 'list item' },
  { label: '❝', title: 'Quote', before: '\n> ', after: '\n', placeholder: 'quote' },
];

export default function EditorPage() {
  const { id } = useParams(); // undefined on /write, the post id on /edit/:id
  const navigate = useNavigate();
  const showToast = useToast();
  const textareaRef = useRef(null);
  const loadedId = useRef(null); // which post the form currently holds

  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('draft'); // saved status of the post
  const [slug, setSlug] = useState('');
  const [mode, setMode] = useState('write'); // write | preview | split
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(null); // null | 'draft' | 'published'
  const [dirty, setDirty] = useState(false); // unsaved changes?

  // Load the post when editing; reset the form when starting a new one.
  useEffect(() => {
    document.title = id ? 'Edit article | DevBlog' : 'Write | DevBlog';
    if (!id) {
      loadedId.current = null;
      setForm(EMPTY);
      setStatus('draft');
      setSlug('');
      setErrors({});
      setDirty(false);
      setLoading(false);
      return;
    }
    if (loadedId.current === id) return; // we just created this post - already in the form

    let ignore = false;
    setLoading(true);
    setLoadError('');
    api
      .get(`/posts/edit/${id}`)
      .then((res) => {
        if (ignore) return;
        const p = res.data.post;
        loadedId.current = p._id;
        setForm({ title: p.title, content: p.content, coverImage: p.coverImage || '', excerpt: p.excerpt || '', tags: p.tags });
        setStatus(p.status);
        setSlug(p.slug);
        setDirty(false);
      })
      .catch((err) => !ignore && setLoadError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [id]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
    setDirty(true);
  }

  // Inserts Markdown syntax around the selected text in the textarea.
  function applyFormat({ before, after, placeholder }) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setField('content', next);
    // put the cursor back around the inserted text after React re-renders
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function save(nextStatus) {
    setServerError('');
    const found = validatePost(form);
    setErrors(found);
    if (Object.keys(found).length) {
      setMode((m) => (m === 'preview' ? 'write' : m)); // show the form so errors are visible
      return;
    }

    setSaving(nextStatus);
    const payload = {
      title: form.title.trim(),
      content: form.content,
      coverImage: form.coverImage.trim(),
      excerpt: form.excerpt.trim(),
      tags: form.tags,
      status: nextStatus,
    };
    try {
      const res = id ? await api.put(`/posts/${id}`, payload) : await api.post('/posts', payload);
      const post = res.data.post;
      setDirty(false);
      setStatus(post.status);
      setSlug(post.slug);
      loadedId.current = post._id;

      if (post.status === 'published') {
        showToast(id && status === 'published' ? 'Article updated!' : 'Article published! 🎉');
        navigate(`/post/${post.slug}`);
      } else {
        showToast('Draft saved.');
        if (!id) navigate(`/edit/${post._id}`, { replace: true });
      }
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <Loader label="Loading article…" />;
  if (loadError) {
    return (
      <div className="container narrow">
        <EmptyState icon="🚫" title="Can't open this article" text={loadError} actionLabel="Back to dashboard" actionTo="/dashboard" />
      </div>
    );
  }

  const isPublished = status === 'published';
  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

  return (
    <div className="container editor">
      <div className="editor-top">
        <div>
          <Link to="/dashboard" className="back-link-inline">
            ← Dashboard
          </Link>
          <h1>{id ? 'Edit article' : 'Write a new article'}</h1>
          <span className={`badge badge-${status}`}>{isPublished ? 'Published' : 'Draft'}</span>
          {dirty && <span className="meta unsaved"> · Unsaved changes</span>}
        </div>
        <div className="editor-actions">
          {isPublished && slug && (
            <Link to={`/post/${slug}`} className="btn btn-ghost">
              View
            </Link>
          )}
          <button type="button" className="btn btn-outline" disabled={Boolean(saving)} onClick={() => save('draft')}>
            {saving === 'draft' ? 'Saving…' : isPublished ? 'Unpublish to draft' : 'Save draft'}
          </button>
          <button type="button" className="btn btn-primary" disabled={Boolean(saving)} onClick={() => save('published')}>
            {saving === 'published' ? 'Publishing…' : isPublished ? 'Update article' : 'Publish'}
          </button>
        </div>
      </div>

      {serverError && <ErrorMessage message={serverError} />}

      <div className="editor-card">
        <div className="editor-meta">
          <FormField id="title" label="Title" className="title-input" placeholder="Article title…" value={form.title} onChange={(e) => setField('title', e.target.value)} error={errors.title} maxLength={150} />
          <div className="editor-meta-row">
            <FormField id="coverImage" label="Cover image URL" placeholder="https://images.unsplash.com/…" value={form.coverImage} onChange={(e) => setField('coverImage', e.target.value)} error={errors.coverImage} hint="Optional. Paste a link to an image." />
            {form.coverImage.trim() && !errors.coverImage && (
              <div className="cover-preview">
                <CoverImage src={form.coverImage.trim()} title={form.title || 'Cover preview'} />
              </div>
            )}
          </div>
          <TagInput id="tags" tags={form.tags} onChange={(tags) => setField('tags', tags)} error={errors.tags} />
          <FormField
            id="excerpt"
            as="textarea"
            rows={2}
            label="Short summary (optional)"
            placeholder="Leave empty to use the start of your article."
            value={form.excerpt}
            onChange={(e) => setField('excerpt', e.target.value)}
            error={errors.excerpt}
            hint={`${form.excerpt.length}/300`}
            maxLength={300}
          />
        </div>

        <div className="editor-tabs">
          <div className="tabs" role="tablist">
            {['write', 'preview', 'split'].map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} className={`tab ${mode === m ? 'active' : ''} ${m === 'split' ? 'hide-mobile' : ''}`} onClick={() => setMode(m)}>
                {m === 'write' ? 'Write' : m === 'preview' ? 'Preview' : 'Side by side'}
              </button>
            ))}
          </div>
          <span className="meta">{words} words · Markdown supported</span>
        </div>

        <div className={`editor-panes mode-${mode}`}>
          {mode !== 'preview' && (
            <div className="editor-pane">
              <div className="toolbar" role="toolbar" aria-label="Formatting">
                {TOOLBAR.map((b) => (
                  <button key={b.title} type="button" title={b.title} aria-label={b.title} onClick={() => applyFormat(b)}>
                    {b.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                id="content"
                aria-label="Article content (Markdown)"
                className={`textarea content-input ${errors.content ? 'invalid' : ''}`}
                placeholder={'Write your article here using Markdown…\n\n## A heading\n\nSome **bold** text and a code block:\n\n```js\nconsole.log("Hello DevBlog");\n```'}
                value={form.content}
                onChange={(e) => setField('content', e.target.value)}
              />
              {errors.content && <span className="field-error">{errors.content}</span>}
            </div>
          )}
          {mode !== 'write' && (
            <div className="editor-pane preview-pane">
              {form.title && <h1 className="preview-title">{form.title}</h1>}
              {form.content.trim() ? <MarkdownRenderer content={form.content} /> : <p className="meta">Nothing to preview yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
