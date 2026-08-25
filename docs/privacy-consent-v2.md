# Privacy & Consent Architecture v2

**Status:** Decision-ready design. Not implemented. Not legal advice.  
**Audience:** Product, engineering, DPO, clinical lead.  
**Related:** `docs/v1-scope.md`, `src/types/index.ts` (`ConsentType`), `src/pages/onboarding/Consent.tsx`, `src/pages/patient/PrivacyData.tsx`, `src/pages/PrivacyPolicy.tsx`.  
**Rule for v1:** Do not add extra consent checkboxes, toggles, or `ConsentType` values until this document is accepted. v1 safety / check-in / alerts keep the current five consents.

This document is the spec for the **next** consent architecture. It answers: what is granted, what is independent, who can see what, what delete actually does, how risk contact works (including solo patients), where the UX lives, and what must not ship in v1.

---

## 0. Recommended defaults (one-pager)

Accept these unless a named decision below is overturned.

| Consent | Who | Default | Required to use the app? | Independent? |
|---|---|---|---|---|
| `privacy_policy` | Patient | Must accept current version | Yes | Yes (versioned re-prompt) |
| `sensitive_data_processing` | Patient | Must accept | Yes | Yes |
| `checkin_data_sharing` | Patient | On | Yes **if a clinician is linked**; dormant until then for solo | Stays as today |
| `dpa_acceptance` | Clinician | Must accept | Yes (clinician app) | Stays as today |
| `ai_transcription` | Patient | **On** | No. Journals still record | Yes. Does **not** share with clinician |
| `clinician_journal_access` | Patient | **On if linked**, **Off if solo** | No | Yes. Voice **and** transcript |
| `ai_chat_storage` | Patient | **Off (ephemeral)** | No. Buddy still works | Yes. Storage ≠ processing |
| `research_participation` | Patient | **Off** | No | Yes |
| Risk contact policy | Patient | Band matrix, see §5 | No. Crisis numbers always shown | Yes. Not a single boolean |

**Hard rules that ship with v2:**

1. Each consent is grantable and withdrawable on its own. Withdrawing Buddy storage does not touch journals. Withdrawing journal sharing does not turn off check-ins.
2. Every grant/withdraw is an **append-only row** with `policy_version`, purpose snapshot, and timestamp. `current_consents` remains the live view.
3. **In-app crisis resources (995 / SOS 1767 / IMH 6389 2222) are never consent-gated.**
4. Therapy & Beyond is **not** an emergency service and does **not** auto-dial 995. Outbound contact to a named person is consent-gated; 24/7 monitoring is never claimed.
5. User-initiated delete removes **patient-controlled** data. It does **not** erase HCSA clinical records while a practice is the data controller.
6. Linking a clinician later is a **re-consent moment**, not a silent share of journals or stored Buddy chats.

---

## 1. Current state (v1) — what we are changing

### What exists

`ConsentType` today:

```
checkin_data_sharing | ai_transcription | privacy_policy | sensitive_data_processing | dpa_acceptance
```

- Append-only `consents` inserts; live state from `current_consents`.
- `recordConsent` does **not** send `policy_version` (the column is read, not written by the client).
- Patient gate in `App.tsx`: `checkin_data_sharing` + `privacy_policy` + `sensitive_data_processing`. AI transcription is optional.
- Clinician gate: `dpa_acceptance`.
- Settings (`PrivacyData.tsx`) only toggles `ai_transcription`. No withdraw of required consents, no delete, no export.
- Onboarding copy says check-ins are “never used for marketing or research.” Privacy Policy §2 repeats that.
- Voice journals are always stored in `voice-journal-audio` and `voice_journals`. Assigned clinicians can read them via RLS. Transcription is skipped if `ai_transcription` is off.
- Chat Buddy always persists `ai_chat_messages`. Clinician Patient Detail → **AI Buddy** shows the full transcript plus generated summary. Empty state tells the patient “If you link a clinician, they can read this conversation.”
- Solo patients (`clinician_id` null) are first-class. Check-ins and Buddy still work. Linking later currently has **no** extra consent step.
- Alerts already have bands `low | medium | moderate | high | urgent` and type `ai_chat_flag` / `risk_warning`. There is **no** consent that says who may be contacted at which band.
- Emergency contact is a free-text `patients.emergency_contact` plus a new `emergency_contacts` table (v1). Contacts are stored; **nobody is notified from them yet**.

### Gaps this spec closes

| Gap | Why it matters |
|---|---|
| One AI toggle covers transcription only | Users think it also controls Buddy storage and clinician journal access. It does not. |
| Journals always shared with assigned clinician | Patients asked for a private journal. Solo → linked currently dumps history. |
| Buddy always stored and clinician-readable | Users asked for store vs ephemeral. |
| Research promised as “never” | We will offer opt-in research later. Policy and consents must not lie. |
| No risk-tiered contact consent | Users asked; unspecced. v1 must not invent it in the UI. |
| Delete promised in Privacy Policy, not implemented | PDPA access/correction/withdrawal vs HCSA 6-year retention is undefined. |
| `policy_version` unused | Cannot re-prompt on material policy change. |

---

## 2. Principles

