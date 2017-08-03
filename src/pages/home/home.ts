import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Flashlight } from '@ionic-native/flashlight';
import { InAppBrowser } from '@ionic-native/in-app-browser';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  iab: InAppBrowser;

  constructor(public navCtrl: NavController, public flashlight: Flashlight, iab: InAppBrowser) {
    this.iab = iab;
  }

  flashlightToggle(){
    this.flashlight.toggle();
  }

  open(path: string){
    const browserOptions = 'location=no';
    this.iab.create(path, '_blank', browserOptions);
  }

  openSubscribe(){
    const browserOptions = 'location=no';
    this.iab.create('http://www.google.com?search=payment', '_blank', browserOptions);
  }
}
