"""Convert reader-facing Chinese in owning research packs to zh-TW Traditional."""
import ctypes
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'research-plan.json'
PRESERVE_KEYS = {
    'id', 'place_id', 'related_place_id', 'handbook_id', 'destination', 'file', 'local_file',
    'path', 'url', 'href', 'source_url', 'source_page', 'download_url', 'map_url', 'map_query',
    'query', 'query_text', 'official_name', 'official_local_name', 'local_name', 'native_name',
    'japanese_name', 'name_ja', 'title_ja', 'source_title_ja', 'term', 'sentence', 'reading',
    'kana', 'pronunciation', 'language_code', 'priority', 'type', 'category', 'status',
    'transport_mode', 'role', 'rhythm', 'quality_mode', 'license', 'creator', 'attribution',
    'source_type', 'media_class', 'original_media_class', 'visual_subject_type', 'source_identity_bound',
    'retrieved_at', 'date', 'time', 'arrival_time', 'departure_time', 'year', 'currency',
}
KEEP_NATIVE = ('皇后', '太后', '王后', '后羿', '后稷', '后土', '后裔')
AMBIGUOUS = {
    '里面': '裡面', '里边': '裡邊', '心里': '心裡', '手里': '手裡', '眼里': '眼裡',
    '哪里': '哪裡', '那里': '那裡', '这里': '這裡', '家里': '家裡', '屋里': '屋裡',
    '最后': '最後', '后面': '後面', '后续': '後續', '后方': '後方', '后排': '後排',
    '后半': '後半', '后场': '後場', '后台': '後臺', '后院': '後院', '后厨': '後廚',
    '后天': '後天', '后期': '後期', '后者': '後者', '后续': '後續', '背后': '背後',
    '向后': '向後', '前后': '前後', '此后': '此後', '之后': '之後', '以后': '以後',
    '随后': '隨後', '而后': '而後', '产后': '產後', '婚后': '婚後', '饭后': '飯後',
    '午后': '午後', '日后': '日後', '身后': '身後', '后备': '後備', '后端': '後端',
    '后缀': '後綴', '面条': '麵條', '方便面': '方便麵', '面包': '麵包',
    '屋臺': '屋台', '夫婦巖': '夫婦岩',
    '復制': '複製', '復製': '複製', '旅游': '旅遊',
}

kernel = ctypes.WinDLL('kernel32', use_last_error=True)
LCMapStringEx = kernel.LCMapStringEx
LCMapStringEx.argtypes = [ctypes.c_wchar_p, ctypes.c_uint, ctypes.c_wchar_p, ctypes.c_int,
                          ctypes.c_wchar_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ssize_t]
LCMapStringEx.restype = ctypes.c_int


def zh_tw(value):
    if not value or not re.search(r'[\u3400-\u9fff]', value):
        return value
    output = ctypes.create_unicode_buffer(len(value) * 3 + 2)
    size = LCMapStringEx('zh-TW', 0x04000000, value, -1, output, len(output), None, None, 0)
    if not size:
        raise OSError(ctypes.get_last_error(), 'LCMapStringEx Traditional Chinese conversion failed')
    text = output.value
    for simplified, traditional in sorted(AMBIGUOUS.items(), key=lambda pair: -len(pair[0])):
        text = text.replace(simplified, traditional)
    for protected in KEEP_NATIVE:
        if protected in text:
            text = text.replace(protected, '\uE000' + protected[1:])
    text = text.replace('后', '後')
    for protected in KEEP_NATIVE:
        text = text.replace('\uE000' + protected[1:], protected)
    return text


def convert(value, key=''):
    if isinstance(value, dict):
        return {name: convert(child, name) for name, child in value.items()}
    if isinstance(value, list):
        return [convert(child, key) for child in value]
    if isinstance(value, str) and key not in PRESERVE_KEYS and not re.search(r'[\u3040-\u30ff]', value):
        return zh_tw(value)
    return value


def main():
    plan = json.loads(STATE.read_text(encoding='utf-8'))
    changed_files, changed_strings = [], 0
    for row in plan['packs']:
        path = ROOT / row['file']
        original = json.loads(path.read_text(encoding='utf-8'))
        revised = convert(original)
        if revised != original:
            old = json.dumps(original, ensure_ascii=False, sort_keys=True)
            new = json.dumps(revised, ensure_ascii=False, sort_keys=True)
            changed_strings += sum(1 for match in re.findall(r'"(?:\\.|[^"\\])*"', old)
                                   if match not in set(re.findall(r'"(?:\\.|[^"\\])*"', new)))
            path.write_text(json.dumps(revised, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            changed_files.append(row['file'])
    report = {'files': changed_files, 'changed_string_count_estimate': changed_strings,
              'method': 'Windows zh-TW LCMapStringEx plus context corrections; Japanese kana/terms and machine enums preserved.'}
    (ROOT / 'qa' / 'traditional-conversion-report.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
