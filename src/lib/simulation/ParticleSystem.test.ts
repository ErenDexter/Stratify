import { describe, it, expect } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import type { FluidParameters, ParticleData } from '../types/simulation.types';

const R = 1;
const LEN = 10;
const N = 2000;
const G = 9.81;

const params = (flowRate: number, viscosity: number, density: number): FluidParameters => ({
	flowRate,
	viscosity,
	density,
	color: 0
});

function interfaceFraction(data: ParticleData): number {
	let n = 0;
	for (let i = 0; i < N; i++) if (Math.abs(data.positions[i * 3 + 1]) < 0.1) n++;
	return n / N;
}

function maxRadius(data: ParticleData): number {
	let m = 0;
	for (let i = 0; i < N; i++) {
		const y = data.positions[i * 3 + 1];
		const z = data.positions[i * 3 + 2];
		m = Math.max(m, Math.hypot(y, z));
	}
	return m;
}

function run(
	ps: ParticleSystem,
	upper: ParticleData,
	lower: ParticleData,
	u: FluidParameters,
	l: FluidParameters,
	steps: number
) {
	const dt = 1 / 60;
	let t = 0;
	for (let s = 0; s < steps; s++) {
		t += dt;
		ps.updateParticles(upper, 'upper', u, l, G, dt, t);
		ps.updateParticles(lower, 'lower', u, l, G, dt, t);
	}
}

describe('initializeParticles - sharp stratified layers', () => {
	it('places all upper-phase particles at or above the interface', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		for (let i = 0; i < N; i++) expect(upper.positions[i * 3 + 1]).toBeGreaterThanOrEqual(-1e-6);
	});

	it('places all lower-phase particles at or below the interface', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const lower = ps.initializeParticles('lower');
		for (let i = 0; i < N; i++) expect(lower.positions[i * 3 + 1]).toBeLessThanOrEqual(1e-6);
	});

	it('fills the cross-section (particles spread across z and the full radius)', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		expect(maxRadius(upper)).toBeGreaterThan(0.8);
		let minZ = Infinity,
			maxZ = -Infinity;
		for (let i = 0; i < N; i++) {
			minZ = Math.min(minZ, upper.positions[i * 3 + 2]);
			maxZ = Math.max(maxZ, upper.positions[i * 3 + 2]);
		}
		expect(maxZ - minZ).toBeGreaterThan(1.2);
	});
});

describe('two-streams regression - the interface must not evacuate', () => {
	it('keeps particles near the interface in strong counter-current flow (no void)', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		const lower = ps.initializeParticles('lower');
		const u = params(-2, 0.5, 800);
		const l = params(2, 0.5, 1000);

		const before = (interfaceFraction(upper) + interfaceFraction(lower)) / 2;
		run(ps, upper, lower, u, l, 900); // 15 s
		const after = (interfaceFraction(upper) + interfaceFraction(lower)) / 2;

		// The bug collapsed this to ~0.000. It must stay populated.
		expect(after).toBeGreaterThan(0.6 * before);
	});

	it('keeps the interface populated under a moderate velocity tweak', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		const lower = ps.initializeParticles('lower');
		const u = params(0.8, 1.0, 800);
		const l = params(0.3, 2.0, 1000);

		const before = (interfaceFraction(upper) + interfaceFraction(lower)) / 2;
		run(ps, upper, lower, u, l, 900);
		const after = (interfaceFraction(upper) + interfaceFraction(lower)) / 2;
		expect(after).toBeGreaterThan(0.75 * before);
	});
});

describe('stratification and containment', () => {
	it('keeps the two phases from inter-penetrating (buoyancy holds layers)', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		const lower = ps.initializeParticles('lower');
		const u = params(-2, 0.5, 800);
		const l = params(2, 0.5, 1000);
		run(ps, upper, lower, u, l, 600);

		let upperCrossed = 0,
			lowerCrossed = 0;
		for (let i = 0; i < N; i++) {
			if (upper.positions[i * 3 + 1] < -0.15) upperCrossed++;
			if (lower.positions[i * 3 + 1] > 0.15) lowerCrossed++;
		}
		expect(upperCrossed / N).toBeLessThan(0.05);
		expect(lowerCrossed / N).toBeLessThan(0.05);
	});

	it('keeps every particle inside the pipe', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		const lower = ps.initializeParticles('lower');
		const u = params(2, 0.5, 800);
		const l = params(-1.5, 1.0, 1000);
		run(ps, upper, lower, u, l, 600);
		expect(maxRadius(upper)).toBeLessThanOrEqual(R + 1e-6);
		expect(maxRadius(lower)).toBeLessThanOrEqual(R + 1e-6);
	});

	it('recycles particles that reach the pipe ends (periodic in x)', () => {
		const ps = new ParticleSystem(N, LEN, R);
		const upper = ps.initializeParticles('upper');
		const lower = ps.initializeParticles('lower');
		const u = params(2, 0.5, 800);
		const l = params(2, 0.5, 1000);
		run(ps, upper, lower, u, l, 600);
		for (let i = 0; i < N; i++) {
			expect(Math.abs(upper.positions[i * 3])).toBeLessThanOrEqual(LEN / 2 + 1e-6);
		}
	});
});
