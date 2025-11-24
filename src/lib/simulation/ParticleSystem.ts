import * as THREE from 'three';
import type { ParticleData, FluidParameters } from '../types/simulation.types';
import { PhysicsCalculator } from './PhysicsCalculator';

export class ParticleSystem {
	private particleCount: number;
	private pipeLength: number;
	private pipeRadius: number;

	constructor(particleCount: number, pipeLength: number, pipeRadius: number) {
		this.particleCount = particleCount;
		this.pipeLength = pipeLength;
		this.pipeRadius = pipeRadius;
	}

	initializeParticles(phase: 'upper' | 'lower', yOffset: number): ParticleData {
		const positions = new Float32Array(this.particleCount * 3);
		const velocities = new Float32Array(this.particleCount * 3);
		const sizes = new Float32Array(this.particleCount);

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			// Random position along pipe length
			positions[i3] = (Math.random() - 0.5) * this.pipeLength;

			// Uniform distribution in semi-circle using polar sampling (no bias)
			const radius = Math.sqrt(Math.random()) * this.pipeRadius;
			const overlap = this.pipeRadius * 0.3; // Significant overlap to ensure continuous interface

			if (phase === 'upper') {
				const theta = Math.random() * Math.PI; // 0..π (y >= 0)
				let y = radius * Math.sin(theta);
				const z = radius * Math.cos(theta);

				// Ensure slight overlap across interface for visual continuity
				y -= overlap * Math.random();

				positions[i3 + 1] = y + yOffset;
				positions[i3 + 2] = z;
			} else {
				const theta = Math.random() * Math.PI + Math.PI; // π..2π (y <= 0)
				let y = radius * Math.sin(theta);
				const z = radius * Math.cos(theta);

				// Ensure slight overlap
				y += overlap * Math.random();

				positions[i3 + 1] = y + yOffset;
				positions[i3 + 2] = z;
			}

			// Initial velocities
			velocities[i3] = 0.1;
			velocities[i3 + 1] = 0;
			velocities[i3 + 2] = 0;

			sizes[i] = 0.05 + Math.random() * 0.05;
		}

