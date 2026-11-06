"use client";

import { useMemo, useState } from "react";
import type { AdminData, Audience, DirectoryUser } from "@/lib/types";
import { fmtDateTime } from "@/lib/util";
import { Badge, EmptyState, Field, Spinner } from "@/components/ui";

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "all", label: "Tout le monde" },
  { id: "client", label: "Clients" },
  { id: "livreur", label: "Livreurs" },
  { id: "commercant", label: "Commerçants" },
  { id: "user", label: "Un compte précis" },
];
const LABEL: Record<string, string> = Object.fromEntries(AUDIENCES.map((a) => [a.id, a.label]));
const ROLE_LABEL: Record<string, string> = { client: "Client", livreur: "Livreur", commercant: "Commerçant", admin: "Admin" };

function AudiencePicker({ audience, setAudience, target, setTarget, directory }: {
  audience: Audience; setAudience: (a: Audience) => void; target: number; setTarget: (n: number) => void; directory: DirectoryUser[];
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directory.filter((u) => !q || u.pseudo.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)).slice(0, 80);
  }, [directory, search]);
  const estimate = audience === "all" ? directory.length : audience === "user" ? (target ? 1 : 0) : directory.filter((u) => u.role === audience).length;
  return (
    <div className="space-y-3">
      <Field label="Destinataires">
        <select className="input" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
          {AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </Field>
      {audience === "user" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="input" placeholder="Rechercher un pseudo ou un nom…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input" value={target} onChange={(e) => setTarget(Number(e.target.value))}>
            <option value={0}>Choisir un compte…</option>
            {filtered.map((u) => <option key={u.id} value={u.id}>{u.displayName} (@{u.pseudo}) · {ROLE_LABEL[u.role]}</option>)}
          </select>
        </div>
      )}
      <p className="text-[11px] font-bold text-ink-soft">{estimate} destinataire(s) estimé(s) · les comptes désactivés sont exclus.</p>
    </div>
  );
}

export default function CommunityPanel({ data, busy, onAction }: {
  data: AdminData;
  busy: boolean;
  onAction: (action: string, payload: Record<string, unknown>, msg: string) => Promise<boolean>;
}) {
  const [tab, setTab] = useState<"messages" | "polls">("messages");
  const [msgAudience, setMsgAudience] = useState<Audience>("all");
  const [msgTarget, setMsgTarget] = useState(0);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pollAudience, setPollAudience] = useState<Audience>("all");
  const [pollTarget, setPollTarget] = useState(0);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");

  const sendMessage = async () => {
    const ok = await onAction("adminSendMessage", { audience: msgAudience, targetUserId: msgTarget || undefined, subject, body }, "Message envoyé.");
    if (ok) { setSubject(""); setBody(""); }
  };
  const createPoll = async () => {
    const ok = await onAction("adminCreatePoll", {
      audience: pollAudience,
      targetUserId: pollTarget || undefined,
      question,
      description,
      options: options.filter((o) => o.trim()),
      closesAt: closesAt ? new Date(closesAt).getTime() : undefined,
    }, "Sondage créé et envoyé.");
    if (ok) { setQuestion(""); setDescription(""); setOptions(["", ""]); setClosesAt(""); }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex gap-1.5">
        <button className={`chip ${tab === "messages" ? "chip-active" : ""}`} onClick={() => setTab("messages")}>📨 Messages</button>
        <button className={`chip ${tab === "polls" ? "chip-active" : ""}`} onClick={() => setTab("polls")}>📊 Sondages</button>
      </div>

      {tab === "messages" && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="card space-y-4 p-5">
            <p className="font-display text-lg font-black">Nouveau message</p>
            <AudiencePicker audience={msgAudience} setAudience={setMsgAudience} target={msgTarget} setTarget={setMsgTarget} directory={data.directory} />
            <Field label="Objet"><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ex. Information importante" /></Field>
            <Field label="Message"><textarea className="input min-h-36" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre message aux destinataires choisis…" /></Field>
            <button onClick={sendMessage} disabled={busy || !subject.trim() || !body.trim() || (msgAudience === "user" && !msgTarget)} className="btn-primary w-full">{busy ? <Spinner /> : "Envoyer le message"}</button>
          </div>
          <div className="space-y-3">
            {data.community.messages.length === 0 && <EmptyState emoji="📨" title="Aucun message envoyé" text="Ciblez tous les comptes, une catégorie ou une personne précise." />}
            {data.community.messages.map((m) => (
              <article key={m.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-black">{m.subject}</p>
                  <Badge tone="grape">{m.audience === "user" ? m.targetName ?? "Compte précis" : LABEL[m.audience]}</Badge>
                </div>
                <p className="mt-1 text-[11px] font-bold text-ink-soft">{fmtDateTime(m.createdAt)} · {m.readCount}/{m.recipientCount} lu(s)</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "polls" && (
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <div className="card space-y-4 p-5">
            <p className="font-display text-lg font-black">Nouveau sondage</p>
            <AudiencePicker audience={pollAudience} setAudience={setPollAudience} target={pollTarget} setTarget={setPollTarget} directory={data.directory} />
            <Field label="Question"><input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="ex. Quel créneau préférez-vous ?" /></Field>
            <Field label="Précision (optionnel)"><textarea className="input min-h-16" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <div>
              <span className="label">Réponses (2 à 8)</span>
              <div className="space-y-2">
                {options.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input" value={o} onChange={(e) => setOptions(options.map((x, j) => j === i ? e.target.value : x))} placeholder={`Réponse ${i + 1}`} />
                    {options.length > 2 && <button className="btn-ghost !px-3" onClick={() => setOptions(options.filter((_, j) => j !== i))}>✕</button>}
                  </div>
                ))}
              </div>
              {options.length < 8 && <button className="btn-ghost mt-2 !text-xs" onClick={() => setOptions([...options, ""])}>+ Ajouter une réponse</button>}
            </div>
            <Field label="Clôture automatique (optionnel)"><input className="input" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} /></Field>
            <button onClick={createPoll} disabled={busy || !question.trim() || options.filter((o) => o.trim()).length < 2 || (pollAudience === "user" && !pollTarget)} className="btn-river w-full">{busy ? <Spinner /> : "Publier le sondage"}</button>
          </div>
          <div className="space-y-4">
            {data.community.polls.length === 0 && <EmptyState emoji="🗳️" title="Aucun sondage" text="Les résultats s'actualisent ici dès les premiers votes." />}
            {data.community.polls.map((p) => {
              const total = Math.max(1, p.voteCount);
              return (
                <article key={p.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-lg font-black">{p.question}</p>
                    <Badge tone={p.status === "open" ? "leaf" : "soft"}>{p.status === "open" ? "Ouvert" : "Clôturé"}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">{p.audience === "user" ? p.targetName ?? "Compte précis" : LABEL[p.audience]} · {fmtDateTime(p.createdAt)} · {p.voteCount}/{p.recipientCount} vote(s)</p>
                  {p.description && <p className="mt-2 text-sm text-ink-soft">{p.description}</p>}
                  <div className="mt-4 space-y-2">
                    {p.options.map((o, i) => {
                      const count = p.results[i] ?? 0;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs font-bold"><span>{o}</span><span className="tabular-nums text-ink-soft">{count} · {pct}%</span></div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-gradient-to-r from-river to-leaf" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                  {p.status === "open" && <button className="btn-ghost mt-4 !text-xs" disabled={busy} onClick={() => onAction("adminClosePoll", { pollId: p.id }, "Sondage clôturé.")}>Clôturer le sondage</button>}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