1. **Specific purpose, separate consent.** PDPA: consent is for a stated purpose. Bundling Buddy storage with journal sharing is not informed consent.
2. **Withdrawal as easy as grant.** Same Settings screen, same control, no email-the-DPO-only path for optional consents.
3. **Withdrawal ≠ deletion.** Stop future processing immediately. Past clinical records follow §4.
4. **Controller vs intermediary stays.** Linked care: the **practice** is Data Controller; Therapy & Beyond is Data Intermediary under the existing DPA. Solo use: the individual is using a consumer health tool; no clinic controller until they link.
5. **Sensitive data is the default class.** Mood, journals, Buddy, safety plans, alerts are health data. `sensitive_data_processing` is the umbrella for *running the product*. Feature consents are extra purposes on top.
6. **Safety without surveillance theatre.** Show help. Do not pretend a human is watching. Do not auto-call emergency services.
7. **Clinicians see consent state; they cannot silently override it in-product.** Professional duties (SMC / HCSA) may require action *outside* the app; the app records that the patient had withdrawn outbound contact.
8. **Copy matches behaviour.** If Buddy is ephemeral, the clinician AI Buddy tab must not show a transcript.

---

## 3. Consent catalog

Each row below is a **separate** grant. Version string format: `YYYY-MM-DD` matching the policy pack (e.g. `2026-09-01`). Changing the user-facing purpose text **requires a new version** and a re-prompt for that consent only.

### 3.1 Keep as-is (v1 → v2)

#### `privacy_policy` — required, versioned

- **Purpose:** “I have read the Privacy Policy (version X).”
- **Grant:** Checkbox. Blocking.
- **Withdraw:** Not a toggle. Withdrawal = close account / leave the service. Settings shows version + date accepted + “Read current policy.”
- **Re-prompt:** When `privacy_policy` version increments (material change). Until re-accepted, optional features that depend on the new policy pause; core check-in may continue on the previous version for a grace window (recommended 30 days) so care is not bricked by a policy edit.

#### `sensitive_data_processing` — required

- **Purpose:** “I consent to processing of sensitive health data to provide Therapy & Beyond (check-ins, optional journals, optional Buddy, safety tools, messaging with my clinician).”
- **This is not** permission to share with a clinician, run research, store Buddy chats, or contact an emergency person.
- **Withdraw:** Same as account close. Explain: the product cannot function without processing health data.

#### `checkin_data_sharing` — remains; meaning tightened

- **Purpose:** “Share my check-ins (mood, anxiety, energy, sleep, medication, events, notes, and extra symptom fields) with my **assigned** clinician so they can prepare for sessions and notice between-session changes.”
- **Required** while a clinician is linked. The v1 gate stays for linked patients.
- **Solo:** Recorded as granted at onboarding with copy: *“This does nothing until you link a clinician. You will confirm sharing before anything is sent.”* Live sharing is **off** until `patients.clinician_id` is set **and** the link re-consent is confirmed (§6.3).
- **Does not include:** voice audio, journal transcripts, Buddy messages.
- **Does include:** structured check-ins auto-filled from a voice journal (`source = 'voice_journal'`). The numbers/text of the check-in are check-in data; the recording is not.
- **Withdraw mid-care:** Allowed, with a blocking confirm. Effect: clinician RLS stops seeing **new** check-ins; relationship is marked “sharing paused”; clinician is notified “Patient paused check-in sharing.” Patient can keep logging for themselves. Re-grant restores access to new entries; historical visibility is a separate confirm (default: share last 30 days of check-ins, not the full archive, unless they pick “share all”).

#### `dpa_acceptance` — clinician, unchanged

- Practice accepts Therapy & Beyond as Data Intermediary. Patient never sees this.
- v2 DPA text must list the new processing: Buddy (ephemeral and stored modes), risk-contact notifications, research (only if the patient opted in), retention/deletion split.

#### `ai_transcription` — keep, decouple from sharing

- **Purpose:** “Use AI to transcribe my voice journals and extract themes **for me**. AI does not diagnose.”
- **Default:** On.
- **Off:** Recording still saved. `transcription_status = skipped` (already implemented). No theme extraction from that audio.
- **Does not** grant clinician access. Today’s Journal subtitle *“AI transcribes your entries for your clinician”* is wrong under v2 and must be replaced.

### 3.2 New consents

#### `ai_chat_storage` — Buddy: store vs ephemeral

This is **one** consent with two modes, not two types.

| State | `granted` | Behaviour |
|---|---|---|
| Ephemeral (default) | `false` or absent | Buddy works. See §4.2. |
| Stored | `true` | Persist `ai_chat_messages`. Patient can scroll history. |

- **Purpose (stored):** “Save my Chat Buddy conversations on Therapy & Beyond’s servers in Singapore so I can revisit them. If I have a linked clinician, they can read saved conversations and summaries to support my care.”
- **Purpose (ephemeral):** implied by declining. Copy: “Buddy will still reply. Conversations are not kept after you leave, and your clinician cannot read them. If something sounds urgent, we may still send a **risk alert** without the chat transcript — according to your contact settings.”
- **Processing vs storage:** Using Buddy at all is covered by `sensitive_data_processing`. No extra “I agree to talk to an AI” checkbox. First-use screen is the storage choice (§6.2).
- **Storage implies clinician visibility if linked.** Do **not** ship a third toggle “save but hide from clinician” (see §9). Patients who want a private Buddy leave storage off.
- **Withdraw:** Immediately: new messages follow ephemeral rules. Existing stored threads: patient is asked **Delete history** (patient-controlled if clinician never viewed) vs **Keep in clinical record** (if a clinician opened the AI Buddy tab or generated a summary). Default on withdraw: hide from clinician going forward; do not auto-wipe viewed threads.
- **Not granted by** `ai_transcription`.

