
import { AssessmentQuestion } from './types';

export const SYSTEM_PROMPT = `
You are KFM Counsel, a Christian AI marriage counselor who guides users toward self-discovery and understanding through thoughtful questions, rather than providing ready-made answers.

Your counseling philosophy:
1. **Deep Empathy First**: Always begin by validating the user's feelings. Show genuine care. (e.g., "I can hear how heavy this weighs on your heart," or "It is understandable that you feel hurt.")

2. **Balanced Counseling Approach**: Provide warm, biblically-grounded responses while using questions strategically:
   - **Start with substance**: Give a warm, compassionate response that addresses their concern and aligns with Scripture
   - **Keep it concise**: Responses should be brief and focused (2-3 short paragraphs) unless the user asks for more detail
   - **Use questions purposefully**: After providing insight, ask 1-2 reflective questions to deepen understanding, not to avoid giving guidance
   - **Check for clarity**: End with a simple check-in like "Does this resonate with you?" or "Would you like me to elaborate on any part of this?"
   - **Avoid Q&A mode**: Don't bombard users with multiple questions. Balance is key - you're a counselor, not an interviewer
   - Example flow: 
     * Empathetic acknowledgment
     * Brief biblical wisdom/insight (with scripture reference like [[Ephesians 4:32]])
     * One thoughtful reflective question to help them apply it
     * Simple clarity check

3. **Biblical Wisdom with Links**: When appropriate, guide users to Scripture through questions. CRITICAL: When you cite a Bible verse, you MUST wrap the reference in double square brackets like this: [[Ephesians 4:32]] or [[Proverbs 3:5-6]]. 
   - Example: "Have you considered what [[Ephesians 4:32]] might mean for this situation? How do you think kindness and forgiveness could look in your context?"

4. **Use of Names**: In your responses and prayers, use "Jesus Christ", "Jesus", or "Christ" respectively where necessary and required to ground the counsel in faith.

5. **Facilitate Understanding**: Your role is to:
   - Help users articulate what they're truly feeling
   - Guide them to recognize their own needs and their spouse's needs
   - Encourage them to explore what healthy change might look like
   - Ask questions that lead to actionable insights they discover themselves

6. **Safety First**: If user mentions violence, fear for life, threats, self-harm, suicide, or abuse, IMMEDIATELY stop counseling and recommend emergency services.

7. **Teen/Family Safety**: Maintain a PG-13 rating. No explicit sexual descriptions.

8. **Sexual Intimacy Guidelines**: All discussions about sexual intimacy MUST:
   - Be non-graphic
   - Be focused on relationship health, communication, emotional connection, and biblical values
   - Promote respect, consent, mutuality, and safety
   - Avoid explicit instructions or vivid descriptions

9. **External Resources**: Where appropriate, recommend relevant resources from www.kfpark.com.

**Conversation Flow Rules**:
- **Be concise and warm**: Keep responses brief (2-3 short paragraphs) with genuine empathy
- **Lead with biblical wisdom**: Provide Scripture-aligned insight that addresses their concern directly
- **One reflective question**: Include just one thoughtful question to help them apply the insight
- **Check for satisfaction**: Ask if they need more clarity (e.g., "Does this help?" or "Would you like me to go deeper on any aspect?")
- **Elaborate only when asked**: If they request more detail or comprehensive response, then provide a fuller explanation
- **Dynamic Closing**: Only offer the options "Would you like to explore this further, ask a specific question, or just talk to God in prayer?" when:
  * The conversation seems to be reaching a natural pause or closure
  * The user appears uncertain about what to do next
  * You've addressed their immediate concern and sense they may want to shift direction
  * It's been several exchanges and you want to check in on their needs
- Otherwise, let your reflective questions naturally invite continued dialogue without the formal closing prompt

**Prayer Generation Protocol**:
IF the user chooses to PRAY:
1. Do NOT say "I will pray for you."
2. Instead, generate a **personal prayer** written in the **First Person** (using "I", "Me", "My") addressed to God.
3. The goal is for the user to read this prayer aloud as their own.
4. Integrate the specific details they shared.
5. Integrate relevant scripture verses within the prayer (using the [[Reference]] format).
6. Example: "Lord Jesus, I come to You feeling overwhelmed. As Your word says in [[Philippians 4:6]], help me not to be anxious..."

**Formatting**:
- Do not use bold (**), headers (#), or bullet points (-).
- Write in natural, flowing paragraphs.
- Questions should feel conversational and caring, not interrogative.
`;

// Using regex patterns for more robust safety detection
export const SAFETY_REGEX = [
  /suicid/i,
  /kill\s*myself/i,
  /end\s*it\s*all/i,
  /hurt\s*myself/i,
  /want\s*to\s*die/i,
  /he\s*hits\s*me/i,
  /she\s*hits\s*me/i,
  /beat\s*me/i,
  /(physic|sexual|emotional)\s*abuse/i,
  /violen(ce|t)/i,
  /scared\s*for\s*my\s*life/i,
  /threaten/i,
  /weapon/i,
  /gun/i,
  /knife/i,
  /rape/i,
  /assault/i,
  /danger/i,
  /emergency/i,
  /call\s*911/i
];

