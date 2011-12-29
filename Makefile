all: clean setup1 minify setup2 package

VERSION=$(shell cat src/DEBIAN/control | grep Version | cut -d " " -f 2)

clean: 
	rm -rf build
	rm -rf CDevReporter-*.deb
	
setup1:
	mkdir build
	cp -R src/* build/
	rm build/usr/local/chronic-dev.CDevReporter/launch.js 
	touch build/usr/local/chronic-dev.CDevReporter/launch.js
	echo \#\!/usr/bin/env node >> build/usr/local/chronic-dev.CDevReporter/launch.js
	
minify:
	java -XX:ReservedCodeCacheSize=64m -jar utils/google-compiler-20111003.jar --js src/usr/local/chronic-dev.CDevReporter/launch.js  --js_output_file build/usr/local/chronic-dev.CDevReporter/launch_new.js 
	
setup2:
	cat build/usr/local/chronic-dev.CDevReporter/launch_new.js >> build/usr/local/chronic-dev.CDevReporter/launch.js 
	rm build/usr/local/chronic-dev.CDevReporter/launch_new.js 

package:
	chmod -R 755 build/
	chown -R root:wheel build/
	mkdir -p binaries
	dpkg-deb -b build binaries/CDevReporter-$(VERSION).deb
	
install:
	dpkg -i binaries/CDevReporter-$(VERSION).deb

