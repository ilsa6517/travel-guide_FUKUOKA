"""Record the real browser-policy limitation for the current handbook build."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / 'scripts'))
from _manual_qa import build_fingerprint

record = {
    'validation_mode': 'unavailable',
    'status': 'pending',
    'build_fingerprint': build_fingerprint(ROOT),
    'host_limitation': {
        'reason': ('The authorized browser explicitly blocked the local file URL under its browser URL policy. '
                   'The policy forbids trying another browser surface or workaround, so desktop/mobile interaction QA '
                   'of the handbook could not be performed.'),
        'tool_reference': ('mcp__cua_repl.js createBrowserTab for '
                           'file:///G:/旅遊手冊/workbench-fukuoka-2026-11/qa/route-capture/day-1-1.html '
                           'returned the explicit URL-policy denial; no alternate surface was tried.'),
        'checked_at': datetime.now(timezone.utc).isoformat(),
    },
}
(ROOT / 'browser-qa.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'build_fingerprint': record['build_fingerprint'], **record['host_limitation']}, ensure_ascii=True))
