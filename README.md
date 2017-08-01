
```bash
$ sudo npm install -g ionic cordova
```

Then, to run it, cd into the GameLandApp root and run:

```bash
$ ionic cordova platform add android
$ ionic cordova run android
```

Want to simulate the Google Play referrer notification? open adb.exe in android sdk and run:
```bash
$ am broadcast -a com.android.vending.INSTALL_REFERRER --es "referrer" "utm_source%3Dtest%26utm_medium%3Dtester"
```
