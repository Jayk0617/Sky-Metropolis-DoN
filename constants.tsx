
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType } from './types';

// Map Settings
export const GRID_SIZE = 15;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 1000;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444', // Used for UI
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects buildings.',
    color: '#374151', // gray-700
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#f87171', // red-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa', // blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#facc15', // yellow-400
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#4ade80', // green-400
    popGen: 1,
    incomeGen: 0,
  },
  [BuildingType.Restaurant]: {
    type: BuildingType.Restaurant,
    cost: 150,
    name: 'Diner',
    description: '+$25/day',
    color: '#fb923c', // orange-400
    popGen: 0,
    incomeGen: 25,
  },
  [BuildingType.Hotel]: {
    type: BuildingType.Hotel,
    cost: 300,
    name: 'Hotel',
    description: '+$35/day',
    color: '#a78bfa', // violet-400
    popGen: 0,
    incomeGen: 35,
  },
  [BuildingType.Hospital]: {
    type: BuildingType.Hospital,
    cost: 600,
    name: 'Hospital',
    description: '+10 Pop/day, Costs $20/day',
    color: '#f43f5e', // rose-500
    popGen: 10,
    incomeGen: -20,
  },
  [BuildingType.Airport]: {
    type: BuildingType.Airport,
    cost: 2000,
    name: 'Airport',
    description: 'Unique. +$120/day. Planes!',
    color: '#0ea5e9', // sky-500
    popGen: 15,
    incomeGen: 120,
  },
};
