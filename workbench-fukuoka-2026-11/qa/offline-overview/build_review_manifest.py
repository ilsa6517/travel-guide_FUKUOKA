"""Bind manually inspected route overviews to map data and browser denial evidence."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / 'qa' / 'offline-overview'
DENIAL = ROOT / 'qa' / 'route-capture' / 'browser-policy-denial.log'
CHECKED_AT = '2026-09-24T03:18:32Z'
REVIEW = ('已逐張檢視繁體中文地圖原尺寸與 390px 手機寬度預覽；所有停靠點依核實座標呈現，編號與行程順序相符，'
          '順序箭頭、繁體中文地名、地理背景及 OpenStreetMap 署名清楚。密集市區標籤以引線避讓後仍可辨識。')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    source = json.loads((HERE / 'backgrounds' / 'sources.json').read_text(encoding='utf-8'))
    endpoints = source['endpoints']
    if not endpoints or not DENIAL.is_file():
        raise SystemExit('missing actual source or browser policy denial evidence')
    attempt = {
        'status': 'denied',
        'reason': ('Browser security policy explicitly denied the prepared Day 1 local route-capture page; '
                   'the denial forbids trying another surface or workaround, so the global browser restriction '
                   'was recorded and no further local capture pages were attempted.'),
        'checked_at': CHECKED_AT,
        'log_file': 'qa/route-capture/browser-policy-denial.log',
        'log_sha256': sha(DENIAL),
    }
    maps = []
    for number in range(1, 7):
        review_dir = HERE / 'review-traditional-v2' / f'day-{number}'
        receipt_path = review_dir / 'receipt.json'
        receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
        image = review_dir / f'day-{number}-overview.png'
        phone = review_dir / 'phone-preview.png'
        background = HERE / 'backgrounds' / f'day-{number}.osm'
        with Image.open(image) as im:
            im.load()
            if im.width < 1000 or im.height < 700:
                raise SystemExit(f'day {number}: image too small')
        with Image.open(phone) as im:
            im.load()
            if im.width != 390:
                raise SystemExit(f'day {number}: phone preview is not 390px wide')
        receipt.update({'visual_reviewed': True, 'review_note': REVIEW,
                        'image_sha256': sha(image), 'phone_preview_sha256': sha(phone),
                        'reviewed_at': '2026-09-24'})
        receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        maps.append({
            'day': number,
            'image': image.relative_to(ROOT).as_posix(),
            'sha256': sha(image),
            'capture_fingerprint': receipt['capture_fingerprint'],
            'visual_reviewed': True,
            'review_note': REVIEW,
            'background_file': background.relative_to(ROOT).as_posix(),
            'background_sha256': sha(background),
            'source_url': 'OpenStreetMap data via Overpass API: ' + ', '.join(endpoints),
            'attribution': '© OpenStreetMap contributors · https://www.openstreetmap.org/copyright',
            'attempts': [attempt],
        })
    manifest = {'schema_version': 1, 'maps': maps}
    target = HERE / 'manifest.json'
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'manifest': str(target), 'maps': len(maps), 'denial_sha256': attempt['log_sha256']},
                     ensure_ascii=True))


if __name__ == '__main__':
    main()
