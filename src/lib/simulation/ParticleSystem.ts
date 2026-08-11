import type { ParticleData, FluidParameters } from '../types/simulation.types';
import { PhysicsCalculator } from './PhysicsCalculator';

// Interfacial (Kelvin-Helmholtz) wave shape.
const WAVE_NUMBER = 2; // spatial wavenumber k
const WAVE_ANGULAR_SPEED = 2; // temporal angular frequency omega
const WAVE_DEPTH = 0.25; // how far from the interface the wave is felt
const MAX_WAVE_AMPLITUDE = 0.12; // hard cap so the wave never tears the interface open
const WAVE_GAIN = 0.06; // amplitude per unit of excess KH shear

const TURBULENCE_STEP = 0.15; // scale of turbulent cross-stream diffusion
const AXIAL_RELAXATION = 5.0; // rate particle speed relaxes to the local flow velocity
const WALL_FRACTION = 0.99; // keep particles just inside the wall (no-slip)

/**
 * Advects tracer particles through the stratified velocity field.
 *
 * Vertical structure is anchored: each particle owns a stable base position
 * (homeY, homeZ) inside its own phase. Immiscibility + gravity keep the phases
 * from crossing the interface (reflection at y = 0), and the interface only
 * carries a bounded, coherent wave when the flow is Kelvin-Helmholtz unstable.
 * This is what keeps the two layers intact instead of pumping a void open at
 * the interface.
 */
export class ParticleSystem {
	private particleCount: number;
	private pipeLength: number;
	private pipeRadius: number;

	constructor(particleCount: number, pipeLength: number, pipeRadius: number) {
		this.particleCount = particleCount;
		this.pipeLength = pipeLength;
		this.pipeRadius = pipeRadius;
	}

	initializeParticles(phase: 'upper' | 'lower'): ParticleData {
		const n = this.particleCount;
		const positions = new Float32Array(n * 3);
		const velocities = new Float32Array(n * 3);
		const sizes = new Float32Array(n);
		const homeY = new Float32Array(n);
		const homeZ = new Float32Array(n);
		const R = this.pipeRadius;

		for (let i = 0; i < n; i++) {
			const i3 = i * 3;

			// Uniform over the half-disc that belongs to this phase.
			const radius = Math.sqrt(Math.random()) * R;
			const angle = Math.random() * Math.PI; // [0, PI] -> sin >= 0
			const z = radius * Math.cos(angle);
			let y = radius * Math.sin(angle); // >= 0
			if (phase === 'lower') y = -y; // heavy phase sits below the interface

			positions[i3] = (Math.random() - 0.5) * this.pipeLength;
			positions[i3 + 1] = y;
			positions[i3 + 2] = z;
			homeY[i] = y;
			homeZ[i] = z;

			velocities[i3] = 0;
			velocities[i3 + 1] = 0;
			velocities[i3 + 2] = 0;

			sizes[i] = 0.04 + Math.random() * 0.05;
		}

		return { positions, velocities, sizes, homeY, homeZ };
	}

