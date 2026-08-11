<script lang="ts">
	import { PhysicsCalculator } from '../simulation/PhysicsCalculator';

	let {
		upperFlowRate = 0.5,
		lowerFlowRate = 0.3,
		upperViscosity = 1.0,
		lowerViscosity = 2.0,
		isMobile = false
	} = $props();

	const width = 280;
	const height = 200;
	const padding = { top: 25, right: 20, bottom: 30, left: 45 };
	const graphWidth = width - padding.left - padding.right;
	const graphHeight = height - padding.top - padding.bottom;
	const pipeRadius = 1;
	const steps = 60;

	// Single source of truth: the chart samples the exact same velocity field the
	// 3D particles are advected by, along the vertical centre-plane (z = 0).
	const upper = $derived({ flowRate: upperFlowRate, viscosity: upperViscosity });
	const lower = $derived({ flowRate: lowerFlowRate, viscosity: lowerViscosity });

	const interfaceVel = $derived(
		PhysicsCalculator.calculateInterfaceVelocity(
			upperFlowRate,
			lowerFlowRate,
			upperViscosity,
			lowerViscosity
		)
	);

	const samples = $derived.by(() => {
		const arr: { y: number; v: number }[] = [];
		for (let i = 0; i <= steps; i++) {
			const y = pipeRadius - (i / steps) * 2 * pipeRadius; // +R (top) down to -R (bottom)
			arr.push({ y, v: PhysicsCalculator.stratifiedAxialVelocity(y, 0, upper, lower, pipeRadius) });
		}
		return arr;
	});

	// Auto-scale the velocity axis so the profile can never run off the chart.
	const vMax = $derived.by(() => {
		let m = 0;
		for (const s of samples) m = Math.max(m, Math.abs(s.v));
		return Math.max(1, Math.ceil(m));
	});

	const xPos = (v: number) => padding.left + ((v + vMax) / (2 * vMax)) * graphWidth;
	const yPos = (y: number) =>
		padding.top + ((pipeRadius - y) / (2 * pipeRadius)) * graphHeight;

	const upperPath = $derived(
		samples
			.filter((s) => s.y >= 0)
			.map((s) => `${xPos(s.v)},${yPos(s.y)}`)
			.join(' ')
	);
	const lowerPath = $derived(
		samples
			.filter((s) => s.y <= 0)
			.map((s) => `${xPos(s.v)},${yPos(s.y)}`)
			.join(' ')
	);

	const velocityTicks = $derived([-vMax, -vMax / 2, 0, vMax / 2, vMax]);
	const positionTicks = [-1, -0.5, 0, 0.5, 1];
	const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(1));
</script>

<div
	class={isMobile
		? ''
		: 'bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl !p-4 border border-gray-700/50'}
>
	{#if !isMobile}
		<h3 class="text-base md:text-lg font-bold text-white !mb-3">Velocity Profile</h3>
	{/if}

	<svg {width} {height} class="bg-gray-800/50 rounded-lg !p-0">
		{#each velocityTicks as tick}
			<line
				x1={xPos(tick)}
				y1={padding.top}
				x2={xPos(tick)}
				y2={padding.top + graphHeight}
				stroke={tick === 0 ? '#6b7280' : '#374151'}
				stroke-width={tick === 0 ? 1.5 : 0.5}
				stroke-dasharray={tick === 0 ? '0' : '2,2'}
			/>
		{/each}

		{#each positionTicks as tick}
			<line
				x1={padding.left}
				y1={padding.top + ((1 - tick) / 2) * graphHeight}
				x2={padding.left + graphWidth}
				y2={padding.top + ((1 - tick) / 2) * graphHeight}
				stroke={tick === 0 ? '#9ca3af' : '#374151'}
				stroke-width={tick === 0 ? 1.5 : 0.5}
				stroke-dasharray={tick === 0 ? '4,2' : '2,2'}
			/>
		{/each}

		<line
			x1={padding.left}
			y1={padding.top}
			x2={padding.left + graphWidth}
			y2={padding.top}
			stroke="#ef4444"
			stroke-width="2"
		/>
		<line
			x1={padding.left}
			y1={padding.top + graphHeight}
			x2={padding.left + graphWidth}
			y2={padding.top + graphHeight}
			stroke="#ef4444"
			stroke-width="2"
		/>

		<rect
			x={padding.left}
			y={padding.top}
			width={graphWidth}
			height={graphHeight / 2}
			fill="rgba(59, 130, 246, 0.1)"
		/>

		<rect
			x={padding.left}
			y={padding.top + graphHeight / 2}
			width={graphWidth}
			height={graphHeight / 2}
			fill="rgba(249, 115, 22, 0.1)"
		/>

		<polyline
			points={upperPath}
			fill="none"
			stroke="#3b82f6"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<polyline
			points={lowerPath}
			fill="none"
			stroke="#f97316"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<circle
			cx={xPos(interfaceVel)}
			cy={padding.top + graphHeight / 2}
			r="4"
			fill="#10b981"
			stroke="#fff"
			stroke-width="1.5"
		/>

		<text x={padding.left + graphWidth / 2} y={height - 5} text-anchor="middle" class="axis-label">
			Velocity (m/s)
		</text>
		<text
			x={12}
			y={padding.top + graphHeight / 2}
			text-anchor="middle"
			transform="rotate(-90, 12, {padding.top + graphHeight / 2})"
			class="axis-label"
		>
			Position (y/R)
		</text>

		{#each velocityTicks as tick}
			<text x={xPos(tick)} y={height - 18} text-anchor="middle" class="tick-label">
				{fmt(tick)}
			</text>
		{/each}

		{#each positionTicks as tick}
			<text
				x={padding.left - 8}
				y={padding.top + ((1 - tick) / 2) * graphHeight + 4}
				text-anchor="end"
				class="tick-label"
			>
				{tick}
			</text>
		{/each}

		<text x={width - 5} y={padding.top + 4} text-anchor="end" class="wall-label">Wall</text>
		<text x={width - 5} y={padding.top + graphHeight - 2} text-anchor="end" class="wall-label"
			>Wall</text
		>
	</svg>

	<div class="flex items-center justify-center gap-4 !mt-3 text-xs">
		<div class="flex items-center gap-1.5">
			<div class="w-3 h-0.5 bg-blue-500 rounded"></div>
			<span class="text-gray-400">Upper (Oil)</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="w-3 h-0.5 bg-orange-500 rounded"></div>
			<span class="text-gray-400">Lower (Water)</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
			<span class="text-gray-400">Interface</span>
		</div>
	</div>

	<div class="text-center !mt-2 text-xs text-gray-500">
		Interface velocity: <span class="text-emerald-400 font-medium"
			>{interfaceVel.toFixed(2)} m/s</span
		>
	</div>
</div>

<style>
	.axis-label {
		fill: #9ca3af;
		font-size: 10px;
	}

	.tick-label {
		fill: #6b7280;
		font-size: 9px;
	}

	.wall-label {
		fill: #ef4444;
		font-size: 8px;
		font-weight: 500;
	}
</style>
