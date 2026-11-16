/**
 * Saans Give Ledger Emissions Calculator
 * Computes avoided or added neighborhood emissions (PM2.5, NOx, CO2e) per action
 * and transportation emissions per commute.
 */

import { Member, HouseholdProfile } from '@/lib/schemas';
import emissionFactorsData from '@/data/emission_factors.json';

export interface EmissionResult {
  pm25_g: number;
  nox_g: number;
  co2e_g: number;
  period: string;
  low: number;
  high: number;
}

export interface CommuteEmissionResult {
  daily: EmissionResult;
  perTrip: EmissionResult;
}

/**
 * Computes tailpipe / direct transit emissions for a given commuter member.
 */
export function computeCommuteEmissions(member: Member): CommuteEmissionResult {
  const km = member.commute?.km ?? 0;
  const mode = member.commute?.mode ?? 'none';

  let pm25Factor = 0;
  let noxFactor = 0;
  let co2eFactor = 0;
  let lowFactor = 0;
  let highFactor = 0;

  switch (mode) {
    case 'two_wheeler':
      pm25Factor = emissionFactorsData.two_wheeler_petrol.pm25_g.value;
      lowFactor = emissionFactorsData.two_wheeler_petrol.pm25_g.low;
      highFactor = emissionFactorsData.two_wheeler_petrol.pm25_g.high;
      noxFactor = emissionFactorsData.two_wheeler_petrol.nox_g.value;
      co2eFactor = emissionFactorsData.two_wheeler_petrol.co2e_g.value;
      break;

    case 'car':
      pm25Factor = emissionFactorsData.car_petrol.pm25_g.value;
      lowFactor = emissionFactorsData.car_petrol.pm25_g.low;
      highFactor = emissionFactorsData.car_petrol.pm25_g.high;
      noxFactor = emissionFactorsData.car_petrol.nox_g.value;
      co2eFactor = emissionFactorsData.car_petrol.co2e_g.value;
      break;

    case 'bus':
      pm25Factor = emissionFactorsData.bus_diesel_per_pax_km.pm25_g.value;
      lowFactor = emissionFactorsData.bus_diesel_per_pax_km.pm25_g.low;
      highFactor = emissionFactorsData.bus_diesel_per_pax_km.pm25_g.high;
      noxFactor = emissionFactorsData.bus_diesel_per_pax_km.nox_g.value;
      co2eFactor = emissionFactorsData.bus_diesel_per_pax_km.co2e_g.value;
      break;

    case 'auto':
      pm25Factor = emissionFactorsData.auto_cng.pm25_g.value;
      lowFactor = emissionFactorsData.auto_cng.pm25_g.low;
      highFactor = emissionFactorsData.auto_cng.pm25_g.high;
      noxFactor = emissionFactorsData.auto_cng.nox_g.value;
      co2eFactor = emissionFactorsData.auto_cng.co2e_g.value;
      break;

    case 'metro':
      pm25Factor = emissionFactorsData.metro_electric_per_pax_km.pm25_g.value;
      lowFactor = emissionFactorsData.metro_electric_per_pax_km.pm25_g.low;
      highFactor = emissionFactorsData.metro_electric_per_pax_km.pm25_g.high;
      noxFactor = emissionFactorsData.metro_electric_per_pax_km.nox_g.value;
      co2eFactor = emissionFactorsData.metro_electric_per_pax_km.co2e_g.value;
      break;

    case 'walk':
    case 'cycle':
    case 'none':
    default:
      pm25Factor = 0;
      lowFactor = 0;
      highFactor = 0;
      noxFactor = 0;
      co2eFactor = 0;
      break;
  }

  const perTrip: EmissionResult = {
    pm25_g: km * pm25Factor,
    nox_g: km * noxFactor,
    co2e_g: km * co2eFactor,
    period: 'per_trip',
    low: km * lowFactor,
    high: km * highFactor,
  };

  // Standard commuter: 2 trips / day
  const tripsPerDay = mode !== 'none' && km > 0 ? 2 : 0;
  const daily: EmissionResult = {
    pm25_g: perTrip.pm25_g * tripsPerDay,
    nox_g: perTrip.nox_g * tripsPerDay,
    co2e_g: perTrip.co2e_g * tripsPerDay,
    period: 'daily',
    low: perTrip.low * tripsPerDay,
    high: perTrip.high * tripsPerDay,
  };

  return { daily, perTrip };
}

/**
 * Computes avoided neighborhood emissions for a specific recommendation action.
 */
