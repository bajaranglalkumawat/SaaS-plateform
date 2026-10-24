# BillFlow Play Store Release

BillFlow Android is a Capacitor shell around the deployed Next.js SaaS app. The Android App Bundle must point to a live HTTPS deployment, not local development.

## Required Before Upload

- Production PostgreSQL database
- Public HTTPS deployment
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Production Razorpay keys and plan IDs
- Privacy policy URL, for example `https://your-domain.com/privacy`
- Signed Android App Bundle
- Google Play Developer account

## Build Steps

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-LIVE-DOMAIN.com"
npx cap sync android
npm run android:open
```

In Android Studio:

```text
Build -> Generate Signed Bundle / APK -> Android App Bundle
```

Terminal alternative:

```powershell
cd android
.\gradlew.bat bundleRelease
```

Expected output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Play Console Checklist

- [ ] App name: BillFlow
- [ ] Package: `com.billflow.saas`
- [ ] Upload signed `app-release.aab`
- [ ] Privacy policy URL: deployed `/privacy`
- [ ] Short description
- [ ] Full description
- [ ] Phone screenshots
- [ ] Feature graphic 1024x500
- [ ] App icon 512x512
- [ ] Content rating questionnaire
- [ ] Data safety form
- [ ] Target audience
- [ ] Pricing and countries

## Versioning

- Version name: `1.0.0`
- Version code: `1`

Increase Android `versionCode` before every new Play Store upload.
