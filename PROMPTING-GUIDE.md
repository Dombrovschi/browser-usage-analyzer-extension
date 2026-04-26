# Prompting Guide — How to Work with LLMs on This Project

A practical guide written as we build this browser extension together.

---

## 1. The Anatomy of a Good Prompt

A strong prompt has four parts:

```
[CONTEXT]   → Where are we? What are we building? What files exist?
[TASK]      → What exactly do you want me to do?
[CONSTRAINTS] → Any limitations? Style preferences? Things to avoid?
[OUTPUT]    → What format should the response be in?
```

### Before (vague):
> "Write the background script for my extension."

The LLM has no idea what your extension does, what storage schema you're using, or how it connects to other files.

### After (good):
> "This is a Chrome MV3 extension that tracks active browsing time. The storage layer in `src/lib/storage.js` provides `addTime(domain, ms)` and `getDailyData()`. The tracker in `src/lib/tracker.js` has a `Tracker` class with `start()`, `stop()`, and `getElapsed()`. Now I need the background service worker (`src/background.js`) to listen for tab switches, start/stop the tracker, and flush accumulated time to storage every 2 seconds. Don't add extra features — just the core tracking loop."

**Result:** The LLM knows the schema, the APIs available, the file it's editing, and the boundaries of the task.

---

## 2. One Feature at a Time

**Don't do:** "Build the whole extension."
**Do:** "Let's implement step 3 — the background tracker."

Why: 
- Each step builds on the previous one
- You can test and verify each piece
- If something breaks, you know exactly which change caused it
- The LLM stays focused and produces better code

This project is already structured as sequential steps for this reason.

---

## 3. Context Is Everything

When starting a new session, **paste the contents of `AGENTS.md`** into the chat. This gives the LLM:

- Project overview and goals
- Data schema (so it writes compatible code)
- Tech stack decisions (MV3, Vite, vanilla JS)
- What's already been built
- What's planned next
- Coding conventions

Without this, the LLM starts from scratch and might make incompatible choices.

---

## 4. Stating Constraints Upfront

Be explicit about what you *don't* want:

- "Don't add comments to the code."
- "Use `const` and `let`, never `var`."
- "Don't import any external libraries."
- "Keep the popup under 300px wide."
- "Don't refactor existing code — just add the new feature."

This saves a round-trip of me asking for clarification.

---

## 5. Debugging with LLMs

When something breaks, show me:

1. **The error message** (full text, from the console)
2. **The relevant code** (the function that's failing)
3. **What you expected** vs what happened
4. **What you've already tried**

### Example:
> "In the popup, `formatDuration` shows NaN instead of a time string. The code calls `formatDuration(undefined)`. Here's the popup/index.js file. I tried adding a console.log but it still shows NaN."

This tells me exactly where to look, what the symptom is, and what you tried.

---

## 6. Iterative Refinement

If I generate code that's not quite right, you can:

- **Point to the specific line**: "In background.js line 24, the domain extraction fails for URLs without http."
- **Describe the behavior you want instead**: "I want it to show 'No site detected' instead of crashing."
- **Ask for alternatives**: "This works but feels fragile. Can you make it more robust?"

Don't rewrite it yourself — describe the fix and let me do it. That way AGENTS.md stays in sync.

---

## 7. Common Prompt Patterns for This Project

### Adding a new feature to an existing file:
> "In `src/lib/storage.js`, I need a new function `clearTodayData()` that removes all entries for today from `dailyData`. Follow the same pattern as the existing functions."

### Modifying behavior:
> "The `extractDomain` function in utils.js currently strips 'www.' but I want it to also strip 'm.' (mobile subdomain). Update the regex."

### Creating a new component:
> "I need a new file `src/lib/notifications.js`. It should have a function `showWarning(domain, timeRemaining)` that uses `chrome.notifications.create` to show a warning. Look at `storage.js` for the code style we use."

### Asking for a refactor:
> "The tracker.js file is getting complex. Can you split the limit-checking logic into a separate `src/lib/limitChecker.js`? Keep the `Tracker` class focused only on tracking start/stop/elapsed."

---

## 8. When to Start Fresh vs Continue

**Start fresh when:**
- You're beginning a new session after closing the chat
- The task is completely unrelated to what we were just doing
- You switched to a different LLM tool

**Continue when:**
- We're in the middle of a feature (it remembers the conversation)
- You're iterating on the same piece of code
- You want to fix or tweak something I just generated

When starting fresh, paste AGENTS.md first!

---

## 9. You're Already Doing Well

Things you did right in your first prompt:

- **Described the goal in plain language:** "track time per website, block sites, dashboard"
- **Stated your learning goal:** "I want to learn how to work with LLMs"
- **Set the process constraint:** "I want an iterative process, not one-shot"
- **Asked for meta-guidance:** "How should I approach this?"
- **Accepted suggestions:** When I offered documents like AGENTS.md, you said yes

One thing to try next time: **explicitly state the output format you want**. For example: *"First give me the plan in bullet points, then ask clarifying questions, then once I approve, start implementing step 1."* This way I know the exact structure you're looking for.

---

## 10. Practice Exercise

After reading this, try writing a prompt for Step 2 (implementing the full background tracker):

> *"We're building a Chrome MV3 extension. AGENTS.md is up to date with our schema and structure. I want to implement Step 3: the background.js tracker. It should listen for tab switches, start/stop the Tracker from tracker.js, and flush time to storage every 2 seconds using addTime() from storage.js. Don't add alarms or blocking yet — just the core tracking loop."*

That's a solid prompt. It gives context, a clear task, and boundaries.
