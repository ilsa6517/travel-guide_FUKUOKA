"""Small Windows-NLS localization layer for generated Traditional Chinese UI."""
import ctypes
import html
import json
import os
import re

_CJK = re.compile(r'[\u3400-\u9fff]')
_FIXUPS = {
    '里面': '裡面', '里边': '裡邊', '心里': '心裡', '手里': '手裡', '眼里': '眼裡',
    '哪里': '哪裡', '那里': '那裡', '这里': '這裡', '家里': '家裡', '屋里': '屋裡',
    '最后': '最後', '后面': '後面', '后续': '後續', '后方': '後方', '后排': '後排',
    '后半': '後半', '后场': '後場', '后台': '後臺', '后院': '後院', '后厨': '後廚',
    '后天': '後天', '后期': '後期', '后者': '後者', '背后': '背後', '向后': '向後',
    '前后': '前後', '此后': '此後', '之后': '之後', '以后': '以後', '随后': '隨後',
    '而后': '而後', '产后': '產後', '婚后': '婚後', '饭后': '飯後', '午后': '午後',
    '日后': '日後', '身后': '身後', '后备': '後備', '后端': '後端', '后缀': '後綴',
    '面条': '麵條', '方便面': '方便麵', '面包': '麵包', '旅游': '旅遊', '復制': '複製', '復製': '複製',
    '屋臺': '屋台', '夫婦巖': '夫婦岩',
}
_KEEP_AFTER = ('皇后', '太后', '王后', '后羿', '后稷', '后土', '后裔')


def traditionalize(value):
    if not value or not _CJK.search(value):
        return value
    if os.name != 'nt':
        raise RuntimeError('zh-TW localization currently requires Windows NLS')
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    mapper = kernel.LCMapStringEx
    mapper.argtypes = [ctypes.c_wchar_p, ctypes.c_uint, ctypes.c_wchar_p, ctypes.c_int,
                       ctypes.c_wchar_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ssize_t]
    mapper.restype = ctypes.c_int
    output = ctypes.create_unicode_buffer(len(value) * 3 + 2)
    size = mapper('zh-TW', 0x04000000, value, -1, output, len(output), None, None, 0)
    if not size:
        raise OSError(ctypes.get_last_error(), 'LCMapStringEx Traditional Chinese conversion failed')
    text = output.value
    for old, new in sorted(_FIXUPS.items(), key=lambda pair: -len(pair[0])):
        text = text.replace(old, new)
    for protected in _KEEP_AFTER:
        text = text.replace(protected, '\ue000' + protected[1:])
    text = text.replace('后', '後')
    for protected in _KEEP_AFTER:
        text = text.replace('\ue000' + protected[1:], protected)
    return text


def _profile_strings(value):
    if isinstance(value, dict):
        for child in value.values():
            yield from _profile_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from _profile_strings(child)
    elif isinstance(value, str) and len(value) >= 2 and _CJK.search(value):
        yield value
        yield html.escape(value, quote=True)
        yield html.escape(value, quote=False)
        yield json.dumps(value, ensure_ascii=False)[1:-1]


def preserve_profile_values(source, profile):
    """Convert generated UI while shielding already-reviewed destination copy."""
    values = sorted(set(_profile_strings(profile)), key=len, reverse=True)
    restored = {}
    for index, value in enumerate(values):
        token = f'\ue100{index:06d}\ue101'
        if value in source:
            source = source.replace(value, token)
            restored[token] = value
    source = traditionalize(source)
    for token, value in restored.items():
        source = source.replace(token, value)
    return source
