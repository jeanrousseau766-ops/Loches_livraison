import { and, desc, eq, inArray, ne, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  adminMessages,
  adminMessageRecipients,
  polls,
  pollRecipients,
  pollVotes,
} from "@/db/schema";
import type { Audience } from "@/db/schema";
import { ApiError } from "@/lib/auth";
import { notify } from "@/lib/core";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "Tout le monde",
  client: "Clients",
  livreur: "Livreurs",
  commercant: "Commerçants",
  user: "Compte précis",
};

type User = typeof users.$inferSelect;

function parseAudience(value: unknown): Audience {
  const v = String(value ?? "");
  if (v === "all" || v === "client" || v === "livreur" || v === "commercant" || v === "user") return v;
  throw new ApiError(400, "Destinataire invalide.");
}

export async function resolveRecipients(audienceRaw: unknown, targetUserIdRaw: unknown): Promise<User[]> {
  const audience = parseAudience(audienceRaw);
  if (audience === "user") {
    const id = Number(targetUserIdRaw);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Choisissez un compte destinataire.");
    const rows = await db.select().from(users).where(and(eq(users.id, id), ne(users.status, "disabled"))).limit(1);
    if (!rows.length) throw new ApiError(404, "Compte destinataire introuvable ou désactivé.");
    return rows;
  }
  const condition = audience === "all" ? ne(users.status, "disabled") : and(eq(users.role, audience), ne(users.status, "disabled"));
  const rows = await db.select().from(users).where(condition);
  if (!rows.length) throw new ApiError(400, "Aucun destinataire actif pour cette catégorie.");
  return rows;
}

export async function sendAdminMessage(
  senderId: number,
  input: { audience?: unknown; targetUserId?: unknown; subject?: unknown; body?: unknown }
) {
  const subject = String(input.subject ?? "").trim();
  const body = String(input.body ?? "").trim();
  if (subject.length < 3 || subject.length > 160) throw new ApiError(400, "Objet : 3 à 160 caractères.");
  if (body.length < 1 || body.length > 8000) throw new ApiError(400, "Message : 1 à 8 000 caractères.");
  const audience = parseAudience(input.audience);
  const recipients = await resolveRecipients(audience, input.targetUserId);
  const now = Date.now();
  const [msg] = await db
    .insert(adminMessages)
    .values({
      senderId,
      audience,
      targetUserId: audience === "user" ? Number(input.targetUserId) : null,
      subject,
      body,
      createdAt: now,
    })
    .returning();
  await db.insert(adminMessageRecipients).values(recipients.map((u) => ({ messageId: msg.id, userId: u.id })));
  for (const u of recipients) await notify(u.id, "message", `📨 ${subject}`, body.slice(0, 180));
  return { id: msg.id, recipientCount: recipients.length };
}

export async function createAdminPoll(
  authorId: number,
  input: { audience?: unknown; targetUserId?: unknown; question?: unknown; description?: unknown; options?: unknown; closesAt?: unknown }
) {
  const question = String(input.question ?? "").trim();
  const description = String(input.description ?? "").trim();
  if (question.length < 5 || question.length > 240) throw new ApiError(400, "Question : 5 à 240 caractères.");
  const rawOptions = Array.isArray(input.options) ? input.options : [];
  const options = rawOptions.map((o) => String(o ?? "").trim()).filter(Boolean);
  if (options.length < 2 || options.length > 8) throw new ApiError(400, "Proposez entre 2 et 8 réponses.");
  if (options.some((o) => o.length > 160)) throw new ApiError(400, "Chaque réponse doit faire 160 caractères maximum.");
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) throw new ApiError(400, "Les réponses doivent être différentes.");
  const audience = parseAudience(input.audience);
  const recipients = await resolveRecipients(audience, input.targetUserId);
  let closesAt: number | null = null;
  if (input.closesAt !== undefined && input.closesAt !== null && input.closesAt !== "") {
    closesAt = Number(input.closesAt);
    if (!Number.isFinite(closesAt) || closesAt <= Date.now()) throw new ApiError(400, "La date de clôture doit être dans le futur.");
  }
  const now = Date.now();
  const [poll] = await db
    .insert(polls)
    .values({
      authorId,
      audience,
      targetUserId: audience === "user" ? Number(input.targetUserId) : null,
      question,
      description,
      options,
      closesAt,
      createdAt: now,
    })
    .returning();
  await db.insert(pollRecipients).values(recipients.map((u) => ({ pollId: poll.id, userId: u.id })));
  for (const u of recipients) await notify(u.id, "sondage", `📊 ${question}`, "Un sondage WawanPost attend votre avis.");
  return { id: poll.id, recipientCount: recipients.length };
}