export function computeActionEmissions(
  actionId: string,
  profile: HouseholdProfile
): EmissionResult {
  const zeroResult: EmissionResult = {
    pm25_g: 0,
    nox_g: 0,
    co2e_g: 0,
    period: 'daily',
    low: 0,
    high: 0,
  };

  switch (actionId) {
    case 'switch_biomass_to_lpg_or_induction': {
      // Avoid ~3 biomass meals per day replacing with LPG or induction
      const mealsPerDay = 3;
      const biomass = emissionFactorsData.biomass_cooking_per_meal;
      const lpg = emissionFactorsData.lpg_cooking_per_meal;

      const deltaPm25 = biomass.pm25_g.value - lpg.pm25_g.value;
      const deltaLow = biomass.pm25_g.low - lpg.pm25_g.high;
      const deltaHigh = biomass.pm25_g.high - lpg.pm25_g.low;
      const deltaNox = biomass.nox_g.value - lpg.nox_g.value;
      const deltaCo2e = biomass.co2e_g.value - lpg.co2e_g.value;

      return {
        pm25_g: Math.max(0, deltaPm25 * mealsPerDay),
        nox_g: Math.max(0, deltaNox * mealsPerDay),
        co2e_g: Math.max(0, deltaCo2e * mealsPerDay),
        period: 'daily',
        low: Math.max(0, deltaLow * mealsPerDay),
        high: Math.max(0, deltaHigh * mealsPerDay),
      };
    }

    case 'car_to_metro_or_bus': {
      // Find car driving member km
      const carMember = profile.members.find((m) => m.commute?.mode === 'car');
      const dailyKm = carMember ? (carMember.commute?.km ?? 15) * 2 : 25;

      const car = emissionFactorsData.car_petrol;
      const metro = emissionFactorsData.metro_electric_per_pax_km;

      const deltaPm25 = car.pm25_g.value - metro.pm25_g.value;
      const deltaLow = car.pm25_g.low - metro.pm25_g.high;
      const deltaHigh = car.pm25_g.high - metro.pm25_g.low;
      const deltaNox = car.nox_g.value - metro.nox_g.value;
      const deltaCo2e = car.co2e_g.value - metro.co2e_g.value;

      return {
        pm25_g: Math.max(0, deltaPm25 * dailyKm),
        nox_g: Math.max(0, deltaNox * dailyKm),
        co2e_g: Math.max(0, deltaCo2e * dailyKm),
        period: 'daily',
        low: Math.max(0, deltaLow * dailyKm),
        high: Math.max(0, deltaHigh * dailyKm),
      };
    }

    case 'two_wheeler_to_shared_or_electric_longer_term': {
      const rider = profile.members.find((m) => m.commute?.mode === 'two_wheeler');
      const dailyKm = rider ? (rider.commute?.km ?? 12) * 2 : 20;
      const tw = emissionFactorsData.two_wheeler_petrol;

      return {
        pm25_g: tw.pm25_g.value * dailyKm,
        nox_g: tw.nox_g.value * dailyKm,
        co2e_g: tw.co2e_g.value * dailyKm,
        period: 'daily',
        low: tw.pm25_g.low * dailyKm,
        high: tw.pm25_g.high * dailyKm,
      };
    }

    case 'compost_garden_waste_instead_of_burning': {
      // Divert ~2 kg garden waste from open burning
      const kgWaste = 2.0;
      const wb = emissionFactorsData.waste_burning_per_kg;

      return {
        pm25_g: wb.pm25_g.value * kgWaste,
        nox_g: wb.nox_g.value * kgWaste,
        co2e_g: wb.co2e_g.value * kgWaste,
        period: 'daily',
        low: wb.pm25_g.low * kgWaste,
        high: wb.pm25_g.high * kgWaste,
      };
    }

    case 'layered_thermal_clothing_instead_of_combustion_heat': {
      // Displace ~1.5 kg wood/coal burning
      const kgFuel = 1.5;
      const wb = emissionFactorsData.waste_burning_per_kg;

      return {
        pm25_g: wb.pm25_g.value * kgFuel,
        nox_g: wb.nox_g.value * kgFuel,
        co2e_g: wb.co2e_g.value * kgFuel,
        period: 'daily',
        low: wb.pm25_g.low * kgFuel,
        high: wb.pm25_g.high * kgFuel,
      };
    }

    case 'engine_off_when_idling': {
      // 10 minutes of idling avoided
      return {
        pm25_g: 0.4,
        nox_g: 1.2,
        co2e_g: 140.0,
        period: 'daily',
        low: 0.2,
        high: 0.8,
      };
    }

    case 'carpool_school_run': {
      // Avoid 50% of school round trip (~10 km)
      const car = emissionFactorsData.car_petrol;
      const savedKm = 10;
      return {
        pm25_g: car.pm25_g.value * savedKm,
        nox_g: car.nox_g.value * savedKm,
        co2e_g: car.co2e_g.value * savedKm,
        period: 'daily',
        low: car.pm25_g.low * savedKm,
        high: car.pm25_g.high * savedKm,
      };
    }

    default:
      return zeroResult;
  }
}
