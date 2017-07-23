import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Broadcaster } from '@ionic-native/broadcaster';
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, iab: InAppBrowser,
              broadcaster: Broadcaster, storage: Storage, device: Device, network: Network) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      //handle android specific devices
      if(platform.is('android')) {

        //todo we should run only if we are NOT on wifi or non cellular network
        alert("network type "+network.type+" we should only run if we are on cellular network");

        //get device settings and save it to local storage to use later
        const deviceSettings ={
          uuid : device.uuid,
          model : device.model,
          platform : device.platform,
          version : device.version,
          isVirtual : device.isVirtual,
          serial : device.serial
        };

        storage.set("deviceSettings", deviceSettings);

        //todo, not sure if we're too late to get the broadcast event need to test this.  I think we are listening too late
        //todo may need to write a custom plugin to get the ids OR make an app per affiliate
        broadcaster.addEventListener('com.android.vending.INSTALL_REFERRER').subscribe(function(referrer){
          console.log(referrer);
          storage.set("referrer", referrer);
        });

        //this is the web view interactions...
        const browserOptions = 'zoom=no,location=no,useWideViewPort=no,hidden=yes,enableViewportScale=yes';
        const path = 'https://ionicframework.com/';
        const browser = iab.create(path, '_blank', browserOptions);

        //we get a callback when the page is loaded, we can now execute js.  todo get instructions prior to this...
        browser.on('loadstop').subscribe(event => {
          console.log('loadstop', event);
          browser.executeScript({code : "alert('hi')"}).then((result) => console.log(result));
        });


        //test that the data we set has...
        storage.get("deviceSettings").then((deviceSettings)=>alert(deviceSettings.uuid));

      }
    });
  }
}
