all: clean setup minify package

VERSION=$(shell cat src/DEBIAN/control | grep Version | cut -d " " -f 2)

clean: 
	rm -rf build
	rm -rf CDevReporter-*.deb
	
setup:
	mkdir build
	cp -R src/* build/
	rm build/usr/local/chronic-dev.CDevReporter/launch.js 
	touch build/usr/local/chronic-dev.CDevReporter/launch.js
	echo \#\!/usr/bin/env node >> build/usr/local/chronic-dev.CDevReporter/launch.js
	
minify:
	java -XX:ReservedCodeCacheSize=64m -jar utils/google-compiler-20111003.jar --js src/usr/local/chronic-dev.CDevReporter/launch.js  --js_output_file build/usr/local/chronic-dev.CDevReporter/launch.js 

package:
	chmod -R 755 build/
	chown -R root:wheel build/
	dpkg-deb -b build CDevReporter-$(VERSION).deb
	
install:
	dpkg -i CDevReporter-$(VERSION).deb

