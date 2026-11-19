/**
 * Relances des comptes sans maillot : quelle relance envoyer et à qui.
 * Spec : docs/specs/2026-11-18-relances-traduites.md.
 *
 * `User.reminderStep` = jour de la dernière relance envoyée (0 = aucune).
 * Une relance n'est envoyée que si son jour dépasse la dernière : jamais de doublon.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderStep = 1 | 7 | 30;

/** Jour de la relance et nombre de jours pendant lesquels elle peut encore partir (rattrapage d'un passage raté). */
const REMINDERS: { step: ReminderStep; windowDays: number }[] = [
  // Fenêtre courte : J+1 ne doit pas tomber la veille de J+7
  { step: 1, windowDays: 2 },
  { step: 7, windowDays: 7 },
  { step: 30, windowDays: 7 },
];

const LAST_REMINDER = REMINDERS[REMINDERS.length - 1];
export const MAX_REMINDER_STEP: ReminderStep = LAST_REMINDER.step;

export function ageInDays(createdAt: Date, now: Date): number {
  return Math.floor((now.getTime() - createdAt.getTime()) / DAY_MS);
}

/** Relance à envoyer à un compte de cet âge, `null` si aucune. */
export function dueReminderStep(ageDays: number, lastStep: number): ReminderStep | null {
  const due = REMINDERS.find((r) => ageDays >= r.step && ageDays < r.step + r.windowDays);
  if (!due || due.step <= lastStep) return null;
  return due.step;
}

/** Bornes d'inscription des comptes qui peuvent avoir une relance due (âge 1 à 36 jours pleins). */
export function reminderCandidateWindow(now: Date): { createdAfter: Date; createdBefore: Date } {
  return {
    createdAfter: new Date(now.getTime() - (LAST_REMINDER.step + LAST_REMINDER.windowDays) * DAY_MS),
    createdBefore: new Date(now.getTime() - REMINDERS[0].step * DAY_MS),
  };
}
