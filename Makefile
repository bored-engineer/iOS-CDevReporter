all: package install

VERSION=$(shell cat src/DEBIAN/control | grep Version | cut -d " " -f 2)

package:
	dpkg-deb -b src CDevReporter-$(VERSION).deb
	
install:
	dpkg -i CDevReporter-$(VERSION).deb
