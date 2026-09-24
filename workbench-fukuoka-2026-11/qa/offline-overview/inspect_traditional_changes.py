"""Read-only inventory of simplified-to-Traditional characters in rendered content."""
import ctypes
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
kernel = ctypes.WinDLL('kernel32', use_last_error=True)
mapper = kernel.LCMapStringEx
mapper.argtypes = [ctypes.c_wchar_p, ctypes.c_uint, ctypes.c_wchar_p, ctypes.c_int,
                   ctypes.c_wchar_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ssize_t]
mapper.restype = ctypes.c_int


def traditional(value):
    if not value:
        return value
    output = ctypes.create_unicode_buffer(len(value) * 3 + 2)
    size = mapper('zh-TW', 0x04000000, value, -1, output, len(output), None, None, 0)
    return output.value if size else value


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_code = 0
        self.values = []

    def handle_starttag(self, tag, attrs):
        if tag in {'script', 'style'}:
            self.in_code += 1
        for key, value in attrs:
            if value and key in {'alt', 'title', 'aria-label', 'placeholder', 'value'}:
                self.values.append(value)

    def handle_endtag(self, tag):
        if tag in {'script', 'style'} and self.in_code:
            self.in_code -= 1

    def handle_data(self, data):
        if not self.in_code and data.strip():
            self.values.append(data.strip())


def main():
    parser_args = argparse.ArgumentParser()
    parser_args.add_argument('--file', type=Path, default=ROOT / 'index.html')
    args = parser_args.parse_args()
    source = args.file.read_text(encoding='utf-8')
    parser = VisibleText()
    parser.feed(source)
    unique = sorted({x for x in parser.values if re.search(r'[\u3400-\u9fff]', x) and traditional(x) != x})
    print(json.dumps({'count': len(unique), 'examples': unique[:250]}, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
