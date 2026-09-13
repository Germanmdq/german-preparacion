import type { Metadata, Viewport } from 'next';
import './globals.css';
import './modern-ui.css';
export const metadata: Metadata = { title: 'Preparación — Germán Asistente', description: 'Descubrí dónde conviene empezar hoy.', icons: null };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F5F5F7' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
