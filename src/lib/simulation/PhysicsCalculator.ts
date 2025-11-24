export class PhysicsCalculator {
	static calculateParabolicVelocity(flowRate: number, radius: number, pipeRadius: number): number {
		return flowRate * (1 - Math.pow(radius / pipeRadius, 2));
	}

	static calculateReynoldsNumber(
		velocity: number,
		diameter: number,
		viscosity: number,
		density: number
	): number {
		return (density * velocity * diameter) / viscosity;
	}

	static calculateInterfaceWaveAmplitude(velocityDiff: number, viscosityRatio: number): number {
		// Simplified Kelvin-Helmholtz instability
		return velocityDiff * 0.05 * (1 / Math.sqrt(viscosityRatio));
	}

	static applyViscousDamping(velocity: number, viscosity: number, deltaTime: number): number {
		const dampingFactor = 1 - viscosity * 0.1 * deltaTime;
		return velocity * Math.max(0, dampingFactor);
	}

	/**
	 * Calculate interface velocity based on viscous coupling
	 * At the interface, shear stress must be continuous: μ₁(du₁/dy) = μ₂(du₂/dy)
	 * For two-layer flow, the interface velocity depends on both viscosities and flow rates
	 */
	static calculateInterfaceVelocity(
		upperFlowRate: number,
		lowerFlowRate: number,
		upperViscosity: number,
		lowerViscosity: number
	): number {
		// Weighted average based on viscosity (more viscous fluid has more drag/influence)
		// This represents the velocity at the center of the interface (y=0, z=0)
		const totalViscosity = upperViscosity + lowerViscosity;
		if (totalViscosity === 0) return (upperFlowRate + lowerFlowRate) / 2;

		const upperWeight = upperViscosity / totalViscosity;
		const lowerWeight = lowerViscosity / totalViscosity;

		return upperFlowRate * upperWeight + lowerFlowRate * lowerWeight;
	}

	/**
	 * Calculate velocity profile for stratified flow
	 * Interpolates between interface velocity and native Poiseuille flow
	 */
	static calculateStratifiedVelocity(
		nativeFlowRate: number, // The driving flow rate of this phase
		interfaceCenterVelocity: number, // Velocity at the center of the interface (y=0, z=0)
		y: number,
		z: number,
		pipeRadius: number,
		viscosity: number
	): number {
		const r = Math.sqrt(y * y + z * z);
		if (r >= pipeRadius) return 0; // No slip at wall

		// 1. Calculate local interface velocity at this z-coordinate
		// The interface is a chord at y=0. Velocity must be 0 at z=R (wall).
		// We approximate the interface velocity profile as parabolic along z.
		const zRatio = z / pipeRadius;
		const localInterfaceVel = interfaceCenterVelocity * Math.max(0, 1 - zRatio * zRatio);

		// 2. Calculate "native" Poiseuille velocity at this point (if it were full pipe flow)
		// This satisfies no-slip at r=R
		const nativeVel = nativeFlowRate * Math.max(0, 1 - (r * r) / (pipeRadius * pipeRadius));

		// 3. Blend between interface velocity and native velocity
		// Near y=0, velocity should match localInterfaceVel
		// Far from y=0, it should approach nativeVel
		// The blending factor depends on distance from interface relative to available height
		const distFromInterface = Math.abs(y);

		// Available height at this z roughly goes from y=0 to y=sqrt(R^2 - z^2)
		const maxH = Math.sqrt(Math.max(0, pipeRadius * pipeRadius - z * z));

		// If we are at the wall (maxH ~ 0), velocity is 0.
		if (maxH < 0.001) return 0;

		const ratio = distFromInterface / maxH; // 0 at interface, 1 at wall

		// Blending function:
		// At ratio=0 (interface), we want localInterfaceVel
		// At ratio=1 (wall), we want 0 (which both nativeVel and localInterfaceVel satisfy in a way, but nativeVel is better)
		// Actually, nativeVel satisfies no-slip everywhere.
		// We want to transition from coupled flow to bulk flow.

		// Use a blending power to shape the profile
		// ratio^2 gives a smooth transition
		// Using a higher power (e.g. 2.0) extends the influence of the interface velocity
		// deeper into the fluid, simulating higher viscous coupling
		const blend = Math.pow(ratio, 2.0);

		return localInterfaceVel * (1 - blend) + nativeVel * blend;
	}

	/**
	 * Calculate viscous shear force at interface
	 * F = μ * (du/dy) where du/dy is the velocity gradient
	 */
	static calculateViscousShear(
		upperVelocity: number,
		lowerVelocity: number,
		viscosity: number,
		interfaceDistance: number = 0.1
	): number {
		const velocityGradient = (upperVelocity - lowerVelocity) / interfaceDistance;
		return viscosity * velocityGradient;
	}

	static isInPipeBounds(
		x: number,
		y: number,
		z: number,
		pipeLength: number,
		pipeRadius: number
	): boolean {
		const r = Math.sqrt(y * y + z * z);
		return Math.abs(x) <= pipeLength / 2 && r <= pipeRadius;
	}
}
