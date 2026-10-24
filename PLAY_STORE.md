# BillFlow — Android / Play Store

## Important
This app is a Capacitor Android shell around your Next.js SaaS.
The APK/AAB opens your live website in a native WebView.

1. Deploy Next.js somewhere with HTTPS (Vercel / Railway / VPS).
2. Point Capacitor at that URL.
3. Build a signed Android App Bundle (.aab).
4. Upload to Google Play Console.

## Prerequisites
- Android Studio (includes Android SDK)
- Google Play Developer account ($25 one-time)
- Live HTTPS URL of BillFlow (required for production)

## 1) Point app to your live site
In project root PowerShell:

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-LIVE-DOMAIN.com"
npx cap sync android
```

Or edit `capacitor.config.ts` and set `server.url` to your HTTPS domain, then run `npm run android:sync`.

## 2) Create release keystore (once)
```powershell
keytool -genkey -v -keystore android/billflow-release.keystore -alias billflow -keyalg RSA -keysize 2048 -validity 10000
```

Copy `android/keystore.properties.example` → `android/keystore.properties` and fill passwords.

Keep the keystore forever. Losing it means you cannot update the same Play Store app.

## 3) Open in Android Studio & build AAB
```powershell
npm run android:open
```

In Android Studio:
- Build → Generate Signed Bundle / APK → Android App Bundle
- Or terminal: `cd android` then `.\gradlew.bat bundleRelease`

Output:
`android/app/build/outputs/bundle/release/app-release.aab`

## 4) Local test (emulator)
```powershell
npm run dev
npm run android:sync
npm run android:open
```
Emulator uses `http://10.0.2.2:3000` (host machine localhost).

Physical phone: set `CAPACITOR_SERVER_URL` to your PC LAN IP, e.g. `http://192.168.1.10:3000`, then sync.

## 5) Play Console upload checklist
- [ ] App name: BillFlow
- [ ] Package: `com.billflow.saas`
- [ ] Upload `app-release.aab`
- [ ] Privacy Policy URL (required)
- [ ] Store listing: short + full description, screenshots (phone)
- [ ] Feature graphic 1024x500
- [ ] App icon 512x512
- [ ] Content rating questionnaire
- [ ] Target audience / Data safety form
- [ ] Pricing: Free or Paid
- [ ] Countries

## App identity
- Application ID: `com.billflow.saas`
- Version name: `1.0.0`
- Version code: `1` (increase every Play upload)
