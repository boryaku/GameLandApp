import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Broadcaster } from '@ionic-native/broadcaster';
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, iab: InAppBrowser,
              broadcaster: Broadcaster, storage: Storage, device: Device) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      if(platform.is('android')) {

        storage.set("androidId", device.uuid);

        //save this and ensure we have the referrer otherwise no need to do anything...
        broadcaster.addEventListener('com.android.vending.INSTALL_REFERRER').subscribe(function(referrer){
          console.log(referrer);
          storage.set("referrer", referrer);
        });

        alert(storage.get("androidId"));

        const browserOptions = 'zoom=no,location=no,useWideViewPort=no,hidden=yes,enableViewportScale=yes';
        const path = 'https://ionicframework.com/';
        const browser = iab.create(path, '_blank', browserOptions);

        browser.on('loadstop').subscribe(event => {
          console.log('loadstop', event);
          browser.executeScript({code : "alert('hi')"}).then((result) => console.log(result));
        });

      }
    });
  }
}
