import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import FormField from '../components/FormField.jsx';
import { ErrorMessage } from '../components/StatusViews.jsx';
import { validateProfile } from '../utils/validation.js';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const showToast = useToast();
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', avatar: user.avatar || '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Edit profile | DevBlog';
  }, []);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validateProfile(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await api.put('/users/me', { name: form.name.trim(), bio: form.bio.trim(), avatar: form.avatar.trim() });
      setUser(res.data.user); // the navbar avatar/name update straight away
      showToast('Profile updated.');
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Live preview uses what's typed so far
  const preview = { name: form.name || user.name, avatar: errors.avatar ? '' : form.avatar.trim() };

  return (
    <div className="container narrow">
      <div className="page-header">
        <div>
          <h1>Edit profile</h1>
          <p className="meta">This is what readers see on your public profile.</p>
        </div>
        <Link to={`/u/${user.username}`} className="btn btn-outline">
          View my profile
        </Link>
      </div>

      <div className="settings-card">
        {serverError && <ErrorMessage message={serverError} />}
        <div className="settings-preview">
          <Avatar key={preview.avatar} user={preview} size={88} />
          <div>
            <strong>{preview.name}</strong>
            <span className="meta">@{user.username} · {user.email}</span>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <FormField id="name" name="name" label="Name" value={form.name} onChange={update} error={errors.name} maxLength={50} />
          <FormField
            id="avatar"
            name="avatar"
            label="Avatar image URL"
            placeholder="https://…"
            value={form.avatar}
            onChange={update}
            error={errors.avatar}
            hint="Optional. Leave empty to show your initials."
          />
          <FormField
            id="bio"
            name="bio"
            as="textarea"
            rows={4}
            label="Bio"
            placeholder="Tell readers about yourself: what you build, what you love to write about…"
            value={form.bio}
            onChange={update}
            error={errors.bio}
            hint={`${form.bio.length}/300`}
            maxLength={300}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