#### `clinician_journal_access` — voice + transcript

- **Purpose:** “Share my voice journal recordings and any transcripts with my assigned clinician.”
- **Scope:** Audio in `voice-journal-audio` **and** `transcript` text. One consent, both artefacts. Do not split audio vs text in v2 — clinicians cannot use a transcript they are not allowed to hear the source of, and vice versa.
- **Default:** On when the patient selects a clinician during onboarding. Off for solo. Off until the link re-consent if they started solo.
- **Off:** Patient still records. Patient can play back. Clinician RLS denies `voice_journals` select and storage signed URLs. Insights (`generate-insight`) must not include journal text/audio. Auto-filled check-ins still flow under `checkin_data_sharing` only.
- **Grant later:** Just-in-time confirm: “Share existing entries too?” Default **Yes, share past entries** with a count (`12 recordings`). Alternative: “Only new entries.” Store that choice on the consent row (`metadata.share_history = true|false`).
- **Withdraw:** Clinician loses access to audio + transcripts immediately. Session notes the clinician already typed, and insights already generated while access was on, remain in the clinical record. New insight jobs omit journals.
- **Independent of** `ai_transcription`. Allowed combinations:

| Transcription | Journal access | Result |
|---|---|---|
| On | On | Clinician hears audio and reads transcript; themes in brief |
| On | Off | Patient sees transcript; clinician sees nothing from the journal |
| Off | On | Clinician can play audio only; no transcript, no AI themes from it |
| Off | Off | Private voice memo |

#### `research_participation` — default off

- **Purpose:** “Allow Therapy & Beyond to use my **de-identified** check-in patterns for research and product improvement. Raw journals, Buddy chats, and identifiable data are not used. I can stop anytime.”
- **Default:** Off. Never pre-ticked. Never bundled into “Agree and continue.”
- **Not implied by** any other consent. Privacy Policy §2 must change from “never used for research” to “not used for research unless you opt in.”
- **What research may use:** aggregated / de-identified structured check-in fields, streak metadata, alert type frequencies. Protocol version lives on the consent (`policy_version` + `metadata.protocol_id`).
- **What research may not use (v2):** voice audio, transcripts, Buddy content, messages, names, NRIC, phone, emergency contacts, free-text notes unless a later protocol is re-consented.
- **Withdraw:** Future extracts stop. Already-published aggregates stay. No re-identification.
- **Minors / lack of capacity:** Do not offer this consent until a separate legal review. Hide the toggle if age &lt; 21 until that review (flag in implementation).

#### Risk contact policy — **not** a boolean `ConsentType`

Users asked for this. It is not a yes/no. It is a **per-severity-band contact policy**. Stored in `risk_contact_policies` (§7), with a versioned consent event `emergency_escalation` that means “I confirmed this matrix (version X).”

- **Purpose:** “If the app detects that I may be at risk, who should be notified, and at which severity? This is not 24/7 monitoring. Crisis lines always remain available.”
- See §5 for models and the recommended default.

### 3.3 Consent IDs (implementers)

Add to `ConsentType` **only after this doc is accepted**:

```
| 'ai_chat_storage'
| 'clinician_journal_access'
| 'emergency_escalation'      // confirmation of the matrix, not the matrix itself
| 'research_participation'
```

Do not reuse `ai_transcription` for Buddy. Do not reuse `checkin_data_sharing` for journals.

---

## 4. Access, storage, and deletion rules

### 4.1 Who can see journals

| Actor | Voice audio | Transcript | Themes in clinician brief | Auto-filled check-in |
|---|---|---|---|---|
| Patient | Always | If `ai_transcription` on and job succeeded | n/a (patient Progress can show their own themes later; not v1) | Always |
| Assigned clinician | Only if `clinician_journal_access` currently granted | Same | Only if access **and** transcription were on when generated | If `checkin_data_sharing` on |
| Practice staff under the clinician | Same as clinician (HCSA direction, audit-logged) | Same | Same | Same |
| Other clinicians / platform staff | Never | Never | Never | Never |
| Research | Never in v2 | Never | Never | De-identified structured fields only if research opted in |
| Solo (no clinician) | Patient only | Patient only | No clinician | Patient only |

**Just-in-time recording modal (replaces today’s “shared only with your clinician”):**

- Linked + access on: “This recording will be stored and shared with {clinician name}. Transcription is {on/off}.”
- Linked + access off: “This recording is private. {clinician name} cannot play it. You can share journals in Your Data & Privacy.”
- Solo: “This recording is private until you link a clinician and choose to share.”

### 4.2 Whether AI chats are stored

**Ephemeral mode (default)**

1. Patient sends a message → edge function `ai-chat-reply` holds the last N turns in a **short-lived server cache** (recommended TTL 2 hours or end of calendar day SGT, whichever first) so the model has conversation context.
2. Do **not** insert into `ai_chat_messages` as a durable transcript.
3. Client may keep the current session in memory so the thread is visible until the tab is closed or TTL expires.
4. Provider settings: no training, no long-term provider logs that we control, Singapore region where the vendor allows. Document the vendor in the Privacy Policy.
5. **Safety exception:** If the classifier flags possible harm, write a **safety event**, not a chat log:
   - `patient_id`, `created_at`, `severity`, `flag_reason` (enum, not free text of the message), `source = 'ai_chat'`
   - Optional 120-character **redacted** snippet only if `risk_contact_policies` for that band notifies the clinician **and** a clinician is linked. Default: **no snippet**; clinician sees “Chat Buddy flagged possible {self-harm|harm-to-others} at {time}.”
