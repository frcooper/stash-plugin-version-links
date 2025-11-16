cd dist

# Copy only what the plugin needs at runtime:
cp ../plugin-version-links.yml .
cp ../main.js .

zip -r plugin-version-links-0.1.0.zip plugin-version-links.yml main.js

sha256sum plugin-version-links-0.1.0.zip > plugin-version-links-0.1.0.zip.sha256
