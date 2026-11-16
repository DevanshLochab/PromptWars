import { describe, it, expect } from 'vitest';
import {
  computeCommuteEmissions,
  computeActionEmissions,
} from '@/lib/engine/emissions';
import emissionFactorsData from '@/data/emission_factors.json';
import { Member, HouseholdProfile } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Give Ledger Emissions Calculator', () => {
  it('ORDINAL SANITY: biomass cooking PM2.5 > LPG cooking per meal', () => {
    const biomassMeal = emissionFactorsData.biomass_cooking_per_meal.pm25_g.value;
    const lpgMeal = emissionFactorsData.lpg_cooking_per_meal.pm25_g.value;

    expect(biomassMeal).toBeGreaterThan(lpgMeal);
    // Biomass produces 0.5g vs LPG 0.02g (25x higher)
    expect(biomassMeal / lpgMeal).toBeGreaterThanOrEqual(20);
  });

  it('ORDINAL SANITY: diesel car PM per km > petrol car', () => {
    const dieselCarPm = emissionFactorsData.car_diesel.pm25_g.value;
    const petrolCarPm = emissionFactorsData.car_petrol.pm25_g.value;

    expect(dieselCarPm).toBeGreaterThan(petrolCarPm);
    // Diesel car PM2.5 (0.045 g/km) is ~9x petrol car PM2.5 (0.005 g/km)
    expect(dieselCarPm).toBeCloseTo(0.045, 3);
    expect(petrolCarPm).toBeCloseTo(0.005, 3);
  });

  it('ORDINAL SANITY: per passenger-km emissions: car > bus > metro', () => {
    // CO2e comparison per passenger-km
    const carCo2e = emissionFactorsData.car_petrol.co2e_g.value; // 170 g/km
    const busCo2e = emissionFactorsData.bus_diesel_per_pax_km.co2e_g.value; // 25 g/pax-km
    const metroCo2e = emissionFactorsData.metro_electric_per_pax_km.co2e_g.value; // 10 g/pax-km

    expect(carCo2e).toBeGreaterThan(busCo2e);
    expect(busCo2e).toBeGreaterThan(metroCo2e);

    // PM2.5 comparison: car diesel vs bus vs metro
    const carDieselPm = emissionFactorsData.car_diesel.pm25_g.value; // 0.045
    const busPm = emissionFactorsData.bus_diesel_per_pax_km.pm25_g.value; // 0.006
    const metroPm = emissionFactorsData.metro_electric_per_pax_km.pm25_g.value; // 0.001

    expect(carDieselPm).toBeGreaterThan(busPm);
    expect(busPm).toBeGreaterThan(metroPm);
  });

  it('ORDINAL SANITY: open waste burning > composting', () => {
    const openBurningPm = emissionFactorsData.waste_burning_per_kg.pm25_g.value;
    const compostingPm = 0.0; // Composting avoids open burning emissions entirely

    expect(openBurningPm).toBeGreaterThan(compostingPm);
    expect(openBurningPm).toBeCloseTo(5.0, 1); // 5g PM2.5 per kg of waste burned
  });

  it('computes commute emissions accurately for a two-wheeler rider', () => {
    const rider: Member = {
      id: 'm1',
      nickname: 'Rajesh',
      ageBand: 'adult',
      conditions: ['none'],
      commute: {
        mode: 'two_wheeler',
        km: 12,
        startHour: 9,
        endHour: 18,
      },
      outdoorHoursPerDay: 2,
      outdoorActivity: 'none',
      maskOwned: 'none',
    };

    const res = computeCommuteEmissions(rider);

    // 12 km single trip: 12 * 0.025 = 0.3g PM2.5
    expect(res.perTrip.pm25_g).toBeCloseTo(0.3, 2);
    expect(res.perTrip.co2e_g).toBeCloseTo(12 * 40, 1);

    // Daily round trip (2 trips): 24 km total → 0.6g PM2.5
    expect(res.daily.pm25_g).toBeCloseTo(0.6, 2);
    expect(res.daily.co2e_g).toBeCloseTo(24 * 40, 1);
  });

  it('computes zero emissions for walk or cycle commutes', () => {
    const walker: Member = {
      id: 'm2',
      nickname: 'Priya',
      ageBand: 'adult',
      conditions: ['none'],
      commute: {
        mode: 'walk',
        km: 3,
        startHour: 8,
        endHour: 17,
      },
      outdoorHoursPerDay: 1,
      outdoorActivity: 'light',
      maskOwned: 'none',
    };

    const res = computeCommuteEmissions(walker);
    expect(res.daily.pm25_g).toBe(0);
    expect(res.daily.co2e_g).toBe(0);
  });

  it('computes community avoided emissions for fuel switching and mode shift actions', () => {
    const profile = demoSnapshot.profile as HouseholdProfile;

    // Switching biomass to LPG avoids ~1.44g PM2.5 daily
    const cookingRes = computeActionEmissions('switch_biomass_to_lpg_or_induction', profile);
    expect(cookingRes.pm25_g).toBeGreaterThan(1.0);
    expect(cookingRes.co2e_g).toBeGreaterThan(500);

    // Composting 2kg waste avoids ~10g PM2.5
    const compostRes = computeActionEmissions('compost_garden_waste_instead_of_burning', profile);
    expect(compostRes.pm25_g).toBeCloseTo(10.0, 1);
    expect(compostRes.co2e_g).toBeCloseTo(3000, 0);
  });
});
