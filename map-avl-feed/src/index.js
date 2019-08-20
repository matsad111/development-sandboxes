import MapMarkerRenderer from './MapMarkerRenderer'
import MapDynamicMarkerRenderer from './MapDynamicMarkerRenderer'
import * as $ from 'jquery'

const getData = () => $.get('https://go.parkcity.org/InfoPoint/rest/Routes/GetAllRoutes')
  .then( res => res.filter( obj => obj.Vehicles.length > 0 )
    .reduce( (arr, obj) => {
      const {
        Color,
        Vehicles,
      } = obj
      // console.log('vehicles:', Vehicles);
      const busesWithColor = Vehicles.map( v => ({
          ...v,
          color: `#${Color}`,
        })
      )
      return [...arr, ...busesWithColor]
    }, [])
    .map( busObj => parkCityBusTranslator(busObj) )
  )
  .catch( err => console.error('Something went wrong getting bus data:', err) )

// const getData = () => fetch('https://go.parkcity.org/InfoPoint/rest/Routes/GetAllRoutes')
//   .then( res => res.body )
//   .then( stream => new Response(stream))
//   .then( response => response.blob() )
//   .then( blob => {
//     const fileReader = new FileReader()
//     fileReader.readAsText(blob)
//     return new Promise((resolve, reject) => {
//       fileReader.onload = e => {
//         const buses = JSON.parse(e.target.result)
//           .filter( obj => obj.Vehicles.length > 0 )
//           .reduce( (arr, obj) => {
//             const {
//               Color,
//               Vehicles,
//             } = obj
//             const busesWithColor = Vehicles.map( v => ({
//                 ...v,
//                 color: `#${Color}`,
//               })
//             )
//             return [...arr, ...busesWithColor]
//           }, [])
//           .map( busObj => parkCityBusTranslator(busObj) )
//
//         resolve(buses)
//       }
//       fileReader.onerror = err => reject(err)
//      })
//   })
//   .catch( err => console.error('Something went wrong:', err) )

const parkCityBusTranslator = busObj => ({
  destination: busObj.Destination, //string
  direction: busObj.DirectionLong, //string
  status: busObj.OpStatus, //string
  previousStop: busObj.LastStop, //string
  lat: busObj.Latitude, //number
  lng: busObj.Longitude, //number
  busId: busObj.VehicleId, //number
  color: busObj.color,  //string
  routeId: busObj.RouteId, //number
  onBoard: busObj.OnBoard, //number
})

let map, markers

const busIcon = {
  scale: 1,
  xOffset: 15,
  yOffset: 15,
}

const getBusIcon = (color) => {
  return {
    ...busIcon,
    url: getSvgUrlString(getBusSvg(color)),
  }
}

export const getSvgUrlString = (svg) => {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const getBusSvg = (fillColor, strokeColor = '#fff', fillOpacity = 1) => `
    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="30px" width="30px" viewBox="0 0 24 24">
      <title>BusIcon2</title>
      <path style="fill: ${fillColor}; opacity: ${fillOpacity}; isolation:isolate;" d="M12,0A12.07,12.07,0,0,1,24,12,12.07,12.07,0,0,1,12,24,12.07,12.07,0,0,1,0,12,12.07,12.07,0,0,1,12,0Z"/>
      <path style="fill:none;" d="M0,0H24V24H0Z"/>
      <path style="fill: ${strokeColor};" d="M4.94,16a2.55,2.55,0,0,0,.88,2V19.5a.88.88,0,0,0,.88.89h.89a.88.88,0,0,0,.88-.89v-.88h7.06v.88a1,1,0,0,0,.88.89h.89a1,1,0,0,0,.88-.89V17.92a2.55,2.55,0,0,0,.88-2V7.14c0-3.09-3.18-3.53-7.06-3.53s-7.06.44-7.06,3.53ZM8,16.86a1.33,1.33,0,1,1,1.32-1.33A1.36,1.36,0,0,1,8,16.86Zm7.94,0a1.33,1.33,0,1,1,1.33-1.33A1.36,1.36,0,0,1,16,16.86Zm1.33-5.3H6.7V7.14H17.3Z"/>
    </svg>
  `

const setMarker = bus => {

  const {
    lat,
    lng,
    color,
    busId,
    ...remaining
  } = bus

  const infoWindowKeys = [
    {
      key: 'status',
      label: 'Status',
    },
    {
      key: 'onBoard',
      label: 'On Board',
    },
    {
      key: 'routeId',
      label: 'Route',
    },
    {
      key: 'destination',
      label: 'Destination',
    },
    {
      key: 'direction',
      label: 'Direction',
    },
    {
      key: 'previousStop',
      label: 'Previous Stop',
    },
  ]

  // prominent route number
  const coloredRouteNumber = `
  <div>
    <div
      style="color: black; padding: .2em 0; font-size: 1.4em; display: flex;  align-items: center;">
      ${getBusSvg(color)}
      <div style="padding: 0 .5em;">
        <strong>Bus ID: ${busId}</strong>
      </div>
    </div>
    <hr style="border: .5px solid gray;">
  </div>`

  const statusStr = `
    <div style="color: black; padding: .2em 0 .5em 0;">
      <span style="color: gray;">Status: </span>
      ${remaining.status === 'LATE' ?
        `<span style="background: red; padding: 3px 5px; color: white; border-radius: 2px; "><strong>${remaining.status}</strong></span>`
        : (
          remaining.status === 'ONTIME' || remaining.status === 'EARLY' ?
          `<span style="background: green; padding: 3px 5px; color: white; border-radius: 2px; "><strong>${remaining.status}</strong></span>`
          :`<strong>${remaining.status}</strong>`)
        }
    </div>`

  const infoWindowContent = infoWindowKeys.reduce( (str, k) => k.key === 'status' ? str + statusStr : str + `<div style="color: black; padding: .25em 1.25em .5em 0;">
    <span style="color: gray;">${k.label}:</span><strong> ${remaining[k.key]}</strong>
  </div>`, coloredRouteNumber)

  // const infoWindowContent = infoWindowData + coloredRouteNumber

  const props = {
    map,
    lat,
    lng,
    iconProps: getBusIcon(color),
    fillColor: null,
    rotation: 0,
    infoWindowContent,
    id: busId,
  }

  return new MapDynamicMarkerRenderer(props)
}

const processData = () => getData()
  .then( buses => {

    if (markers) {
      buses.forEach( bus => {
        const m = markers.find( marker => marker.props.id === bus.busId )

        if (m) {

          console.log('marker:', m);
          m.marker.setPosition({lat: bus.lat, lng: bus.lng})
        }
        else {
          const marker = setMarker(bus)
          markers = [...markers, marker]
        }
      })
    }
    else {
      markers = buses.map( bus => setMarker(bus) )
    }
  })

const initialize = () => {
  console.log('initializing...');
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
        lat: 40.643684,
        lng: -111.495922,
      },
      zoom: 13,
    })

  processData()

  setInterval( () => {
    processData()
  }, 5 * 1000)
}

google.maps.event.addDomListener(window, 'load', initialize)

console.log('Hello Fiona!');
