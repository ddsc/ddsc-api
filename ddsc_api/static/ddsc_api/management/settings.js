

var base = (domain ? domain : 'http://' + window.location.host);
var domain = base + '/api/v1/';


var settings = {
    parameters_url: domain + 'parameters/',
    locations_url: domain + 'locations/',
    //wms_proxy_base_url: domain + 'proxy/?',
    logicalgroups_url: domain +'logicalgroups/',
    timeseries_url: domain + 'timeseries/',
    manufacturer_url: domain + 'manufacturer/',
    datasets_url: domain + 'datasets/',
    //alarms_url: domain + 'alarms/' + extra,
    //collages_url: domain + 'collages/',
    //workspace_url: domain + 'workspaces/',
	  //layers_url: domain + 'layers/?page_size=100',
	  //account_url: domain + 'account/',
	  //login_token_url: domain + 'account/login-url/',
	  //logout_token_url: domain + 'account/logout-url/',
    //events_url: domain + 'events/',
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
    processingmethods_url: domain + 'processingmethods/'

};

