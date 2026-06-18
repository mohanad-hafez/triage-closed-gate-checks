import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const RESULT_PATH =
	process.env.TRIAGE_RESULT_PATH ?? "/tmp/issue-triage-result.json";
const LABEL_COLORS = {
	"triage:investigated": "0969da",
	"triage:needs-info": "bf8700",
	"triage:possible-duplicate": "8250df",
	"triage:needs-routing": "57606a",
	"area:conversation": "54aeef",
	"area:composer-agent": "54aeef",
	"area:session-runtime": "0969da",
	"area:protocol": "0969da",
	"area:onboarding": "1f883d",
	"area:app-shell": "1f883d",
	"area:workspaces": "0969da",
	"area:git-state": "0969da",
	"area:pull-requests": "8250df",
	"area:diff-review": "8250df",
	"area:workflows": "fbca04",
	"area:automation": "fbca04",
	"area:canvas-tools": "cf222e",
	"area:terminal": "cf222e",
	"area:settings-diagnostics": "6fdd8b",
	"area:feature-flags": "6fdd8b",
	"area:persistence": "57606a",
	"area:data-model": "57606a",
};
const ALLOWED_LABELS = new Set(Object.keys(LABEL_COLORS));
const ALLOWED_CLASSIFICATIONS = new Set([
	"bug",
	"feature-request",
	"question",
	"feedback",
]);
const ALLOWED_CONFIDENCE = new Set(["high", "medium", "low"]);
const ALLOWED_NEXT_ACTIONS = new Set([
	"ask-for-info",
	"review-duplicate",
	"assign-owner",
	"start-session",
	"manual-review",
]);
const BLOCKED_ASSIGNEES = new Set([
	"copilot",
	"github-actions",
	"github-actions[bot]",
]);
const COMMENT_MARKER = "<!-- github-app-issue-triage -->";

const result = parseResult();
const issue = normalizeIssue(result.issue);
const repo = `${issue.owner}/${issue.repo}`;
const labels = normalizeLabels(result.labels, result);
const assignee = normalizeAssignee(result.assignee);
const commentBody = buildComment(result);

for (const label of labels) {
	ensureLabel(repo, label);
}
if (labels.length > 0) {
	runGh([
		"issue",
		"edit",
		String(issue.number),
		"--repo",
		repo,
		"--add-label",
		labels.join(","),
	]);
}
if (assignee) {
	try {
		runGh([
			"issue",
			"edit",
			String(issue.number),
			"--repo",
			repo,
			"--add-assignee",
			assignee,
		]);
	} catch (error) {
		console.warn(`Could not assign ${assignee}: ${error.message}`);
	}
}
upsertComment(repo, issue.number, commentBody);

console.log(`Applied triage result to ${repo}#${issue.number}`);

function parseResult() {
	const parsed = JSON.parse(readFileSync(RESULT_PATH, "utf8"));
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("Triage result must be a JSON object.");
	}
	if (!ALLOWED_CLASSIFICATIONS.has(parsed.classification)) {
		throw new Error(`Invalid classification: ${parsed.classification}`);
	}
	if (!ALLOWED_CONFIDENCE.has(parsed.confidence)) {
		throw new Error(`Invalid confidence: ${parsed.confidence}`);
	}
	const nextAction = parsed.investigation?.next_action;
	if (!ALLOWED_NEXT_ACTIONS.has(nextAction)) {
		throw new Error(`Invalid next_action: ${nextAction}`);
	}
	return parsed;
}

function normalizeIssue(value) {
	const owner = asTrimmedString(value?.owner);
	const repo = asTrimmedString(value?.repo);
	const number = Number(value?.number);
	if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
		throw new Error("Invalid issue owner/repo.");
	}
	if (!Number.isInteger(number) || number <= 0) {
		throw new Error("Invalid issue number.");
	}
	return { owner, repo, number };
}

function normalizeLabels(values, triageResult) {
	const labels = Array.isArray(values) ? values.map(asTrimmedString) : [];
	const normalized = labels.filter((label) => ALLOWED_LABELS.has(label));
	if (!normalized.includes("triage:investigated")) {
		normalized.unshift("triage:investigated");
	}
	if (
		triageResult.info_needed?.needed &&
		!normalized.includes("triage:needs-info")
	) {
		normalized.push("triage:needs-info");
	}
	if (
		(triageResult.duplicates ?? []).length > 0 &&
		!normalized.includes("triage:possible-duplicate")
	) {
		normalized.push("triage:possible-duplicate");
	}
	if (
		!asTrimmedString(triageResult.owner_area) &&
		!normalized.includes("triage:needs-routing")
	) {
		normalized.push("triage:needs-routing");
	}
	return [...new Set(normalized)].slice(0, 4);
}

