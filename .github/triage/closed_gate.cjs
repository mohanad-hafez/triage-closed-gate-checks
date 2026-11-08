'use strict';
// Closed-issue preflight only. Other triage decisions remain with the source task.
function closedIssueGate(issue){
 if(!issue||typeof issue!=='object'||Array.isArray(issue))throw new Error('Issue snapshot required');
 if(!Number.isSafeInteger(issue.number)||issue.number<=0)throw new Error('Native issue number required');
 if(issue.pull_request)throw new Error('Pull requests are outside this issue gate');
 if(!['open','closed'].includes(issue.state))throw new Error('Unknown native issue state');
 if(issue.state==='open')return {decision:'defer',reason:'Open issue requires remaining triage policy'};
 return {decision:'noop',message:`Issue #${issue.number} is closed — no triage actions taken.`};
}
module.exports={closedIssueGate};
