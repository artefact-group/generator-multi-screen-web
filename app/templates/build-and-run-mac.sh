grunt dist-mac32
if [ -e "dist/macOS/<%%= name %%>.app/Contents/MacOS/nwjs" ]; then
  dist/macOS/<%%= name %%>.app/Contents/MacOS/nwjs
else
  dist/macOS/<%%= name %%>.app/Contents/MacOS/node-webkit
fi