function normalizeAssignee(value) {
	const assignee = asTrimmedString(value).replace(/^@/, "");
	if (!assignee) return null;
	if (!/^[A-Za-z0-9-]+$/.test(assignee)) return null;
	if (
		assignee.includes("[bot]") ||
		BLOCKED_ASSIGNEES.has(assignee.toLowerCase())
	)
		return null;
	return assignee;
}

function ensureLabel(repo, label) {
	try {
		runGh(["api", `repos/${repo}/labels/${encodeURIComponent(label)}`]);
		return;
	} catch {
		// Missing labels are created below. Other failures are surfaced by create.
	}
	runGh([
		"label",
		"create",
		label,
		"--repo",
		repo,
		"--description",
		labelDescription(label),
		"--color",
		LABEL_COLORS[label],
	]);
}

function buildComment(triageResult) {
	const investigation = triageResult.investigation ?? {};
	const duplicates = Array.isArray(triageResult.duplicates)
		? triageResult.duplicates.slice(0, 5)
		: [];
	const codePaths = Array.isArray(investigation.code_paths)
		? investigation.code_paths.slice(0, 5)
		: [];
	const findings = Array.isArray(investigation.findings)
		? investigation.findings.slice(0, 5)
		: [];
	const duplicateLines = duplicates.length
		? duplicates
				.map((duplicate) => {
					const number = Number(duplicate.number);
					const confidence =
						asTrimmedString(duplicate.confidence) || "possible";
					const reason = truncate(asTrimmedString(duplicate.reason), 180);
					const url = asTrimmedString(duplicate.url);
					return `- ${url ? `[#${number}](${url})` : `#${number}`} - ${confidence}${reason ? `: ${reason}` : ""}`;
				})
				.join("\n")
		: "- No likely duplicates found.";
	const infoNeeded = triageResult.info_needed?.needed
		? truncate(asTrimmedString(triageResult.info_needed.question), 500) ||
			"More details are needed before this can be routed confidently."
		: "No additional information requested by the triage pass.";
	const body = `${COMMENT_MARKER}
## Automated triage

**Summary:** ${truncate(asTrimmedString(investigation.summary), 700)}

**Classification:** ${triageResult.classification} (${triageResult.confidence} confidence)
**Suggested area:** ${truncate(asTrimmedString(triageResult.owner_area) || "Needs routing", 160)}
**Routing rationale:** ${truncate(asTrimmedString(triageResult.owner_rationale), 300)}

**Duplicate check**
${duplicateLines}

**Info needed**
${infoNeeded}

**Initial investigation**
${findings.length ? findings.map((finding) => `- ${truncate(asTrimmedString(finding), 220)}`).join("\n") : "- No findings generated."}

**Likely code paths or surfaces**
${codePaths.length ? codePaths.map((path) => `- \`${truncate(asTrimmedString(path), 160)}\``).join("\n") : "- Needs manual routing."}

**Recommended next action:** ${triageResult.investigation.next_action} - ${truncate(asTrimmedString(investigation.next_action_reason), 300)}
`;
	return truncate(body, 6000);
}

function upsertComment(repo, issueNumber, body) {
	const comments = JSON.parse(
		runGh([
			"api",
			`repos/${repo}/issues/${issueNumber}/comments?per_page=100`,
			"--jq",
			"[.[] | {id, body}]",
		]) || "[]",
	);
	const existing = comments.find(
		(comment) =>
			typeof comment.body === "string" && comment.body.includes(COMMENT_MARKER),
	);
	if (existing?.id) {
		runGh([
			"api",
			"--method",
			"PATCH",
			`repos/${repo}/issues/comments/${existing.id}`,
			"-f",
			`body=${body}`,
		]);
		return;
	}
	runGh([
		"issue",
		"comment",
		String(issueNumber),
		"--repo",
		repo,
		"--body",
		body,
	]);
}

function runGh(args) {
	return execFileSync("gh", args, {
		env: {
			...process.env,
			CLICOLOR: "0",
			GH_PAGER: "cat",
			NO_COLOR: "1",
			PAGER: "cat",
		},
		encoding: "utf8",
		maxBuffer: 10 * 1024 * 1024,
	});
}

function labelDescription(label) {
	if (label === "triage:investigated")
		return "Issue has an automated initial triage result";
	if (label === "triage:needs-info")
		return "Issue needs more details before engineering can act";
	if (label === "triage:possible-duplicate")
		return "Issue may overlap with an existing report";
	if (label === "triage:needs-routing")
		return "Issue needs human routing to an owner area";
	if (label.startsWith("area:"))
		return `Area routing label for ${label.slice("area:".length)}`;
	return "Automated triage label";
}

function asTrimmedString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function truncate(value, maxLength) {
	const text = asTrimmedString(value);
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3)}...`;
}