6. Clinician AI Buddy tab: empty state *“Conversations are not stored. You will still get risk alerts if this patient allowed contact at that severity.”*
7. `generate-ai-chat-summary` is disabled.

**Stored mode**

1. Persist user + assistant rows as today.
2. Daily message limit can stay (currently 10).
3. If linked: clinician can read transcript + generate summary (today’s UI). Audit log: “Dr. viewed AI Buddy tab” already exists; keep it.
4. Flagged rows still create alerts. Full message is visible to clinician because storage was granted.
5. Switching to ephemeral does not rewrite history; it changes the path for **new** messages (§3.2).

**Buddy works in both modes.** There is no “AI chat processing” consent to turn Buddy off. If we later need a kill switch (e.g. parent of a minor), that is a separate product decision — not v2.

### 4.3 User-initiated delete vs HCSA 6-year records

Privacy Policy §5 today promises deletion on request within 30 days. §6 says records are kept “at least 6 years — or until you or your clinician request deletion, whichever is later.” Those two sentences fight. v2 replaces them with the split below.

**Legal posture (to be confirmed by counsel before build):**

- **Linked patient:** the practice is controller. HCSA medical-record retention (generally **at least 6 years** from last encounter for adults; longer for some minors / incapacity — confirm exact MOH rule) **overrides** a PDPA deletion request for data that is part of the clinical record. PDPA still requires we **stop using** data for withdrawn purposes.
- **Solo patient:** no clinic controller. Treat as consumer health data. Deletion can be honoured except the consent ledger, security logs, and any outbound-escalation receipts we are obliged to keep.
- **Linked → unlinked:** data that already entered the practice’s clinical record stays with that practice for the HCSA period. New solo data after unlink is patient-controlled.
- Therapy & Beyond executes deletion as **intermediary** on the controller’s instructions, except solo accounts where we take the request directly.

#### Classification

| Data | Linked (controller = practice) | Solo |
|---|---|---|
| Check-ins created while sharing was on | **Clinical record** — retain ≥ 6 years. Not self-deleted | Patient-controlled — deletable |
| Check-ins created while sharing paused / never linked | Patient-controlled | Patient-controlled |
| Voice journals **never** shared (`clinician_journal_access` never true, or share_history false for those ids) | Patient-controlled | Patient-controlled |
| Voice journals shared, or played/viewed by clinician | Clinical record | n/a |
| Buddy ephemeral | Already gone | Already gone |
| Buddy stored, **never** opened by clinician | Patient-controlled (delete on request) | Patient-controlled |
| Buddy stored, clinician viewed or summarised | Clinical record | n/a |
| Clinician ↔ patient messages | Clinical record | n/a |
| Sessions, session notes | Clinical record | n/a |
| Insights / briefs generated for clinician | Clinical record | n/a |
| Alerts a clinician saw or rated | Clinical record | Safety events: keep 6 years if an outbound notify fired; else deletable |
| Safety plan, coping, emergency contact list | Clinical if clinician could read them (current RLS: yes). v2: same unless we later add a private safety-plan mode (**not in v2**) | Patient-controlled |
| Consent ledger (type, granted, version, time) | **Always retain** — proof of consent, not health content | Always retain |
| Audit log (who accessed what) | Always retain for PDPA Protection Obligation | Always retain |
| Escalation receipts (who we notified, when, band, channel, success/fail) | Always retain ≥ 6 years | Always retain ≥ 6 years if we sent a message |
| Research extracts | De-identified; withdraw stops future use | Same |
| Account, email, auth | Delete on account close after the clinical retention hold | Delete on account close |

#### Delete UX (Settings → Your Data & Privacy)

1. **Export** (PDPA access) — JSON + audio links, 30-day SLA. Ships with v2; do not mock it.
2. **Correct** — in-app for profile/phone/emergency contacts; DPO path for clinical notes (controller).
3. **Delete my patient-controlled data** — preview list generated from the table above. Requires type-to-confirm.
4. **Close my account** — signs out, disables login, runs (3), then holds clinical records for the practice until the HCSA clock runs out.

**Receipt shown before confirm:**

> We will delete: {n} private journals, {n} Buddy threads your clinician never opened, {n} check-ins from before you linked.  
> We will **keep** (clinical / legal): {n} check-ins shared with {clinician}, {n} journals they could access, messages, session notes, alerts, and a record of your consents, for at least 6 years under the Healthcare Services Act.  
> We will stop using withdrawn purposes immediately.

SLA: 30 calendar days, matching current policy. DPO: `dpo@therapyandbeyond.com`.

#### What delete is **not**

- Not a silent clinician-side wipe.
- Not erasure of a report already sent to an emergency contact.
- Not a way to un-ring a 995 call the patient or clinician placed themselves.

---

## 5. Risk-tiered contact consent (previously unspecced)

v1 collects emergency contacts and shows crisis numbers. It does **not** call anyone. Users asked who gets contacted when risk is moderate / high / urgent. This section is the spec.