	updateParticles(
		data: ParticleData,
		phase: 'upper' | 'lower',
		upper: FluidParameters,
		lower: FluidParameters,
		gravity: number,
		deltaTime: number,
		time: number
	): void {
		const { positions, velocities, homeY, homeZ } = data;
		const R = this.pipeRadius;
		const halfLen = this.pipeLength / 2;
		const isUpper = phase === 'upper';

		// Actual velocity scale of each layer (drive / viscosity): thicker = slower.
		const upperVelocity = upper.flowRate / Math.max(1e-6, upper.viscosity);
		const lowerVelocity = lower.flowRate / Math.max(1e-6, lower.viscosity);

		// Interfacial wave amplitude, shared by both phases so the interface moves
		// coherently. Zero unless the shear exceeds the Kelvin-Helmholtz threshold.
		const velocityDiff = upperVelocity - lowerVelocity;
		const critShear = PhysicsCalculator.kelvinHelmholtzCriticalShear(
			upper.density,
			lower.density,
			gravity,
			WAVE_NUMBER
		);
		let waveAmplitude = 0;
		if (critShear > 0) {
			const excess = Math.abs(velocityDiff) / critShear - 1;
			if (excess > 0) waveAmplitude = Math.min(MAX_WAVE_AMPLITUDE, WAVE_GAIN * excess);
		} else if (Math.abs(velocityDiff) > 0) {
			waveAmplitude = MAX_WAVE_AMPLITUDE; // gravitationally unstable stratification
		}

		// Turbulent cross-stream mixing intensity for this phase (0 while laminar).
		// Reynolds uses the layer's actual velocity, so thicker fluids stay laminar.
		const own = isUpper ? upper : lower;
		const ownVelocity = isUpper ? upperVelocity : lowerVelocity;
		const reynolds = PhysicsCalculator.calculateReynoldsNumber(
			own.density,
			ownVelocity,
			2 * R,
			own.viscosity
		);
		const mixing = PhysicsCalculator.turbulentMixingFactor(reynolds);
		const turbulentStep = mixing * TURBULENCE_STEP * Math.sqrt(deltaTime);

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			let hy = homeY[i];
			let hz = homeZ[i];

			// Turbulent diffusion of the base position (persistent random walk).
			if (turbulentStep > 0) {
				hy += (Math.random() - 0.5) * turbulentStep;
				hz += (Math.random() - 0.5) * turbulentStep;
			}

			// Buoyancy / immiscibility: each phase stays on its own side of the
			// interface. A denser lower fluid and lighter upper fluid is
			// gravitationally stable, so any excursion across y = 0 is reflected back.
			if (isUpper) {
				if (hy < 0) hy = -hy;
			} else if (hy > 0) {
				hy = -hy;
			}

			// No-slip wall: keep the base position inside the pipe.
			const chord = Math.sqrt(Math.max(0, R * R - hz * hz));
			const maxAbsY = chord * WALL_FRACTION;
			if (hy > maxAbsY) hy = maxAbsY;
			else if (hy < -maxAbsY) hy = -maxAbsY;
			const maxAbsZ = R * WALL_FRACTION;
			if (hz > maxAbsZ) hz = maxAbsZ;
			else if (hz < -maxAbsZ) hz = -maxAbsZ;

			homeY[i] = hy;
			homeZ[i] = hz;

			// Coherent interfacial wave: a bounded vertical displacement measured
			// from the anchor, so it can never accumulate into a drift.
			let x = positions[i3];
			let y = hy;
			let z = hz;
			if (waveAmplitude > 0) {
				const envelope = 1 - Math.abs(hy) / WAVE_DEPTH;
				if (envelope > 0) {
					y = hy + waveAmplitude * envelope * Math.sin(WAVE_NUMBER * x - WAVE_ANGULAR_SPEED * time);
				}
			}

			// Containment backstop.
			const rr = Math.hypot(y, z);
			if (rr > R) {
				const s = (R * WALL_FRACTION) / rr;
				y *= s;
				z *= s;
			}

			// Axial motion: relax the particle speed toward the local stratified
			// velocity, then advect. As particles diffuse in y they sample different
			// speeds, which is what makes turbulent flow look streaky.
			const target = PhysicsCalculator.stratifiedAxialVelocity(y, z, upper, lower, R);
			let vx = velocities[i3];
			vx += (target - vx) * Math.min(1, AXIAL_RELAXATION * deltaTime);
			x += vx * deltaTime;

			// Periodic boundary condition along the pipe.
			if (x > halfLen) x -= this.pipeLength;
			else if (x < -halfLen) x += this.pipeLength;

			positions[i3] = x;
			positions[i3 + 1] = y;
			positions[i3 + 2] = z;
			velocities[i3] = vx;
		}
	}
}
