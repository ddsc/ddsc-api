

var base = (domain ? domain : 'https://' + window.location.host);
var domain = base + '/api/v1/';
var doc = base + '/static_media/ddsc_api/management/data/Beheerdershandleiding - Dijk Data Service Centrum.pdf';
var user_doc = base + '/static_media/ddsc_api/management/data/Gebruikershandleiding - Dijk Data Service Centrum.pdf';
var appImagesUrl = "https://portal.ddsc.nl/app/images/";
var locationIconValueMap = {
    "/app/images/beautifulview.png": "beautifulview",
    "/app/images/icon-ddsc-alizarin.png": "icon-ddsc-alizarin",
    "/app/images/icon-ddsc-amethyst.png": "icon-ddsc-amethyst",
    "/app/images/icon-ddsc-belizehole.png": "icon-ddsc-belizehole",
    "/app/images/icon-ddsc-carrot.png": "icon-ddsc-carrot",
    "/app/images/icon-ddsc-emerald.png": "icon-ddsc-emerald",
    "/app/images/icon-ddsc-greensea.png": "icon-ddsc-greensea",
    "/app/images/icon-ddsc-nephritis.png": "icon-ddsc-nephritis",
    "/app/images/icon-ddsc-peterriver.png": "icon-ddsc-peterriver",
    "/app/images/icon-ddsc-sunflower.png": "icon-ddsc-sunflower",
    "/app/images/icon-ddsc-wetasphalt.png": "icon-ddsc-wetasphalt",
    "/app/images/icon-ddsc-wisteria.png": "icon-ddsc-wisteria",
    "/app/images/marker-dam-1.png": "marker-dam-1",
    "/app/images/marker-dam-2.png": "marker-dam-2",
    "/app/images/marker-dam-3-annotations.png": "marker-dam-3-annotations",
    "/app/images/marker-dam-3.png": "marker-dam-3",
    "/app/images/marker-shore-white.png": "marker-shore-white",
    "/app/images/marker-watertemperature-green.png": "marker-watertemperature-green"
};

var settings = {
    parameters_url: domain + 'parameters/',
    locations_url: domain + 'locations/',
    //wms_proxy_base_url: domain + 'proxy/?',
    logicalgroups_url: domain +'logicalgroups/',
    timeseries_url: domain + 'timeseries/',
    manufacturer_url: domain + 'manufacturer/',
    datasets_url: domain + 'datasets/',
    //collages_url: domain + 'collages/',
    //workspace_url: domain + 'workspaces/',
	  //layers_url: domain + 'layers/?page_size=100',
	  //account_url: domain + 'account/',
	  //login_token_url: domain + 'account/login-url/',
	  //logout_token_url: domain + 'account/logout-url/',
    //events_url: domain + 'events/',
    status_url: domain + 'status/',
    active_alarm_url: domain + 'alarms/',
    csv_upload_url: base + '/csv-upload/',
    alarm_settings_url: domain + 'alarmsettings',
    dataowners_url: domain + 'dataowner/',
    sources_url: domain + 'sources/',
    units_url: domain + 'units/',
    referenceframes_url: domain + 'referenceframes/',
    compartments_url: domain + 'compartments/',
    measuringdevices_url: domain + 'measuringdevices/',
    measuringmethods_url: domain + 'measuringmethods/',
    processingmethods_url: domain + 'processingmethods/',
    usergroups_url: domain + 'groups/',
    roles_url: domain + 'roles/',
    doc: {
      timeseries_url: doc + '#page=20',
      source_url: doc + '#page=22',
      logicalgroup_url: doc + '#page=23',
      upload_url: user_doc + '#page=25',
      location_url: doc + '#page=21',
      alarms_url: user_doc + '#page=22',
      accessgroup_url: doc + '#page=17',
      alarm_overview_url: user_doc + '#page=25',
      status_overview_url: user_doc + '#page=25'
    },
    template_download_url: 'https://github.com/ddsc/ddsc-excel-import/blob/master/template/DDSC_import_location_timeseries.xls?raw=true'
};