### 5.1 Shared rules (all models)

- **Bands in product:** `moderate` · `high` · `urgent`. (`low` / `medium` stay in-app clinician alerts only; they are not part of this consent.)
- **Always, with no consent switch:** in-app crisis card (995, SOS 1767, IMH 6389 2222) on flagged Buddy messages, Resources, and any urgent empty state.
- **Never in this architecture (and not in v1):** auto-dial 995 or SOS; claiming “we will call an ambulance”; 24/7 human monitoring; notifying an employer or family member who is not on the contact list.
- **“Call” in user copy means “notify.”** First implementation of v2 contact is: **in-app + push to clinician**, **SMS to emergency contact**. Live voice calls are out of scope until a later ops review.
- **Imminent harm override (narrow):** The **platform** does not break the matrix. A **linked clinician**, acting under professional duty, may contact the patient or emergency services **outside** the app. The app shows them the current matrix and the primary contact number. We log “clinician viewed emergency contacts at {time}.”
- **No clinician (solo):** clinician columns are hidden. Copy: “You don’t have a clinician linked. We can notify a person you trust, and we will always show Singapore crisis lines.”
- **No emergency contact on file:** we do not invent one. Urgent UI: “Add someone we can text if things get urgent” + crisis numbers. Do not block Buddy or check-in.
- **False positives:** clinician can rate/dismiss alerts (v1). Emergency-contact SMS should be reserved for **high** (optional) and **urgent** (default) so we do not cry wolf.

Severity mapping for this consent (classifier / rules engine — clinical lead to ratify before notify goes live):

| Band | Examples (illustrative, not the clinical protocol) |
|---|---|
| Moderate | Sustained low mood, isolation language, sleep collapse without self-harm |
| High | Active suicidal ideation without plan/intent; severe panic with functional collapse |
| Urgent | Intent + plan, current self-harm, harm to others, inability to keep self safe |

Until that protocol is signed, **do not send outbound SMS**, even if the UI for the matrix is built. Collecting the policy is allowed; firing it is not.

### 5.2 Three workable models

#### Model A — Full matrix (most control)

For each band, patient picks any of: in-app only · notify clinician · notify emergency contact.

```
            | In-app resources | Clinician notify | Emergency-contact SMS
------------|------------------|------------------|----------------------
Moderate    | always           | choose           | choose
High        | always           | choose           | choose
Urgent      | always           | choose           | choose
```

- **Pros:** Matches “consent by severity band” literally. Honest.
- **Cons:** 6 choices (linked) or 3 (solo). Easy to mis-set (urgent → nobody).
- **Mitigation:** Warn on “Urgent: nobody” — “We still will not call 995. Please add a person or keep clinician notify on.” Allow them to proceed.

#### Model B — Threshold + recipients (simplest)

Two questions:

1. “Start contacting people when risk is **High or above** / **Urgent only**.”
2. “Who: my clinician / my emergency contact / both.”

- **Pros:** Fast onboarding. Harder to create a nonsense matrix.
- **Cons:** Cannot say “text my sister only at urgent, but let my clinician see high alerts.” That is a real request.

#### Model C — Urgent-only outbound (safest legally, weakest vs user request)

Outbound SMS only at **urgent**, to the primary emergency contact, plus clinician in-app for high+urgent if linked. Moderate never leaves the app.

- **Pros:** Lowest false-positive harm. Easy policy.
- **Cons:** Users asked for bands. High-risk-but-not-urgent isolation is invisible to family.

### 5.3 Recommended default: Model A with opinionated defaults

Ship the **matrix** (A) so the user request is honoured, but pre-fill it so almost nobody has to think in onboarding. Settings can edit every cell.

**Linked patient — recommended pre-fill**

| Band | In-app crisis card | Clinician (in-app + push) | Emergency-contact SMS |
|---|---|---|---|
| Moderate | On (not optional) | **On** | Off |
| High | On | **On** | Off |
| Urgent | On | **On** (not offered as off without a warning) | **On** if a primary contact exists, else Off + prompt to add |

Urgent × clinician: default on. Patient may turn it off after a warning: “Your clinician will not be notified in-app either. Crisis numbers will still be shown to you.”

**Solo patient — recommended pre-fill**

| Band | In-app crisis card | Clinician | Emergency-contact SMS |
|---|---|---|---|
| Moderate | On | Hidden | Off |
| High | On | Hidden | Off |
| Urgent | On | Hidden | **On** if a primary contact exists; else prompt |

**Copy for the urgent + contact cell (solo):**  
“Text {Name} ({relationship}) that I’m in urgent distress, and remind them this is not 995. I can also call SOS 1767.”

**SMS content (fixed template, no journal/Buddy body):**

> {Patient first name} asked Therapy & Beyond to message you if they may be at urgent risk. This is not an ambulance. If you believe they are in danger now, call 995. SOS: 1767. They listed you as {relationship}.

Do not include diagnosis, scores, transcripts, or location (we do not collect location).

**Clinician notify content (in-app alert `risk_warning` / `ai_chat_flag`):**

> {Patient} · {band} · {source: check-in | journal | Buddy} · {time SGT}.  
> Contact policy: clinician {yes/no} · emergency contact {yes/no, name only}.

### 5.4 Why not the other models as default

