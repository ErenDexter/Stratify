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
	 *
	 * From shear stress continuity at interface:
	 * Ui = (μ₁·U₁ + μ₂·U₂) / (μ₁ + μ₂)
	 *
	 */
	static calculateInterfaceVelocity(
		upperFlowRate: number,
		lowerFlowRate: number,
		upperViscosity: number,
		lowerViscosity: number
	): number {
		const totalViscosity = upperViscosity + lowerViscosity;
		if (totalViscosity === 0) return (upperFlowRate + lowerFlowRate) / 2;

		const upperWeight = upperViscosity / totalViscosity;
		const lowerWeight = lowerViscosity / totalViscosity;

		return upperFlowRate * upperWeight + lowerFlowRate * lowerWeight;
	}

	/**
	 *
	 * Key physics:
	 * - At wall (r=R): velocity = 0 (no-slip)
	 * - At interface (y=0): velocity = interfaceVelocity (continuity)
	 * - Higher viscosity → slower flow for same driving force
	 */
	static calculateStratifiedVelocity(
		nativeFlowRate: number,
		interfaceCenterVelocity: number, // Velocity at the center of the interface (y=0, z=0)
		y: number,
		z: number,
		pipeRadius: number,
		viscosity: number
	): number {
		const r = Math.sqrt(y * y + z * z);
		if (r >= pipeRadius) return 0; // No slip at wall

		const zRatio = z / pipeRadius;
		const localInterfaceVel = interfaceCenterVelocity * Math.max(0, 1 - zRatio * zRatio);

		const viscosityFactor = 1.0 / Math.max(0.1, viscosity);
		const nativeVel =
			nativeFlowRate * viscosityFactor * Math.max(0, 1 - (r * r) / (pipeRadius * pipeRadius));
		const distFromInterface = Math.abs(y);
		const maxH = Math.sqrt(Math.max(0, pipeRadius * pipeRadius - z * z));

		if (maxH < 0.001) return 0;

		const ratio = distFromInterface / maxH; // 0 at interface, 1 at wall

		const blendPower = 1.5 + 0.5 / Math.max(0.1, viscosity);
		const blend = Math.pow(ratio, blendPower);

		return localInterfaceVel * (1 - blend) + nativeVel * blend;
	}

	static calculateViscousDrag(
		targetVelocity: number,
		currentVelocity: number,
		viscosity: number,
		distance: number = 0.1
	): number {
		const velocityDiff = targetVelocity - currentVelocity;
		const dragFactor = 1.0 / Math.max(0.1, viscosity);
		return velocityDiff * dragFactor * 0.1;
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
