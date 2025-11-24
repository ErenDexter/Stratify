import * as THREE from 'three';
import type { SimulationConfig, FluidPhase } from '../types/simulation.types';
import { ParticleSystem } from './ParticleSystem';
import { PhysicsCalculator } from './PhysicsCalculator';

export class FluidEngine {
	private scene: THREE.Scene;
	private particleSystem: ParticleSystem;
	private config: SimulationConfig;
	private fluidPhases: { upper: FluidPhase | null; lower: FluidPhase | null };

	constructor(scene: THREE.Scene, config: SimulationConfig) {
		this.scene = scene;
		this.config = config;
		this.particleSystem = new ParticleSystem(
			config.particleCount,
			config.pipeLength,
			config.pipeRadius
		);
		this.fluidPhases = { upper: null, lower: null };
	}

	initialize(): void {
		// Interface at y=0: upper fluid from 0 to +pipeRadius, lower fluid from -pipeRadius to 0
		this.createFluidPhase('upper', this.config.upperFluid.color, 0);
		this.createFluidPhase('lower', this.config.lowerFluid.color, 0);
	}

	private createParticleTexture(): THREE.CanvasTexture {
		const canvas = document.createElement('canvas');
		canvas.width = 32;
		canvas.height = 32;
		const context = canvas.getContext('2d');
		if (context) {
			const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
			gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
			gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
			gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
			context.fillStyle = gradient;
			context.fillRect(0, 0, 32, 32);
		}
		const texture = new THREE.CanvasTexture(canvas);
		return texture;
	}

	private createFluidPhase(phase: 'upper' | 'lower', color: number, yOffset: number): void {
		const geometry = new THREE.BufferGeometry();
		const data = this.particleSystem.initializeParticles(phase, yOffset);

		geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
		geometry.setAttribute('velocity', new THREE.BufferAttribute(data.velocities, 3));
		geometry.setAttribute('size', new THREE.BufferAttribute(data.sizes, 1));

		const sprite = this.createParticleTexture();

		const material = new THREE.PointsMaterial({
			color: color,
			size: 0.1, // Smaller particles for denser appearance
			map: sprite,
			transparent: true,
			opacity: 1.0, // Full opacity for solid appearance
			blending: THREE.NormalBlending,
			sizeAttenuation: true,
			depthWrite: false, // Don't write to depth buffer
			depthTest: false, // Don't test depth - allows both fluid layers to always be visible
			vertexColors: false,
			alphaTest: 0.01
		});

		const points = new THREE.Points(geometry, material);
		// High render order ensures particles render after pipe
		// Pipe (renderOrder 0) writes depth first, then particles render on top
		// Without depth testing, particles from both layers will always be visible
		points.renderOrder = phase === 'upper' ? 100 : 99;
		points.frustumCulled = false;
		points.visible = true;
		points.matrixAutoUpdate = true;
		this.scene.add(points);

		this.fluidPhases[phase] = { geometry, material, points, data };
	}

	update(deltaTime: number, time: number): void {
		if (!this.fluidPhases.upper || !this.fluidPhases.lower) return;

		// Calculate interface velocity for viscous coupling
		const interfaceVelocity = PhysicsCalculator.calculateInterfaceVelocity(
			this.config.upperFluid.flowRate,
			this.config.lowerFluid.flowRate,
			this.config.upperFluid.viscosity,
			this.config.lowerFluid.viscosity
		);

		// Update particle positions with interface velocity influence
		this.particleSystem.updateParticles(
			this.fluidPhases.upper.data,
			this.config.upperFluid,
			deltaTime,
			time,
			interfaceVelocity
		);

		this.particleSystem.updateParticles(
			this.fluidPhases.lower.data,
			this.config.lowerFluid,
			deltaTime,
			time,
			interfaceVelocity
		);

		// Apply interface interaction with viscous coupling
		this.particleSystem.applyInterfaceInteraction(
			this.fluidPhases.upper.data,
			this.fluidPhases.lower.data,
			this.config.upperFluid.flowRate,
			this.config.lowerFluid.flowRate,
			this.config.upperFluid.viscosity,
			this.config.lowerFluid.viscosity,
			time
		);

		// Update geometry attributes for both phases
		const upperPosAttr = this.fluidPhases.upper.geometry.attributes
			.position as THREE.BufferAttribute;
		const lowerPosAttr = this.fluidPhases.lower.geometry.attributes
			.position as THREE.BufferAttribute;

		// Copy position data to geometry attributes
		upperPosAttr.array.set(this.fluidPhases.upper.data.positions);
		lowerPosAttr.array.set(this.fluidPhases.lower.data.positions);

		upperPosAttr.needsUpdate = true;
		lowerPosAttr.needsUpdate = true;

		// Ensure both point systems are visible and in the scene
		this.fluidPhases.upper.points.visible = true;
		this.fluidPhases.lower.points.visible = true;
	}

	updateFluidParameters(
		phase: 'upper' | 'lower',
		params: Partial<typeof this.config.upperFluid>
	): void {
		if (phase === 'upper') {
			this.config.upperFluid = { ...this.config.upperFluid, ...params };
		} else {
			this.config.lowerFluid = { ...this.config.lowerFluid, ...params };
		}
	}

	dispose(): void {
		Object.values(this.fluidPhases).forEach((phase) => {
			if (phase) {
				phase.geometry.dispose();
				phase.material.dispose();
				this.scene.remove(phase.points);
			}
		});
	}
}
