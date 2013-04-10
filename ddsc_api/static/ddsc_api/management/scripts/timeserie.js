locationPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    isc.Label.create({
      contents: "Listing",
      align: "center",
      overflow: "hidden",
      showResizeBar: true,
      border: "1px solid blue"
    }),
    isc.Label.create({
      contents: "Details",
      align: "center",
      overflow: "hidden",
      border: "1px solid blue"
    })
  ]
})