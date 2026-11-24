# NOVA ARCADE Android releases

## First-time signing setup

The Android release workflow signs every public APK with one permanent keystore. Keep that keystore private and backed up. If it is lost, Android cannot install future APKs as updates over an installation signed with it.

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and add the four values from the private signing bundle:

- `KEYSTORE_BASE64`
- `KEYSTORE_PASSWORD`
- `KEY_ALIAS`
- `KEY_PASSWORD`

Never commit the keystore or its passwords to this repository.

## Publish a new Android version

1. Increase `version` in `package.json` (semantic version, for example `1.0.5`).
2. Commit and push to `main`.
3. Create and push a matching tag, for example `v1.0.5`.
4. GitHub Actions builds a signed APK and publishes it as a GitHub Release.
5. The Android app checks the latest public release and displays a download prompt when a newer APK exists.

The release workflow updates the embedded app version in the Capacitor URL automatically. The website itself continues to update independently through Vercel.

## Important migration note

The previously distributed `1.0.3` APK was signed by a temporary CI debug key. Android will not accept an APK signed by this permanent release key as an in-place update over that old installation. The first permanent release therefore requires uninstalling the old app once, then installing the new signed APK. After that one-time migration, later releases use the same signing key and can update the existing installation.

Updates are downloaded from GitHub Releases and require the user to confirm Android's installer. This is not a silent background installation; Android does not allow an ordinary app to install APKs silently without privileged distribution mechanisms.
