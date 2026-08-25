export const RESOURCE_CATEGORIES = ['All', 'Anxiety', 'Sleep', 'Mindfulness', 'CBT'] as const;

export type ResourceCategory = Exclude<(typeof RESOURCE_CATEGORIES)[number], 'All'>;
export type ResourceType = 'Exercise' | 'Worksheet' | 'Guide' | 'Audio';

export type ResourceStep =
  | { kind: 'read'; title: string; body: string }
  | { kind: 'breathe'; title: string; inhale: number; hold: number; exhale: number; holdAfter: number; rounds: number }
  | { kind: 'prompt'; title: string; body: string; placeholder: string; multiline?: boolean }
  | { kind: 'check'; title: string; body: string; items: string[] }
  | { kind: 'timer'; title: string; body: string; seconds: number; cue?: string }
  | { kind: 'scan'; title: string; body: string; regions: { name: string; seconds: number }[] };

export interface GuidedResource {
  id: string;
  category: ResourceCategory;
  title: string;
  desc: string;
  duration: string;
  type: ResourceType;
  intro: string;
  steps: ResourceStep[];
  close: string;
}

export const RESOURCES: GuidedResource[] = [
  {
    id: 'box-breathing',
    category: 'Anxiety',
    title: 'Box Breathing Technique',
    desc: 'A 4-step breathing exercise for acute anxiety management.',
    duration: '5 min',
    type: 'Exercise',
    intro: 'Box breathing gives your nervous system a square rhythm: in, hold, out, hold. Sit comfortably. You will do four rounds. Skip this if breath-holding feels unsafe — just breathe slowly instead.',
    steps: [
      {
        kind: 'read',
        title: 'Get ready',
        body: 'Put both feet on the floor. Rest a hand on your belly if you like. Breathe in through the nose, out through the mouth. The timer will count each side of the “box” for 4 seconds.',
      },
      { kind: 'breathe', title: 'Round 1 of 4', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, rounds: 1 },
      { kind: 'breathe', title: 'Round 2 of 4', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, rounds: 1 },
      { kind: 'breathe', title: 'Round 3 of 4', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, rounds: 1 },
      { kind: 'breathe', title: 'Round 4 of 4', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, rounds: 1 },
      {
        kind: 'prompt',
        title: 'Notice',
        body: 'How does your body feel compared with a minute ago? One word is enough.',
        placeholder: 'e.g. a little slower, still tight, more present…',
      },
    ],
    close: 'You can repeat a round any time anxiety spikes. This is a skill, not a test.',
  },
  {
    id: 'thought-record',
    category: 'CBT',
    title: 'Thought Record Sheet',
    desc: 'Identify and challenge cognitive distortions using a structured CBT worksheet.',
    duration: '10 min',
    type: 'Worksheet',
    intro: 'A thought record slows a hot thought down so you can see it, not fight it. Write what is true enough for now. You can skip any box.',
    steps: [
      {
        kind: 'prompt',
        title: 'The situation',
        body: 'What happened? Where were you, who was there, what triggered this?',
        placeholder: 'e.g. After the team meeting, walking back to my desk…',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Emotion',
        body: 'Name the feeling and roughly how strong it is (0–100).',
        placeholder: 'e.g. Shame 70, anxiety 55',
      },
      {
        kind: 'prompt',
        title: 'Automatic thought',
        body: 'What ran through your mind, as a sentence? Include “I” if it is about you.',
        placeholder: 'e.g. They all think I am incompetent.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Evidence that supports it',
        body: 'Facts only — what a camera would have seen, not interpretations.',
        placeholder: 'e.g. I stumbled on the second slide.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Evidence that does not',
        body: 'What else is true? What would you say to a friend in the same spot?',
        placeholder: 'e.g. My manager asked a follow-up, which usually means they were listening.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Balanced thought',
        body: 'Write a fairer sentence that includes both sides. It does not need to be cheerful.',
        placeholder: 'e.g. I had a clumsy moment. That does not mean I am incompetent.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Emotion now',
        body: 'Name the feeling again and the intensity (0–100). A small drop still counts.',
        placeholder: 'e.g. Shame 40, anxiety 35',
      },
    ],
    close: 'Keep the balanced thought somewhere you can see it. Bring this sheet to session if it would help.',
  },
  {
    id: 'sleep-hygiene',
    category: 'Sleep',
    title: 'Sleep Hygiene Guide',
    desc: 'Evidence-based practices to improve sleep quality and duration.',
    duration: '3 min read',
    type: 'Guide',
    intro: 'Sleep hygiene is a set of levers, not a personality test. Tick what you already do, then pick one change for tonight only.',
    steps: [
      {
        kind: 'check',
        title: 'What is already in place?',
        body: 'Check anything that is mostly true for you this week.',
        items: [
          'I have a roughly consistent wind-down time',
          'The bedroom is dark and cool enough',
          'I keep caffeine to the morning',
          'Screens dim or stop in the last hour before bed',
          'I get some daylight in the first half of the day',
          'I get out of bed if I am awake for more than ~20 minutes',
        ],
      },
      {
        kind: 'read',
        title: 'One change tonight',
        body: 'Pick a single lever. Common first moves: same lights-out window (±30 min), no caffeine after 2pm, or leaving the bed if you are spinning. Doing all of them at once usually backfires.',
      },
      {
        kind: 'prompt',
        title: 'My one experiment',
        body: 'Write the one thing you will try tonight, in a sentence you could text a friend.',
        placeholder: 'e.g. Phone charges in the kitchen after 11.',
        multiline: true,
      },
    ],
    close: 'If sleep is a long-standing problem, mention it in your next check-in or session. This guide is a starting point, not a diagnosis.',
  },
  {
    id: 'grounding-54321',
    category: 'Mindfulness',
    title: '5-4-3-2-1 Grounding',
    desc: 'A sensory grounding technique for managing dissociation and panic episodes.',
    duration: '7 min',
    type: 'Exercise',
    intro: 'This exercise pulls attention into the room through your senses. Go slowly. If a sense is unavailable, skip it. You are not trying to “empty” your mind.',
    steps: [
      {
        kind: 'read',
        title: 'Plant yourself',
        body: 'Feel your feet, your seat, or your back against the chair. Unclench your jaw if you notice it. We will name things you can already sense — no need to hunt.',
      },
      {
        kind: 'prompt',
        title: '5 things you can see',
        body: 'Look around. List five objects, colours, or details. Ordinary is better than dramatic.',
        placeholder: 'lamp, blue mug, scuff on the wall…',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: '4 things you can feel',
        body: 'Clothes, temperature, the chair, your feet on the floor.',
        placeholder: 'cool air, cotton shirt…',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: '3 things you can hear',
        body: 'Near or far. Traffic, a fridge, your own breath.',
        placeholder: 'fan, distant voices…',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: '2 things you can smell',
        body: 'If nothing is obvious, notice the absence, or walk to a cup of water or soap.',
        placeholder: 'soap, coffee, nothing much…',
      },
      {
        kind: 'prompt',
        title: '1 thing you can taste',
        body: 'Toothpaste, tea, or just the inside of your mouth.',
        placeholder: 'mint, water…',
      },
    ],
    close: 'If you still feel unreal or panicked, repeat the “see” list. Crisis lines are on the Resources page if you need a person.',
  },
  {
    id: 'pmr',
    category: 'Anxiety',
    title: 'Progressive Muscle Relaxation',
    desc: 'Release physical tension by systematically tensing and releasing muscle groups.',
    duration: '15 min',
    type: 'Exercise',
    intro: 'You will tense a muscle group for a few seconds, then let it go and notice the drop. Skip any area that hurts or feels unsafe. Sit or lie down.',
    steps: [
      { kind: 'read', title: 'How each round works', body: 'When the timer starts, gently squeeze that area (about 60% effort). When it ends, drop the tension completely and notice warmth or heaviness.' },
      { kind: 'timer', title: 'Hands and forearms', body: 'Make fists. Squeeze.', seconds: 7, cue: 'Now drop your hands. Notice the difference.' },
      { kind: 'timer', title: 'Shoulders', body: 'Lift your shoulders toward your ears.', seconds: 7, cue: 'Let them fall. Heavier is fine.' },
      { kind: 'timer', title: 'Face', body: 'Scrunch your eyes and jaw for a moment — skip if this stresses your head.', seconds: 5, cue: 'Soften your face. Unclench.' },
      { kind: 'timer', title: 'Belly', body: 'Tighten your abdomen as if bracing.', seconds: 7, cue: 'Let the belly be soft. Breathe low.' },
      { kind: 'timer', title: 'Legs and feet', body: 'Press your feet into the floor and tense your thighs.', seconds: 7, cue: 'Release. Heavy legs are a good sign.' },
      { kind: 'timer', title: 'Whole body rest', body: 'Do nothing. Let the after-feel settle.', seconds: 20, cue: 'Stay here a few more breaths if you want.' },
    ],
    close: 'Tension often comes back. That does not mean it failed — it means your body learned a contrast you can use again.',
  },
  {
    id: 'catastrophizing',
    category: 'CBT',
    title: 'Catastrophizing Worksheet',
    desc: 'Examine and challenge worst-case thinking patterns to reduce anxiety spirals.',
    duration: '12 min',
    type: 'Worksheet',
    intro: 'Catastrophizing jumps to the worst ending as if it were certain. We will walk the thought down a ladder: worst, most likely, and how you would cope even if the worst happened.',
    steps: [
      {
        kind: 'prompt',
        title: 'The worry in one sentence',
        body: 'What is the prediction?',
        placeholder: 'e.g. If I speak up, I will get fired.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Worst case',
        body: 'If it all went badly, what is the actual worst realistic outcome — not a movie plot?',
        placeholder: 'e.g. My manager is annoyed and I feel embarrassed for a week.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Best case',
        body: 'What is a good-enough outcome that is also possible?',
        placeholder: 'e.g. They agree, or they just say “let’s park that.”',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'Most likely',
        body: 'Given how similar moments have gone before, what usually happens?',
        placeholder: 'e.g. Mixed reaction, then we move on.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'If the worst happened',
        body: 'How would you cope for the first 24 hours? Who or what would help?',
        placeholder: 'e.g. Talk to a colleague, write it down, still go home.',
        multiline: true,
      },
      {
        kind: 'prompt',
        title: 'A more useful sentence',
        body: 'Rewrite the original worry so it includes likelihood and coping.',
        placeholder: 'e.g. I might feel awkward. I have handled awkward before.',
        multiline: true,
      },
    ],
    close: 'You do not have to believe the new sentence 100%. Using it as a counterweight is enough for today.',
  },
  {
    id: 'body-scan',
    category: 'Mindfulness',
    title: 'Guided Body Scan',
    desc: 'Develop body awareness and reduce somatic symptoms through mindful attention.',
    duration: '20 min',
    type: 'Audio',
    intro: 'A body scan is slow attention, not hypnosis. If you dissociate easily, keep your eyes open and feel the chair. You can stop at any region.',
    steps: [
      {
        kind: 'read',
        title: 'Settle',
        body: 'Sit or lie down. You will move attention through the body. Nothing to fix. If the mind wanders, that is normal — come back to the region on the screen.',
      },
      {
        kind: 'scan',
        title: 'Scan',
        body: 'Stay with each region until the timer moves on. Notice temperature, pressure, numbness, or nothing at all.',
        regions: [
          { name: 'Feet and toes', seconds: 25 },
          { name: 'Lower legs', seconds: 20 },
          { name: 'Thighs and hips', seconds: 25 },
          { name: 'Belly and lower back', seconds: 25 },
          { name: 'Chest and upper back', seconds: 25 },
          { name: 'Hands and arms', seconds: 20 },
          { name: 'Neck, jaw, and face', seconds: 25 },
          { name: 'Whole body at once', seconds: 30 },
        ],
      },
      {
        kind: 'prompt',
        title: 'What stood out',
        body: 'Any area that was loud, quiet, or surprising? Optional.',
        placeholder: 'e.g. Jaw was clenched; feet felt far away.',
        multiline: true,
      },
    ],
    close: 'A body scan is practice, not a performance. Coming back once is the whole skill.',
  },
  {
    id: 'sleep-restriction',
    category: 'Sleep',
    title: 'Sleep Restriction Protocol',
    desc: 'A clinical protocol for addressing insomnia through controlled sleep scheduling.',
    duration: '5 min read',
    type: 'Guide',
    intro: 'Sleep restriction (more accurately: sleep compression) limits time in bed to the hours you actually sleep, then slowly expands. Do this with a clinician if you have bipolar disorder, a seizure history, or drive for work — it can increase sleepiness at first.',
    steps: [
      {
        kind: 'read',
        title: 'The idea',
        body: 'Long nights in bed “trying” to sleep often fragment sleep. A shorter, consistent window can rebuild sleep drive. This is not the same as forcing yourself to stay awake as punishment.',
      },
      {
        kind: 'prompt',
        title: 'Rough sleep now',
        body: 'About how many hours do you actually sleep on a typical night (not hours in bed)?',
        placeholder: 'e.g. about 5.5 hours',
      },
      {
        kind: 'prompt',
        title: 'A starting window',
        body: 'Pick a fixed wake time you can keep 7 days a week. Your first time-in-bed window is about equal to current sleep time, but not less than 5.5 hours unless a clinician says so. Example: wake 7:00, sleep 5.5h → lights out 1:30.',
        placeholder: 'e.g. In bed 1:00–7:00, out of bed at 7 even if tired',
        multiline: true,
      },
      {
        kind: 'check',
        title: 'Rules of the window',
        body: 'These are the usual constraints. Tick the ones you can commit to this week.',
        items: [
          'Same get-up time every day, including weekends',
          'No going to bed before the window, even if sleepy early',
          'If awake ~20 minutes, leave the bed and do something dim and dull',
          'No extra napping (or cap a nap at 20 minutes before 3pm)',
          'After a week of mostly solid sleep, move bedtime 15 minutes earlier',
        ],
      },
      {
        kind: 'read',
        title: 'Safety',
        body: 'You may be sleepier for a few days. Do not drive if you are dangerously drowsy. If mood drops sharply or you feel manic, stop and contact your clinician.',
      },
    ],
    close: 'Bring the window you chose to your next session. This protocol works best with someone tracking it with you.',
  },
];

export function getResource(id: string | undefined) {
  if (!id) return undefined;
  return RESOURCES.find((r) => r.id === id);
}
