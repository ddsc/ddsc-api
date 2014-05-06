from fabric.context_managers import cd
from fabric.contrib.console import confirm
from fabric.contrib.files import exists
from fabric.decorators import task
from fabric.operations import abort
from fabric.operations import env
from fabric.operations import sudo

from sitesetup.fab.config import config, production_config
from sitesetup.fab.config import init_file
from sitesetup.fab.tasks import *
from sitesetup.fab import detail

# Most settings can be configured in fabfile.cfg
init_file('fabfile.cfg')

@task
def solr_build_schema():
    print('SOLR: building schema')
    if not exists(config('basedir')):
        abort(
            "Directory %s doesn't exist yet. Run 'create_srv_dir'."
            % config('basedir'))
    with cd(config('basedir')):
        sudo(("bin/django build_solr_schema > "
                "{basedir}/etc/solr/conf/schema.xml".format(
                    basedir=config('basedir'))
                ),
            user='buildout')

@task
def solr_rebuild_index():
    print('SOLR: rebuilding index')
    if not exists(config('basedir')):
        abort(
            "Directory %s doesn't exist yet. Run 'create_srv_dir'."
            % config('basedir'))
    with cd(config('basedir')):
        if confirm("Rebuilding (instead of updating) the index, are you sure?"):
            sudo("bin/django rebuild_index", user='buildout')

@task
def solr_update_index():
    print('SOLR: rebuilding index')
    if not exists(config('basedir')):
        abort(
            "Directory %s doesn't exist yet. Run 'create_srv_dir'."
            % config('basedir'))
    with cd(config('basedir')):
        if confirm("Are you sure you want to update the index?"):
            sudo("bin/django update_index", user='buildout')


@task
def solr_link():
    print('SOLR: linking the generated xml file')
    sudo(("ln -s {basedir}/etc/solr.xml "
            "/etc/tomcat6/Catalina/localhost/solr.xml".format(
                basedir=config('basedir'))
            ),
        user='buildout')

@task
def solr_restart():
    print('SOLR: restarting solr')
    sudo("service tomcat6 restart")


@task
def update():
    """Updates an existing site that was previously created with init."""
    detail.switch_and_buildout()
    detail.sync_and_migrate()
    detail.start_or_restart()