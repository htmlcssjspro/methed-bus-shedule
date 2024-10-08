import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { DateTime } from 'luxon';


const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const port = 3000
const timeZone = 'UTC'


const app = express();
app.use(express.static(path.join(__dirname, 'public')))


const loadBuses = async () => {
  const data = await readFile(path.join(__dirname, './buses.json'), 'utf-8')
  return JSON.parse(data)
}

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
  const now = DateTime.now().setZone(timeZone)
  const [hours, minutes] = firstDepartureTime.split(':').map(Number)

  let departure = DateTime.now()
    .set({hours, minutes})
    .setZone(timeZone)

  const endOfDay = DateTime.now()
    .set({hours: 23, minutes: 59, seconds: 59})
    .setZone(timeZone)

  if (departure > endOfDay) {
    departure = departure.departure.startOf('day').plus({days: 1}).set({hours, minutes})
  }

  while (now > departure) {
    departure = departure.plus({minutes: frequencyMinutes})

    if (departure > endOfDay) {
      departure = departure.startOf('day').plus({days: 1}).set({hours, minutes})
    }
  }

  return departure
}

const sendUpdatedData = async () => {
  const buses = await loadBuses()

  const updatedBuses = buses.map(bus => {
    const nextDeparture = getNextDeparture(bus.firstDepartureTime, bus.frequencyMinutes)

    return {...bus, nextDeparture: {
      date: nextDeparture.toFormat('yyyy-MM-dd'),
      time: nextDeparture.toFormat('HH:mm:ss'),
    }}
  })

  return updatedBuses
}

const sortBuses = buses =>
  [...buses].sort((a, b) =>
    DateTime.fromISO(`${a.nextDeparture.date}T${a.nextDeparture.time}Z`) -
    DateTime.fromISO(`${b.nextDeparture.date}T${b.nextDeparture.time}Z`)
    // new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}Z`) -
    // new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}Z`)
  )


app.get('/', (req, res) => {
  res.send('Home Page');
})

app.get('/next-departure', async (req, res) => {
  try {
    const updatedBuses = await sendUpdatedData()
    const sortedBuses = sortBuses(updatedBuses)
    res.json(sortedBuses)
  } catch (e) {
    res.status(500)
    res.send(e);
  }
})


app.listen(port, () => console.log('Server running on http://localhost:' + port));