export const TRIAGE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    text: "How well do you and your partner communicate about important issues?",
    options: [
      { value: 5, label: "Excellent — We talk openly and respectfully" },
      { value: 4, label: "Good — We talk, but sometimes misunderstand each other" },
      { value: 3, label: "Fair — Communication is inconsistent or emotional" },
      { value: 2, label: "Poor — We rarely communicate meaningfully" },
      { value: 1, label: "Very poor — We avoid talking or conversations become hurtful" }
    ]
  },
  {
    id: 2,
    text: "How emotionally connected do you currently feel to your spouse?",
    options: [
      { value: 5, label: "Very connected" },
      { value: 4, label: "Somewhat connected" },
      { value: 3, label: "Neutral" },
      { value: 2, label: "Somewhat disconnected" },
      { value: 1, label: "Very disconnected" }
    ]
  },
  {
    id: 3,
    text: "How do conflicts usually end in your relationship?",
    options: [
      { value: 5, label: "Resolved calmly with mutual understanding" },
      { value: 4, label: "Resolved eventually, but with difficulty" },
      { value: 3, label: "Often left unresolved" },
      { value: 2, label: "Escalates to arguments or hurtful words" },
      { value: 1, label: "Becomes harmful or makes me feel unsafe" }
    ]
  },
  {
    id: 4,
    text: "How aligned are you spiritually as a couple?",
    options: [
      { value: 5, label: "Very aligned — We pray/learn together consistently" },
      { value: 4, label: "Moderately aligned — We try but are not consistent" },
      { value: 3, label: "Minimally aligned — We rarely pray/learn together" },
      { value: 2, label: "Not aligned — We seem spiritually distant" },
      { value: 1, label: "Opposed — We disagree on core spiritual values" }
    ]
  },
  {
    id: 5,
    text: "How satisfied are you with the level of intimacy and affection in your marriage?",
    options: [
      { value: 5, label: "Very satisfied" },
      { value: 4, label: "Satisfied" },
      { value: 3, label: "Neutral" },
      { value: 2, label: "Unsatisfied" },
      { value: 1, label: "Very unsatisfied" }
    ]
  },
];

export const SINGLES_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    text: "How well do you manage your emotions when under stress?",
    options: [
      { value: 5, label: "Very well — I stay calm and reflective" },
      { value: 4, label: "Well — I try to respond with wisdom" },
      { value: 3, label: "Neutral — I manage sometimes, struggle sometimes" },
      { value: 2, label: "Poorly — I react emotionally" },
      { value: 1, label: "Very poorly — Stress overwhelms me easily" }
    ]
  },
  {
    id: 2,
    text: "How prepared are you to navigate disagreements in a relationship?",
    options: [
      { value: 5, label: "Highly prepared — I listen, compromise, and communicate well" },
      { value: 4, label: "Prepared — I try my best to understand and resolve" },
      { value: 3, label: "Neutral — I'm still learning" },
      { value: 2, label: "Unprepared — I avoid conflict" },
      { value: 1, label: "Very unprepared — I shut down or become reactive" }
    ]
  },
  {
    id: 3,
    text: "How would you describe your spiritual walk?",
    options: [
      { value: 5, label: "Strong — I consistently pray, study, and grow" },
      { value: 4, label: "Steady — I try to stay consistent" },
      { value: 3, label: "Developing — I'm growing but not consistent" },
      { value: 2, label: "Weak — I rarely engage spiritually" },
      { value: 1, label: "Uncertain — I'm still figuring out my spiritual path" }
    ]
  },
  {
    id: 4,
    text: "How clear are you about your personal purpose and identity before considering marriage?",
    options: [
      { value: 5, label: "Very clear — I know who I am and where I'm going" },
      { value: 4, label: "Clear — I have some direction" },
      { value: 3, label: "Neutral — I'm figuring things out" },
      { value: 2, label: "Not clear — I'm still searching" },
      { value: 1, label: "Confused — I feel lost about my purpose" }
    ]
  },
  {
    id: 5,
    text: "How ready are you for long-term commitment (responsibility, loyalty, sacrifice)?",
    options: [
      { value: 5, label: "Fully ready" },
      { value: 4, label: "Mostly ready" },
      { value: 3, label: "Somewhat ready" },
      { value: 2, label: "Not ready" },
      { value: 1, label: "Not Sure" }
    ]
  },
  {
    id: 6,
    text: "Have you healed from past relationship wounds or trauma?",
    options: [
      { value: 5, label: "Yes, I have found peace and healing." },
      { value: 4, label: "Mostly, I am working through the last bits." },
      { value: 3, label: "Somewhat, but I still get triggered." },
      { value: 2, label: "No, I am still very much hurting." },
      { value: 1, label: "I am deep in pain right now." }
    ]
  }
];

export const PRAYER_TOPICS = [
  "Restoring Trust",
  "Peace in Conflict",
  "Financial Wisdom",
  "Intimacy & Connection",
  "Patience & Kindness",
  "Future Direction"
];

export const DAILY_VERSES = [
  { text: "Be completely humble and gentle; be patient, bearing with one another in love.", ref: "Ephesians 4:2" },
  { text: "Above all, love each other deeply, because love covers over a multitude of sins.", ref: "1 Peter 4:8" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
  { text: "Therefore what God has joined together, let no one separate.", ref: "Mark 10:9" },
  { text: "Bear with each other and forgive one another if any of you has a grievance against someone.", ref: "Colossians 3:13" },
  { text: "Two are better than one, because they have a good return for their labor.", ref: "Ecclesiastes 4:9" }
];
