The Chronic Dev Crash Reporter
=======
###The simplest and easiest method to send you crash reports to the Chronic Dev team to help future jailbreaks.


`CDevReporter` is a daemon that runs in the background on your iOS device and sends your crash reports to the Chronic Dev team. It sleeps until new crash reports are found, then attempts to upload them to the Chronic Dev (llc) servers.

Installation
------------
Installation is relatively straight forward. Either install `CDevReporter` from Cydia or from a pre-built deb on the Downloads page.


Build
------------
To build `CDevReporter` from source yourself, you must follow these instructions:

``` bash
$ git clone git://github.com/innoying/iOS-CDevReporter.git

$ cd iOS-CDevReporter

$ (sudo) make mode=release

$ scp binaries/CDevReporter-*.deb root@DEVICE_IP:~

```
Then on-device:
``` bash
$ dpkg -i CDevReporter-*.deb
```


File explanations (Developers)
------------
`utils/google-compiler-20111003.jar` is Google javascript compiler jar that is used to minify the JS files.

`src/usr/bin/ECID-CDevReporter` is the binary for retrieving a iOS device's ECID. The source is available [here](https://github.com/innoying/iOS-ecid)

`src/usr/local/chronic-dev.CDevReporter/node_modules` is the modules folder for `CDevReporter`. It only contains the `stalker` module for watching folders for activity. The module source is available [here](https://github.com/jslatts/stalker)

`src/usr/local/chronic-dev.CDevReporter/launch.js` is the actual script that does most of the work. It should be pretty self-explanatory using the comments within. 

`src/usr/local/chronic-dev.CDevReporter/clean.js` is the hosts file cleaning module. It allows easy cleaning of the hosts file from multiple independent scripts. 

`src/usr/local/chronic-dev.CDevReporter/cleanme.js` is a script that simple cleans the hosts file using the `clean.js` module. It is called in `src/DEBIAN/prerm` to clean the hosts file before un-installation.

`src/System/Library/LaunchDaemons/com.chronic-dev.CDevReporter.plist` is the LaunchDaemon that starts the `launch.js` file on device start-up and keeps it running.

`src/Library/PreferenceLoader/Preferences/com.chronic-dev.CDevReporter.plist` is where the preferences are defined. It contains a short blurb about `CDevReporter` and a enabled/disable toggle. It saves the values to `var/mobile/Library/Preferences/com.chronic-dev.CDevReporter.plist` where it is read by `launch.js`

`src/DEBIAN/control` is where all the information for Cydia about `CDevReporter` is contained. 

`src/DEBIAN/postinst` is a script that is run after `CDevReporter` is installed. It loads the `System/Library/LaunchDaemons/com.chronic-dev.CDevReporter.plist` launch daemon so a reboot can be avoided. 

`src/DEBIAN/prerm` is a script that is run before `CDevReporter` is removed. It first cleans the hosts file using `cleanme.js` then stops the `System/Library/LaunchDaemons/com.chronic-dev.CDevReporter.plist` launch daemon so a reboot is avoided. 


Credits (Developers)
------------
I'd like to thank `nikias` of the Chronic-Dev team for helping me to understand how the original `CDevReporter` worked and generally for being helpful.
I'd like to thank the Chronic-Dev team as a whole for being open to support iOS devices directly and for working with me to get this up to their standards.
I'd like to thank `TooTallNate` for his iOS port of `node.js` which made this possible.
And I'd like to thank you. For bothering to find out how apps like this work by looking at the source. I wish you luck in your own coding.