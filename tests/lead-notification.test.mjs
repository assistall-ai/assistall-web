import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Source-level checks for the new-lead alert email in demo-request.php (no PHP runtime locally).
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [php, example, launchSecurity] = await Promise.all([
  read('demo-request.php'),
  read('config/assistall-secrets.example.php'),
  read('docs/LAUNCH_SECURITY.md'),
]);

const fn = (name) => {
  const match = php.match(new RegExp(`function ${name}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `${name} is defined`);
  return match[1];
};
const builder = fn('lead_notification');
const sender = fn('send_lead_notification');

test('the alert is sent only for requests Supabase accepted', () => {
  const gate = php.indexOf("if (($ingest['ok'] ?? false) !== true) {");
  const hook = php.indexOf("register_shutdown_function('send_lead_notification'");
  const success = php.indexOf("respond(201, true, 'accepted', $requestId);");
  assert.ok(gate > 0, 'checks the ingest result');
  assert.ok(hook > gate, 'the alert is queued only after the ingest check');
  assert.ok(success > hook, 'the alert is queued before the success response');
  assert.equal((php.match(/send_lead_notification/g) ?? []).length, 2, 'defined once and queued in one place');
  assert.equal((php.match(/\bmail\(/g) ?? []).length, 1, 'one mail() call, inside the sender');
  assert.match(sender, /@mail\(/);
  // Every rejection path ends in respond(), which exits before the alert is queued.
  const failure = php.slice(gate, hook);
  assert.match(failure, /respond\(\$status === 429 \? 429 : 503/);
});

test('the alert never blocks or fails the visitor submission', () => {
  assert.match(sender, /try \{[\s\S]*@mail\([\s\S]*\} catch \(\\Throwable\)/, 'mail errors are caught');
  assert.match(sender, /fastcgi_finish_request\(\)/, 'response is finished before mailing on PHP-FPM');
  assert.match(sender, /litespeed_finish_request\(\)/, 'response is finished before mailing on LiteSpeed');
  assert.ok(sender.indexOf('finish_request') < sender.indexOf('@mail('), 'the visitor is answered before the mail is sent');
  assert.doesNotMatch(sender, /respond\(|exit|http_response_code/, 'a mail failure never changes the response');
  assert.match(sender, /log_code\(\$requestId, \$sent \? 'lead_notified' : 'lead_notify_failed'\)/, 'only a code is logged');
  assert.doesNotMatch(php, /error_log\([^)]*(body|message|workNeed|email)/i, 'message content is never logged');
});

test('the recipient is fixed in the secrets file, never taken from the request', () => {
  assert.match(builder, /\$config\['lead_notify_recipient'\]/);
  assert.match(builder, /filter_var\(\$to, FILTER_VALIDATE_EMAIL\) === false\) \$to = LEAD_NOTIFY_DEFAULT_RECIPIENT/);
  assert.match(php, /const LEAD_NOTIFY_DEFAULT_RECIPIENT = 'hello@assistall\.ai';/);
  assert.doesNotMatch(php, /\$payload\[['"](to|cc|bcc|recipient|lead_notify_recipient)['"]\]/);
  assert.doesNotMatch(builder, /\$_(POST|GET|REQUEST|SERVER)/, 'no request data besides the validated lead fields');
  assert.doesNotMatch(builder, /^\s*'(Cc|Bcc):/m, 'no extra recipients');
});

test('the message is injection-safe plain text with no secrets', () => {
  assert.match(php, /function safe_line\(string \$value\): string \{\s*return str_replace\(\["\\r", "\\n", "\\0"\], ' ', \$value\);/);
  for (const field of ['requestId', 'name', 'email', 'company']) {
    assert.match(builder, new RegExp(`safe_line\\(\\$${field}\\)`), `${field} is a single line`);
  }
  assert.match(builder, /'Reply-To: ' \. safe_line\(\$email\)/);
  assert.match(builder, /'Content-Type: text\/plain; charset=UTF-8'/);
  assert.match(builder, /'subject' => LEAD_NOTIFY_SUBJECT/);
  assert.match(php, /const LEAD_NOTIFY_SUBJECT = 'New Assistall demo request';/);
  assert.equal((builder.match(/\$config\[/g) ?? []).length, 1, 'only the recipient is read from the configuration');
  assert.doesNotMatch(builder, /secret|hmac|turnstile|supabase_function_url|remoteIp|\$ip\b/i);
});

test('the secrets example and launch runbook document the recipient', () => {
  assert.match(example, /'lead_notify_recipient' => '[^']+@[^']+'/);
  assert.match(launchSecurity, /lead_notify_recipient/);
  assert.match(launchSecurity, /New-lead alert email/);
  assert.match(launchSecurity, /lead_notify_failed/);
});
