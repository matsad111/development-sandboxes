export default class MapDynamicMarkerRenderer {

  // marker = null
  // infowindow = new google.maps.InfoWindow()
  // listeners = []

  constructor(props){
    this.props = props
    this.marker = null
    this.infowindow = new google.maps.InfoWindow()
    this.listeners = []
    // super(props)
    this.addMarker()
    this.addListeners()
  }

  addMarker() {
  // addMarker = () => {

    const {
      map,
      lat,
      lng,
      iconProps,
      fillColor,
      rotation,
      id,
    } = this.props

    const icon = {
      ...iconProps,
      fillColor,
      rotation,
      anchor: new google.maps.Point(iconProps.xOffset, iconProps.yOffset)
    }

    const position = {
      lat,
      lng,
    }

    this.clearMap()

    this.marker = new google.maps.Marker({
      id,
      position,
      icon,
      map,
      zIndex: 999,
      updater: this.moveMarker,
    })

    this.addListeners()
  }

  addListeners() {
  // addListeners = () => {

    const {
      map,
      onclickReturnValue,
      // value,
      onClick,
      infoWindowContent,
      // showName = true,
    } = this.props

    if (onClick && onclickReturnValue) {
    // if (onClick && value) {
      this.listeners.push(
        //@ts-ignore
        google.maps.event.addListener(this.marker, 'click', () => {
          onClick(value)
        })
      )
    }

    if (infoWindowContent) {
    // if (showName && value && value.name) {
      this.listeners.push(
        //@ts-ignore
        google.maps.event.addListener(this.marker, 'mouseover', () => {

          this.infowindow.setContent(infoWindowContent)
          //@ts-ignore
          this.infowindow.open(map, this.marker)
        }),
        // current code
        // google.maps.event.addListener(this.marker, 'mouseover', () => {
        //   const content = `<div style="color: black; padding: .25em 1.25em 0 0;">${value.name}</div>`
        //   this.infowindow.setContent(content)
        //   //@ts-ignore
        //   this.infowindow.open(map, this.marker)
        // }),
        //@ts-ignore
        google.maps.event.addListener(this.marker, 'mouseout', () => {
          this.infowindow.close()
        })
      )
    }
  }

  moveMarker() {
    console.log('moving!!!');
  }

  removeListener(listener) {
  // removeListener = (listener: google.maps.MapsEventListener) => {
    google.maps.event.removeListener(listener)
  }

  removeAllListeners() {
    this.listeners.forEach(listener => this.removeListener(listener))
  }

  clearMap() {

    this.removeAllListeners()

    if (this.marker) {
      this.marker.setMap(null)
      this.marker = null
    }
  }

  // componentWillUnmount() {
  //   this.clearMap()
  // }

  // render(): false {
  //   this.addMarker()
  //   return false
  // }
}
