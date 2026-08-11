import { describe, it, expect } from 'vitest';
import { PhysicsCalculator } from './PhysicsCalculator';

const R = 1;
const up = (flowRate: number, viscosity: number) => ({ flowRate, viscosity, density: 800, color: 0 });
const lo = (flowRate: number, viscosity: number) => ({ flowRate, viscosity, density: 1000, color: 0 });

/** Numerical derivative of the axial velocity field w.r.t. y at (y,z). */
function dudy(y: number, z: number, u: any, l: any, eps = 1e-5): number {
	const a = PhysicsCalculator.stratifiedAxialVelocity(y + eps, z, u, l, R);
	const b = PhysicsCalculator.stratifiedAxialVelocity(y - eps, z, u, l, R);
	return (a - b) / (2 * eps);
}

describe('calculateInterfaceVelocity', () => {
	it('is the total drive divided by the total viscosity', () => {
		// Slider = driving force. Ui = (F_up + F_lo) / (mu_up + mu_lo)
		expect(PhysicsCalculator.calculateInterfaceVelocity(0.5, 0.3, 1.0, 2.0)).toBeCloseTo(
			(0.5 + 0.3) / (1.0 + 2.0),
			6
		);
	});

	it('is zero for symmetric counter-current flow with equal viscosity', () => {
		expect(PhysicsCalculator.calculateInterfaceVelocity(-2, 2, 0.5, 0.5)).toBeCloseTo(0, 6);
	});

	it('slows the interface as either fluid gets more viscous (thicker = slower)', () => {
		const thin = PhysicsCalculator.calculateInterfaceVelocity(0.5, 0.3, 1.0, 1.0);
		const thick = PhysicsCalculator.calculateInterfaceVelocity(0.5, 0.3, 5.0, 5.0);
		expect(Math.abs(thick)).toBeLessThan(Math.abs(thin));
	});
});

describe('viscosity acts as flow resistance', () => {
	it('makes a fluid flow slower when its own viscosity increases', () => {
		const peak = (upperViscosity: number) => {
			let m = 0;
			for (let y = 0; y <= 1; y += 0.02) {
				const v = PhysicsCalculator.stratifiedAxialVelocity(
					y,
					0,
					up(0.5, upperViscosity),
					lo(0.3, 2.0),
					R
				);
				if (Math.abs(v) > Math.abs(m)) m = v;
			}
			return Math.abs(m);
		};
		expect(peak(5.0)).toBeLessThan(peak(1.0));
		expect(peak(1.0)).toBeLessThan(peak(0.5));
	});
});

describe('stratifiedAxialVelocity - boundary conditions', () => {
	const u = up(0.5, 1.0);
	const l = lo(0.3, 2.0);

	it('is zero at the top wall (no-slip)', () => {
		expect(PhysicsCalculator.stratifiedAxialVelocity(R, 0, u, l, R)).toBeCloseTo(0, 6);
	});

	it('is zero at the bottom wall (no-slip)', () => {
		expect(PhysicsCalculator.stratifiedAxialVelocity(-R, 0, u, l, R)).toBeCloseTo(0, 6);
	});

	it('is zero on the curved side wall (no-slip anywhere on the pipe)', () => {
		const z = 0.6;
		const yWall = Math.sqrt(R * R - z * z); // point exactly on the wall
		expect(PhysicsCalculator.stratifiedAxialVelocity(yWall, z, u, l, R)).toBeCloseTo(0, 6);
		expect(PhysicsCalculator.stratifiedAxialVelocity(-yWall, z, u, l, R)).toBeCloseTo(0, 6);
	});

	it('is zero outside the pipe', () => {
		expect(PhysicsCalculator.stratifiedAxialVelocity(1.5, 0, u, l, R)).toBe(0);
	});
});

describe('stratifiedAxialVelocity - interface matching', () => {
	const u = up(0.5, 1.0);
	const l = lo(0.3, 2.0);

	it('is continuous at the interface and equals the interface velocity', () => {
		const ui = PhysicsCalculator.calculateInterfaceVelocity(0.5, 0.3, 1.0, 2.0);
		const above = PhysicsCalculator.stratifiedAxialVelocity(1e-6, 0, u, l, R);
		const below = PhysicsCalculator.stratifiedAxialVelocity(-1e-6, 0, u, l, R);
		expect(above).toBeCloseTo(ui, 4);
		expect(below).toBeCloseTo(ui, 4);
	});

	it('conserves shear stress across the interface: mu_up*du_up = mu_lo*du_lo', () => {
		// one-sided derivatives evaluated in the limit y -> 0 (the interface itself)
		const eps = 1e-6;
		const ui = PhysicsCalculator.stratifiedAxialVelocity(0, 0, u, l, R);
		const gradAbove = (PhysicsCalculator.stratifiedAxialVelocity(eps, 0, u, l, R) - ui) / eps;
		const gradBelow = (ui - PhysicsCalculator.stratifiedAxialVelocity(-eps, 0, u, l, R)) / eps;
		const stressAbove = u.viscosity * gradAbove;
		const stressBelow = l.viscosity * gradBelow;
		expect(stressAbove).toBeCloseTo(stressBelow, 3);
	});
});