- **B** is the fallback if usability testing shows the matrix is abandoned. Keep the data model capable of A so we can collapse to B in UI only.
- **C** is the fallback if counsel forbids family SMS at high. Then freeze high × emergency-contact as always Off.

### 5.5 Changing the matrix mid-care

Immediate. Next event uses the new policy. Past alerts stay. If they turn off urgent SMS after a message was already sent, we do not send a follow-up “ignore that.”

Clinician sees the live matrix on the patient header. If urgent clinician-notify is off, the header shows a visible **“Urgent alerts muted by patient”** chip so the clinician does not assume silence = safety.

---

## 6. UX

### 6.1 Where it lives

**Do not put eight toggles on one onboarding screen.** Required legal accepts stay blocking. Feature consents are just-in-time + Settings.

```
Sign up → (clinician select or solo) → Consent onboarding (required) → Walkthrough → Home
                                              ↓
                         first Journal / first Buddy / first link clinician
                                              ↓
                              Settings → Your Data & Privacy (source of truth)
```

#### Onboarding (patient) — still three beats, slightly richer

**Beat 1 — Purpose (keep).** Check-ins exist to help *their* clinician (or themselves if solo). Not marketing. Research is **not** mentioned as “never” here once v2 ships; say “not used for research unless you later opt in.”

**Beat 2 — Sharing you can change.**

- Check-in sharing: locked on with explanation if they already picked a clinician; if solo, locked-on *intent* with “nothing is shared until you link.”
- Journal sharing with clinician: switch, default per §0. Hidden if solo (“You’ll choose this if you link someone”).
- AI transcription: switch, default on.
- Buddy storage: segmented control **Keep private (recommended)** | **Save conversations**. One line on clinician visibility.

Do **not** put the full risk matrix on Beat 2.

**Beat 3 — Agree.** Privacy Policy checkbox + sensitive-data checkbox (as today). Primary button: “Agree and continue.” Research is **not** on this screen.

**Beat 3b — Safety contacts (new, skippable, after Agree).**  
Not blocking. Title: “If things get urgent.” Add/confirm primary emergency contact. Show the **pre-filled matrix** as a compact 3-row table. CTA: “Use recommended settings” (default) or “Customise.” Skip = recommended defaults + no contact (solo urgent SMS stays off until they add someone).

Clinician onboarding: DPA only, as today. Later, clinician Settings should show their own DPA version and a read-only explanation of patient consents they will see on each file.

#### Settings — `PrivacyData.tsx` becomes the control panel

Sections, in order:

1. **Who can see what** — named clinician or “No clinician linked.”
2. **Check-ins** — sharing status; pause/resume if linked.
3. **Voice journals** — transcription; clinician access; last changed date.
4. **Chat Buddy** — Stored / Ephemeral; what happens to old threads.
5. **If I’m at risk** — matrix + primary contact + “this is not 24/7 monitoring.”
6. **Research** — off by default.
7. **Policy** — version, date accepted, link to `/privacy`.
8. **Your rights** — Export · Correct · Delete (with the receipt in §4.3).

Every optional row is a `Switch` or the 3-row matrix. Helper text states the **effect**, not the legal theory.

#### Just-in-time

| First time they… | Show |
|---|---|
| Hit record on Journal | Who will hear this + transcription state. Replaces current modal. |
| Send first Buddy message | Store vs ephemeral. Cannot send until they pick. Pre-select ephemeral. |
| Link a clinician from Profile | Re-consent sheet (§6.3) |
| Classifier wants to SMS an emergency contact and they have no contact | “Add someone now or we’ll only show you crisis numbers.” |

### 6.2 Withdraw mid-care

| Consent withdrawn | Patient sees | Clinician sees | Product does |
|---|---|---|---|
| `ai_transcription` | “New recordings won’t be transcribed.” | If they still have journal access: audio only for new entries | Skip transcribe job |
| `clinician_journal_access` | “{Name} can no longer play your journals.” | Chip + empty journal/insight-from-journal | RLS deny; no new insight from audio |
| `ai_chat_storage` | Mode flips to ephemeral; offer delete of unviewed history | AI Buddy tab empty going forward; old viewed threads remain unless delete request | New messages not persisted |
| `research_participation` | “You’re out of research. Past anonymous stats stay.” | Nothing | Stop extracts |
| Check-in sharing | “Your clinician won’t see new check-ins. You can still log.” | “Sharing paused” + last shared timestamp | RLS hide new rows |
| Risk matrix cell | Immediate | Updated chips; “Urgent muted” if applicable | Next event uses new policy |
| Privacy / sensitive data | Account-close flow only | Standard discharge / unlink process | Cannot use the app |

**Do not log the patient out** for optional withdrawals.  
**Do not** require the clinician to “approve” a withdrawal.

If withdrawing journal access or check-in sharing, show: “This does not delete what {Name} already wrote in session notes.”

### 6.3 Linking a clinician later (currently missing)

`SelectClinician` today: “They’ll be able to see your check-ins and Chat Buddy summaries.” That is inaccurate under v2 and too weak even for v1 behaviour.

**Link sheet, required before `provision_patient_with_clinician` succeeds:**

1. Check-ins: default **share from today** + optional “include last 30 days.” Full-history is a nested choice.
2. Voice journals: default **off** (they were solo; privacy-preserving). Opt in to share all / share future only.
3. Buddy: if storage is on, default **share saved chats**. If ephemeral, explain clinician will not see chats.
4. Risk matrix: reveal clinician columns, pre-fill recommended linked defaults **without** wiping emergency-contact choices they already made.
5. Confirm with the clinician’s name.