		return { positions, velocities, sizes };
	}

	updateParticles(
		data: ParticleData,
		params: FluidParameters,
		deltaTime: number,
		time: number,
		interfaceVelocity?: number
	): void {
		const { positions, velocities } = data;
		const { flowRate, viscosity } = params;

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;
			const x = positions[i3];
			const y = positions[i3 + 1];
			const z = positions[i3 + 2];

			// Calculate radial distance from center
			const r = Math.sqrt(y * y + z * z);

			// Enforce no-slip boundary condition at pipe wall
			// Particles very close to wall should have zero velocity
			const wallDistance = this.pipeRadius - r;
			const wallThickness = this.pipeRadius * 0.05; // 5% boundary layer

			// Use the realistic stratified velocity profile
			// This handles no-slip at walls (r=R) and velocity continuity at interface (y=0)
			// If interfaceVelocity is undefined (e.g. during init), use standard Poiseuille
			let targetVelocity;

			if (interfaceVelocity !== undefined) {
				targetVelocity = PhysicsCalculator.calculateStratifiedVelocity(
					flowRate,
					interfaceVelocity,
					y,
					z,
					this.pipeRadius,
					viscosity
				);
			} else {
				targetVelocity = PhysicsCalculator.calculateParabolicVelocity(flowRate, r, this.pipeRadius);
			}

			// Strict no-slip enforcement: velocity must be zero at and near wall
			if (wallDistance < wallThickness) {
				// Linear decay to zero velocity as approaching wall
				const wallFactor = Math.max(0, wallDistance / wallThickness);
				targetVelocity *= wallFactor;

				// Also damp existing velocity near wall
				velocities[i3] *= wallFactor;
			}

			// Accelerate towards target velocity
			// This replaces the simple += velocityProfile * deltaTime
			// We want particles to converge to the target velocity profile
			// Relaxation represents the viscous drag force bringing the particle to the local flow velocity
			const relaxationFactor = 5.0 * deltaTime; // Faster convergence to profile
			velocities[i3] += (targetVelocity - velocities[i3]) * relaxationFactor;

			// Add a small driving force component to ensure flow doesn't stop completely if far from target
			if (Math.abs(targetVelocity) > 0.001 && wallDistance > wallThickness) {
				velocities[i3] += targetVelocity * deltaTime * 0.1;
			}

			// Update position
			positions[i3] += velocities[i3] * deltaTime;
			positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
			positions[i3 + 2] += velocities[i3 + 2] * deltaTime;

			// Check and enforce wall boundary - particles cannot penetrate wall
			const newR = Math.sqrt(
				positions[i3 + 1] * positions[i3 + 1] + positions[i3 + 2] * positions[i3 + 2]
			);
			if (newR >= this.pipeRadius) {
				// Particle hit wall - reflect it back and zero its velocity
				const scale = (this.pipeRadius * 0.98) / newR;
				positions[i3 + 1] *= scale;
				positions[i3 + 2] *= scale;

				// No-slip: zero all velocity components at wall
				velocities[i3] = 0;
				velocities[i3 + 1] = 0;
				velocities[i3 + 2] = 0;
			}

			// Gentle lateral damping - too strong prevents gap filling
			const lateralDamping = Math.max(0, 1 - 0.5 * deltaTime);
			velocities[i3 + 1] *= lateralDamping;
			velocities[i3 + 2] *= lateralDamping;

			// Add turbulence for high flow rates
			if (flowRate > 1.0) {
				const turbulenceIntensity = (flowRate - 1.0) * 0.01;
				positions[i3 + 1] += (Math.random() - 0.5) * turbulenceIntensity;
				positions[i3 + 2] += (Math.random() - 0.5) * turbulenceIntensity;

				// Keep within pipe bounds
				const newR = Math.sqrt(
					positions[i3 + 1] * positions[i3 + 1] + positions[i3 + 2] * positions[i3 + 2]
				);
				if (newR > this.pipeRadius * 0.9) {
					const scale = (this.pipeRadius * 0.9) / newR;
					positions[i3 + 1] *= scale;
					positions[i3 + 2] *= scale;
				}
			}

			// Periodic boundary condition
			if (positions[i3] > this.pipeLength / 2) {
				positions[i3] = -this.pipeLength / 2;
			}
		}
	}

	applyInterfaceInteraction(
		upperData: ParticleData,
		lowerData: ParticleData,
		upperFlowRate: number,
		lowerFlowRate: number,
		upperViscosity: number,
		lowerViscosity: number,
		time: number
	): void {
		// Calculate interface velocity based on viscous coupling
		const interfaceVelocity = PhysicsCalculator.calculateInterfaceVelocity(
			upperFlowRate,
			lowerFlowRate,
			upperViscosity,
			lowerViscosity
		);

		const velocityDiff = Math.abs(upperFlowRate - lowerFlowRate);
		const waveAmplitude = velocityDiff * 0.05;
		const waveFrequency = 2;
		const waveSpeed = 2;

		// Apply viscous coupling: particles near interface experience shear stress
		const interfaceRegion = this.pipeRadius * 0.3; // Region near interface affected by coupling

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;
			const xUpper = upperData.positions[i3];
			const xLower = lowerData.positions[i3];
			const yUpper = upperData.positions[i3 + 1];
			const yLower = lowerData.positions[i3 + 1];

			// Distance from interface
			const distUpper = Math.abs(yUpper);
			const distLower = Math.abs(yLower);

			// Apply viscous shear force for particles near interface
			if (distUpper < interfaceRegion) {
				const couplingStrength = 1 - distUpper / interfaceRegion;
				// Calculate velocity difference and apply viscous drag
				const velocityDiffAtInterface = interfaceVelocity - upperData.velocities[i3];
				const shearForce = PhysicsCalculator.calculateViscousShear(
					interfaceVelocity,
					upperData.velocities[i3],
					upperViscosity,
					distUpper + 0.01 // Avoid division by zero
				);
				// Apply shear force (proportional to viscosity and velocity gradient)
				upperData.velocities[i3] += shearForce * couplingStrength * 0.1;
			}

			if (distLower < interfaceRegion) {
				const couplingStrength = 1 - distLower / interfaceRegion;
				// Calculate velocity difference and apply viscous drag
				const velocityDiffAtInterface = interfaceVelocity - lowerData.velocities[i3];
				const shearForce = PhysicsCalculator.calculateViscousShear(
					interfaceVelocity,
					lowerData.velocities[i3],
					lowerViscosity,
					distLower + 0.01
				);
				// Apply shear force
				lowerData.velocities[i3] += shearForce * couplingStrength * 0.1;
			}

			// Apply Kelvin-Helmholtz instability at interface (reduced to prevent separation)
			// Convert wave displacement to vertical velocity component
			// v_y = d(A*sin(kx - wt))/dt = -A*w*cos(kx - wt) (roughly)
			// We add this to velocity instead of position to avoid accumulation drift
			const waveVel = waveAmplitude * 2.0 * Math.cos(xUpper * waveFrequency + time * waveSpeed);

			// Apply only very close to interface with small magnitude
			if (distUpper < 0.2) {
				upperData.velocities[i3 + 1] += waveVel * (1 - distUpper / 0.2) * 0.02;
			}

			if (distLower < 0.2) {
				lowerData.velocities[i3 + 1] += waveVel * (1 - distLower / 0.2) * 0.02;
			}
		}
	}
}
