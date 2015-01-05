Changelog of ddsc-api
===================================================


0.5 (unreleased)
----------------

- Upgraded Django to 1.5.4 (to solve postgis-2.x-related problems with
  migrations, amongst other things). Not 1.5.5, because that is
  incompatible with django-staticfiles, which is a requirement of
  lizard-ui.

- Upgraded lizard-wms, lizard-auth-client and lizard-maptree to
  versions compatible with Django 1.5.4.

- Pinned dependencies to versions currently used in production.

- Small changes to deal with the Django version update.
- Added drop-down field to location form. 
- Added the hard coded list with paths to location icons to settings.js

0.4 (2012-11-16)
----------------

- Nothing changed yet.


0.3 (2012-11-02)
----------------

- Nothing changed yet.


0.2 (2012-10-26)
----------------

- Nothing changed yet.


0.1 (2012-10-25)
----------------

- Initial project structure created with nensskel 1.27.dev0.
