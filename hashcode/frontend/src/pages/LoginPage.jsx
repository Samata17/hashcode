import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage, getFieldErrors } from '../api/client.js';
import { validateLogin } from '../utils/validation.js';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { ErrorMessage } from '../components/StatusViews.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard'; // where the user was trying to go

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Log in | DevBlog';
  }, []);

  // Already logged in? Skip this page.
  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const me = await login(form.email.trim(), form.password);
      showToast(`Welcome back, ${me.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to write and manage your articles."
      footer={
        <>
          New to DevBlog? <Link to="/register" state={location.state}>Create an account</Link>
        </>
      }
    >
      {serverError && <ErrorMessage message={serverError} />}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <FormField id="email" name="email" type="email" label="Email" autoComplete="email" value={form.email} onChange={update} error={errors.email} autoFocus />
        <FormField id="password" name="password" type="password" label="Password" autoComplete="current-password" value={form.password} onChange={update} error={errors.password} />
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