describe('stratifiedAxialVelocity - profile shape', () => {
	it('gives an antisymmetric profile for symmetric counter-current flow', () => {
		const u = up(-2, 0.5);
		const l = lo(2, 0.5);
		for (const y of [0.2, 0.5, 0.8]) {
			const top = PhysicsCalculator.stratifiedAxialVelocity(y, 0, u, l, R);
			const bot = PhysicsCalculator.stratifiedAxialVelocity(-y, 0, u, l, R);
			expect(top).toBeCloseTo(-bot, 4);
		}
	});

	it('each layer is a genuine parabola with curvature set by F/mu', () => {
		const u = up(0.8, 2.0); // mu != 1 so this actually exercises the viscosity scaling
		const l = lo(0.3, 2.0);
		// second derivative of the upper parabola should equal -2*F/(mu*R^2) in the layer
		const d2 = (y: number) => (dudy(y + 1e-3, 0, u, l) - dudy(y - 1e-3, 0, u, l)) / 2e-3;
		expect(d2(0.3)).toBeCloseTo(d2(0.6), 2);
		expect(d2(0.3)).toBeCloseTo((-2 * u.flowRate) / (u.viscosity * R * R), 1);
	});

	it('reduces the interface velocity toward the pipe sides (chord scaling)', () => {
		const u = up(0.5, 1.0);
		const l = lo(0.3, 2.0);
		const ui0 = PhysicsCalculator.calculateInterfaceVelocity(0.5, 0.3, 1.0, 2.0);
		// at z=0.6 the chord half-height is sqrt(1-0.36)=0.8, so interface vel scales by 0.8^2=0.64
		const vSide = PhysicsCalculator.stratifiedAxialVelocity(0, 0.6, u, l, R);
		expect(vSide).toBeCloseTo(ui0 * 0.64, 4);
		expect(Math.abs(vSide)).toBeLessThan(Math.abs(ui0));
	});
});

describe('calculateReynoldsNumber', () => {
	it('computes rho*U*D/mu', () => {
		expect(PhysicsCalculator.calculateReynoldsNumber(1000, 2, 2, 0.5)).toBeCloseTo(8000, 6);
	});
});

describe('turbulentMixingFactor', () => {
	it('is zero in the laminar regime (Re below the critical ~2300)', () => {
		expect(PhysicsCalculator.turbulentMixingFactor(1000)).toBe(0);
		expect(PhysicsCalculator.turbulentMixingFactor(2300)).toBe(0);
	});

	it('grows monotonically once flow is turbulent and stays bounded', () => {
		const a = PhysicsCalculator.turbulentMixingFactor(3000);
		const b = PhysicsCalculator.turbulentMixingFactor(9000);
		expect(a).toBeGreaterThan(0);
		expect(b).toBeGreaterThan(a);
		expect(b).toBeLessThanOrEqual(1);
	});
});

describe('Kelvin-Helmholtz stability', () => {
	const g = 9.81;
	const k = 2;

	it('critical shear matches the inviscid KH criterion', () => {
		// dU_crit^2 = g*(rhoL-rhoU)*(rhoU+rhoL) / (k*rhoU*rhoL)
		const expected = Math.sqrt((g * (1000 - 800) * (800 + 1000)) / (k * 800 * 1000));
		expect(PhysicsCalculator.kelvinHelmholtzCriticalShear(800, 1000, g, k)).toBeCloseTo(expected, 4);
	});

	it('a small velocity difference is stable', () => {
		expect(PhysicsCalculator.isKelvinHelmholtzUnstable(0.2, 800, 1000, g, k)).toBe(false);
	});

	it('a large velocity difference is unstable', () => {
		expect(PhysicsCalculator.isKelvinHelmholtzUnstable(4, 800, 1000, g, k)).toBe(true);
	});

	it('denser fluid on the bottom is stabilizing (positive critical shear)', () => {
		expect(PhysicsCalculator.kelvinHelmholtzCriticalShear(800, 1000, g, k)).toBeGreaterThan(0);
	});
});
