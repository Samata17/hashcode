import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { validateRegister } from '../utils/validation.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { ErrorMessage } from '../components/StatusViews.jsx';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Sign up | DevBlog';
  }, []);

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      showToast('Account created! Welcome to DevBlog.');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It's free and takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </>
      }
    >
      {serverError && <ErrorMessage message={serverError} />}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField id="name" name="name" label="Full name" autoComplete="name" value={form.name} onChange={update} error={errors.name} autoFocus />
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
        <FormField id="password" name="password" type="password" label="Password" autoComplete="new-password" value={form.password} onChange={update} error={errors.password} hint="At least 6 characters." />
        <FormField id="confirm" name="confirm" type="password" label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={update} error={errors.confirm} />
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
