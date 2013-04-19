
uploadFrame = isc.VLayout.create({width:"100%", height:"100%", members:[
    isc.HTMLPane.create({
        ID: "myPane",
        showEdges: false,
        contentsURL: settings.csv_upload_url,
        contentsType: "page"
    })
]})

fileUploadPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    uploadFrame
  ]
});

