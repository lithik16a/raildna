// DEMO railway sections. Names are real places used only as fictional labels; the data is synthetic.

export interface Section {
  name: string;
  lat: number;
  lng: number;
  /** Heading of the demo corridor in degrees (0 = north). */
  heading: number;
}

export const SECTIONS: Section[] = [
  { name: "Pune Railway Section", lat: 18.52, lng: 73.86, heading: 100 },
  { name: "Mumbai Suburban Section", lat: 19.08, lng: 72.88, heading: 20 },
  { name: "Nashik Road Section", lat: 19.95, lng: 73.83, heading: 80 },
  { name: "Bhusawal Section", lat: 21.05, lng: 75.78, heading: 60 },
  { name: "Nagpur Section", lat: 21.15, lng: 79.09, heading: 90 },
  { name: "Solapur Section", lat: 17.66, lng: 75.91, heading: 50 },
  { name: "Ahmedabad Section", lat: 23.02, lng: 72.57, heading: 15 },
  { name: "Vadodara Section", lat: 22.31, lng: 73.19, heading: 170 },
  { name: "Ratlam Section", lat: 23.33, lng: 75.04, heading: 120 },
  { name: "Bhopal Section", lat: 23.26, lng: 77.41, heading: 70 },
  { name: "Itarsi Section", lat: 22.61, lng: 77.76, heading: 150 },
  { name: "Jabalpur Section", lat: 23.18, lng: 79.95, heading: 100 },
  { name: "Kota Section", lat: 25.21, lng: 75.86, heading: 30 },
  { name: "Jaipur Section", lat: 26.91, lng: 75.79, heading: 110 },
  { name: "Secunderabad Section", lat: 17.44, lng: 78.5, heading: 40 },
  { name: "Kolhapur Section", lat: 16.7, lng: 74.24, heading: 160 },
];
