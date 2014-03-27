ddsc-api
==========================================

Introduction
------------
DDSC-api is the api module for Dike Data Service Centre. A collaboration between Fugro, Stichting IjkDijk and Nelen & Schuurmans.


Requires
--------
* Postgis
* ...

Depends on xml::
	sudo apt-get install libxml2-dev libxslt-dev


Installation
------------
Create postgis databases:
* ddsc_api
* ddsc_site

Initially, there's no ``buildout.cfg``. You need to make that a symlink to the
correct configuration. On your development machine, that is
``development.cfg`` (and ``staging.cfg`` or ``production.cfg``, for instance
on the server)::

    ln -s development.cfg buildout.cfg
    python bootstrap.py
    bin/buildout

    # do the same for submodule ddsc-site
    cd src/ddsc-site
	ln -s development.cfg buildout.cfg
    python bootstrap.py
    bin/buildout
    bin/django syncdb
    # for the database to sync 
    bin/django migrate lizard-wms