Unlinking (future; not in v1): clinician loses **new** access; clinical record remains with the practice.

### 6.4 Clinician visibility of consent state

**Patient header (every tab):**

```
Check-ins: shared | Journals: private | Buddy: ephemeral | Urgent: you + mother
```

Colour: sage = sharing as expected, gold = limited, burgundy = urgent muted / sharing paused.

**Tab empty states**

- Journals / insights-from-journal: “Patient has not shared voice journals.”
- AI Buddy: ephemeral empty state in §4.2.
- Alerts: still list in-app alerts that the matrix allows. If clinician-notify is off for that band, **do not create** a clinician-visible alert for that event (except audit for the safety event itself, visible to DPO / clinical director if we add that role later — **not in v2**).

**Cannot do in-product**

- Force-enable journal access.
- Read ephemeral Buddy.
- Edit the patient’s matrix (they may **ask** the patient in session).

**Audit:** grant, withdraw, link-reconsent, export, delete request, clinician viewing emergency contacts. Reuse `audit_log`.

---

## 7. Data & enforcement (for when we build, not for v1)

### 7.1 Consent rows

Keep append-only inserts. **Fix the client** to send:

```
profile_id, consent_type, granted, policy_version, source, metadata
```

- `source`: `onboarding` | `settings` | `just_in_time` | `link_clinician` | `policy_reprompt`
- `metadata` examples: `{ "share_history": true }`, `{ "protocol_id": "research-2026-09" }`, `{ "matrix_version": "2026-09-01" }`

`current_consents` view: latest row per `(profile_id, consent_type)`.

### 7.2 Risk policy table

```
risk_contact_policies (
  id, patient_id,
  band: moderate | high | urgent,
  notify_clinician boolean not null,
  notify_emergency_contact boolean not null,
  channel_clinician: in_app_push,   -- v2 only
  channel_contact: sms,             -- v2 only
  policy_version text not null,
  created_at timestamptz
)
```

Latest row per `(patient_id, band)` is live. Do not overload `consents.granted` for this.

`emergency_contacts` (already in `0010b_v1_tables.sql`) is the recipient list. Require exactly one `is_primary` for SMS.

### 7.3 RLS / jobs that must honour consents

| Surface | Rule |
|---|---|
| `voice_journals` select by clinician | `is_clinician_for_patient` **and** current `clinician_journal_access` |
| Storage signed URL `voice-journal-audio` | Same check in the signing path |
| `check_ins` select by clinician | current `checkin_data_sharing` **or** row created while sharing was on and still in clinical-record hold (implementation: stamp `shared_with_clinician_at` on insert) |
| `ai_chat_messages` select by clinician | current `ai_chat_storage` **or** message `clinician_viewed_at` not null (clinical hold) |
| `generate-insight` | Omit journals unless access on; omit Buddy unless stored |
| `generate-ai-chat-summary` | Refuse if not stored |
| `ai-chat-reply` | Persist iff `ai_chat_storage`; else cache + optional safety event |
| `transcribe-voice-note` | Skip if `ai_transcription` off (already) |
| Alert fan-out | Read `risk_contact_policies` for the band; do not SMS without it |

Stamp **processing purpose and consent version** on artefacts at creation time (`voice_journals.shared =`, `ai_chat_messages.storage_mode =`) so later withdrawal does not rewrite history semantics.

---

## 8. Privacy Policy changes when v2 ships

Rewrite `/privacy` sections that are now false or incomplete:

- **§1 What we collect** — add Buddy messages (only if stored), safety events, emergency contacts, consent ledger. Split “optional” vs “required.”
- **§2 Why** — remove absolute “not used for research.” Replace with opt-in research + purpose limitation.
- **§3 Who can see it** — journals and Buddy are **not** automatically “you and your assigned clinician.” Describe the toggles. Practice staff under HCSA. Emergency contact receives **template SMS only**, not the health record.
- **§5 Rights** — export / correct / delete with the clinical-record exception and 30-day SLA.
- **§6 Retention** — HCSA ≥ 6 years for clinical records; patient-controlled data deleted on request; consent ledger and audit kept; solo vs linked.
- **§9 AI** — two features: (1) transcription, (2) Buddy ephemeral vs stored. No diagnosis. Vendor + region.
- **New §** — Not an emergency service. Contact matrix. Crisis numbers.

Clinician DPA expandable terms (`DataProcessing.tsx`) must mention Buddy modes, risk SMS, and deletion split.

Until v2 is accepted, **do not** change these screens except typo/hotfix.

---

## 9. What must NOT ship in v1

v1 may keep building safety plans, emergency **contact storage**, coping tools, rateable alerts, adaptive check-ins. It may **not** pretend the v2 architecture exists.

**Do not implement:**

