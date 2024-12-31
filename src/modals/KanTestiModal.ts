// src/types/BloodTestTypes.ts
export interface KanTestiModal {
	id?: string;
	date: Date;
	testType: string;
	results: {
	  [key: string]: {
		value: number;
		unit: string;
		referenceRange?: {
		  low: number;
		  high: number;
		};
	  };
	};
	notes?: string;
	userId: string;
  }
  
  export const DEFAULT_TEST_TYPES = [
	'Ig Kan Testi'
  ];
  
  export const DEFAULT_TEST_PARAMETERS: {[key: string]: {unit: string, referenceRange?: {low: number, high: number}}} = {
	'IgA': { unit: 'mg/dL', referenceRange: { low: 0.7, high: 4.0 } },
	'IgM': { unit: 'mg/dL', referenceRange: { low: 0.4, high: 2.3 } },
	'IgG': { unit: 'mg/dL', referenceRange: { low: 7.0, high: 16.0 } },
	'IgG1': { unit: 'mg/dL', referenceRange: { low: 3.8, high: 9.3 } },
	'IgG2': { unit: 'mg/dL', referenceRange: { low: 2.4, high: 7.0 } },
	'IgG3': { unit: 'mg/dL', referenceRange: { low: 0.22, high: 1.76 } },
	'IgG4': { unit: 'mg/dL', referenceRange: { low: 0.04, high: 0.86 } }
  };