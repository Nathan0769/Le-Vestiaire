import { describe, it, expect } from "vitest";
import { ageInDays, dueReminderStep, reminderCandidateWindow } from "@/lib/reminders";

const NOW = new Date("2026-11-18T09:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000);

describe("ageInDays", () => {
  it("compte les jours pleins depuis l'inscription", () => {
    expect(ageInDays(hoursAgo(23), NOW)).toBe(0);
    expect(ageInDays(hoursAgo(24), NOW)).toBe(1);
    expect(ageInDays(hoursAgo(24 * 7 + 5), NOW)).toBe(7);
  });
});

describe("dueReminderStep", () => {
  it("n'envoie rien avant un jour plein", () => {
    expect(dueReminderStep(0, 0)).toBeNull();
  });

  it("envoie J+1 à 1 et 2 jours", () => {
    expect(dueReminderStep(1, 0)).toBe(1);
    expect(dueReminderStep(2, 0)).toBe(1);
  });

  it("n'envoie plus J+1 à partir de 3 jours, pour ne pas tomber la veille de J+7", () => {
    expect(dueReminderStep(3, 0)).toBeNull();
    expect(dueReminderStep(6, 0)).toBeNull();
  });

  it("n'envoie jamais deux fois J+1", () => {
    expect(dueReminderStep(2, 1)).toBeNull();
  });

  it("envoie J+7 de 7 à 13 jours, J+1 reçu ou non", () => {
    expect(dueReminderStep(7, 1)).toBe(7);
    expect(dueReminderStep(13, 1)).toBe(7);
    expect(dueReminderStep(7, 0)).toBe(7);
    expect(dueReminderStep(14, 1)).toBeNull();
  });

  it("n'envoie jamais deux fois J+7", () => {
    expect(dueReminderStep(8, 7)).toBeNull();
  });

  it("envoie J+30 de 30 à 36 jours, puis plus rien", () => {
    expect(dueReminderStep(30, 7)).toBe(30);
    expect(dueReminderStep(36, 0)).toBe(30);
    expect(dueReminderStep(37, 7)).toBeNull();
    expect(dueReminderStep(31, 30)).toBeNull();
  });
});

describe("reminderCandidateWindow", () => {
  it("couvre les inscrits d'il y a 1 à 36 jours pleins", () => {
    const { createdAfter, createdBefore } = reminderCandidateWindow(NOW);
    expect(createdBefore).toEqual(hoursAgo(24));
    expect(createdAfter).toEqual(hoursAgo(24 * 37));
    expect(ageInDays(new Date(createdAfter.getTime() + 1), NOW)).toBe(36);
  });
});
