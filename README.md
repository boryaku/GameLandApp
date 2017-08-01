
```bash
$ sudo npm install -g ionic cordova
```

Then, to run it, cd into the GameLandApp root and run:

```bash
$ ionic cordova platform add android
```

Next we need to add a couple custom plugins, one sets the referrer and the other gets it from SharedPreferences run:

```bash
$ cordova plugin add --link <path>/andorid-referrer-plugin
$ cordova plugin add --link <path>/andorid-referrer-setter-plugin
```

I am using GenyMotion for emulation if you fire up your VM you can then run:

```bash
$ ionic cordova run android
```
*this will build and deploy it on the emulator


Want to simulate the Google Play referrer notification? open adb.exe in android sdk and run:
```bash
$ am broadcast -a com.android.vending.INSTALL_REFERRER --es "referrer" "utm_source%3Dtest%26utm_medium%3Dtester"
```
*you'll need to suspend execution before you ask to set and get it ie. put an alert('suspend'); before you request the value