export async function closeAdminPoll(pollIdRaw: unknown) {
  const id = Number(pollIdRaw);
  const rows = await db.select().from(polls).where(eq(polls.id, id)).limit(1);
  if (!rows.length) throw new ApiError(404, "Sondage introuvable.");
  if (rows[0].status === "closed") return { ok: true };
  await db.update(polls).set({ status: "closed", closedAt: Date.now() }).where(eq(polls.id, id));
  return { ok: true };
}

export async function markMessageRead(userId: number, messageIdRaw: unknown) {
  const messageId = Number(messageIdRaw);
  await db
    .update(adminMessageRecipients)
    .set({ readAt: Date.now() })
    .where(and(eq(adminMessageRecipients.messageId, messageId), eq(adminMessageRecipients.userId, userId), isNull(adminMessageRecipients.readAt)));
  return { ok: true };
}

function pollIsOpen(p: typeof polls.$inferSelect, now = Date.now()): boolean {
  return p.status === "open" && (!p.closesAt || p.closesAt > now);
}

export async function voteInPoll(userId: number, pollIdRaw: unknown, optionIndexRaw: unknown) {
  const pollId = Number(pollIdRaw);
  const optionIndex = Number(optionIndexRaw);
  const recipient = await db
    .select()
    .from(pollRecipients)
    .where(and(eq(pollRecipients.pollId, pollId), eq(pollRecipients.userId, userId)))
    .limit(1);
  if (!recipient.length) throw new ApiError(403, "Ce sondage ne vous est pas destiné.");
  const rows = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  const poll = rows[0];
  if (!poll) throw new ApiError(404, "Sondage introuvable.");
  if (!pollIsOpen(poll)) throw new ApiError(400, "Ce sondage est clôturé.");
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length)
    throw new ApiError(400, "Réponse invalide.");
  await db
    .insert(pollVotes)
    .values({ pollId, userId, optionIndex, createdAt: Date.now() })
    .onConflictDoUpdate({
      target: [pollVotes.pollId, pollVotes.userId],
      set: { optionIndex, createdAt: Date.now() },
    });
  return { ok: true };
}

export async function getInbox(userId: number) {
  const now = Date.now();
  const msgRows = await db
    .select({ r: adminMessageRecipients, m: adminMessages })
    .from(adminMessageRecipients)
    .innerJoin(adminMessages, eq(adminMessageRecipients.messageId, adminMessages.id))
    .where(eq(adminMessageRecipients.userId, userId))
    .orderBy(desc(adminMessages.createdAt))
    .limit(60);
  const senderIds = [...new Set(msgRows.map((x) => x.m.senderId))];
  const senders = senderIds.length ? await db.select().from(users).where(inArray(users.id, senderIds)) : [];
  const senderMap = new Map(senders.map((u) => [u.id, u.displayName || u.pseudo]));

  const pollRows = await db
    .select({ r: pollRecipients, p: polls })
    .from(pollRecipients)
    .innerJoin(polls, eq(pollRecipients.pollId, polls.id))
    .where(eq(pollRecipients.userId, userId))
    .orderBy(desc(polls.createdAt))
    .limit(40);
  const pollIds = pollRows.map((x) => x.p.id);
  const allVotes = pollIds.length ? await db.select().from(pollVotes).where(inArray(pollVotes.pollId, pollIds)) : [];
  const allRecipients = pollIds.length ? await db.select().from(pollRecipients).where(inArray(pollRecipients.pollId, pollIds)) : [];

  return {
    messages: msgRows.map(({ r, m }) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      senderName: senderMap.get(m.senderId) ?? "Administration",
      audience: m.audience,
      createdAt: m.createdAt,
      readAt: r.readAt,
    })),
    polls: pollRows.map(({ p }) => {
      const myVote = allVotes.find((v) => v.pollId === p.id && v.userId === userId)?.optionIndex ?? null;
      const votes = allVotes.filter((v) => v.pollId === p.id);
      const results = p.options.map((_, i) => votes.filter((v) => v.optionIndex === i).length);
      const open = pollIsOpen(p, now);
      const showResults = myVote !== null || !open;
      return {
        id: p.id,
        question: p.question,
        description: p.description,
        options: p.options,
        audience: p.audience,
        status: open ? ("open" as const) : ("closed" as const),
        closesAt: p.closesAt,
        createdAt: p.createdAt,
        myVote,
        totalRecipients: allRecipients.filter((r) => r.pollId === p.id).length,
        totalVotes: votes.length,
        results: showResults ? results : null,
      };
    }),
  };
}

