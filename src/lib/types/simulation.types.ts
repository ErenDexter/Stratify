import * as THREE from 'three';

export interface FluidParameters {
	flowRate: number;
	viscosity: number;
	density: number;
	color: number;
}

export interface SimulationConfig {
	particleCount: number;
	pipeLength: number;
	pipeRadius: number;
	upperFluid: FluidParameters;
	lowerFluid: FluidParameters;
}

export interface ParticleData {
	positions: Float32Array;
	velocities: Float32Array;
	sizes: Float32Array;
}

export interface FluidPhase {
	geometry: THREE.BufferGeometry;
	material: THREE.PointsMaterial;
	points: THREE.Points;
	data: ParticleData;
}
