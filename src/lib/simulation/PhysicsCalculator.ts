/**
 * Physics for laminar two-phase stratified flow in a horizontal pipe.
 *
 * Model: two immiscible fluids share a horizontal interface at y = 0. The upper
 * fluid (lighter) fills y > 0, the lower fluid (heavier) fills y < 0. The pipe
 * axis is x; the cross-section lies in the (y, z) plane with radius R.
 *
 * For a fully-developed laminar flow each fluid obeys the momentum balance
 * mu * d^2u/dy^2 = dp/dx, so the axial velocity in each layer is a parabola.
 * The two parabolas are joined at the interface by the two matching conditions
 * that make the problem physical:
 *   1. Continuity of velocity:      u_upper(0) = u_lower(0) = U_i
 *   2. Continuity of shear stress:  mu_upper * du_upper/dy = mu_lower * du_lower/dy
 * and closed by no-slip (u = 0) on the pipe wall.
 */

export interface LayerParams {
	flowRate: number;
	viscosity: number;
}

const MIN_VISCOSITY = 1e-6;

export class PhysicsCalculator {
	/**
	 * Interface velocity U_i for the two-layer profile.
	 *
	 * Each slider "flow rate" F is the driving force applied to that fluid (its
	 * pressure gradient, G = 2*F/R^2 at the reference viscosity). Viscosity is
	 * resistance: for a fixed drive a thicker fluid flows slower, exactly like
	 * Poiseuille flow (mean velocity proportional to drive / viscosity).
	 *
	 * Imposing shear-stress continuity at the interface (mu1*u1' = mu2*u2') on
	 * the two parabolas and solving for the shared interface velocity gives:
	 *
	 *     U_i = (F_upper + F_lower) / (mu_upper + mu_lower)
	 *
	 * so increasing either viscosity slows the interface down.
	 */
	static calculateInterfaceVelocity(
		upperFlowRate: number,
		lowerFlowRate: number,
		upperViscosity: number,
		lowerViscosity: number
	): number {
		const muU = Math.max(MIN_VISCOSITY, upperViscosity);
		const muL = Math.max(MIN_VISCOSITY, lowerViscosity);
		return (upperFlowRate + lowerFlowRate) / (muU + muL);
	}

	/**
	 * Axial velocity of the stratified flow at a point (y, z) in the pipe.
	 *
	 * Each vertical chord at horizontal position z spans y in [-h, +h] with
	 * h = sqrt(R^2 - z^2), so it behaves like a local two-layer channel whose
	 * walls sit exactly on the (curved) pipe wall — this gives no-slip everywhere
	 * on the pipe, not just at the top and bottom. Within a chord the two layers
	 * are the matched parabolas described above.
	 */
	static stratifiedAxialVelocity(
		y: number,
		z: number,
		upper: LayerParams,
		lower: LayerParams,
		pipeRadius: number
	): number {
		const R = pipeRadius;
		if (y * y + z * z >= R * R) return 0; // no-slip at / outside the wall

		const h = Math.sqrt(R * R - z * z); // half-height of this vertical chord
		if (h < 1e-9) return 0;

		const muU = Math.max(MIN_VISCOSITY, upper.viscosity);
		const muL = Math.max(MIN_VISCOSITY, lower.viscosity);
		const ui0 = (upper.flowRate + lower.flowRate) / (muU + muL);
		const ui = (ui0 * h * h) / (R * R); // interface velocity scales with chord^2

		// u(y) = -c*y^2 + a*y + ui, with curvature c = F/(mu*R^2) (thicker -> slower)
		// and 'a' fixed by no-slip at the chord wall.
		if (y >= 0) {
			const c = upper.flowRate / (muU * R * R);
			const a = c * h - ui / h;
			return -c * y * y + a * y + ui;
		} else {
			const c = lower.flowRate / (muL * R * R);
			const a = ui / h - c * h;
			return -c * y * y + a * y + ui;
		}
	}

	/** Reynolds number Re = rho * U * D / mu. */
	static calculateReynoldsNumber(
		density: number,
		velocity: number,
		diameter: number,
		viscosity: number
	): number {
		return (density * Math.abs(velocity) * diameter) / Math.max(MIN_VISCOSITY, viscosity);
	}

	/**
	 * Dimensionless mixing intensity (0..1) driven by the Reynolds number.
	 * Pipe flow is laminar below Re ~ 2300 (no cross-stream mixing) and becomes
	 * progressively more turbulent above it. Returns 0 while laminar and ramps up
	 * once the transition is exceeded.
	 */
	static turbulentMixingFactor(reynolds: number, criticalReynolds = 2300): number {
		if (reynolds <= criticalReynolds) return 0;
		return Math.min(1, (reynolds - criticalReynolds) / (10 * criticalReynolds));
	}

	/**
	 * Critical velocity difference above which the interface is Kelvin-Helmholtz
	 * unstable (inviscid theory, gravity only, no surface tension):
	 *
	 *     dU_crit = sqrt( g * (rhoLower - rhoUpper) * (rhoUpper + rhoLower)
	 *                     / (k * rhoUpper * rhoLower) )
	 *
	 * A denser fluid on the bottom (rhoLower > rhoUpper) is gravitationally
	 * stable, so a finite shear is required before waves grow. If the
	 * stratification is not stable the interface is unstable at any shear (0).
	 */
	static kelvinHelmholtzCriticalShear(
		rhoUpper: number,
		rhoLower: number,
		gravity: number,
		waveNumber: number
	): number {
		const numerator = gravity * (rhoLower - rhoUpper) * (rhoUpper + rhoLower);
		if (numerator <= 0) return 0;
		return Math.sqrt(numerator / (waveNumber * rhoUpper * rhoLower));
	}

	/** Whether the shear |dU| across the interface exceeds the KH threshold. */
	static isKelvinHelmholtzUnstable(
		velocityDifference: number,
		rhoUpper: number,
		rhoLower: number,
		gravity: number,
		waveNumber: number
	): boolean {
		const crit = PhysicsCalculator.kelvinHelmholtzCriticalShear(
			rhoUpper,
			rhoLower,
			gravity,
			waveNumber
		);
		return Math.abs(velocityDifference) > crit;
	}

	/** True when (x, y, z) lies inside the finite pipe. */
	static isInPipeBounds(
		x: number,
		y: number,
		z: number,
		pipeLength: number,
		pipeRadius: number
	): boolean {
		return Math.abs(x) <= pipeLength / 2 && Math.sqrt(y * y + z * z) <= pipeRadius;
	}
}
