export type LatLng = { lat: number; lng: number }

export type Place = {
  label: string
  coord: LatLng
}

export type DutyStatus = 'OFF_DUTY' | 'SLEEPER' | 'DRIVING' | 'ON_DUTY'

export type EventKind =
  | 'offduty'
  | 'sleeper'
  | 'restart'
  | 'pretrip'
  | 'driving'
  | 'break'
  | 'fuel'
  | 'pickup'
  | 'dropoff'

export type TripEvent = {
  kind: EventKind
  status: DutyStatus
  startMin: number
  endMin: number
  location: string
  note: string
  miles?: number
  coord?: LatLng
}

export type StopInfo = {
  kind: EventKind
  label: string
  time: string
  location: string
  coord: LatLng
  cumMiles: number
}

export type DailyLog = {
  day: number
  dateLabel: string
  events: TripEvent[]
  totals: Record<DutyStatus, number>
  miles: number
  driveMin: number
  avgMph: number
  startOdo: number
  endOdo: number
  fromLabel: string
  toLabel: string
}

export type TripInput = {
  origin: string
  pickup: string
  dropoff: string
  cycleUsed: number
}

export type SimInput = {
  legMiles: [number, number]
  driveMin: number
  cycleUsed: number
  labels: { origin: string; pickup: string; dropoff: string }
  geometry: LatLng[]
}

export type SimResult = {
  events: TripEvent[]
  stops: StopInfo[]
  cycleRestart: boolean
}

export type Trip = {
  origin: Place
  pickup: Place
  dropoff: Place
  geometry: LatLng[]
  totalMiles: number
  totalDriveMin: number
  effectiveMph: number
  stops: StopInfo[]
  days: DailyLog[]
  cycleUsed: number
  cycleRestart: boolean
  departLabel: string
  arriveLabel: string
  daysCount: number
}
