// ============================================================================
// SPRINTHUB - Email Configuration & Utilities
// Nodemailer setup for sending email notifications
// ============================================================================

import nodemailer from 'nodemailer';
import { env } from './env.js';

// ============================================================================
// TRANSPORTER SETUP
// ============================================================================

let transporter = null;

if (env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
} else {
  console.warn('[EMAIL] SMTP_HOST is not configured. Email sending is disabled.');
}

// ============================================================================
// SEND EMAIL - Generic function for sending emails
// ============================================================================
export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn('[EMAIL] SMTP not configured, skipping email to:', to);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log('[EMAIL] Sent to:', to, '| Subject:', subject);
  } catch (e) {
    console.error('[EMAIL] Failed to send email to:', to, e.message);
  }
}

// ============================================================================
// SEND TICKET ASSIGNED EMAIL
// ============================================================================
export async function sendTicketAssignedEmail({ to, ticketTitle, workspaceName, assignedBy, sprintLink }) {
  if (!transporter) {
    console.warn('[EMAIL] SMTP not configured, skipping ticket assigned email to:', to);
    return;
  }

  const subject = `SprintHub - You have been assigned a ticket: ${ticketTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SprintHub</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">A new ticket has been assigned to you</h2>
        <p style="color: #4b5563;">
          <strong>${assignedBy}</strong> has assigned you a ticket in workspace <strong>${workspaceName}</strong>.
        </p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${ticketTitle}</p>
        </div>
        ${sprintLink ? `
        <a href="${sprintLink}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          View in sprint
        </a>
        ` : ''}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This is an automated notification from the SprintHub application.
        </p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

// ============================================================================
// SEND SPRINT STARTED EMAIL
// ============================================================================
export async function sendSprintStartedEmail({ to, sprintName, workspaceName, sprintLink }) {
  if (!transporter) {
    console.warn('[EMAIL] SMTP not configured, skipping sprint started email to:', to);
    return;
  }

  const subject = `SprintHub - Sprint started: ${sprintName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SprintHub</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">Sprint has been started</h2>
        <p style="color: #4b5563;">
          Sprint <strong>${sprintName}</strong> has been started in workspace <strong>${workspaceName}</strong>.
        </p>
        ${sprintLink ? `
        <a href="${sprintLink}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Open sprint
        </a>
        ` : ''}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This is an automated notification from the SprintHub application.
        </p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

// ============================================================================
// SEND MEMBER ADDED EMAIL
// ============================================================================
export async function sendMemberAddedEmail({ to, projectName, addedBy, projectLink }) {
  if (!transporter) {
    console.warn('[EMAIL] SMTP not configured, skipping member added email to:', to);
    return;
  }

  const subject = `SprintHub - You have been added to workspace: ${projectName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">SprintHub</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">You have been added to a workspace</h2>
        <p style="color: #4b5563;">
          <strong>${addedBy}</strong> has added you to workspace <strong>${projectName}</strong>.
        </p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${projectName}</p>
        </div>
        ${projectLink ? `
        <a href="${projectLink}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Open workspace
        </a>
        ` : ''}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          This is an automated notification from the SprintHub application.
        </p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html });
}
