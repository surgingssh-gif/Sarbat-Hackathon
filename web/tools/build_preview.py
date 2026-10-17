"""Bundle the atlas into ONE self-contained HTML file (data, styles and code inside).

Useful for sharing a preview that opens anywhere without a server, e.g. on a phone.

    python web/tools/build_preview.py                 # -> web/dist/punjab-data-hub.html
    python web/tools/build_preview.py --data other.csv
    python web/tools/build_preview.py --fragment      # body-only output (for hosts that add <html>/<head>)
"""

import argparse
import json
import re
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
ROOT = WEB.parent
SCRIPTS = ["config.js", "i18n.js", "data.js", "map.js", "charts.js", "need.js", "answer.js", "chat.js", "account.js", "app.js"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "data" / "punjab_atlas.csv"))
    ap.add_argument("--villages", default=str(ROOT / "data" / "punjab_villages.csv"))
    ap.add_argument("--out", default=str(WEB / "dist" / "punjab-data-hub.html"))
    ap.add_argument("--fragment", action="store_true")
    args = ap.parse_args()

    html = (WEB / "index.html").read_text()
    css = (WEB / "css" / "atlas.css").read_text()
    inline = {
        "csv": Path(args.data).read_text(),
        "villages": Path(args.villages).read_text() if Path(args.villages).exists() else "",
        "boundaries": json.loads((WEB / "geo" / "punjab_districts.geojson").read_text()),
        "context": json.loads((WEB / "geo" / "context.geojson").read_text()),
    }
    data_js = "window.ATLAS_INLINE = " + json.dumps(inline, separators=(",", ":")).replace("</", "<\\/") + ";"
    code = "\n".join((WEB / "js" / s).read_text() for s in SCRIPTS)

    body = html[html.index("<body>") + len("<body>"): html.index("<script src=")]
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts[^"]+)">', html).group(1)

    parts = [
        "<title>Punjab Data Hub</title>",
        '<meta name="claude:viewport-fit-sides" content="cover">',
        f'<link rel="stylesheet" href="{fonts}">',
        f"<style>\n{css}\n</style>",
        body,
        f"<script>{data_js}</script>",
        f"<script>\n{code}\n</script>",
    ]
    out = "\n".join(parts)
    if not args.fragment:
        out = (
            '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + "\n".join(parts[:4]) + "\n</head>\n<body>\n" + "\n".join(parts[4:]) + "\n</body>\n</html>\n"
        )
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(out)
    print(f"Wrote {args.out} ({len(out) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
