"use client";

import { useState } from "react";
import { api, usePoll, toast } from "@/lib/client";
import type { InboxData, InboxPoll, MeData } from "@/lib/types";
import { fmtDateTime } from "@/lib/util";
import { Badge, EmptyState, PageHead, Spinner } from "@/components/ui";

const AUDIENCE: Record<string, string> = {
  all: "Tout le monde",
  client: "Clients",
  livreur: "Livreurs",
  commercant: "Commerçants",
  user: "Message personnel",
};

function PollCard({ poll, onVoted }: { poll: InboxPoll; onVoted: () => void }) {
  const [selected, setSelected] = useState<number | null>(poll.myVote);
  const [busy, setBusy] = useState(false);
  const closed = poll.status === "closed";
  const total = Math.max(1, poll.totalVotes);

  const vote = async () => {
    if (selected === null) return;
    setBusy(true);
    try {
      await api("votePoll", { pollId: poll.id, optionIndex: selected });
      toast("Votre réponse a été enregistrée.");
      onVoted();
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-black">📊 {poll.question}</p>
        <Badge tone={closed ? "soft" : "river"}>{closed ? "Clôturé" : "Ouvert"}</Badge>
      </div>
      {poll.description && <p className="mt-1 text-sm text-ink-soft">{poll.description}</p>}
      <p className="mt-1 text-[11px] font-bold text-ink-soft">
        {AUDIENCE[poll.audience] ?? poll.audience} · {fmtDateTime(poll.createdAt)}
        {poll.closesAt ? ` · clôture le ${fmtDateTime(poll.closesAt)}` : ""}
      </p>
      <div className="mt-4 space-y-2">
        {poll.options.map((opt, i) => {
          const count = poll.results?.[i] ?? 0;
          const pct = poll.results ? Math.round((count / total) * 100) : 0;
          const checked = selected === i;
          return (
            <label key={i} className={`block rounded-xl border px-4 py-3 transition ${checked ? "border-river bg-river/8" : "border-line bg-paper/50"} ${closed ? "" : "cursor-pointer hover:border-river/50"}`}>
              <div className="flex items-center gap-3">
                {!closed && <input type="radio" name={`poll-${poll.id}`} checked={checked} onChange={() => setSelected(i)} className="h-4 w-4 accent-[#2667FF]" />}
                <span className="flex-1 text-sm font-bold">{opt}</span>
                {poll.results && <span className="text-xs font-black tabular-nums text-ink-soft">{count} voix · {pct}%</span>}
              </div>
              {poll.results && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-river" style={{ width: `${pct}%` }} /></div>}
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink-soft">{poll.totalVotes} réponse(s) sur {poll.totalRecipients} destinataire(s){poll.myVote !== null ? " · vous avez voté" : ""}</p>
        {!closed && <button onClick={vote} disabled={busy || selected === null} className="btn-river !text-xs">{busy ? <Spinner /> : poll.myVote !== null ? "Modifier mon vote" : "Voter"}</button>}
      </div>
    </div>
  );
}

export default function MessageriePage() {
  const me = usePoll<MeData>("me", {}, 15000);
  const { data, refresh } = usePoll<InboxData>("inbox", {}, 8000);
  const [busy, setBusy] = useState<number | null>(null);

  const markRead = async (id: number) => {
    setBusy(id);
    try {
      await api("markMessageRead", { messageId: id });
      refresh();
      me.refresh();
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHead
        kicker="Messagerie WawanPost"
        title="Messages & sondages"
        sub="Annonces de l'administration et consultations réservées à votre compte ou à votre catégorie."
        right={<Badge tone="vermillon">{(me.data?.inboxUnread ?? 0) + (me.data?.pollsPending ?? 0)} à traiter</Badge>}
      />
      {!data ? (
        <div className="space-y-4"><div className="skeleton h-32" /><div className="skeleton h-48" /></div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl font-black">📨 Messages</h2>
            <div className="mt-3 space-y-3">
              {data.messages.length === 0 && <EmptyState emoji="📭" title="Aucun message" text="Les messages de l'administration apparaîtront ici." />}
              {data.messages.map((m) => (
                <article key={m.id} className={`card p-5 ${!m.readAt ? "border-vermillon/40" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-lg font-black">{m.subject}</p>
                    {!m.readAt ? <Badge tone="vermillon">Nouveau</Badge> : <Badge tone="soft">Lu</Badge>}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-ink-soft">{m.senderName} · {AUDIENCE[m.audience] ?? m.audience} · {fmtDateTime(m.createdAt)}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{m.body}</p>
                  {!m.readAt && <button onClick={() => markRead(m.id)} disabled={busy === m.id} className="btn-ghost mt-4 !text-xs">{busy === m.id ? <Spinner /> : "Marquer comme lu"}</button>}
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-display text-xl font-black">📊 Sondages</h2>
            <div className="mt-3 space-y-4">
              {data.polls.length === 0 && <EmptyState emoji="🗳️" title="Aucun sondage" text="Les consultations auxquelles vous participez apparaîtront ici." />}
              {data.polls.map((p) => <PollCard key={p.id} poll={p} onVoted={() => { refresh(); me.refresh(); }} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
