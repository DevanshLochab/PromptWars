export interface CityOption {
  city: string;
  state: string;
  region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'Northeast';
  placeName: string;
  lat: number;
  lon: number;
  isMetro?: boolean;
}

export const INDIAN_CITIES: CityOption[] = [
  // --- Metros & Major Capitals ---
  {
    city: 'New Delhi',
    state: 'Delhi NCR',
    region: 'North',
    placeName: 'New Delhi, Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    isMetro: true,
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Mumbai, Maharashtra, India',
    lat: 19.076,
    lon: 72.8777,
    isMetro: true,
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    placeName: 'Bengaluru, Karnataka, India',
    lat: 12.9716,
    lon: 77.5946,
    isMetro: true,
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    placeName: 'Kolkata, West Bengal, India',
    lat: 22.5726,
    lon: 88.3639,
    isMetro: true,
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    placeName: 'Chennai, Tamil Nadu, India',
    lat: 13.0827,
    lon: 80.2707,
    isMetro: true,
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    placeName: 'Hyderabad, Telangana, India',
    lat: 17.385,
    lon: 78.4867,
    isMetro: true,
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Pune, Maharashtra, India',
    lat: 18.5204,
    lon: 73.8567,
    isMetro: true,
  },
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    region: 'West',
    placeName: 'Ahmedabad, Gujarat, India',
    lat: 23.0225,
    lon: 72.5714,
    isMetro: true,
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    placeName: 'Jaipur, Rajasthan, India',
    lat: 26.9124,
    lon: 75.7873,
    isMetro: true,
  },
  {
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Lucknow, Uttar Pradesh, India',
    lat: 26.8467,
    lon: 80.9462,
    isMetro: true,
  },

  // --- Delhi NCR & North India ---
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Noida, Uttar Pradesh, India',
    lat: 28.5355,
    lon: 77.391,
    isMetro: true,
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    region: 'North',
    placeName: 'Gurugram, Haryana, India',
    lat: 28.4595,
    lon: 77.0266,
    isMetro: true,
  },
  {
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Ghaziabad, Uttar Pradesh, India',
    lat: 28.6692,
    lon: 77.4538,
  },
  {
    city: 'Faridabad',
    state: 'Haryana',
    region: 'North',
    placeName: 'Faridabad, Haryana, India',
    lat: 28.4089,
    lon: 77.3178,
  },
  {
    city: 'Chandigarh',
    state: 'Chandigarh',
    region: 'North',
    placeName: 'Chandigarh, India',
    lat: 30.7333,
    lon: 76.7794,
    isMetro: true,
  },
  {
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Kanpur, Uttar Pradesh, India',
    lat: 26.4499,
    lon: 80.3319,
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Varanasi, Uttar Pradesh, India',
    lat: 25.3176,
    lon: 82.9739,
  },
  {
    city: 'Agra',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Agra, Uttar Pradesh, India',
    lat: 27.1767,
    lon: 78.0081,
  },
  {
    city: 'Prayagraj',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Prayagraj, Uttar Pradesh, India',
    lat: 25.4358,
    lon: 81.8463,
  },
  {
    city: 'Meerut',
    state: 'Uttar Pradesh',
    region: 'North',
    placeName: 'Meerut, Uttar Pradesh, India',
    lat: 28.9845,
    lon: 77.7064,
  },
  {
    city: 'Ludhiana',
    state: 'Punjab',
    region: 'North',
    placeName: 'Ludhiana, Punjab, India',
    lat: 30.901,
    lon: 75.8573,
  },
  {
    city: 'Amritsar',
    state: 'Punjab',
    region: 'North',
    placeName: 'Amritsar, Punjab, India',
    lat: 31.634,
    lon: 74.8723,
  },
  {
    city: 'Jalandhar',
    state: 'Punjab',
    region: 'North',
    placeName: 'Jalandhar, Punjab, India',
    lat: 31.326,
    lon: 75.5762,
  },
  {
    city: 'Dehradun',
    state: 'Uttarakhand',
    region: 'North',
    placeName: 'Dehradun, Uttarakhand, India',
    lat: 30.3165,
    lon: 78.0322,
  },
  {
    city: 'Haridwar',
    state: 'Uttarakhand',
    region: 'North',
    placeName: 'Haridwar, Uttarakhand, India',
    lat: 29.9457,
    lon: 78.1642,
  },
  {
    city: 'Shimla',
    state: 'Himachal Pradesh',
    region: 'North',
    placeName: 'Shimla, Himachal Pradesh, India',
    lat: 31.1048,
    lon: 77.1734,
  },
  {
    city: 'Srinagar',
    state: 'Jammu & Kashmir',
    region: 'North',
    placeName: 'Srinagar, Jammu & Kashmir, India',
    lat: 34.0837,
    lon: 74.7973,
  },
  {
    city: 'Jammu',
    state: 'Jammu & Kashmir',
    region: 'North',
    placeName: 'Jammu, Jammu & Kashmir, India',
    lat: 32.7266,
    lon: 74.857,
  },
  {
    city: 'Jodhpur',
    state: 'Rajasthan',
    region: 'North',
    placeName: 'Jodhpur, Rajasthan, India',
    lat: 26.2389,
    lon: 73.0243,
  },
  {
    city: 'Kota',
    state: 'Rajasthan',
    region: 'North',
    placeName: 'Kota, Rajasthan, India',
    lat: 25.2138,
    lon: 75.8648,
  },
  {
    city: 'Udaipur',
    state: 'Rajasthan',
    region: 'North',
    placeName: 'Udaipur, Rajasthan, India',
    lat: 24.5854,
    lon: 73.7125,
  },

  // --- Western India ---
  {
    city: 'Thane',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Thane, Maharashtra, India',
    lat: 19.2183,
    lon: 72.9781,
  },
  {
    city: 'Nagpur',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Nagpur, Maharashtra, India',
    lat: 21.1458,
    lon: 79.0882,
  },
  {
    city: 'Nashik',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Nashik, Maharashtra, India',
    lat: 19.9975,
    lon: 73.7898,
  },
  {
    city: 'Chhatrapati Sambhajinagar (Aurangabad)',
    state: 'Maharashtra',
    region: 'West',
    placeName: 'Chhatrapati Sambhajinagar, Maharashtra, India',
    lat: 19.8762,
    lon: 75.3433,
  },
  {
    city: 'Surat',
    state: 'Gujarat',
    region: 'West',
    placeName: 'Surat, Gujarat, India',
    lat: 21.1702,
    lon: 72.8311,
  },
  {
    city: 'Vadodara',
    state: 'Gujarat',
    region: 'West',
    placeName: 'Vadodara, Gujarat, India',
    lat: 22.3072,
    lon: 73.1812,
  },
  {
    city: 'Rajkot',
    state: 'Gujarat',
    region: 'West',
    placeName: 'Rajkot, Gujarat, India',
    lat: 22.3039,
    lon: 70.8022,
  },
  {
    city: 'Panaji',
    state: 'Goa',
    region: 'West',
    placeName: 'Panaji, Goa, India',
    lat: 15.4909,
    lon: 73.8278,
  },

  // --- Southern India ---
  {
    city: 'Mysuru',
    state: 'Karnataka',
    region: 'South',
    placeName: 'Mysuru, Karnataka, India',
    lat: 12.2958,
    lon: 76.6394,
  },
  {
    city: 'Hubballi-Dharwad',
    state: 'Karnataka',
    region: 'South',
    placeName: 'Hubballi, Karnataka, India',
    lat: 15.3647,
    lon: 75.124,
  },
  {
    city: 'Mangaluru',
    state: 'Karnataka',
    region: 'South',
    placeName: 'Mangaluru, Karnataka, India',
    lat: 12.9141,
    lon: 74.856,
  },
  {
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    region: 'South',
    placeName: 'Coimbatore, Tamil Nadu, India',
    lat: 11.0168,
    lon: 76.9558,
  },
  {
    city: 'Madurai',
    state: 'Tamil Nadu',
    region: 'South',
    placeName: 'Madurai, Tamil Nadu, India',
    lat: 9.9252,
    lon: 78.1198,
  },
  {
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    region: 'South',
    placeName: 'Tiruchirappalli, Tamil Nadu, India',
    lat: 10.7905,
    lon: 78.7047,
  },
  {
    city: 'Salem',
    state: 'Tamil Nadu',
    region: 'South',
    placeName: 'Salem, Tamil Nadu, India',
    lat: 11.6643,
    lon: 78.146,
  },
  {
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    region: 'South',
    placeName: 'Visakhapatnam, Andhra Pradesh, India',
    lat: 17.6868,
    lon: 83.2185,
  },
  {
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    region: 'South',
    placeName: 'Vijayawada, Andhra Pradesh, India',
    lat: 16.5062,
    lon: 80.648,
  },
  {
    city: 'Warangal',
    state: 'Telangana',
    region: 'South',
    placeName: 'Warangal, Telangana, India',
    lat: 17.9689,
    lon: 79.5941,
  },
  {
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    region: 'South',
    placeName: 'Thiruvananthapuram, Kerala, India',
    lat: 8.5241,
    lon: 76.9366,
  },
  {
    city: 'Kochi',
    state: 'Kerala',
    region: 'South',
    placeName: 'Kochi, Kerala, India',
    lat: 9.9312,
    lon: 76.2673,
  },
  {
    city: 'Kozhikode',
    state: 'Kerala',
    region: 'South',
    placeName: 'Kozhikode, Kerala, India',
    lat: 11.2588,
    lon: 75.7804,
  },

  // --- Eastern India ---
  {
    city: 'Howrah',
    state: 'West Bengal',
    region: 'East',
    placeName: 'Howrah, West Bengal, India',
    lat: 22.5958,
    lon: 88.2636,
  },
  {
    city: 'Siliguri',
    state: 'West Bengal',
    region: 'East',
    placeName: 'Siliguri, West Bengal, India',
    lat: 26.7271,
    lon: 88.3953,
  },
  {
    city: 'Durgapur',
    state: 'West Bengal',
    region: 'East',
    placeName: 'Durgapur, West Bengal, India',
    lat: 23.5204,
    lon: 87.3119,
  },
  {
    city: 'Patna',
    state: 'Bihar',
    region: 'East',
    placeName: 'Patna, Bihar, India',
    lat: 25.5941,
    lon: 85.1376,
  },
  {
    city: 'Gaya',
    state: 'Bihar',
    region: 'East',
    placeName: 'Gaya, Bihar, India',
    lat: 24.7914,
    lon: 85.0002,
  },
  {
    city: 'Muzaffarpur',
    state: 'Bihar',
    region: 'East',
    placeName: 'Muzaffarpur, Bihar, India',
    lat: 26.1209,
    lon: 85.3647,
  },
  {
    city: 'Bhubaneswar',
    state: 'Odisha',
    region: 'East',
    placeName: 'Bhubaneswar, Odisha, India',
    lat: 20.2961,
    lon: 85.8245,
  },
  {
    city: 'Cuttack',
    state: 'Odisha',
    region: 'East',
    placeName: 'Cuttack, Odisha, India',
    lat: 20.4625,
    lon: 85.8828,
  },
  {
    city: 'Ranchi',
    state: 'Jharkhand',
    region: 'East',
    placeName: 'Ranchi, Jharkhand, India',
    lat: 23.3441,
    lon: 85.3096,
  },
  {
    city: 'Jamshedpur',
    state: 'Jharkhand',
    region: 'East',
    placeName: 'Jamshedpur, Jharkhand, India',
    lat: 22.8046,
    lon: 86.2029,
  },

  // --- Central India ---
  {
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    region: 'Central',
    placeName: 'Bhopal, Madhya Pradesh, India',
    lat: 23.2599,
    lon: 77.4126,
  },
  {
    city: 'Indore',
    state: 'Madhya Pradesh',
    region: 'Central',
    placeName: 'Indore, Madhya Pradesh, India',
    lat: 22.7196,
    lon: 75.8577,
  },
  {
    city: 'Gwalior',
    state: 'Madhya Pradesh',
    region: 'Central',
    placeName: 'Gwalior, Madhya Pradesh, India',
    lat: 26.2183,
    lon: 78.1828,
  },
  {
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    region: 'Central',
    placeName: 'Jabalpur, Madhya Pradesh, India',
    lat: 23.1815,
    lon: 79.9864,
  },
  {
    city: 'Raipur',
    state: 'Chhattisgarh',
    region: 'Central',
    placeName: 'Raipur, Chhattisgarh, India',
    lat: 21.2514,
    lon: 81.6296,
  },

  // --- Northeast India ---
  {
    city: 'Guwahati',
    state: 'Assam',
    region: 'Northeast',
    placeName: 'Guwahati, Assam, India',
    lat: 26.1445,
    lon: 91.7362,
  },
  {
    city: 'Agartala',
    state: 'Tripura',
    region: 'Northeast',
    placeName: 'Agartala, Tripura, India',
    lat: 23.8315,
    lon: 91.2868,
  },
  {
    city: 'Shillong',
    state: 'Meghalaya',
    region: 'Northeast',
    placeName: 'Shillong, Meghalaya, India',
    lat: 25.5788,
    lon: 91.8933,
  },
  {
    city: 'Imphal',
    state: 'Manipur',
    region: 'Northeast',
    placeName: 'Imphal, Manipur, India',
    lat: 24.817,
    lon: 93.9368,
  },
];

/**
 * Calculates distance in kilometers between two geo coordinates using Haversine formula
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest Indian city from our directory to given coordinates
 */
export function findNearestCity(lat: number, lon: number): CityOption {
  let nearest = INDIAN_CITIES[0];
  let minDistance = Infinity;

  for (const city of INDIAN_CITIES) {
    const dist = getDistanceKm(lat, lon, city.lat, city.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return nearest;
}