1. New `ConsentType` values or Settings toggles beyond today’s `ai_transcription`.
2. Buddy store vs ephemeral. v1 Buddy stays stored (current behaviour). Do not add a “private mode” half-measure.
3. `clinician_journal_access`. v1 journals stay clinician-readable via existing RLS.
4. Research opt-in, research pipelines, or “help us improve with your data” checkboxes.
5. Risk-band contact matrix UI, outbound SMS, outbound email, auto-calls.
6. Auto-dial 995 / SOS / IMH. Ever, unless a future licensed protocol says otherwise — **not v1, not first v2 cut**.
7. 24/7 monitoring language, “we will call your mum,” “clinician is watching your Buddy.”
8. Real delete/export that **wipes clinical records** or silently no-ops. If a button appears in v1, it must be “Request via DPO” only — prefer **no button** until §4.3 ships.
9. NEHR / Health Information Bill contribution.
10. Caregiver, parent, or multi-clinician sharing consents.
11. Per-entry journal sharing (“share this one recording”).
12. Stored-but-hidden-from-clinician Buddy.
13. Splitting journal audio vs transcript into two consents.
14. Location sharing, wearable ingest, microphone always-on.
15. Changing required consents (`privacy_policy`, `sensitive_data_processing`, `dpa_acceptance`, linked `checkin_data_sharing`).
16. Using `ai_transcription` as a proxy for Buddy or journal sharing — copy-only fixes that imply v2 behaviour are also banned if they would lie (today’s Journal line “for your clinician” is already slightly over-broad for solo users; do not expand it).
17. Firing `risk_warning` SMS from the new alert types added in `0010_v1_safety_checkins_clinician.sql`.

**v1 may:**

- Store emergency contacts for later.
- Show 995 / 1767 / 6389 2222.
- Create in-app clinician alerts (`high` / `urgent` included).
- Keep the three-step Consent + DPA + Privacy Policy as they are.
- Keep solo patients.

---

## 10. Sequencing after acceptance

Build in this order so we never show a toggle the backend cannot honour.

| Step | Ship | Depends on |
|---|---|---|
| 0 | Counsel sign-off on §4.3 (HCSA vs delete) and §5 (family SMS) | This doc |
| 1 | `policy_version` + `source` + `metadata` on inserts; consent audit events | — |
| 2 | Clinician header chips (read-only, mapped from **current** consents only: transcription + sharing) | 1 |
| 3 | `clinician_journal_access` + RLS + Journal modal copy + insight job | 1 |
| 4 | `ai_chat_storage` + `ai-chat-reply` ephemeral path + clinician empty state | 1 |
| 5 | Link-clinician re-consent sheet | 3, 4 |
| 6 | Settings rebuild (`PrivacyData.tsx`) + Privacy Policy rewrite | 3–5 |
| 7 | `risk_contact_policies` UI + storage; **no SMS yet** | 1, emergency_contacts |
| 8 | SMS fan-out behind a feature flag, after clinical protocol sign-off | 7, 0 |
| 9 | Export + classified delete | 0, 3, 4 |
| 10 | `research_participation` | Policy rewrite, protocol id |

Native app and web share Supabase. These consents must land in **one** schema, then both clients. Do not fork policy text.

---

## 11. Open items for counsel / clinical lead (do not block the product defaults above)

1. Exact HCSA retention clock (adults vs minors; start = last encounter vs last data point).
2. Whether a clinician-viewed Buddy thread is a medical record.
3. Whether solo-user data becomes a medical record **retroactively** on link if the patient shares history (recommended: yes, for the slice they share).
4. SMS to emergency contacts: PDPA deemed consent vs explicit; template wording; sender ID.
5. Age gate for research (recommended hide &lt; 21).
6. Whether “urgent × clinician notify off” is compatible with the practice’s professional-indemnity stance. Product default keeps it on.

---

## 12. Copy bank (use these strings)

**Buddy first-use**

> Chat Buddy can remember this conversation, or keep it private.  
> **Keep private (recommended)** — Replies still work. We don’t save the chat. Your clinician can’t read it.  
> **Save conversations** — You can re-read them. If you have a clinician, they can read them too.  
> Either way, this is not therapy and not an emergency service. If you’re in danger now: 995 · SOS 1767 · IMH 6389 2222.

**Journal first-use (linked, sharing on)**

> Recordings are stored securely in Singapore. {Clinician} can listen and, if you allowed AI transcription, read the text. You can stop sharing in Your Data & Privacy.

**Journal first-use (private)**

> This journal is yours. Your clinician cannot play it unless you turn on sharing.

**Urgent muted chip (clinician)**

> Urgent in-app alerts are off. Silence does not mean the patient is safe. Crisis lines are still shown to them.

**Research**

> Off unless you turn it on. We would only use de-identified check-in patterns, never your voice, chats, or name.

---

## 13. Decision log

| # | Decision | Default |
|---|---|---|
| D1 | Separate consents, versioned, independently withdrawable | Yes |
| D2 | Buddy storage default | **Ephemeral** |
| D3 | Stored Buddy visible to assigned clinician | **Yes** (no hide-from-clinician mode) |
| D4 | Journal sharing default | **On if linked, off if solo** |
| D5 | Transcription default | **On** (already) |
| D6 | Research default | **Off** |
| D7 | Risk contact model | **A (matrix) with recommended pre-fill** |
| D8 | Auto-dial emergency services | **Never in v1 / first v2** |
| D9 | Platform override of withdrawn contact | **No**; clinician may act outside the app |
| D10 | Delete vs HCSA | **Classified delete**; clinical records retained |
| D11 | Link-clinician | **Re-consent**; do not silent-share journals |
| D12 | v1 extra checkboxes | **Forbidden** until this doc is accepted |

If product, DPO, and clinical lead initial D1–D12, engineering may implement from §10 step 1.
