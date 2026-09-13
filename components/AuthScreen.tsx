'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, updateProfile, User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, authPersistence, db, googleProvider } from '@/lib/firebase';

type Mode = 'register' | 'login';

const errorMessage = (error: unknown) => {
  const code = (error as { code?: string })?.code ?? '';
  if (code.includes('email-already-in-use')) return 'Este correo ya está registrado. Iniciá sesión.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'El correo o la contraseña son incorrectos.';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup-request')) return 'Se cerró el acceso con Google. Podés intentarlo de nuevo.';
  if (code.includes('unauthorized-domain')) return 'Este dominio todavía no está autorizado en Firebase.';
  if (code.includes('invalid-email')) return 'Ingresá un correo electrónico válido.';
  return 'No pudimos completar la operación. Revisá tus datos e intentá nuevamente.';
};

async function saveUser(user: User, name: string, provider: string, isNew = false) {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: name.trim() || user.displayName || user.email?.split('@')[0] || 'Usuario',
    email: user.email ?? '',
    provider,
    updatedAt: serverTimestamp(),
    ...(isNew ? { createdAt: serverTimestamp() } : {}),
  }, { merge: true });
}

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async (user: User, provider: string, displayName = '', isNew = false) => {
    await saveUser(user, displayName, provider, isNew);
    onAuthenticated();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (mode === 'register' && password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setBusy(true);
    try {
      await authPersistence;
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
        await finish(result.user, 'password', name, true);
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        await finish(result.user, 'password', result.user.displayName ?? '');
      }
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  const google = async () => {
    setError(''); setBusy(true);
    try {
      await authPersistence;
      const result = await signInWithPopup(auth, googleProvider);
      await finish(result.user, 'google');
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code.includes('popup-blocked') || code.includes('operation-not-supported')) {
        try { await signInWithRedirect(auth, googleProvider); return; } catch (redirectError) { setError(errorMessage(redirectError)); }
      } else setError(errorMessage(e));
    } finally { setBusy(false); }
  };

  return <main className="screen auth-screen"><section className="content-card auth-card">
    <p className="eyebrow">PREPARACIÓN</p>
    <h1>Creá tu acceso gratuito</h1>
    <p className="lead">Guardamos tus respuestas para preparar tu evaluación personalizada, conservar tu avance y enviarte el resultado a tu mail.</p>
    <button className="google-button" onClick={google} disabled={busy}><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true"/> Continuar con Google</button>
    <div className="auth-divider"><span>o con tu correo</span></div>
    <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <label>Nombre<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required placeholder="Tu nombre" /></label>}
      <label>Correo electrónico<div className="input-with-icon"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="vos@ejemplo.com" /></div></label>
      <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} placeholder="Mínimo 6 caracteres" /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy}>{mode === 'register' ? 'Crear mi acceso gratuito' : 'Ingresar'} <ArrowRight size={18}/></button>
    </form>
    <>{mode === 'register' && <p className="auth-free-note">Es gratis. No requiere compra ni suscripción.</p>}<button className="auth-switch" onClick={()=>{setMode(mode === 'register' ? 'login' : 'register');setError('')}}>{mode === 'register' ? '¿Ya ingresaste antes? Iniciá sesión' : '¿No tenés cuenta? Creá tu acceso gratuito'}</button></>
  </section></main>;
}
