const fetchBusData = async () => {
  try {
    const response = await fetch('/next-departure')

    if (!response.ok) {
      throw new Error(`Network error! Status: ${response.status}`)
    }

    const buses = await response.json()
    return buses
  } catch (error) {
    console.error(error);
  }
}


const formatDate = date => date.toISOString().split('T')[0]
const formatTime = date => date.toTimeString().split(' ')[0].slice(0, 5)


const renderBusData = buses => {
  const tableBody = document.querySelector('#buses tbody')
  tableBody.innerHTML = ''

  buses.forEach(bus => {
    const nextDepartureTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`)


    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${bus.busNumber}</td>
      <td>${bus.startPoint} - ${bus.endPoint}</td>
      <td>${formatDate(nextDepartureTimeUTC)}</td>
      <td>${formatTime(nextDepartureTimeUTC)}</td>
    `
    tableBody.append(row)
  })
}

const init = async () => {
  const buses = await fetchBusData()
  renderBusData(buses)
}

init()
