#!/bin/sh
# Give every CSS/JS link in index.html a fresh ?v= stamp so browsers and CDNs
# don't mix old and new files after an update. Run from the repo root before committing.
V=$(date +%Y%m%d%H%M)
sed -i.bak -E "s#(href=\"css/atlas\.css)(\?v=[0-9]+)?\"#\1?v=$V\"#; s#(src=\"js/[a-z0-9]+\.js)(\?v=[0-9]+)?\"#\1?v=$V\"#g" web/index.html && rm -f web/index.html.bak
echo "Stamped web/index.html with v=$V"
