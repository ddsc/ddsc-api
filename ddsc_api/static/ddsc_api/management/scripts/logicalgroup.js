
var logicalGroupDS = isc.Tree.create({
  modelType: "parent",
  nameProperty: "Name",
  idField: "EmployeeId",
  parentIdField: "ReportsTo",
  data: [
    {EmployeeId:"4", ReportsTo:"1", Name:"Charles Madigen"},
    {EmployeeId:"188", ReportsTo:"4", Name:"Rogine Leger"},
    {EmployeeId:"189", ReportsTo:"4", Name:"Gene Porter"},
    {EmployeeId:"265", ReportsTo:"189", Name:"Olivier Doucet"},
    {EmployeeId:"264", ReportsTo:"189", Name:"Cheryl Pearson"}
  ]
});

var logicalGroupTree = isc.TreeGrid.create({
  //ID: "logicalGroupTree",
  data: logicalGroupDS,
  autoDraw: false,
  width: 200,
  //nodeIcon:"icons/16/person.png",
  //folderIcon:"icons/16/person.png",
  //showOpenIcons:false,
  //showDropIcons:false,
  //closedIconSuffix:"",
  autoFetchData:true,
  dataFetchMode:"local",
  loadDataOnDemand:false,
  dataProperties:{
    dataArrived:function (parentNode) {
      this.openAll();
    }
  },
  fields: [
    {name: "Name", width:"40%"}
    //{name: "Job"},
    //{name: "EmployeeType"},
    //{name: "Salary", formatCellValue: "isc.Format.toUSDollarString(value*1000)"}
  ]
});


var selectedTimeseriesDS = isc.RestDataSource.create({
  //ID: "countryDS",
  autoFetchData: false,
  dataFormat: 'custom',
  recordXPath: 'results',
  bypassCache: false,
  dataURL: 'data/locations.json',// "http://api.dijkdata.nl/api/v1/locations",
  containsCredentials: true,
  fields:[
    {name:"name", title:"Name"},
    {name:"description", title:"Description"},
    {name:"point_geometry", title:"geom"}
  ],
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {
      startRow: dsRequest.startRow,
      page_size: dsRequest.dataPageSize
    }
    //debugger
  },
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);

    dsResponse.totalRows = json_data.totalRows;
    dsResponse.data = json_data.results;
    dsResponse.startRow = rowCount;
    rowCount += 30;
    dsResponse.endRow = rowCount;
  },
  //  clientOnly: true,
  //  testData: countryData
});



var selectedTimeseriesList = isc.ListGrid.create({
  //ID: "countryList",
  width:700,
  alternateRecordStyles:true,
  showFilterEditor: true,
  autoFetchData: false,
  dataSource: selectedTimeseriesDS,
  fields:[
    {name:"name", title:"Name"},
    {name:"description", title:"Description"},
    {name:"point_geometry", title:"geom"}
  ],
  rowClick: function(record) {
    alarm_form.setValues(record);
  },
  canReorderFields: true,
  dataPageSize: 30,
  drawAheadRatio: 2
});



var logicalGroupForm = isc.DynamicForm.create({
  ID: "exampleForm",
  autoDraw: false,
  width: 250,
  fields: [
    {name: "name",
      title: "name",
      required: true,
      type: "text"
    },
    {name: "description",
      title: "description",
      required: true,
      type: "text"
    },
    {name: "geometry",
      required: true,
      title: "geoemtry",
      type: "text"
    }
    //table

  ]
});

logicalGroupPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    logicalGroupTree,
    selectedTimeseriesList,
    logicalGroupForm
  ]
})