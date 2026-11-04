export function getDangerOptions(tree) {
  const question = tree.questions.find((item) => item.id === "danger");
  return question ? question.options.filter((option) => option.danger) : [];
}

export function isDangerSelected(tree, dangerId) {
  if (!dangerId || dangerId === "none") return false;
  return getDangerOptions(tree).some((option) => option.id === dangerId);
}

/** Whether an option should be shown given the answers collected so far. */
export function isOptionAvailable(option, answers) {
  const conditions = option.available_for;
  if (!conditions) return true;
  return Object.entries(conditions).every(([key, allowed]) => {
    const actual = answers[key];
    // Not answered yet: do not hide anything prematurely.
    if (actual == null) return true;
    return Array.isArray(allowed) ? allowed.includes(actual) : actual === allowed;
  });
}

export function getVisibleOptions(question, answers) {
  if (!question) return [];
  return question.options.filter((option) => isOptionAvailable(option, answers));
}

/** Drop answers that are no longer valid for the current answers (e.g. pregnancy after choosing a child). */
export function pruneAnswers(tree, answers) {
  const valid = { ...answers };
  for (const question of tree.questions) {
    const selected = valid[question.id];
    if (selected == null) continue;
    const visible = getVisibleOptions(question, valid);
    if (!visible.some((option) => option.id === selected)) {
      delete valid[question.id];
    }
  }
  return valid;
}

function matchesRule(tree, when, answers) {
  return Object.entries(when).every(([key, expected]) => {
    if (key === "danger" && expected === "any") {
      return isDangerSelected(tree, answers.danger);
    }
    const actual = answers[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    return actual === expected;
  });
}

/** Evaluate the JSON routing rules against the user's answers. */
export function evaluateAnswers(tree, answers) {
  const valid = pruneAnswers(tree, answers);
  for (const rule of tree.routing_rules) {
    if (rule.default) continue;
    if (matchesRule(tree, rule.when, valid)) {
      return {
        level: rule.level,
        specialty: rule.specialty || valid.specialty || "family",
      };
    }
  }
  const fallbackRule = tree.routing_rules.find((rule) => rule.default);
  return {
    level: fallbackRule?.default || "primary",
    specialty: valid.specialty || "family",
  };
}

export function getCareLevel(tree, level) {
  return tree.care_levels[level] || tree.care_levels.primary;
}

export function buildResultHref(tree, answers) {
  const valid = pruneAnswers(tree, answers);
  const { level, specialty } = evaluateAnswers(tree, valid);
  const params = new URLSearchParams();
  params.set("level", level);
  params.set("specialty", specialty);
  if (valid.complaint) params.set("complaint", valid.complaint);
  if (valid.age) params.set("age", valid.age);
  if (valid.danger) params.set("danger", valid.danger);
  return `/result/?${params.toString()}`;
}