export async function getInboxCounts(userId: number) {
  const inbox = await getInbox(userId);
  return {
    inboxUnread: inbox.messages.filter((m) => !m.readAt).length,
    pollsPending: inbox.polls.filter((p) => p.status === "open" && p.myVote === null).length,
  };
}

export async function getAdminCommunity() {
  const now = Date.now();
  const us = await db.select().from(users);
  const uMap = new Map(us.map((u) => [u.id, u]));
  const msgs = await db.select().from(adminMessages).orderBy(desc(adminMessages.createdAt)).limit(60);
  const msgRecipients = msgs.length
    ? await db.select().from(adminMessageRecipients).where(inArray(adminMessageRecipients.messageId, msgs.map((m) => m.id)))
    : [];
  const ps = await db.select().from(polls).orderBy(desc(polls.createdAt)).limit(60);
  const pollIds = ps.map((p) => p.id);
  const recipients = pollIds.length ? await db.select().from(pollRecipients).where(inArray(pollRecipients.pollId, pollIds)) : [];
  const votes = pollIds.length ? await db.select().from(pollVotes).where(inArray(pollVotes.pollId, pollIds)) : [];
  const name = (id: number | null) => (id ? uMap.get(id)?.displayName || uMap.get(id)?.pseudo || null : null);

  return {
    directory: us
      .filter((u) => u.status !== "disabled")
      .map((u) => ({ id: u.id, pseudo: u.pseudo, displayName: u.displayName || u.pseudo, role: u.role, status: u.status })),
    community: {
      messages: msgs.map((m) => {
      const rs = msgRecipients.filter((r) => r.messageId === m.id);
      return {
        id: m.id,
        subject: m.subject,
        body: m.body,
        audience: m.audience,
        targetUserId: m.targetUserId,
        targetName: name(m.targetUserId),
        createdAt: m.createdAt,
        recipientCount: rs.length,
        readCount: rs.filter((r) => r.readAt).length,
      };
      }),
      polls: ps.map((p) => {
      const pv = votes.filter((v) => v.pollId === p.id);
      return {
        id: p.id,
        question: p.question,
        description: p.description,
        options: p.options,
        audience: p.audience,
        targetUserId: p.targetUserId,
        targetName: name(p.targetUserId),
        status: pollIsOpen(p, now) ? ("open" as const) : ("closed" as const),
        closesAt: p.closesAt,
        createdAt: p.createdAt,
        recipientCount: recipients.filter((r) => r.pollId === p.id).length,
        voteCount: pv.length,
        results: p.options.map((_, i) => pv.filter((v) => v.optionIndex === i).length),
        };
      }),
    },
  };
}

export async function countRecipientsForAudience(audience: Audience, targetUserId?: number | null) {
  const rows = await resolveRecipients(audience, targetUserId);
  return rows.length;
}

