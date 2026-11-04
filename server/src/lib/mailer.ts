import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!env.SMTP_HOST) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function renderEmail(title: string, body: string, link?: string): { html: string; text: string } {
  const safeBody = escapeHtml(body).replace(/\n/g, '<br/>');
  const button = link
    ? `<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;border:1px solid #111;color:#111;text-decoration:none">Open in Aradam</a></p>`
    : '';
  const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;padding:24px;color:#111">
<h2 style="font-weight:normal;letter-spacing:.04em">${escapeHtml(title)}</h2><p>${safeBody}</p>${button}
<hr style="border:none;border-top:1px solid #ddd;margin-top:32px"/><p style="font-size:12px;color:#777">Aradam</p></div>`;
  const text = `${title}\n\n${body}${link ? `\n\n${link}` : ''}`;
  return { html, text };
}

/** Returns true if the email was handed to the SMTP server. */
export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    logger.warn('SMTP is not configured; email skipped', { to: opts.to, subject: opts.subject });
    return false;
  }
  await t.sendMail({ from: env.MAIL_FROM, ...opts });
  return true;
}
